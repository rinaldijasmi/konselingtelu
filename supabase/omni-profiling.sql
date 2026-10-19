-- Hasil Tes OMNI (format skala sama dengan PANDU, tanpa resiliensi). Bukan hasil PANDU Tel-U.
-- Hanya admin/superadmin yang dapat membaca; tulis lewat fungsi admin_upsert_omni_results.

create table if not exists public.omni_results (
  nim text primary key,
  full_name text not null,
  program_study text,
  faculty text,
  cohort text,
  fill_status text not null,
  answered_items integer,
  total_items integer,
  is_complete boolean not null default false,
  validity jsonb not null default '{}'::jsonb,
  normal_scales jsonb not null default '{}'::jsonb,
  pd_scales jsonb not null default '{}'::jsonb,
  factor_scales jsonb not null default '{}'::jsonb,
  pd_flag_count integer,
  pd_top_scale text,
  pd_top_t numeric,
  pd_status text,
  imported_at timestamptz not null default now()
);


alter table public.omni_results enable row level security;
revoke all on public.omni_results from anon, public;
revoke insert, update, delete on public.omni_results from authenticated;
grant select on public.omni_results to authenticated;
grant all on public.omni_results to service_role;

drop policy if exists "admins read omni results" on public.omni_results;
create policy "admins read omni results" on public.omni_results
for select to authenticated using (public.is_admin());

-- Input hasil Tes OMNI oleh admin dan akses baca terbatas untuk konselor.
-- Aman dijalankan ulang.

create or replace function public.admin_upsert_omni_results(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  affected integer;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menambah data profiling' using errcode = '42501';
  end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Data harus berupa daftar';
  end if;
  if jsonb_array_length(p_rows) > 500 then
    raise exception 'Maksimal 500 baris per impor';
  end if;

  insert into public.omni_results (
    nim, full_name, program_study, faculty, cohort, fill_status, answered_items, total_items, is_complete,
    validity, normal_scales, pd_scales, factor_scales,
    pd_flag_count, pd_top_scale, pd_top_t, pd_status
  )
  select
    left(btrim(r.nim), 40), left(btrim(r.full_name), 200), left(r.program_study, 200), left(r.faculty, 200), left(r.cohort, 20),
    left(coalesce(r.fill_status, ''), 80), r.answered_items, r.total_items, coalesce(r.is_complete, false),
    coalesce(r.validity, '{}'::jsonb), coalesce(r.normal_scales, '{}'::jsonb), coalesce(r.pd_scales, '{}'::jsonb), coalesce(r.factor_scales, '{}'::jsonb),
    r.pd_flag_count, left(r.pd_top_scale, 20), r.pd_top_t, left(r.pd_status, 80)
  from jsonb_to_recordset(p_rows) as r(
    nim text, full_name text, program_study text, faculty text, cohort text, fill_status text,
    answered_items integer, total_items integer, is_complete boolean,
    validity jsonb, normal_scales jsonb, pd_scales jsonb, factor_scales jsonb,
    pd_flag_count integer, pd_top_scale text, pd_top_t numeric, pd_status text
  )
  where nullif(btrim(r.nim), '') is not null and nullif(btrim(r.full_name), '') is not null
  on conflict (nim) do update set
    full_name = excluded.full_name, program_study = excluded.program_study, faculty = excluded.faculty,
    cohort = excluded.cohort, fill_status = excluded.fill_status, answered_items = excluded.answered_items,
    total_items = excluded.total_items, is_complete = excluded.is_complete, validity = excluded.validity,
    normal_scales = excluded.normal_scales, pd_scales = excluded.pd_scales, factor_scales = excluded.factor_scales,
    pd_flag_count = excluded.pd_flag_count, pd_top_scale = excluded.pd_top_scale, pd_top_t = excluded.pd_top_t,
    pd_status = excluded.pd_status, imported_at = now()
  -- Hasil lengkap tidak boleh tertimpa data yang belum lengkap.
  where excluded.is_complete or not public.omni_results.is_complete;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Konselor hanya bisa membaca profiling mahasiswa yang punya pengajuan/sesi dengan dirinya.
create or replace function public.counselor_omni_result(p_nim text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role::text = 'counselor' and is_active
  ) then
    return null;
  end if;

  if not exists (
    select 1
    from public.appointments a
    left join public.profiles s on s.id = a.student_id
    left join public.guest_students g on g.id = a.guest_student_id
    where a.counselor_id = auth.uid()
      and a.status in ('pending', 'confirmed', 'completed')
      and p_nim in (s.nim, g.nim)
  ) then
    return null;
  end if;

  select to_jsonb(p) - 'imported_at' into result
  from public.omni_results p
  where p.nim = p_nim;
  return result;
end;
$$;

revoke all on function public.admin_upsert_omni_results(jsonb) from public, anon;
revoke all on function public.counselor_omni_result(text) from public, anon;
grant execute on function public.admin_upsert_omni_results(jsonb) to authenticated;
grant execute on function public.counselor_omni_result(text) to authenticated;
