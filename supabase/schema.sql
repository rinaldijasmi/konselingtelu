create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('student', 'counselor', 'admin', 'superadmin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'rejected', 'cancelled', 'no_response');
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

create table if not exists public.counselor_directory (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  full_name text not null,
  specialties text[] not null default '{}',
  phone text,
  contact_email text,
  linked_profile_id uuid unique references public.profiles(id) on delete set null,
  is_listed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.counselor_directory
  add column if not exists phone text,
  add column if not exists contact_email text;

create table if not exists public.counselor_availability (
  directory_id uuid not null references public.counselor_directory(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  mode text not null check (mode in ('Online', 'Tatap muka')),
  open_slots boolean[] not null default array[false,false,false,false,false,false,false,false],
  updated_at timestamptz not null default now(),
  primary key (directory_id, weekday, mode),
  check (cardinality(open_slots) = 8)
);

create table if not exists public.counselor_date_overrides (
  directory_id uuid not null references public.counselor_directory(id) on delete cascade,
  available_date date not null,
  mode text not null check (mode in ('Online', 'Tatap muka')),
  open_slots boolean[] not null default array[false,false,false,false,false,false,false,false],
  updated_at timestamptz not null default now(),
  primary key (directory_id, available_date, mode),
  check (cardinality(open_slots) = 8)
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
  admin_close_reason text,
  reminder_student_opened boolean not null default false,
  reminder_counselor_opened boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(student_id, guest_student_id) = 1),
  constraint appointments_closed_status_requires_admin_note
    check (status::text not in ('cancelled', 'no_response') or nullif(btrim(admin_close_reason), '') is not null),
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

create unique index if not exists appointments_one_pending_counselor_slot
on public.appointments (counselor_id, requested_date, requested_start_time)
where counselor_id is not null and status = 'pending';

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

insert into public.counselor_directory (source_key, full_name, specialties)
values
  ('gentur-anto-judho', 'Gentur Anto Judho, S.Psi., Psikolog', array['Permasalahan belajar','Prokrastinasi','Gangguan kepribadian','Pengembangan karir']),
  ('rosi-hernawati', 'Rosi Hernawati, M.Psi., Psikolog', array['Tumbuh kembang anak & remaja','Perlindungan & pencegahan kekerasan','Pemilihan karir']),
  ('rahmi-dahnan', 'Rahmi Dahnan, S.Psi., M.Pd., Psikolog', array['Permasalahan dengan orang tua','Masalah GPPH/ADHD','Permasalahan komunikasi','Persiapan pernikahan/relasi dengan calon pasangan']),
  ('didik-kusnadi', 'Didik Kusnadi, S.Psi., M.Psi., Psikolog', array['Adiksi & penyalahgunaan NAPZA','Gangguan psikotik','Gangguan depresi','HIV-AIDS']),
  ('magdalena-hanoum', 'Magdalena Hanoum, M.Psi., Psikolog', array['Adaptasi akademik-sosial','Gangguan kecemasan','Trauma healing','Permasalahan kekerasan seksual']),
  ('marina-puspa-ningrum', 'Marina Puspa Ningrum, M.Psi., Psikolog', array['Masalah emosi','Hubungan relasi','Self-harm (Non-suicidal Self-Injury/NSSI)','Griefing']),
  ('halimah-syadiyah', 'Halimah Sya’diyah, M.Psi., Psikolog', array['Masalah emosi (cemas, depressed mood, anger issue)','Kekerasan (dampak trauma, melakukan atau mendapatkan kekerasan)','Griefing (perpisahan, meninggal)']),
  ('anak-agung-via-aristyawati', 'Anak Agung Istri Via Aristyawati, S.Psi', array['Psikologi dewasa','Pengembangan diri','Permasalahan quarter life crisis']),
  ('sasanti', 'Sasanti, S.Psi', array['Regulasi emosi','Kecemasan','Prokrastinasi','Pengembangan diri']),
  ('shinta-putrinanda', 'Shinta Putrinanda, M.Si., Psikolog', array['Motivasi','Pemilihan karir','Gangguan kecemasan']),
  ('nurul-astria-putri', 'Nurul Astria Putri, M.Psi., Psikolog', array['Masalah mood dan emosi','Stres & kecemasan','Hubungan interpersonal & keluarga','Self development']),
  ('hana-kamilah', 'Hana Kamilah, S.Psi., M.Psi., Psikolog', array['Gangguan perasaan & suasana hati','Trauma','Penyesuaian akademik','Relasi interpersonal','Bimbingan karir']),
  ('elvin-rosalina', 'Elvin Rosalina, M.Psi., Psikolog', array['Kesehatan mental remaja','Psikologi pendidikan','Manajemen SDM']),
  ('diandra-ayu-citi', 'Diandra Ayu Citi W., M.Psi., Psikolog', array['Masalah emosi (mood, stres, kecemasan)','Trauma','Kecemasan','Masalah hubungan intimasi (pacaran dan pernikahan)']),
  ('rr-dyah-windy-ramadhiyanti', 'RR. Dyah Windy Ramadhiyanti, M.Psi., Psikolog', array['Masalah emosi','Stres dan gangguan kecemasan','Masalah keluarga dan hubungan dengan pasangan','Pengembangan diri']),
  ('nuria-ristnawati', 'Nuria Ristnawati, M.Psi., Psikolog', array['Pengembangan diri','Masalah emosi (stres, kecemasan)','Masalah relasi','Masalah kepribadian']),
  ('zahra-fadilah-syamil', 'Zahra Fadilah Syamil, S.Psi', array['Self-compassion','Potensi diri','Pemahaman diri','Bahasa Inggris (native speaker)']),
  ('rana-fathina', 'Rana Fathina, S.Psi', array['Potensi diri','Permasalahan akademik','Regulasi emosi','Masalah adaptasi'])
on conflict (source_key) do nothing;

update public.counselor_directory
set contact_email = lower(source_key || '@example.invalid')
where contact_email is null;

alter table public.counselor_directory alter column contact_email set not null;

create unique index if not exists counselor_directory_contact_email_key
  on public.counselor_directory (lower(contact_email))
  where contact_email is not null;

with schedule_windows (source_key, weekday, mode, start_hour, end_hour) as (
  values
    ('gentur-anto-judho', 1, 'Tatap muka', 9, 12),
    ('gentur-anto-judho', 2, 'Tatap muka', 9, 12),
    ('gentur-anto-judho', 3, 'Tatap muka', 9, 12),
    ('gentur-anto-judho', 4, 'Tatap muka', 9, 12),
    ('rosi-hernawati', 2, 'Online', 9, 12),
    ('rahmi-dahnan', 1, 'Online', 13, 16),
    ('didik-kusnadi', 5, 'Online', 9, 10),
    ('didik-kusnadi', 5, 'Online', 14, 16),
    ('magdalena-hanoum', 5, 'Online', 14, 16),
    ('marina-puspa-ningrum', 2, 'Tatap muka', 13, 16),
    ('marina-puspa-ningrum', 3, 'Tatap muka', 13, 16),
    ('halimah-syadiyah', 4, 'Online', 13, 16),
    ('anak-agung-via-aristyawati', 1, 'Tatap muka', 8, 15),
    ('anak-agung-via-aristyawati', 2, 'Tatap muka', 8, 15),
    ('anak-agung-via-aristyawati', 3, 'Tatap muka', 8, 15),
    ('anak-agung-via-aristyawati', 4, 'Tatap muka', 8, 15),
    ('anak-agung-via-aristyawati', 5, 'Tatap muka', 8, 15),
    ('sasanti', 1, 'Tatap muka', 8, 15),
    ('sasanti', 2, 'Tatap muka', 8, 15),
    ('sasanti', 3, 'Tatap muka', 8, 15),
    ('sasanti', 4, 'Tatap muka', 8, 15),
    ('sasanti', 5, 'Tatap muka', 8, 15),
    ('shinta-putrinanda', 1, 'Online', 13, 16),
    ('nurul-astria-putri', 1, 'Online', 9, 13),
    ('nurul-astria-putri', 2, 'Online', 9, 13),
    ('nurul-astria-putri', 3, 'Online', 9, 13),
    ('nurul-astria-putri', 5, 'Online', 9, 11),
    ('hana-kamilah', 5, 'Tatap muka', 9, 15),
    ('elvin-rosalina', 1, 'Tatap muka', 9, 14),
    ('elvin-rosalina', 2, 'Tatap muka', 9, 14),
    ('elvin-rosalina', 3, 'Tatap muka', 9, 14),
    ('diandra-ayu-citi', 1, 'Tatap muka', 13, 16),
    ('diandra-ayu-citi', 4, 'Tatap muka', 13, 16),
    ('rr-dyah-windy-ramadhiyanti', 2, 'Online', 14, 16),
    ('rr-dyah-windy-ramadhiyanti', 5, 'Online', 14, 16),
    ('nuria-ristnawati', 3, 'Online', 9, 15),
    ('zahra-fadilah-syamil', 1, 'Tatap muka', 8, 15),
    ('zahra-fadilah-syamil', 2, 'Tatap muka', 8, 15),
    ('zahra-fadilah-syamil', 3, 'Tatap muka', 8, 15),
    ('zahra-fadilah-syamil', 4, 'Tatap muka', 8, 15),
    ('zahra-fadilah-syamil', 5, 'Tatap muka', 8, 15),
    ('rana-fathina', 1, 'Tatap muka', 8, 15),
    ('rana-fathina', 2, 'Tatap muka', 8, 15),
    ('rana-fathina', 3, 'Tatap muka', 8, 15),
    ('rana-fathina', 4, 'Tatap muka', 8, 15),
    ('rana-fathina', 5, 'Tatap muka', 8, 15)
), slot_hours as (
  select d.id as directory_id, w.weekday, w.mode, h.hour_value,
    bool_or(h.hour_value >= w.start_hour and h.hour_value < w.end_hour) as is_open
  from schedule_windows w
  join public.counselor_directory d on d.source_key = w.source_key
  cross join generate_series(8, 15) as h(hour_value)
  group by d.id, w.weekday, w.mode, h.hour_value
), availability_seed as (
  select directory_id, weekday, mode,
    array_agg(is_open order by hour_value) as open_slots
  from slot_hours
  group by directory_id, weekday, mode
)
insert into public.counselor_availability (directory_id, weekday, mode, open_slots)
select directory_id, weekday, mode, open_slots from availability_seed
on conflict (directory_id, weekday, mode) do nothing;

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

  if new.counselor_id is null or not exists (
    select 1 from public.profiles p
    where p.id = new.counselor_id and p.role = 'counselor' and p.is_active
  ) then
    raise exception 'Appointment must be assigned to an active counselor';
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
  where cd.linked_profile_id = new.counselor_id
    and cd.is_listed
    and (weekly.directory_id is not null or date_override.directory_id is not null);
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
      and a.counselor_id = new.counselor_id
      and a.status::text in ('pending', 'confirmed')
      and (
        (a.status::text = 'pending' and a.requested_date = v_date and a.requested_start_time = v_start)
        or (a.status::text = 'confirmed' and a.scheduled_date = v_date and a.start_time = v_start)
      )
  ) then
    raise exception 'The selected counselor time slot is no longer available';
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
set row_security = off
as $$
declare
  v_counselor_id uuid := auth.uid();
  v_locked_appointment uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = v_counselor_id and role = 'counselor' and is_active
  ) then
    raise exception 'Only an active authenticated counselor can complete a session';
  end if;

  select id into v_locked_appointment
  from public.appointments
  where id = p_appointment_id
    and counselor_id = v_counselor_id
    and status = 'confirmed'
  for update;
  if not found then
    raise exception 'Appointment is not assigned to this counselor or is no longer confirmable';
  end if;

  insert into public.counseling_reports (
    appointment_id, counselor_id, diagnosis, description, intervention, conclusion, recommendation
  ) values (
    v_locked_appointment, v_counselor_id, p_diagnosis, p_description, p_intervention, p_conclusion, p_recommendation
  );

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
  join public.counselor_directory d
    on d.is_listed
  join public.profiles p
    on p.id = d.linked_profile_id and p.role = 'counselor' and p.is_active
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
      where a.counselor_id = p.id
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
    coalesce(p.is_active, false) and exists (
      select 1 from public.counselor_availability ca
      where ca.directory_id = d.id
        and ca.open_slots && array[true,true,true,true,true,true,true,true]
    )
  from public.counselor_directory d
  left join public.profiles p on p.id = d.linked_profile_id and p.role = 'counselor'
  where d.is_listed or public.is_admin()
  order by d.full_name
$$;

create or replace function public.admin_update_counselor_directory(
  p_directory_id uuid,
  p_full_name text,
  p_specialties text[],
  p_phone text
)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_profile_id uuid;
  v_name text := btrim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can edit counselor directory entries';
  end if;
  if length(v_name) < 2 or length(v_name) > 120
    or coalesce(cardinality(p_specialties), 0) > 30
    or (v_phone is not null and (length(v_phone) < 10 or length(v_phone) > 15))
  then
    raise exception 'Counselor name, specialties, or phone number are invalid';
  end if;

  update public.counselor_directory
  set full_name = v_name, specialties = coalesce(p_specialties, '{}'), updated_at = now()
  where id = p_directory_id
  returning linked_profile_id into v_profile_id;
  if not found then
    raise exception 'Counselor directory entry was not found';
  end if;
  if v_profile_id is not null then
    update public.profiles
    set full_name = v_name, phone = coalesce(v_phone, phone), updated_at = now()
    where id = v_profile_id and role = 'counselor';
  end if;
end;
$$;

create or replace function public.admin_save_counselor_directory(
  p_directory_id uuid,
  p_full_name text,
  p_specialties text[],
  p_phone text,
  p_contact_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_directory_id uuid;
  v_profile_id uuid;
  v_source_key text;
  v_name text := btrim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
  v_phone text := nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '');
  v_email text := lower(btrim(coalesce(p_contact_email, '')));
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can edit counselor directory entries';
  end if;
  if length(v_name) < 2 or length(v_name) > 120
    or coalesce(cardinality(p_specialties), 0) < 1
    or coalesce(cardinality(p_specialties), 0) > 30
    or (v_phone is not null and length(v_phone) not between 10 and 15)
    or length(v_email) > 254
    or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    raise exception 'Counselor name, specialties, phone number, or email are invalid';
  end if;

  if p_directory_id is null then
    v_source_key := 'manual-' || replace(gen_random_uuid()::text, '-', '');
    insert into public.counselor_directory (source_key, full_name, specialties, phone, contact_email)
    values (v_source_key, v_name, p_specialties, v_phone, v_email)
    returning id into v_directory_id;
  else
    update public.counselor_directory
    set full_name = v_name,
      specialties = p_specialties,
      phone = v_phone,
      contact_email = v_email,
      updated_at = now()
    where id = p_directory_id
    returning id, linked_profile_id into v_directory_id, v_profile_id;
    if not found then
      raise exception 'Counselor directory entry was not found';
    end if;
    if v_profile_id is not null then
      update public.profiles
      set full_name = v_name, phone = coalesce(v_phone, phone), updated_at = now()
      where id = v_profile_id and role = 'counselor';
    end if;
  end if;

  return v_directory_id;
end;
$$;

create or replace function public.save_counselor_availability(p_settings jsonb)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_directory_id uuid;
  v_setting jsonb;
  v_weekday integer;
  v_mode text;
  v_open_slots boolean[];
begin
  select cd.id into v_directory_id
  from public.counselor_directory cd
  join public.profiles p on p.id = cd.linked_profile_id
  where p.id = auth.uid() and p.role = 'counselor' and p.is_active;
  if v_directory_id is null then
    raise exception 'Only linked active counselors can update their schedule';
  end if;
  if p_settings is null or jsonb_typeof(p_settings) <> 'array' then
    raise exception 'Schedule settings must be a JSON array';
  end if;
  if jsonb_array_length(p_settings) > 14 then
    raise exception 'Schedule settings must contain at most 14 day/mode entries';
  end if;

  delete from public.counselor_availability where directory_id = v_directory_id;
  for v_setting in select value from jsonb_array_elements(p_settings)
  loop
    v_weekday := (v_setting->>'weekday')::integer;
    v_mode := v_setting->>'mode';
    select array_agg(value::boolean order by ordinality)
      into v_open_slots
      from jsonb_array_elements_text(v_setting->'open_slots') with ordinality;
    if v_weekday is null or v_weekday not between 0 and 6
      or v_mode is null or v_mode not in ('Online', 'Tatap muka')
      or coalesce(cardinality(v_open_slots), 0) <> 8
    then
      raise exception 'Invalid counselor schedule setting';
    end if;
    if coalesce(v_open_slots, array[false,false,false,false,false,false,false,false]) && array[true,true,true,true,true,true,true,true] then
      insert into public.counselor_availability (directory_id, weekday, mode, open_slots)
      values (v_directory_id, v_weekday::smallint, v_mode, v_open_slots);
    end if;
  end loop;
end;
$$;

create or replace function public.admin_save_counselor_availability(
  p_directory_id uuid,
  p_settings jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_setting jsonb;
  v_weekday integer;
  v_mode text;
  v_open_slots boolean[];
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can update counselor schedules';
  end if;
  if not exists (select 1 from public.counselor_directory where id = p_directory_id) then
    raise exception 'Counselor directory entry was not found';
  end if;
  if p_settings is null or jsonb_typeof(p_settings) <> 'array'
    or jsonb_array_length(p_settings) > 14
  then
    raise exception 'Schedule settings must be a JSON array with at most 14 entries';
  end if;

  delete from public.counselor_availability where directory_id = p_directory_id;
  for v_setting in select value from jsonb_array_elements(p_settings)
  loop
    v_weekday := (v_setting->>'weekday')::integer;
    v_mode := v_setting->>'mode';
    select array_agg(value::boolean order by ordinality)
      into v_open_slots
      from jsonb_array_elements_text(v_setting->'open_slots') with ordinality;
    if v_weekday is null or v_weekday not between 0 and 6
      or v_mode is null or v_mode not in ('Online', 'Tatap muka')
      or coalesce(cardinality(v_open_slots), 0) <> 8
    then
      raise exception 'Invalid counselor schedule setting';
    end if;
    if v_open_slots && array[true,true,true,true,true,true,true,true] then
      insert into public.counselor_availability (directory_id, weekday, mode, open_slots)
      values (p_directory_id, v_weekday::smallint, v_mode, v_open_slots);
    end if;
  end loop;
end;
$$;

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
  if v_counselor_id is not null and exists (
    select 1
    from public.appointments a
    cross join generate_subscripts(p_open_slots, 1) as slot(slot_index)
    where a.counselor_id = v_counselor_id
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

create or replace function public.prevent_invalid_appointment_closure()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if old.status::text in ('cancelled', 'no_response')
    and new.status::text is distinct from old.status::text
  then
    raise exception 'A closed appointment cannot be reopened or reclassified';
  end if;
  if new.status::text in ('cancelled', 'no_response')
    and old.status::text not in ('cancelled', 'no_response')
  then
    if not public.is_admin() then
      raise exception 'Only an active administrator can close a confirmed session';
    end if;
    if old.status::text <> 'confirmed' or old.scheduled_date > (now() at time zone 'Asia/Jakarta')::date then
      raise exception 'Only confirmed sessions scheduled for today or earlier can be closed';
    end if;
    if nullif(btrim(new.admin_close_reason), '') is null then
      raise exception 'An administrator note is required to close the session';
    end if;
    if exists (
      select 1 from public.counseling_reports r where r.appointment_id = old.id
    ) then
      raise exception 'A session with a counseling report cannot be closed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_validate_admin_closure on public.appointments;
create trigger appointments_validate_admin_closure
before update of status, admin_close_reason on public.appointments
for each row execute function public.prevent_invalid_appointment_closure();

alter table public.profiles enable row level security;
alter table public.guest_students enable row level security;
alter table public.appointments enable row level security;
alter table public.counseling_reports enable row level security;
alter table public.service_hours enable row level security;
alter table public.service_date_overrides enable row level security;
alter table public.staff_account_registry enable row level security;
alter table public.counselor_directory enable row level security;
alter table public.counselor_availability enable row level security;
alter table public.counselor_date_overrides enable row level security;

revoke all on public.profiles, public.guest_students, public.appointments, public.counseling_reports, public.service_hours, public.service_date_overrides, public.counselor_directory, public.counselor_availability, public.counselor_date_overrides from anon, public;
grant select, insert, update, delete on public.profiles, public.guest_students, public.appointments, public.counseling_reports, public.service_hours, public.service_date_overrides, public.counselor_directory, public.counselor_availability, public.counselor_date_overrides to authenticated;
grant all on public.profiles, public.guest_students, public.appointments, public.counseling_reports, public.service_hours, public.service_date_overrides, public.counselor_directory, public.counselor_availability, public.counselor_date_overrides to service_role;
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

drop policy if exists "authenticated users read listed counselor directory" on public.counselor_directory;
drop policy if exists "admins and linked counselors read counselor directory" on public.counselor_directory;
create policy "admins and linked counselors read counselor directory" on public.counselor_directory
for select to authenticated using (public.is_admin() or linked_profile_id = auth.uid());

drop policy if exists "admins manage counselor directory" on public.counselor_directory;
create policy "admins manage counselor directory" on public.counselor_directory
for all to authenticated using (public.is_admin())
with check (public.is_admin());

drop policy if exists "authenticated users read counselor availability" on public.counselor_availability;
create policy "authenticated users read counselor availability" on public.counselor_availability
for select to authenticated using (true);

drop policy if exists "admins manage counselor availability" on public.counselor_availability;
create policy "admins manage counselor availability" on public.counselor_availability
for all to authenticated using (public.is_admin())
with check (public.is_admin());

drop policy if exists "counselors manage own availability" on public.counselor_availability;
create policy "counselors manage own availability" on public.counselor_availability
for all to authenticated using (
  exists (
    select 1 from public.counselor_directory d
    where d.id = counselor_availability.directory_id and d.linked_profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.counselor_directory d
    where d.id = counselor_availability.directory_id and d.linked_profile_id = auth.uid()
  )
);

drop policy if exists "admins read counselor date overrides" on public.counselor_date_overrides;
create policy "admins read counselor date overrides" on public.counselor_date_overrides
for select to authenticated using (public.is_admin());

drop policy if exists "counselors read own date overrides" on public.counselor_date_overrides;
create policy "counselors read own date overrides" on public.counselor_date_overrides
for select to authenticated using (exists (
  select 1 from public.counselor_directory d
  where d.id = counselor_date_overrides.directory_id and d.linked_profile_id = auth.uid()
));

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
  student_id = auth.uid() and counselor_id is not null and status = 'pending'
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
revoke all on function public.available_counselor_slots_range(date,date) from public, anon;
grant execute on function public.available_counselor_slots_range(date,date) to authenticated;
revoke all on function public.list_counselor_directory() from public, anon;
grant execute on function public.list_counselor_directory() to authenticated;
revoke all on function public.admin_update_counselor_directory(uuid,text,text[],text) from public, anon;
grant execute on function public.admin_update_counselor_directory(uuid,text,text[],text) to authenticated;
revoke all on function public.admin_save_counselor_directory(uuid,text,text[],text,text) from public, anon;
grant execute on function public.admin_save_counselor_directory(uuid,text,text[],text,text) to authenticated;
revoke all on function public.save_counselor_availability(jsonb) from public, anon;
grant execute on function public.save_counselor_availability(jsonb) to authenticated;
revoke all on function public.admin_save_counselor_availability(uuid,jsonb) from public, anon;
grant execute on function public.admin_save_counselor_availability(uuid,jsonb) to authenticated;
revoke all on function public.admin_save_counselor_date_override(uuid,date,text,boolean[],boolean) from public, anon;
grant execute on function public.admin_save_counselor_date_override(uuid,date,text,boolean[],boolean) to authenticated;
