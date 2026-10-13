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

drop policy if exists "profile self or authorized reader" on public.profiles;
create policy "profile self or authorized reader" on public.profiles
for select to authenticated using (
  id = auth.uid()
  or public.is_admin()
  or public.can_read_related_profile(id)
);
