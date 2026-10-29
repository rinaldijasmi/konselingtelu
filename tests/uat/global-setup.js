import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const BASE = process.env.UAT_BASE_URL || "https://rinaldijasmi.github.io/konselingtelu/";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://rakqjbzbuctkzbgjueyu.supabase.co";
const TEST_NIM = "9900000001";
const TEST_NAME = "UAT Mahasiswa Uji";

const password = () => `Uat-${randomBytes(9).toString("base64url")}9!`;

// Membuat akun dan data sementara khusus UAT, lalu menghapus semuanya setelah selesai.
export default async function globalSetup() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY (lihat tests/uat/README.md).");
  const config = await (await fetch(new URL("assets/supabase-config.js", BASE))).text();
  const anonKey = config.match(/"?anonKey"?\s*:\s*"([^"]+)"/)?.[1];
  if (!anonKey) throw new Error("anonKey tidak ditemukan di situs yang diuji.");

  const admin = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
  const tag = randomBytes(4).toString("hex");
  const accounts = {};
  const created = [];
  const cleanup = async () => {
    await admin.from("appointments").delete().eq("student_id", accounts.student?.id ?? "00000000-0000-0000-0000-000000000000");
    await admin.from("counselor_directory").delete().eq("source_key", `uat-${tag}`);
    await admin.from("omni_results").delete().like("nim", "99000000%");
    await admin.from("pandu_results").delete().in("nim", [TEST_NIM, "9900000002", "9900000003", "9900000004"]);
    for (const id of created) await admin.auth.admin.deleteUser(id);
  };

  try {

  for (const [role, profileRole] of [["student", "student"], ["counselor", "counselor"], ["admin", "admin"]]) {
    const email = `uat.${role}.${tag}@example.com`;
    const pass = password();
    const { data, error } = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: { full_name: `UAT ${role}` } });
    if (error) throw new Error(`Gagal membuat akun ${role}: ${error.message}`);
    created.push(data.user.id);
    const patch = { role: profileRole, full_name: `UAT ${role} ${tag}`, must_change_password: false, is_active: true };
    if (role === "student") Object.assign(patch, { nim: TEST_NIM, program: "S1 Uji", faculty: "Fakultas Uji", phone: "081200000000" });
    const { error: profileError } = await admin.from("profiles").update(patch).eq("id", data.user.id);
    if (profileError) throw new Error(`Gagal mengatur profil ${role}: ${profileError.message}`);
    accounts[role] = { id: data.user.id, email, password: pass, name: patch.full_name };
  }

  const scales = (codes, base) => Object.fromEntries(codes.map((code, index) => [code, base + index]));
  const { error: pandu } = await admin.from("pandu_results").upsert({
    nim: TEST_NIM, full_name: TEST_NAME, program_study: "S1 Uji", faculty: "Fakultas Uji", cohort: "2026",
    fill_status: "Lengkap", is_complete: true,
    vulnerability_status: "Rentan", omni_cluster: "Kuning", omni_cluster_name: "Perlu Pembinaan",
    validity: { VRIN: 45, CD: 52 },
    normal_scales: scales(["AE", "AM", "AN", "AS", "CO", "DE"], 45),
    pd_scales: { PAR: 55, SCH: 48, SCT: 72, ANT: 50, BOR: 58, HIS: 47, NAR: 52, AVD: 66, DEP: 60, OBC: 49 },
    factor_scales: scales(["AGRE", "CONC", "EXTR", "NARC", "NEUR", "OPEN", "SENS"], 47),
    pd_flag_count: 1, pd_top_scale: "SCT", pd_top_t: 72, pd_status: "Perlu telaah profesional",
    resilience_score: 24, resilience_index: 52
  });
  if (pandu) throw new Error(`Gagal membuat data PANDU uji: ${pandu.message}`);
  const { error: omni } = await admin.from("omni_results").upsert({
    nim: TEST_NIM, full_name: TEST_NAME, program_study: "S1 Uji", faculty: "Fakultas Uji", cohort: "2026",
    fill_status: "Lengkap", is_complete: true,
    vulnerability_status: "Rentan", omni_cluster: "Kuning", omni_cluster_name: "Perlu Pembinaan",
    validity: { VRIN: 45, CD: 52 },
    normal_scales: scales(["AE", "AM", "AN", "AS", "CO", "DE"], 45),
    pd_scales: { PAR: 55, SCH: 48, SCT: 68, ANT: 50, BOR: 74, HIS: 47, NAR: 52, AVD: 66, DEP: 60, OBC: 49 },
    factor_scales: scales(["AGRE", "CONC", "EXTR", "NARC", "NEUR", "OPEN", "SENS"], 47),
    pd_flag_count: 1, pd_top_scale: "BOR", pd_top_t: 74, pd_status: "Perlu telaah profesional"
  });
  if (omni) throw new Error(`Gagal membuat data OMNI uji: ${omni.message}`);

  const { data: directory, error: directoryError } = await admin.from("counselor_directory").insert({
    source_key: `uat-${tag}`, full_name: accounts.counselor.name, specialties: ["UAT"],
    contact_email: accounts.counselor.email, linked_profile_id: accounts.counselor.id, is_listed: true
  }).select("id").single();
  if (directoryError) throw new Error(`Gagal membuat direktori konselor uji: ${directoryError.message}`);

  const { error: availabilityError } = await admin.from("counselor_availability").insert(
    Array.from({ length: 7 }, (_, weekday) => ({ directory_id: directory.id, weekday, mode: "Online", open_slots: Array(8).fill(true) }))
  );
  if (availabilityError) throw new Error(`Gagal membuat jadwal konselor uji: ${availabilityError.message}`);

  const date = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const { data: appointment, error: appointmentError } = await admin.from("appointments").insert({
    student_id: accounts.student.id, counselor_id: accounts.counselor.id, requested_date: date,
    requested_start_time: "09:00", requested_end_time: "10:00", scheduled_date: date, start_time: "09:00", end_time: "10:00",
    location: "https://zoom.us/j/uat", mode: "Online", status: "confirmed",
    category: "Akademik", issue_summary: "UAT otomatis", reason: "Pengujian otomatis", issue_details: "Data sementara UAT"
  }).select("id").single();
  if (appointmentError) throw new Error(`Gagal membuat pengajuan uji: ${appointmentError.message}`);

  // Sesi selesai tanpa laporan: halaman konselor tetap harus termuat.
  const past = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
  const { error: pastError } = await admin.from("appointments").insert({
    student_id: accounts.student.id, counselor_id: accounts.counselor.id, requested_date: past,
    requested_start_time: "10:00", requested_end_time: "11:00", scheduled_date: past, start_time: "10:00", end_time: "11:00",
    location: "Ruang UAT", mode: "Tatap muka", status: "completed",
    category: "Akademik", issue_summary: "UAT selesai tanpa laporan", reason: "UAT", issue_details: "UAT"
  });
  if (pastError) throw new Error(`Gagal membuat sesi selesai uji: ${pastError.message}`);

  // Disembunyikan segera agar tidak tampil ke mahasiswa sungguhan selama pengujian.
  await admin.from("counselor_directory").update({ is_listed: false }).eq("id", directory.id);

  process.env.UAT_STATE = JSON.stringify({ supabaseUrl: SUPABASE_URL, anonKey, accounts, nim: TEST_NIM, name: TEST_NAME, appointmentId: appointment.id, tag });

  } catch (error) {
    await cleanup();
    throw error;
  }
  return cleanup;
}
