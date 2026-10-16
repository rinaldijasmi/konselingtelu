-- Hasil tes PANDU Tel-U (Profiling Personality, Adaptability, and Resilience Diagnostic).
-- Data psikologis bersifat sensitif: hanya admin/superadmin yang dapat membaca,
-- dan tidak ada akses tulis dari browser. Impor dilakukan lewat SQL Editor.

create table if not exists public.pandu_results (
  nim text primary key,
  full_name text not null,
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
  resilience_items jsonb not null default '{}'::jsonb,
  resilience_score numeric,
  resilience_index numeric,
  imported_at timestamptz not null default now()
);

alter table public.pandu_results enable row level security;
revoke all on public.pandu_results from anon, public;
revoke insert, update, delete on public.pandu_results from authenticated;
grant select on public.pandu_results to authenticated;
grant all on public.pandu_results to service_role;

drop policy if exists "admins read pandu results" on public.pandu_results;
create policy "admins read pandu results" on public.pandu_results
for select to authenticated using (public.is_admin());
