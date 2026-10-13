alter table public.service_hours
  add column if not exists online_is_open boolean,
  add column if not exists online_open_slots boolean[],
  add column if not exists offline_is_open boolean,
  add column if not exists offline_open_slots boolean[];

update public.service_hours
set online_is_open = is_open,
    online_open_slots = open_slots,
    offline_is_open = is_open,
    offline_open_slots = open_slots
where online_is_open is null
   or online_open_slots is null
   or offline_is_open is null
   or offline_open_slots is null;

alter table public.service_hours
  alter column online_is_open set default false,
  alter column online_is_open set not null,
  alter column online_open_slots set default array[false,false,false,false,false,false,false,false],
  alter column online_open_slots set not null,
  alter column offline_is_open set default false,
  alter column offline_is_open set not null,
  alter column offline_open_slots set default array[false,false,false,false,false,false,false,false],
  alter column offline_open_slots set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.service_hours'::regclass and conname = 'service_hours_online_slots_count'
  ) then
    alter table public.service_hours add constraint service_hours_online_slots_count
      check (cardinality(online_open_slots) = 8);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.service_hours'::regclass and conname = 'service_hours_offline_slots_count'
  ) then
    alter table public.service_hours add constraint service_hours_offline_slots_count
      check (cardinality(offline_open_slots) = 8);
  end if;
end
$$;

create table if not exists public.service_date_overrides (
  available_date date primary key,
  online_is_open boolean not null default false,
  online_open_slots boolean[] not null default array[false,false,false,false,false,false,false,false],
  offline_is_open boolean not null default false,
  offline_open_slots boolean[] not null default array[false,false,false,false,false,false,false,false],
  updated_at timestamptz not null default now(),
  check (cardinality(online_open_slots) = 8),
  check (cardinality(offline_open_slots) = 8)
);

drop index if exists public.appointments_one_pending_request_per_slot;
create unique index appointments_one_pending_request_per_slot
on public.appointments (requested_date, requested_start_time, mode)
where requested_start_time is not null and status = 'pending';

create unique index if not exists appointments_one_confirmed_service_slot
on public.appointments (scheduled_date, start_time, mode)
where scheduled_date is not null and start_time is not null and status in ('confirmed', 'completed');

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
begin
  if new.status not in ('pending', 'confirmed') then
    return new;
  end if;

  if new.status = 'pending' then
    v_date := new.requested_date;
    v_start := new.requested_start_time;
    v_end := new.requested_end_time;
    if new.counselor_id is not null then
      raise exception 'Pending appointment cannot have a counselor assigned';
    end if;
  else
    v_date := new.scheduled_date;
    v_start := new.start_time;
    v_end := new.end_time;
    if not exists (
      select 1 from public.profiles p
      where p.id = new.counselor_id and p.role = 'counselor' and p.is_active
    ) then
      raise exception 'Appointment must be assigned to an active counselor';
    end if;
  end if;

  if v_date is null or v_start is null or v_end is null
    or v_date < (now() at time zone 'Asia/Jakarta')::date
    or extract(minute from v_start) <> 0
    or v_end <> v_start + interval '1 hour'
  then
    raise exception 'Appointment date and one-hour time slot are invalid';
  end if;

  v_slot_index := extract(hour from v_start)::integer - 8;
  if v_slot_index < 0 or v_slot_index > 7 then
    raise exception 'Appointments must be scheduled between 08:00 and 16:00';
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
    where a.code <> new.code
      and a.mode = new.mode
      and (
        (a.status = 'pending' and a.requested_date = v_date and a.requested_start_time = v_start)
        or (a.status = 'confirmed' and a.scheduled_date = v_date and a.start_time = v_start)
      )
  ) then
    raise exception 'The selected time slot is no longer available';
  end if;

  return new;
end;
$$;

create or replace function public.available_counseling_slots(p_date date)
returns table (start_time time, end_time time, mode text)
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select (time '00:00' + hour_slot.hour_value * interval '1 hour')::time,
    (time '00:00' + (hour_slot.hour_value + 1) * interval '1 hour')::time,
    modes.mode
  from generate_series(8, 15) as hour_slot(hour_value)
  cross join (values ('Online'::text), ('Tatap muka'::text)) as modes(mode)
  left join public.service_hours sh on sh.weekday = extract(dow from p_date)::smallint
  left join public.service_date_overrides ov on ov.available_date = p_date
  where auth.uid() is not null
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student' and p.is_active)
    and p_date >= (now() at time zone 'Asia/Jakarta')::date
    and case when modes.mode = 'Online'
      then coalesce(ov.online_is_open, sh.online_is_open)
      else coalesce(ov.offline_is_open, sh.offline_is_open)
    end
    and case when modes.mode = 'Online'
      then (coalesce(ov.online_open_slots, sh.online_open_slots))[hour_slot.hour_value - 7]
      else (coalesce(ov.offline_open_slots, sh.offline_open_slots))[hour_slot.hour_value - 7]
    end
    and not exists (
      select 1 from public.appointments a
      where a.status in ('pending', 'confirmed')
        and a.mode = modes.mode
        and (
          (a.status = 'pending' and a.requested_date = p_date and a.requested_start_time = (time '00:00' + hour_slot.hour_value * interval '1 hour')::time)
          or (a.status = 'confirmed' and a.scheduled_date = p_date and a.start_time = (time '00:00' + hour_slot.hour_value * interval '1 hour')::time)
        )
    )
  order by hour_slot.hour_value, modes.mode
$$;

create or replace function public.available_counseling_slots_range(p_start_date date, p_end_date date)
returns table (available_date date, start_time time, end_time time, mode text)
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select dates.slot_date::date, slots.start_time, slots.end_time, slots.mode
  from generate_series(p_start_date, p_end_date, interval '1 day') as dates(slot_date)
  cross join lateral public.available_counseling_slots(dates.slot_date::date) slots
  where p_end_date >= p_start_date and p_end_date - p_start_date <= 62
$$;

alter table public.service_date_overrides enable row level security;
revoke all on public.service_date_overrides from anon, public;
grant select, insert, update, delete on public.service_date_overrides to authenticated;
grant all on public.service_date_overrides to service_role;

drop policy if exists "authenticated users read service date overrides" on public.service_date_overrides;
create policy "authenticated users read service date overrides" on public.service_date_overrides
for select to authenticated using (true);

drop policy if exists "admins manage service date overrides" on public.service_date_overrides;
create policy "admins manage service date overrides" on public.service_date_overrides
for all to authenticated using (public.is_admin())
with check (public.is_admin());

revoke all on function public.available_counseling_slots(date) from public;
grant execute on function public.available_counseling_slots(date) to authenticated;
revoke all on function public.available_counseling_slots_range(date,date) from public;
grant execute on function public.available_counseling_slots_range(date,date) to authenticated;
