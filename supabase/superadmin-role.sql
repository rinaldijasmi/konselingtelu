alter type public.app_role add value if not exists 'superadmin';

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

create table if not exists public.staff_account_registry (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  account_email text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.staff_account_registry enable row level security;
revoke all on public.staff_account_registry from anon, public;
grant select on public.staff_account_registry to authenticated;
grant all on public.staff_account_registry to service_role;

drop policy if exists "superadmins read staff account registry" on public.staff_account_registry;
create policy "superadmins read staff account registry" on public.staff_account_registry
for select to authenticated using (public.current_app_role()::text = 'superadmin');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role::text in ('admin', 'superadmin')
      and is_active
  )
$$;

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
