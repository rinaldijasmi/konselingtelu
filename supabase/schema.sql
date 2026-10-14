create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('student', 'counselor', 'admin', 'superadmin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  full_name text not null default '',
  nim text unique,
  program text,
  faculty text,
  phone text,
  must_change_password boolean not null default false,
  birth_date date,
  ethnicity text,
  religion text,
  city text,
  address text,
  birth_order integer check (birth_order is null or birth_order > 0),
  sibling_count integer check (sibling_count is null or sibling_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guest_students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  nim text not null unique,
  program text not null,
  faculty text not null,
  phone text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.staff_account_registry (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  account_email text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('KN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  student_id uuid references public.profiles(id),
  guest_student_id uuid references public.guest_students(id),
  counselor_id uuid references public.profiles(id),
  requested_date date not null,
  requested_start_time time,
  requested_end_time time,
  scheduled_date date,
  start_time time,
  end_time time,
  mode text not null check (mode in ('Online', 'Tatap muka')),
  status public.appointment_status not null default 'pending',
  category text not null,
  issue_summary text not null,
  reason text not null,
  issue_details text not null,
  location text,
  schedule_changed boolean not null default false,
  reminder_student_opened boolean not null default false,
  reminder_counselor_opened boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(student_id, guest_student_id) = 1),
  check ((status not in ('confirmed', 'completed')) or (counselor_id is not null and scheduled_date is not null and start_time is not null and end_time is not null)),
  check (end_time is null or start_time is null or end_time > start_time)
);

create table if not exists public.counseling_reports (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  counselor_id uuid not null references public.profiles(id),
  diagnosis text not null,
  description text not null,
  intervention text not null,
  conclusion text not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.service_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  is_open boolean not null default false,
  open_slots boolean[] not null default array[false,false,false,false,false,false,false,false],
  online_is_open boolean not null default false,
  online_open_slots boolean[] not null default array[false,false,false,false,false,false,false,false],
  offline_is_open boolean not null default false,
  offline_open_slots boolean[] not null default array[false,false,false,false,false,false,false,false],
  updated_at timestamptz not null default now(),
  check (cardinality(open_slots) = 8),
  check (cardinality(online_open_slots) = 8),
  check (cardinality(offline_open_slots) = 8)
);

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

create unique index if not exists appointments_one_active_counselor_slot
on public.appointments (counselor_id, scheduled_date, start_time)
where counselor_id is not null and status in ('confirmed', 'completed');

create index if not exists appointments_guest_student_id_idx
on public.appointments (guest_student_id)
where guest_student_id is not null;

create unique index if not exists appointments_one_confirmed_service_slot
on public.appointments (scheduled_date, start_time, mode)
where scheduled_date is not null and start_time is not null and status in ('confirmed', 'completed');

drop index if exists public.appointments_one_pending_request_per_slot;
create unique index if not exists appointments_one_pending_request_per_slot
on public.appointments (requested_date, requested_start_time, mode)
where requested_start_time is not null and status = 'pending';

insert into public.service_hours (
  weekday, is_open, open_slots, online_is_open, online_open_slots, offline_is_open, offline_open_slots
)
values
  (0, false, array[false,false,false,false,false,false,false,false], false, array[false,false,false,false,false,false,false,false], false, array[false,false,false,false,false,false,false,false]),
  (1, true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true]),
  (2, true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true]),
  (3, true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true]),
  (4, true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true], true, array[true,true,true,true,true,true,true,true]),
  (5, true, array[true,true,true,true,true,true,false,false], true, array[true,true,true,true,true,true,false,false], true, array[true,true,true,true,true,true,false,false]),
  (6, false, array[false,false,false,false,false,false,false,false], false, array[false,false,false,false,false,false,false,false], false, array[false,false,false,false,false,false,false,false])
on conflict (weekday) do nothing;

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
      and a.status in ('pending', 'confirmed')
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

drop trigger if exists appointments_validate_slot on public.appointments;
create trigger appointments_validate_slot
before insert or update of requested_date, requested_start_time, requested_end_time, scheduled_date, start_time, end_time, mode, status, counselor_id
on public.appointments
for each row execute function public.validate_appointment_slot();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists appointments_touch_updated_at on public.appointments;
create trigger appointments_touch_updated_at before update on public.appointments
for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text in ('admin', 'superadmin') and is_active
  )
