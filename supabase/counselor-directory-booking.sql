-- Allow student bookings from admin-managed directory schedules without an active counselor login.
-- Requires counselor-booking-revision.sql and counselor-schedule-management.sql.

alter table public.appointments
  add column if not exists counselor_directory_id uuid
    references public.counselor_directory(id) on delete set null;

update public.appointments a
set counselor_directory_id = d.id
from public.counselor_directory d
where a.counselor_directory_id is null
  and a.counselor_id = d.linked_profile_id;

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%counselor_id IS NOT NULL%'
      and pg_get_constraintdef(oid) ilike '%scheduled_date IS NOT NULL%'
  loop
    execute format('alter table public.appointments drop constraint %I', v_constraint.conname);
  end loop;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_confirmed_schedule_assigned'
  ) then
    alter table public.appointments
      add constraint appointments_confirmed_schedule_assigned
      check (
        status::text not in ('confirmed', 'completed')
        or (
          (counselor_id is not null or counselor_directory_id is not null)
          and scheduled_date is not null and start_time is not null and end_time is not null
        )
      );
  end if;
end
$$;

create unique index if not exists appointments_one_pending_directory_slot
on public.appointments (counselor_directory_id, requested_date, requested_start_time)
where counselor_directory_id is not null and status = 'pending';

create unique index if not exists appointments_one_active_directory_slot
on public.appointments (counselor_directory_id, scheduled_date, start_time)
where counselor_directory_id is not null and status in ('confirmed', 'completed');

drop policy if exists "students submit own appointments" on public.appointments;
create policy "students submit own appointments" on public.appointments
for insert to authenticated with check (
  student_id = auth.uid()
  and status = 'pending'
  and (counselor_id is not null or counselor_directory_id is not null)
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student' and p.is_active
  )
);

create or replace function public.validate_appointment_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_date date;
  v_start time;
  v_end time;
  v_slot_index integer;
  v_is_open boolean;
  v_open_slots boolean[];
  v_counselor_slots boolean[];
  v_directory_id uuid;
begin
  if new.status::text not in ('pending', 'confirmed') then
    return new;
  end if;

  if new.status::text = 'pending' then
    v_date := new.requested_date;
    v_start := new.requested_start_time;
    v_end := new.requested_end_time;
  else
    v_date := new.scheduled_date;
    v_start := new.start_time;
    v_end := new.end_time;
  end if;

  if new.counselor_id is not null and not exists (
    select 1 from public.profiles p
    where p.id = new.counselor_id and p.role = 'counselor'
  ) then
    raise exception 'The assigned profile is not a counselor';
  end if;

  v_directory_id := new.counselor_directory_id;
  if v_directory_id is null and new.counselor_id is not null then
    select d.id into v_directory_id
    from public.counselor_directory d
    where d.linked_profile_id = new.counselor_id;
  end if;
  if v_directory_id is null or not exists (
    select 1 from public.counselor_directory d
    where d.id = v_directory_id
      and d.is_listed
      and (new.counselor_id is null or d.linked_profile_id = new.counselor_id)
  ) then
    raise exception 'Appointment must reference a listed counselor directory entry';
  end if;

  if v_date is null or v_start is null or v_end is null
    or v_date < (now() at time zone 'Asia/Jakarta')::date
    or (v_date = (now() at time zone 'Asia/Jakarta')::date
      and v_start <= (now() at time zone 'Asia/Jakarta')::time)
    or extract(minute from v_start) <> 0
    or v_end <> v_start + interval '1 hour'
  then
    raise exception 'Appointment date and one-hour time slot are invalid';
  end if;

  v_slot_index := extract(hour from v_start)::integer - 8;
  if v_slot_index < 0 or v_slot_index > 7 then
    raise exception 'Appointments must be scheduled between 08:00 and 16:00';
  end if;

  select coalesce(date_override.open_slots, weekly.open_slots)
  into v_counselor_slots
  from public.counselor_directory cd
  left join public.counselor_availability weekly
    on weekly.directory_id = cd.id
    and weekly.weekday = extract(dow from v_date)::smallint
    and weekly.mode = new.mode
  left join public.counselor_date_overrides date_override
    on date_override.directory_id = cd.id
    and date_override.available_date = v_date
    and date_override.mode = new.mode
  where cd.id = v_directory_id
    and cd.is_listed;
  if not found or not coalesce(v_counselor_slots[v_slot_index + 1], false) then
    raise exception 'The counselor is not available for this mode and time';
  end if;

  if new.mode = 'Online' then
    select online_is_open, online_open_slots into v_is_open, v_open_slots
    from public.service_date_overrides where available_date = v_date;
    if not found then
      select online_is_open, online_open_slots into v_is_open, v_open_slots
      from public.service_hours where weekday = extract(dow from v_date)::smallint;
    end if;
  else
    select offline_is_open, offline_open_slots into v_is_open, v_open_slots
    from public.service_date_overrides where available_date = v_date;
    if not found then
      select offline_is_open, offline_open_slots into v_is_open, v_open_slots
      from public.service_hours where weekday = extract(dow from v_date)::smallint;
    end if;
  end if;

  if not found or not coalesce(v_is_open, false) or not coalesce(v_open_slots[v_slot_index + 1], false) then
    raise exception 'The selected service hour is closed';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.id <> new.id
      and (a.counselor_directory_id = v_directory_id
        or (new.counselor_id is not null and a.counselor_id = new.counselor_id))
      and a.status::text in ('pending', 'confirmed')
      and (
        (a.status::text = 'pending' and a.requested_date = v_date and a.requested_start_time = v_start)
        or (a.status::text = 'confirmed' and a.scheduled_date = v_date and a.start_time = v_start)
      )
  ) then
    raise exception 'The selected counselor time slot is no longer available';
  end if;

  new.counselor_directory_id := v_directory_id;
  return new;
