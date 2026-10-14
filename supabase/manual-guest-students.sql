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

alter table public.appointments
  alter column student_id drop not null,
  add column if not exists guest_student_id uuid references public.guest_students(id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.appointments'::regclass
      and conname = 'appointments_exactly_one_student'
  ) then
    alter table public.appointments
      add constraint appointments_exactly_one_student
      check (num_nonnulls(student_id, guest_student_id) = 1);
  end if;
end
$$;

create index if not exists appointments_guest_student_id_idx
on public.appointments (guest_student_id)
where guest_student_id is not null;

alter table public.guest_students enable row level security;
revoke all on public.guest_students from anon, public;
grant select, insert, update, delete on public.guest_students to authenticated;
grant all on public.guest_students to service_role;

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