$$;

create or replace function public.can_read_related_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.appointments a
    where (a.counselor_id = p_profile_id and a.student_id = auth.uid())
       or (a.student_id = p_profile_id and a.counselor_id = auth.uid())
  )
$$;

revoke all on function public.can_read_related_profile(uuid) from public, anon;
grant execute on function public.can_read_related_profile(uuid) to authenticated;

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and auth.uid() = old.id then
    raise exception 'Users cannot change their own role';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_self_role_change on public.profiles;
create trigger prevent_self_role_change before update of role on public.profiles
for each row execute function public.prevent_self_role_change();

create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if new.role is distinct from old.role
    and auth.uid() is not null
    and not exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role::text = 'superadmin'
        and is_active
    )
  then
    raise exception 'Only an active superadmin can change account roles';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_unauthorized_role_change on public.profiles;
create trigger prevent_unauthorized_role_change before update of role on public.profiles
for each row execute function public.prevent_unauthorized_role_change();

create or replace function public.prevent_self_password_flag_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.must_change_password is distinct from old.must_change_password and auth.uid() = old.id then
    raise exception 'Users cannot change their own initial password status';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_self_password_flag_change on public.profiles;
create trigger prevent_self_password_flag_change before update of must_change_password on public.profiles
for each row execute function public.prevent_self_password_flag_change();

create or replace function public.complete_counseling_session(
  p_appointment_id uuid,
  p_diagnosis text,
  p_description text,
  p_intervention text,
  p_conclusion text,
  p_recommendation text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_counselor_id uuid := auth.uid();
begin
  if not exists (
    select 1 from public.profiles
    where id = v_counselor_id and role = 'counselor' and is_active
  ) then
    raise exception 'Only an active authenticated counselor can complete a session';
  end if;

  insert into public.counseling_reports (
    appointment_id, counselor_id, diagnosis, description, intervention, conclusion, recommendation
  )
  select id, v_counselor_id, p_diagnosis, p_description, p_intervention, p_conclusion, p_recommendation
  from public.appointments
  where id = p_appointment_id
    and counselor_id = v_counselor_id
    and status = 'confirmed';

  if not found then
    raise exception 'Appointment is not assigned to this counselor or is no longer confirmable';
  end if;

  update public.appointments
  set status = 'completed'
  where id = p_appointment_id and counselor_id = v_counselor_id and status = 'confirmed';
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
  select (time '00:00' + hours.hour_value * interval '1 hour')::time,
    (time '00:00' + (hours.hour_value + 1) * interval '1 hour')::time,
    modes.mode
  from generate_series(8, 15) as hours(hour_value)
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
      then (coalesce(ov.online_open_slots, sh.online_open_slots))[hours.hour_value - 7]
      else (coalesce(ov.offline_open_slots, sh.offline_open_slots))[hours.hour_value - 7]
    end
    and not exists (
      select 1 from public.appointments a
      where a.status in ('pending', 'confirmed')
        and a.mode = modes.mode
        and (
          (a.status = 'pending' and a.requested_date = p_date and a.requested_start_time = (time '00:00' + hours.hour_value * interval '1 hour')::time)
          or (a.status = 'confirmed' and a.scheduled_date = p_date and a.start_time = (time '00:00' + hours.hour_value * interval '1 hour')::time)
        )
    )
  order by hours.hour_value, modes.mode
$$;

create or replace function public.available_counseling_slots_range(p_start_date date, p_end_date date)
returns table (available_date date, start_time time, end_time time, mode text)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'student' and is_active
  ) then
    raise exception 'Only authenticated students can check available slots';
  end if;
  if p_end_date < p_start_date or p_end_date - p_start_date > 62 then
    raise exception 'Date range must be between 0 and 62 days';
  end if;

  return query
  select dates.slot_date::date, slots.start_time, slots.end_time, slots.mode
  from generate_series(p_start_date, p_end_date, interval '1 day') as dates(slot_date)
  cross join lateral public.available_counseling_slots(dates.slot_date::date) slots
  order by dates.slot_date, slots.start_time, slots.mode;
end;
$$;

