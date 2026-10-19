-- Data dummy Profiling PANDU dan Tes OMNI untuk preview/pengembangan (bukan data mahasiswa nyata).
-- Jalankan setelah pandu-profiling.sql, omni-profiling.sql, dan seed akun demo. Aman dijalankan ulang.
--  * 60 mahasiswa dummy (NIM DUMMY-PROF-001..060): terlihat di menu Profiling PANDU dan OMNI admin.
--    Nomor 056-060 sengaja "belum lengkap" untuk mencoba tampilan tersebut.
--  * Mahasiswa demo Nadia Putri (NIM 1202210031) memiliki hasil PANDU dan OMNI lengkap; konselor demo
--    (konselor.demo@...) yang menangani sesinya dapat melihatnya di halaman Jadwal.
-- Hapus kembali dengan baris di bagian paling bawah.

do $$
declare
  faculties text[] := array['Fakultas Ekonomi dan Bisnis','Fakultas Rekayasa Industri','Fakultas Teknik Elektro','Fakultas Informatika','Fakultas Industri Kreatif','Fakultas Ilmu Terapan'];
  programs text[] := array['S1 Manajemen Bisnis','S1 Teknik Industri','S1 Teknik Telekomunikasi','S1 Informatika','S1 Desain Komunikasi Visual','D3 Teknologi Telekomunikasi'];
  first_names text[] := array['Aditya','Bunga','Citra','Dimas','Eka','Fajar','Gita','Hendra','Indah','Joko','Kirana','Lutfi','Maya','Nanda','Oki','Putri','Qori','Rafi','Salsa','Tegar'];
  last_names text[] := array['Pratama','Lestari','Wijaya','Saputra','Rahmawati','Hidayat','Kusuma','Permata','Nugroho','Anggraini'];
  pd_codes text[] := array['PAR','SCH','SCT','ANT','BOR','HIS','NAR','AVD','DEP','OBC'];
  normal_codes text[] := array['AE','AM','AN','AS','CO','DE','DU','EC','EH','EN','FL','HS','IM','IT','IR','MD','MO','OR','SI','SN','SO','SR','TO','TR','WR'];
  factor_codes text[] := array['AGRE','CONC','EXTR','NARC','NEUR','OPEN','SENS'];
  rec record;
  i integer;
  idx integer;
  nim_value text;
  name_value text;
  fac text; prog text; cohort_value text;
  complete boolean;
  pd jsonb; normal jsonb; factor jsonb; validity jsonb;
  flags integer; top_code text; top_t numeric;
  res_index numeric;
  tbl text;