end;
$$;

drop trigger if exists appointments_validate_slot on public.appointments;
create trigger appointments_validate_slot
before insert or update of requested_date, requested_start_time, requested_end_time, scheduled_date, start_time, end_time, mode, status, counselor_id, counselor_directory_id
on public.appointments
for each row execute function public.validate_appointment_slot();

create or replace function public.available_counselor_slots_range(p_start_date date, p_end_date date)
returns table (
  available_date date,
  counselor_id uuid,
  directory_id uuid,
  counselor_name text,
  specialties text[],
  start_time time,
  end_time time,
  mode text
)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student' and p.is_active
  ) then
    raise exception 'Only active students can check counselor availability';
  end if;
  if p_end_date < p_start_date or p_end_date - p_start_date > 62 then
    raise exception 'Date range must be between 0 and 62 days';
  end if;

  return query
  select
    dates.slot_date::date,
    p.id,
    d.id,
    d.full_name,
    d.specialties,
    (time '00:00' + hours.hour_value * interval '1 hour')::time,
    (time '00:00' + (hours.hour_value + 1) * interval '1 hour')::time,
    modes.mode
  from generate_series(p_start_date, p_end_date, interval '1 day') as dates(slot_date)
  cross join generate_series(8, 15) as hours(hour_value)
  join public.counselor_directory d on d.is_listed
  left join public.profiles p
    on p.id = d.linked_profile_id and p.role = 'counselor'
  cross join (values ('Online'::text), ('Tatap muka'::text)) as modes(mode)
  left join public.counselor_availability availability
    on availability.directory_id = d.id
    and availability.weekday = extract(dow from dates.slot_date)::smallint
    and availability.mode = modes.mode
  left join public.counselor_date_overrides counselor_override
    on counselor_override.directory_id = d.id
    and counselor_override.available_date = dates.slot_date::date
    and counselor_override.mode = modes.mode
  join public.service_hours sh
    on sh.weekday = extract(dow from dates.slot_date)::smallint
  left join public.service_date_overrides ov
    on ov.available_date = dates.slot_date::date
  where dates.slot_date::date >= (now() at time zone 'Asia/Jakarta')::date
    and (
      dates.slot_date::date > (now() at time zone 'Asia/Jakarta')::date
      or (time '00:00' + hours.hour_value * interval '1 hour')::time > (now() at time zone 'Asia/Jakarta')::time
    )
    and (coalesce(counselor_override.open_slots, availability.open_slots))[hours.hour_value - 7]
    and case when modes.mode = 'Online'
      then coalesce(ov.online_is_open, sh.online_is_open)
      else coalesce(ov.offline_is_open, sh.offline_is_open)
    end
    and case when modes.mode = 'Online'
      then (coalesce(ov.online_open_slots, sh.online_open_slots))[hours.hour_value - 7]
      else (coalesce(ov.offline_open_slots, sh.offline_open_slots))[hours.hour_value - 7]
    end
    and not exists (
      select 1 from public.appointments a
      where (a.counselor_directory_id = d.id or (p.id is not null and a.counselor_id = p.id))
        and a.status::text in ('pending', 'confirmed')
        and (
          (a.status::text = 'pending'
            and a.requested_date = dates.slot_date::date
            and a.requested_start_time = (time '00:00' + hours.hour_value * interval '1 hour')::time)
          or (a.status::text = 'confirmed'
            and a.scheduled_date = dates.slot_date::date
            and a.start_time = (time '00:00' + hours.hour_value * interval '1 hour')::time)
        )
    )
  order by dates.slot_date, d.full_name, hours.hour_value;
