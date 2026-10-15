-- ANONYMIZED PREVIEW DATA ONLY; do not run against production.
-- Preserves date, time, counselor roster, mode, and appointment outcome from the supplied workbook.
-- Student identity and all counseling/demographic details are replaced with generated dummy values.
-- Requires counselor-directory-booking.sql and manual-guest-students.sql.
-- Safe to rerun: each row uses a stable DUMMY-XLSX code and NIM.

do $$
declare
  v_admin_id uuid;
  v_unassigned_id uuid;
  v_directory_id uuid;
  v_counselor_id uuid;
  v_guest_id uuid;
  v_status public.appointment_status;
  v_reason text;
  v_code text;
  v_trigger_state "char";
  v_row record;
  v_inserted integer := 0;
  v_skipped integer := 0;
begin
  if to_regclass('public.appointments') is null or to_regclass('public.guest_students') is null or to_regclass('public.counselor_directory') is null or to_regclass('public.counselor_date_overrides') is null then
    raise exception 'Run the guest-student, counselor schedule, and directory booking migrations first';
  end if;
  select id into v_admin_id from public.profiles where role in ('admin', 'superadmin') and is_active order by case when role = 'superadmin' then 0 else 1 end limit 1;
  if v_admin_id is null then raise exception 'No active admin profile exists to own the anonymized preview records'; end if;
  select tgenabled into v_trigger_state from pg_trigger where tgrelid = 'public.appointments'::regclass and tgname = 'appointments_validate_slot' and not tgisinternal;
  if v_trigger_state is null or v_trigger_state <> 'O' then raise exception 'Expected the active appointment validation trigger; import stopped without changing data'; end if;

  insert into public.counselor_directory (source_key, full_name, specialties, contact_email, is_listed)
  values ('dummy-import-unassigned', 'Belum ditentukan (Dummy)', array[]::text[], 'dummy-import-unassigned@dummy.invalid', false)
  on conflict (source_key) do update set
    full_name = excluded.full_name,
    contact_email = excluded.contact_email,
    is_listed = false,
    updated_at = now();
  select id into v_unassigned_id from public.counselor_directory where source_key = 'dummy-import-unassigned';

  alter table public.appointments disable trigger appointments_validate_slot;
  for v_row in
    select * from (values
      (1, date '2026-10-02', time '09:00', 'Tatap muka', 'sasanti', 'completed'),
      (2, date '2026-10-01', time '08:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (3, date '2026-09-30', time '14:00', 'Online', 'nuria-ristnawati', 'completed'),
      (4, date '2026-10-02', time '09:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'completed'),
      (5, date '2026-10-02', time '13:00', 'Tatap muka', 'sasanti', 'completed'),
      (6, date '2026-10-02', time '10:00', 'Tatap muka', 'sasanti', 'completed'),
      (7, date '2026-09-30', time '13:00', 'Online', 'nuria-ristnawati', 'completed'),
      (8, date '2026-09-30', time '15:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'completed'),
      (9, date '2026-09-30', time '09:00', 'Online', 'nuria-ristnawati', 'completed'),
      (10, date '2026-10-05', time '14:00', 'Online', 'diandra-ayu-citi', 'completed'),
      (11, date '2026-10-06', time '09:00', 'Tatap muka', NULL, 'cancelled'),
      (12, date '2026-10-01', time '14:00', 'Tatap muka', 'diandra-ayu-citi', 'completed'),
      (13, date '2026-10-03', time '13:00', 'Online', 'elvin-rosalina', 'completed'),
      (14, date '2026-10-01', time '10:00', 'Tatap muka', NULL, 'cancelled'),
      (15, date '2026-10-02', time '09:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (16, date '2026-10-01', time '15:00', 'Online', NULL, 'cancelled'),
      (17, date '2026-10-02', time '11:00', 'Tatap muka', 'sasanti', 'completed'),
      (18, date '2026-10-01', time '13:00', 'Tatap muka', 'diandra-ayu-citi', 'completed'),
      (19, date '2026-10-05', time '11:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (20, date '2026-10-01', time '14:00', 'Online', 'halimah-syadiyah', 'completed'),
      (21, date '2026-10-02', time '13:00', 'Online', 'nurul-astria-putri', 'completed'),
      (22, date '2026-10-02', time '10:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (23, date '2026-10-01', time '11:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (24, date '2026-10-02', time '09:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (25, date '2026-10-02', time '15:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'completed'),
      (26, date '2026-10-07', time '14:00', 'Online', 'elvin-rosalina', 'completed'),
      (27, date '2026-10-02', time '14:00', 'Tatap muka', 'sasanti', 'completed'),
      (28, date '2026-10-05', time '11:00', 'Online', 'elvin-rosalina', 'completed'),
      (29, date '2026-10-02', time '14:00', 'Tatap muka', NULL, 'rejected'),
      (30, date '2026-10-02', time '11:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'completed'),
      (31, date '2026-10-08', time '15:00', 'Tatap muka', NULL, 'cancelled'),
      (32, date '2026-10-06', time '14:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (33, date '2026-10-05', time '13:00', 'Online', 'diandra-ayu-citi', 'completed'),
      (34, date '2026-10-05', time '11:00', 'Online', 'nurul-astria-putri', 'completed'),
      (35, date '2026-10-02', time '14:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (36, date '2026-10-07', time '15:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (37, date '2026-10-02', time '11:00', 'Tatap muka', 'rana-fathina', 'completed'),
      (38, date '2026-10-12', time '10:00', 'Online', 'zahra-fadilah-syamil', 'completed'),
      (39, date '2026-10-08', time '13:00', 'Online', 'halimah-syadiyah', 'completed'),
      (40, date '2026-10-02', time '13:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (41, date '2026-10-05', time '10:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (42, date '2026-10-09', time '10:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (43, date '2026-10-05', time '10:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (44, date '2026-10-05', time '10:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (45, date '2026-10-05', time '13:00', 'Online', 'nurul-astria-putri', 'completed'),
      (46, date '2026-10-06', time '15:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (47, date '2026-10-05', time '11:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (48, date '2026-10-05', time '14:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (49, date '2026-10-09', time '14:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (50, date '2026-10-07', time '13:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (51, date '2026-10-05', time '09:00', 'Online', 'nurul-astria-putri', 'completed'),
      (52, date '2026-10-07', time '14:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (53, date '2026-10-13', time '13:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (54, date '2026-10-06', time '15:00', 'Online', NULL, 'cancelled'),
      (55, date '2026-10-09', time '11:00', 'Tatap muka', NULL, 'cancelled'),
      (56, date '2026-10-06', time '13:00', 'Online', 'nurul-astria-putri', 'completed'),
      (57, date '2026-10-05', time '10:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (58, date '2026-10-14', time '13:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (59, date '2026-10-07', time '09:00', 'Online', 'nurul-astria-putri', 'completed'),
      (60, date '2026-10-05', time '13:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (61, date '2026-10-12', time '13:00', 'Tatap muka', 'diandra-ayu-citi', 'completed'),
      (62, date '2026-10-14', time '10:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (63, date '2026-10-09', time '14:00', 'Tatap muka', 'sasanti', 'completed'),
      (64, date '2026-10-08', time '08:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (65, date '2026-10-12', time '15:00', 'Tatap muka', 'diandra-ayu-citi', 'completed'),
      (66, date '2026-10-20', time '15:00', 'Tatap muka', 'marina-puspa-ningrum', 'confirmed'),
      (67, date '2026-10-08', time '14:00', 'Online', 'halimah-syadiyah', 'completed'),
      (68, date '2026-10-09', time '15:00', 'Online', 'magdalena-hanoum', 'completed'),
      (69, date '2026-10-12', time '11:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (70, date '2026-10-08', time '09:00', 'Tatap muka', NULL, 'no_response'),
      (71, date '2026-10-07', time '10:00', 'Online', 'nuria-ristnawati', 'completed'),
      (72, date '2026-10-09', time '09:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (73, date '2026-10-06', time '13:00', 'Online', NULL, 'cancelled'),
      (74, date '2026-10-13', time '14:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (75, date '2026-10-13', time '15:00', 'Tatap muka', NULL, 'cancelled'),
      (76, date '2026-10-09', time '11:00', 'Online', 'nurul-astria-putri', 'completed'),
      (77, date '2026-10-07', time '13:00', 'Online', 'nurul-astria-putri', 'completed'),
      (78, date '2026-10-09', time '15:00', 'Online', 'didik-kusnadi', 'completed'),
      (79, date '2026-10-09', time '13:00', 'Tatap muka', 'sasanti', 'completed'),
      (80, date '2026-10-14', time '14:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (81, date '2026-10-08', time '15:00', 'Online', 'halimah-syadiyah', 'completed'),
      (82, date '2026-10-09', time '11:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (83, date '2026-10-12', time '10:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (84, date '2026-10-09', time '09:00', 'Online', 'nurul-astria-putri', 'completed'),
      (85, date '2026-10-08', time '13:00', 'Online', NULL, 'cancelled'),
      (86, date '2026-10-09', time '08:00', 'Tatap muka', 'rana-fathina', 'completed'),
      (87, date '2026-10-09', time '14:00', 'Online', 'rr-dyah-windy-ramadhiyanti', 'completed'),
      (88, date '2026-10-22', time '09:00', 'Tatap muka', 'gentur-anto-judho', 'confirmed'),
      (89, date '2026-10-14', time '13:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (90, date '2026-10-08', time '14:00', 'Online', NULL, 'cancelled'),
      (91, date '2026-10-08', time '11:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (92, date '2026-10-08', time '10:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (93, date '2026-10-12', time '13:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (94, date '2026-10-15', time '09:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (95, date '2026-10-12', time '14:00', 'Tatap muka', 'diandra-ayu-citi', 'completed'),
      (96, date '2026-10-13', time '10:00', 'Online', NULL, 'no_response'),
      (97, date '2026-10-08', time '13:00', 'Tatap muka', 'diandra-ayu-citi', 'completed'),
      (98, date '2026-10-08', time '14:00', 'Tatap muka', 'diandra-ayu-citi', 'completed'),
      (99, date '2026-10-08', time '13:00', 'Tatap muka', NULL, 'cancelled'),
      (100, date '2026-10-15', time '13:00', 'Online', 'halimah-syadiyah', 'confirmed'),
      (101, date '2026-10-09', time '15:00', 'Online', 'rr-dyah-windy-ramadhiyanti', 'completed'),
      (102, date '2026-10-09', time '13:00', 'Tatap muka', 'hana-kamilah', 'completed'),
      (103, date '2026-10-14', time '13:00', 'Online', 'zahra-fadilah-syamil', 'completed'),
      (104, date '2026-10-09', time '09:00', 'Tatap muka', 'sasanti', 'completed'),
      (105, date '2026-10-15', time '14:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (106, date '2026-10-14', time '11:00', 'Tatap muka', NULL, 'cancelled'),
      (107, date '2026-10-12', time '09:00', 'Online', 'nurul-astria-putri', 'completed'),
      (108, date '2026-10-15', time '15:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (109, date '2026-10-15', time '13:00', 'Online', 'diandra-ayu-citi', 'confirmed'),
      (110, date '2026-10-12', time '13:00', 'Online', 'nurul-astria-putri', 'completed'),
      (111, date '2026-10-14', time '09:00', 'Tatap muka', NULL, 'no_response'),
      (112, date '2026-10-09', time '15:00', 'Tatap muka', 'sasanti', 'completed'),
      (113, date '2026-10-15', time '08:00', 'Tatap muka', 'gentur-anto-judho', 'confirmed'),
      (114, date '2026-10-12', time '15:00', 'Tatap muka', 'rana-fathina', 'completed'),
      (115, date '2026-10-09', time '15:00', 'Tatap muka', NULL, 'cancelled'),
      (116, date '2026-10-16', time '13:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (117, date '2026-10-14', time '09:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (118, date '2026-10-19', time '15:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (119, date '2026-10-22', time '15:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (120, date '2026-10-12', time '11:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (121, date '2026-10-14', time '14:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (122, date '2026-10-13', time '14:00', 'Tatap muka', 'sasanti', 'completed'),
      (123, date '2026-10-14', time '09:00', 'Online', 'elvin-rosalina', 'completed'),
      (124, date '2026-10-13', time '15:00', 'Online', NULL, 'cancelled'),
      (125, date '2026-10-13', time '10:00', 'Tatap muka', 'sasanti', 'completed'),
      (126, date '2026-10-14', time '09:00', 'Online', 'nuria-ristnawati', 'completed'),
      (127, date '2026-10-20', time '14:00', 'Tatap muka', 'marina-puspa-ningrum', 'confirmed'),
      (128, date '2026-10-13', time '10:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'completed'),
      (129, date '2026-10-13', time '09:00', 'Tatap muka', 'sasanti', 'completed'),
      (130, date '2026-10-16', time '10:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (131, date '2026-10-13', time '11:00', 'Tatap muka', 'sasanti', 'completed'),
      (132, date '2026-10-16', time '09:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (133, date '2026-10-15', time '10:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'confirmed'),
      (134, date '2026-10-19', time '13:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (135, date '2026-10-23', time '13:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (136, date '2026-10-13', time '15:00', 'Tatap muka', 'marina-puspa-ningrum', 'completed'),
      (137, date '2026-10-13', time '15:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'completed'),
      (138, date '2026-10-15', time '11:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'confirmed'),
      (139, date '2026-10-16', time '11:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (140, date '2026-10-16', time '12:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (141, date '2026-10-14', time '13:00', 'Online', NULL, 'cancelled'),
      (142, date '2026-10-19', time '08:00', 'Tatap muka', 'gentur-anto-judho', 'confirmed'),
      (143, date '2026-10-19', time '14:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (144, date '2026-10-13', time '13:00', 'Online', 'nurul-astria-putri', 'completed'),
      (145, date '2026-10-13', time '09:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (146, date '2026-10-15', time '14:00', 'Online', 'halimah-syadiyah', 'confirmed'),
      (147, date '2026-10-16', time '09:00', 'Online', 'nurul-astria-putri', 'confirmed'),
      (148, date '2026-10-14', time '15:00', 'Tatap muka', 'zahra-fadilah-syamil', 'completed'),
      (149, date '2026-10-13', time '13:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (150, date '2026-10-23', time '14:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (151, date '2026-10-16', time '15:00', 'Online', 'didik-kusnadi', 'confirmed'),
      (152, date '2026-10-14', time '11:00', 'Online', 'nurul-astria-putri', 'completed'),
      (153, date '2026-10-21', time '13:00', 'Online', 'zahra-fadilah-syamil', 'confirmed'),
      (154, date '2026-10-19', time '14:00', 'Tatap muka', NULL, 'cancelled'),
      (155, date '2026-10-16', time '14:00', 'Tatap muka', 'hana-kamilah', 'confirmed'),
      (156, date '2026-10-14', time '14:00', 'Tatap muka', 'sasanti', 'completed'),
      (157, date '2026-10-13', time '11:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'completed'),
      (158, date '2026-10-13', time '10:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (159, date '2026-10-13', time '10:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (160, date '2026-10-13', time '10:00', 'Tatap muka', 'elvin-rosalina', 'completed'),
      (161, date '2026-10-22', time '13:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (162, date '2026-10-19', time '14:00', 'Tatap muka', 'elvin-rosalina', 'confirmed'),
      (163, date '2026-10-14', time '10:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (164, date '2026-10-22', time '14:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (165, date '2026-10-14', time '08:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (166, date '2026-10-19', time '11:00', 'Tatap muka', 'elvin-rosalina', 'confirmed'),
      (167, date '2026-10-20', time '11:00', 'Online', 'nurul-astria-putri', 'confirmed'),
      (168, date '2026-10-14', time '11:00', 'Tatap muka', 'sasanti', 'completed'),
      (169, date '2026-10-14', time '11:00', 'Tatap muka', 'gentur-anto-judho', 'completed'),
      (170, date '2026-10-22', time '08:00', 'Tatap muka', 'gentur-anto-judho', 'confirmed'),
      (171, date '2026-10-20', time '15:00', 'Online', 'rosi-hernawati', 'confirmed'),
      (172, date '2026-10-20', time '14:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'confirmed'),
      (173, date '2026-10-19', time '10:00', 'Tatap muka', 'sasanti', 'confirmed'),
      (174, date '2026-10-29', time '15:00', 'Tatap muka', 'diandra-ayu-citi', 'confirmed'),
      (175, date '2026-10-16', time '11:00', 'Online', 'nurul-astria-putri', 'confirmed'),
      (176, date '2026-10-15', time '11:00', 'Tatap muka', 'rana-fathina', 'confirmed'),
      (177, date '2026-10-20', time '09:00', 'Tatap muka', 'anak-agung-via-aristyawati', 'confirmed'),
      (178, date '2026-10-15', time '09:00', 'Tatap muka', NULL, 'no_response'),
      (179, date '2026-10-21', time '09:00', 'Online', 'nuria-ristnawati', 'confirmed'),
      (180, date '2026-10-26', time '10:00', 'Tatap muka', 'sasanti', 'confirmed'),
      (181, date '2026-10-16', time '16:00', 'Online', 'rr-dyah-windy-ramadhiyanti', 'confirmed'),
      (182, date '2026-10-15', time '14:00', 'Tatap muka', 'rana-fathina', 'confirmed'),
      (183, date '2026-10-20', time '09:00', 'Tatap muka', 'gentur-anto-judho', 'confirmed'),
      (184, date '2026-10-15', time '15:00', 'Tatap muka', 'rana-fathina', 'confirmed'),
      (185, date '2026-10-20', time '13:00', 'Online', 'rosi-hernawati', 'confirmed'),
      (186, date '2026-10-15', time '15:00', 'Online', 'halimah-syadiyah', 'confirmed'),
      (187, date '2026-10-16', time '14:00', 'Online', 'rr-dyah-windy-ramadhiyanti', 'confirmed'),
      (188, date '2026-10-16', time '15:00', 'Online', 'rr-dyah-windy-ramadhiyanti', 'confirmed'),
      (189, date '2026-10-15', time '15:00', 'Online', 'halimah-syadiyah', 'confirmed'),
      (190, date '2026-10-16', time '14:00', 'Online', 'rr-dyah-windy-ramadhiyanti', 'confirmed'),
      (191, date '2026-10-16', time '15:00', 'Online', 'rr-dyah-windy-ramadhiyanti', 'confirmed')
    ) as source(row_no, session_date, session_time, mode, source_key, source_status)
    order by row_no
  loop
    v_code := 'DUMMY-XLSX-' || lpad(v_row.row_no::text, 3, '0');
    if exists (select 1 from public.appointments where code = v_code) then
      v_skipped := v_skipped + 1;
      continue;
    end if;
    v_directory_id := v_unassigned_id;
    v_counselor_id := null;
    if v_row.source_key is not null then
      select id, linked_profile_id into v_directory_id, v_counselor_id
      from public.counselor_directory where source_key = v_row.source_key and is_listed;
      if v_directory_id is null then raise exception 'Counselor directory entry missing for source key %', v_row.source_key; end if;
    end if;
    v_status := v_row.source_status::public.appointment_status;
    v_reason := case v_status
      when 'cancelled' then 'Data dummy: sesi dibatalkan atau konselor berhalangan pada sumber.'
      when 'no_response' then 'Data dummy: status respons disamarkan dari sumber.'
      else null end;
    if v_status in ('confirmed', 'completed') and exists (
      select 1 from public.appointments a
      where a.code <> v_code and a.status::text in ('pending', 'confirmed', 'completed')
        and a.scheduled_date = v_row.session_date and a.start_time = v_row.session_time
        and (a.counselor_directory_id = v_directory_id or (v_counselor_id is not null and a.counselor_id = v_counselor_id))
    ) then
      v_status := 'cancelled';
      v_reason := 'Data dummy: slot duplikat atau bentrok dengan jadwal lain pada sumber.';
    end if;

    insert into public.guest_students (full_name, nim, program, faculty, phone, created_by)
    values ('Mahasiswa Dummy ' || lpad(v_row.row_no::text, 3, '0'), v_code, 'Program Studi Dummy', 'Fakultas Dummy', '0000000000', v_admin_id)
    on conflict (nim) do update set full_name = excluded.full_name, program = excluded.program, faculty = excluded.faculty, phone = excluded.phone, created_by = excluded.created_by
    returning id into v_guest_id;
    if v_guest_id is null then select id into v_guest_id from public.guest_students where nim = v_code; end if;

    insert into public.appointments (
      code, guest_student_id, counselor_id, counselor_directory_id,
      requested_date, requested_start_time, requested_end_time,
      scheduled_date, start_time, end_time, mode, status, category,
      issue_summary, reason, issue_details, location, admin_close_reason
    ) values (
      v_code, v_guest_id, v_counselor_id, v_directory_id,
      v_row.session_date, v_row.session_time, v_row.session_time + interval '1 hour',
      v_row.session_date, v_row.session_time, v_row.session_time + interval '1 hour',
      v_row.mode, v_status, 'Data dummy',
      'Data simulasi untuk preview (bukan informasi konseling asli)',
      'Data dummy untuk preview',
      'Data simulasi; detail konseling asli tidak disalin',
      case when v_row.mode = 'Online' then 'https://example.invalid/dummy-session' else 'Lokasi dummy' end,
      v_reason
    ) on conflict (code) do nothing;
    v_inserted := v_inserted + 1;
  end loop;
  alter table public.appointments enable trigger appointments_validate_slot;
  raise notice 'Anonymized preview import finished: % inserted, % already existed (skipped).', v_inserted, v_skipped;
end $$;