begin
  perform setseed(0.42);
  for i in 1..61 loop
    if i = 61 then
      nim_value := '1202210031'; name_value := 'Nadia Putri'; fac := 'Fakultas Informatika'; prog := 'S1 Informatika'; cohort_value := '2022'; complete := true;
    else
      nim_value := 'DUMMY-PROF-' || lpad(i::text, 3, '0');
      name_value := first_names[1 + (i * 7) % 20] || ' ' || last_names[1 + (i * 3) % 10] || ' (Dummy)';
      idx := 1 + (i % 6);
      fac := faculties[idx]; prog := programs[idx];
      cohort_value := (2021 + (i % 5))::text;
      complete := i <= 55;
    end if;

    foreach tbl in array array['pandu_results', 'omni_results'] loop
      if complete then
        validity := jsonb_build_object('VRIN', round((38 + random() * 22)::numeric, 1), 'CD', round((40 + random() * 30)::numeric, 1));
        select jsonb_object_agg(c, round((38 + random() * 28)::numeric, 1)) into normal from unnest(normal_codes) c;
        select jsonb_object_agg(c, round((40 + random() * 30)::numeric, 1)) into factor from unnest(factor_codes) c;
        select jsonb_object_agg(c, round((40 + random() * 22 + case when random() < 0.12 then 20 else 0 end)::numeric, 1)) into pd from unnest(pd_codes) c;
        -- Nadia: pola tetap agar demo konsisten (satu skala tinggi).
        if i = 61 then pd := jsonb_set(pd, '{AVD}', '72.4'); end if;
        select count(*), max(value::numeric) into flags, top_t from jsonb_each_text(pd) where value::numeric >= 70;
        select key, value::numeric into top_code, top_t from jsonb_each_text(pd) order by value::numeric desc limit 1;
        res_index := round((25 + random() * 70)::numeric, 1);
      end if;

      if tbl = 'pandu_results' then
        insert into public.pandu_results (nim, full_name, program_study, faculty, cohort, fill_status, answered_items, total_items, is_complete,
          validity, normal_scales, pd_scales, factor_scales, pd_flag_count, pd_top_scale, pd_top_t, pd_status, resilience_score, resilience_index)
        values (nim_value, name_value, prog, fac, cohort_value,
          case when complete then 'Lengkap' else 'Belum lengkap (' || (60 + i) || '/375)' end,
          case when complete then 375 else 60 + i end, 375, complete,
          case when complete then validity else '{}' end, case when complete then normal else '{}' end,
          case when complete then pd else '{}' end, case when complete then factor else '{}' end,
          case when complete then flags end, case when complete then top_code end, case when complete then top_t end,
          case when complete then case when flags > 0 then 'Perlu telaah profesional' else 'Tidak ada flag' end end,
          case when complete then round(res_index / 100 * 48) end, case when complete then res_index end)
        on conflict (nim) do update set full_name = excluded.full_name, program_study = excluded.program_study, faculty = excluded.faculty,
          cohort = excluded.cohort, fill_status = excluded.fill_status, answered_items = excluded.answered_items, total_items = excluded.total_items,
          is_complete = excluded.is_complete, validity = excluded.validity, normal_scales = excluded.normal_scales, pd_scales = excluded.pd_scales,
          factor_scales = excluded.factor_scales, pd_flag_count = excluded.pd_flag_count, pd_top_scale = excluded.pd_top_scale,
          pd_top_t = excluded.pd_top_t, pd_status = excluded.pd_status, resilience_score = excluded.resilience_score,
          resilience_index = excluded.resilience_index, imported_at = now();
      else
        insert into public.omni_results (nim, full_name, program_study, faculty, cohort, fill_status, answered_items, total_items, is_complete,
          validity, normal_scales, pd_scales, factor_scales, pd_flag_count, pd_top_scale, pd_top_t, pd_status)
        values (nim_value, name_value, prog, fac, cohort_value,
          case when complete then 'Lengkap' else 'Belum lengkap (' || (80 + i) || '/375)' end,
          case when complete then 375 else 80 + i end, 375, complete,
          case when complete then validity else '{}' end, case when complete then normal else '{}' end,
          case when complete then pd else '{}' end, case when complete then factor else '{}' end,
          case when complete then flags end, case when complete then top_code end, case when complete then top_t end,
          case when complete then case when flags > 0 then 'Perlu telaah profesional' else 'Tidak ada flag' end end)
        on conflict (nim) do update set full_name = excluded.full_name, program_study = excluded.program_study, faculty = excluded.faculty,
          cohort = excluded.cohort, fill_status = excluded.fill_status, answered_items = excluded.answered_items, total_items = excluded.total_items,
          is_complete = excluded.is_complete, validity = excluded.validity, normal_scales = excluded.normal_scales, pd_scales = excluded.pd_scales,
          factor_scales = excluded.factor_scales, pd_flag_count = excluded.pd_flag_count, pd_top_scale = excluded.pd_top_scale,
          pd_top_t = excluded.pd_top_t, pd_status = excluded.pd_status, imported_at = now();
      end if;
    end loop;
  end loop;
end $$;

-- Menghapus data dummy ini:
-- delete from public.pandu_results where nim like 'DUMMY-PROF-%' or nim = '1202210031';
-- delete from public.omni_results where nim like 'DUMMY-PROF-%' or nim = '1202210031';