end;
$$;

revoke all on function public.available_counselor_slots_range(date,date) from public, anon;
grant execute on function public.available_counselor_slots_range(date,date) to authenticated;

create or replace function public.admin_save_counselor_date_override(
  p_directory_id uuid,
  p_available_date date,
  p_mode text,
  p_open_slots boolean[],
  p_clear boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_counselor_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can update counselor date exceptions';
  end if;
  if p_available_date is null
    or p_available_date < (now() at time zone 'Asia/Jakarta')::date
    or p_available_date > (now() at time zone 'Asia/Jakarta')::date + 365
    or p_mode is null or p_mode not in ('Online', 'Tatap muka')
  then
    raise exception 'Choose a valid date within the next 365 days and a session mode';
  end if;
  select linked_profile_id into v_counselor_id
  from public.counselor_directory where id = p_directory_id;
  if not found then
    raise exception 'Counselor directory entry was not found';
  end if;
  if p_clear then
    delete from public.counselor_date_overrides
    where directory_id = p_directory_id and available_date = p_available_date and mode = p_mode;
    return;
  end if;
  if p_open_slots is null or cardinality(p_open_slots) <> 8 then
    raise exception 'A date exception must contain eight hourly slots';
  end if;
  if exists (
    select 1
    from public.appointments a
    cross join generate_subscripts(p_open_slots, 1) as slot(slot_index)
    where (a.counselor_directory_id = p_directory_id
        or (v_counselor_id is not null and a.counselor_id = v_counselor_id))
      and a.mode = p_mode
      and a.status::text in ('pending', 'confirmed')
      and slot.slot_index = extract(hour from case
        when a.status::text = 'pending' then a.requested_start_time
        else a.start_time
      end)::integer - 7
      and not p_open_slots[slot.slot_index]
      and case when a.status::text = 'pending' then a.requested_date else a.scheduled_date end = p_available_date
  ) then
    raise exception 'This counselor has a booked session in one of the slots being closed; reschedule or resolve that session first';
  end if;

  insert into public.counselor_date_overrides (directory_id, available_date, mode, open_slots)
  values (p_directory_id, p_available_date, p_mode, p_open_slots)
  on conflict (directory_id, available_date, mode)
  do update set open_slots = excluded.open_slots, updated_at = now();
end;
$$;

revoke all on function public.admin_save_counselor_date_override(uuid,date,text,boolean[],boolean) from public, anon;
grant execute on function public.admin_save_counselor_date_override(uuid,date,text,boolean[],boolean) to authenticated;

create or replace function public.list_counselor_directory()
returns table (
  directory_id uuid,
  full_name text,
  specialties text[],
  is_bookable boolean
)
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select d.id, d.full_name, d.specialties,
    exists (
      select 1 from public.counselor_availability ca
      where ca.directory_id = d.id
        and ca.open_slots && array[true,true,true,true,true,true,true,true]
    ) or exists (
      select 1 from public.counselor_date_overrides co
      where co.directory_id = d.id
        and co.open_slots && array[true,true,true,true,true,true,true,true]
    )
  from public.counselor_directory d
  where d.is_listed or public.is_admin()
  order by d.full_name
$$;

revoke all on function public.list_counselor_directory() from public, anon;
grant execute on function public.list_counselor_directory() to authenticated;
