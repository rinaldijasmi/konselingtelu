-- Sesi dummy untuk konselor demo (Dr. Rani Putri), tersebar di setiap hari 5 Oktober - 6 November 2026.
-- Mahasiswa memakai NIM DUMMY-PROF-001..055 sehingga hasil PANDU dan OMNI-nya tampil di halaman konselor.
-- Jalankan setelah dummy-profiling.sql dan seed akun demo. Aman dijalankan ulang (kode DUMMY-RANI-*).
-- Khusus preview/pengembangan, bukan produksi.

do $$
declare
  v_counselor uuid;
  v_admin uuid;
  v_directory uuid;
  v_day date;
  v_slot integer;
  v_seq integer := 0;
  v_nim text;
  v_guest uuid;
  v_time time;
  v_mode text;
  v_status text;
  v_code text;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  select id into v_counselor from public.profiles where full_name = 'Dr. Rani Putri' and role = 'counselor' limit 1;
  select id into v_admin from public.profiles where role in ('admin', 'superadmin') order by created_at limit 1;
  if v_counselor is null or v_admin is null then
    raise exception 'Akun demo konselor/admin belum ada. Jalankan scripts/seed-demo-users.mjs dahulu.';
  end if;

  select id into v_directory from public.counselor_directory where linked_profile_id = v_counselor;
  if v_directory is null then
    insert into public.counselor_directory (source_key, full_name, specialties, contact_email, phone, linked_profile_id, is_listed)
    values ('demo-konselor-rani', 'Dr. Rani Putri', array['Akademik', 'Karier', 'Relasi'], 'konselor.demo@telkomuniversity.ac.id', '6281234567001', v_counselor, true)
    returning id into v_directory;
  end if;

  insert into public.counselor_availability (directory_id, weekday, mode, open_slots)
  select v_directory, w, m, array_fill(true, array[8])
  from generate_series(0, 6) w, unnest(array['Online', 'Tatap muka']) m
  on conflict (directory_id, weekday, mode) do update set open_slots = excluded.open_slots, updated_at = now();

  alter table public.appointments disable trigger appointments_validate_slot;
  for v_day in select d::date from generate_series(date '2026-10-05', date '2026-11-06', interval '1 day') d loop
    foreach v_slot in array array[9, 13] loop
      v_seq := v_seq + 1;
      v_nim := 'DUMMY-PROF-' || lpad((1 + (v_seq * 7) % 55)::text, 3, '0');
      v_time := make_time(v_slot, 0, 0);
      v_mode := case when v_seq % 2 = 0 then 'Online' else 'Tatap muka' end;
      v_status := case when v_day < v_today or (v_day = v_today and v_slot < 14) then 'completed' else 'confirmed' end;
      v_code := 'DUMMY-RANI-' || to_char(v_day, 'YYYYMMDD') || '-' || v_slot;

      insert into public.guest_students (full_name, nim, program, faculty, phone, created_by)
      select p.full_name, p.nim, coalesce(p.program_study, '-'), coalesce(p.faculty, '-'), '0000000000', v_admin
      from public.pandu_results p where p.nim = v_nim
      on conflict (nim) do update set full_name = excluded.full_name, program = excluded.program, faculty = excluded.faculty
      returning id into v_guest;
      if v_guest is null then select id into v_guest from public.guest_students where nim = v_nim; end if;

      insert into public.appointments (
        code, guest_student_id, counselor_id, counselor_directory_id,
        requested_date, requested_start_time, requested_end_time,
        scheduled_date, start_time, end_time, mode, status, category,
        issue_summary, reason, issue_details, location
      ) values (
        v_code, v_guest, v_counselor, v_directory,
        v_day, v_time, v_time + interval '1 hour', v_day, v_time, v_time + interval '1 hour',
        v_mode, v_status::public.appointment_status,
        (array['Akademik', 'Karier', 'Relasi', 'Pribadi'])[1 + v_seq % 4],
        'Data simulasi untuk preview (bukan informasi konseling asli)', 'Data dummy untuk preview',
        'Data simulasi; bukan detail konseling asli',
        case when v_mode = 'Online' then 'https://example.invalid/dummy-session' else 'Ruang Konseling (dummy)' end
      ) on conflict (code) do nothing;
    end loop;
  end loop;
  alter table public.appointments enable trigger appointments_validate_slot;
end $$;

-- Menghapus data dummy ini:
-- delete from public.appointments where code like 'DUMMY-RANI-%';
-- delete from public.guest_students where nim like 'DUMMY-PROF-%';