alter table public.profiles enable row level security;
alter table public.guest_students enable row level security;
alter table public.appointments enable row level security;
alter table public.counseling_reports enable row level security;
alter table public.service_hours enable row level security;
alter table public.service_date_overrides enable row level security;
alter table public.staff_account_registry enable row level security;

revoke all on public.profiles, public.guest_students, public.appointments, public.counseling_reports, public.service_hours, public.service_date_overrides from anon, public;
grant select, insert, update, delete on public.profiles, public.guest_students, public.appointments, public.counseling_reports, public.service_hours, public.service_date_overrides to authenticated;
grant all on public.profiles, public.guest_students, public.appointments, public.counseling_reports, public.service_hours, public.service_date_overrides to service_role;
revoke all on public.staff_account_registry from anon, public;
grant select on public.staff_account_registry to authenticated;
grant all on public.staff_account_registry to service_role;

drop policy if exists "superadmins read staff account registry" on public.staff_account_registry;
create policy "superadmins read staff account registry" on public.staff_account_registry
for select to authenticated using (public.current_app_role()::text = 'superadmin');

drop policy if exists "profile self or authorized reader" on public.profiles;
create policy "profile self or authorized reader" on public.profiles
for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or public.can_read_related_profile(id)
);

drop policy if exists "profile owner can update own student details" on public.profiles;
create policy "profile owner can update own student details" on public.profiles
for update to authenticated using (id = auth.uid() and role = 'student' and is_active)
with check (id = auth.uid() and role = 'student' and is_active);

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles
for all to authenticated using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage guest students" on public.guest_students;
create policy "admins manage guest students" on public.guest_students
for all to authenticated using (public.is_admin())
with check (public.is_admin());

drop policy if exists "assigned counselors read guest students" on public.guest_students;
create policy "assigned counselors read guest students" on public.guest_students
for select to authenticated using (
  exists (
    select 1
    from public.appointments a
    join public.profiles p on p.id = auth.uid()
    where a.guest_student_id = guest_students.id
      and a.counselor_id = auth.uid()
      and p.role = 'counselor'
      and p.is_active
  )
);

drop policy if exists "students read own appointments" on public.appointments;
create policy "students read own appointments" on public.appointments
for select to authenticated using (student_id = auth.uid());

drop policy if exists "students submit own appointments" on public.appointments;
create policy "students submit own appointments" on public.appointments
for insert to authenticated with check (
  student_id = auth.uid() and counselor_id is null and status = 'pending'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student' and p.is_active)
);

drop policy if exists "assigned counselors read appointments" on public.appointments;
create policy "assigned counselors read appointments" on public.appointments
for select to authenticated using (
  counselor_id = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'counselor' and p.is_active)
);

drop policy if exists "admins manage appointments" on public.appointments;
create policy "admins manage appointments" on public.appointments
for all to authenticated using (public.is_admin())
with check (public.is_admin());

drop policy if exists "counselors and admins read reports" on public.counseling_reports;
create policy "counselors and admins read reports" on public.counseling_reports
for select to authenticated using (
  public.is_admin()
  or (
    counselor_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'counselor' and p.is_active)
  )
);

drop policy if exists "authenticated users read service hours" on public.service_hours;
create policy "authenticated users read service hours" on public.service_hours
for select to authenticated using (true);

drop policy if exists "admins manage service hours" on public.service_hours;
create policy "admins manage service hours" on public.service_hours
for all to authenticated using (public.is_admin())
with check (public.is_admin());

drop policy if exists "authenticated users read service date overrides" on public.service_date_overrides;
create policy "authenticated users read service date overrides" on public.service_date_overrides
for select to authenticated using (true);

drop policy if exists "admins manage service date overrides" on public.service_date_overrides;
create policy "admins manage service date overrides" on public.service_date_overrides
for all to authenticated using (public.is_admin())
with check (public.is_admin());

revoke all on function public.complete_counseling_session(uuid,text,text,text,text,text) from public;
grant execute on function public.complete_counseling_session(uuid,text,text,text,text,text) to authenticated;
revoke all on function public.available_counseling_slots(date) from public;
grant execute on function public.available_counseling_slots(date) to authenticated;
revoke all on function public.available_counseling_slots_range(date,date) from public;
grant execute on function public.available_counseling_slots_range(date,date) to authenticated;
