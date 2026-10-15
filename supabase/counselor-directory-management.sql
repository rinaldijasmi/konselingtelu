alter table public.counselor_directory
  add column if not exists phone text,
  add column if not exists contact_email text;

update public.counselor_directory d
set contact_email = lower(d.source_key || '@example.invalid'),
    phone = coalesce(d.phone, p.phone)
from public.profiles p
where d.linked_profile_id = p.id
  and d.contact_email is null;

update public.counselor_directory
set contact_email = lower(source_key || '@example.invalid')
where contact_email is null;

alter table public.counselor_directory alter column contact_email set not null;

create unique index if not exists counselor_directory_contact_email_key
  on public.counselor_directory (lower(contact_email))
  where contact_email is not null;

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

revoke all on function public.admin_save_counselor_directory(uuid,text,text[],text,text) from public, anon;
grant execute on function public.admin_save_counselor_directory(uuid,text,text[],text,text) to authenticated;
