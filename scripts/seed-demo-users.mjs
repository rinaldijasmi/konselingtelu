const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !demoPassword) {
  throw new Error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DEMO_ACCOUNT_PASSWORD before running this script.");
}
if (demoPassword.length < 12) {
  throw new Error("DEMO_ACCOUNT_PASSWORD must be at least 12 characters.");
}

const accounts = [
  { email: "admin.demo@telkomuniversity.ac.id", role: "admin", full_name: "Admin Demo" },
  { email: "konselor.demo@telkomuniversity.ac.id", role: "counselor", full_name: "Dr. Rani Putri", phone: "6281234567001", is_active: true },
  {
    email: "mahasiswa.demo@student.telkomuniversity.ac.id",
    role: "student",
    full_name: "Nadia Putri",
    nim: "1202210031",
    program: "S1 Informatika",
    faculty: "Fakultas Informatika",
    phone: "6281234567010",
    birth_date: "2003-08-11",
    ethnicity: "Sunda",
    religion: "Islam",
    city: "Bandung",
    address: "Alamat contoh, Bandung",
    birth_order: 1,
    sibling_count: 2
  }
];

async function supabaseRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}${path}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${method} ${path} failed (${response.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

const { users = [] } = await supabaseRequest("/auth/v1/admin/users?page=1&per_page=100");
for (const account of accounts) {
  const existing = users.find(user => user.email?.toLowerCase() === account.email.toLowerCase());
  const created = existing
    ? existing
    : await supabaseRequest("/auth/v1/admin/users", {
      method: "POST",
      body: {
        email: account.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: account.full_name }
      }
    });
  const userId = created.id;
  const { email, ...profile } = account;
  await supabaseRequest("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    body: { id: userId, ...profile }
  });
  console.log(`${existing ? "Updated profile for" : "Created"} ${account.role} account: ${account.email}`);
}

const profiles = await supabaseRequest(
  `/rest/v1/profiles?select=id,role&role=in.(student,counselor)&nim=eq.1202210031`
);
if (!Array.isArray(profiles)) throw new Error("Supabase returned an unexpected response while loading demo profiles.");
const student = profiles.find(profile => profile.role === "student");
const counselors = await supabaseRequest("/rest/v1/profiles?select=id&role=eq.counselor&limit=1");
if (!Array.isArray(counselors)) throw new Error("Supabase returned an unexpected response while loading demo counselors.");
if (!student || !counselors.length) throw new Error("Could not locate demo student and counselor profiles.");

function dateOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nextServiceDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const demoAppointments = [
  {
    code: "KN-DEMO-0001",
    student_id: student.id,
    counselor_id: counselors[0].id,
    requested_date: nextServiceDate(1),
    requested_start_time: "10:00",
    requested_end_time: "11:00",
    scheduled_date: nextServiceDate(1),
    start_time: "10:00",
    end_time: "11:00",
    mode: "Online",
    status: "confirmed",
    category: "Akademik",
    issue_summary: "Kesulitan menjaga keseimbangan aktivitas perkuliahan.",
    reason: "Ingin berdiskusi tentang pengelolaan waktu kuliah.",
    issue_details: "Data ini hanya contoh fiktif untuk menguji alur pengajuan.",
    location: "https://zoom.us/j/987654321"
  },
  {
    code: "KN-DEMO-0002",
    student_id: student.id,
    counselor_id: counselors[0].id,
    requested_date: dateOffset(-5),
    requested_start_time: "14:00",
    requested_end_time: "15:00",
    scheduled_date: dateOffset(-5),
    start_time: "14:00",
    end_time: "15:00",
    mode: "Tatap muka",
    status: "completed",
    category: "Akademik",
    issue_summary: "Contoh sesi yang telah terlaksana.",
    reason: "Data ini hanya contoh fiktif.",
    issue_details: "Data ini hanya contoh fiktif untuk menguji laporan.",
    location: "Ruang Konseling A-204"
  },
  {
    code: "KN-DEMO-0003",
    student_id: student.id,
    counselor_id: null,
    requested_date: nextServiceDate(2),
    requested_start_time: "09:00",
    requested_end_time: "10:00",
    scheduled_date: null,
    start_time: null,
    end_time: null,
    mode: "Tatap muka",
    status: "pending",
    category: "Akademik",
    issue_summary: "Contoh pengajuan yang menunggu konfirmasi.",
    reason: "Data ini hanya contoh fiktif.",
    issue_details: "Data ini hanya contoh fiktif untuk menguji persetujuan admin.",
    location: null
  }
];

await supabaseRequest("/rest/v1/appointments?on_conflict=code", {
  method: "POST",
  body: demoAppointments
});
const completed = await supabaseRequest(
  "/rest/v1/appointments?select=id&code=eq.KN-DEMO-0002"
);
if (!Array.isArray(completed) || !completed[0]) throw new Error("Could not locate the completed demo appointment.");
await supabaseRequest("/rest/v1/counseling_reports?on_conflict=appointment_id", {
  method: "POST",
  body: {
    appointment_id: completed[0].id,
    counselor_id: counselors[0].id,
    diagnosis: "Contoh catatan konseling.",
    description: "Laporan ini merupakan data fiktif untuk menguji tampilan riwayat.",
    intervention: "Konselor membantu mahasiswa mengidentifikasi langkah yang dapat dicoba.",
    conclusion: "Sesi contoh telah diselesaikan.",
    recommendation: "Hapus data demo sebelum digunakan untuk layanan sebenarnya."
  }
});

console.log("Demo accounts and sample sessions are ready. Newly created accounts use DEMO_ACCOUNT_PASSWORD; existing account passwords are unchanged.");
console.log("Change passwords or delete these accounts before production use.");
