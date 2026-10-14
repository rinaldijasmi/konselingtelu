# Menyiapkan backend Supabase

Semua halaman memakai satu proyek Supabase dan role akun yang ditentukan di tabel `profiles`; pengguna tidak memilih role ketika login. Jangan masukkan service-role key ke browser atau file konfigurasi frontend.

Pengguna baru dapat memilih **Daftar sebagai mahasiswa** pada halaman masuk. Akun dibuat lewat Supabase Auth, lalu trigger `on_auth_user_created` membuat profil mahasiswa (`student`) secara otomatis. Pendaftaran publik tidak menerima pilihan role, sehingga pengguna tidak dapat mendaftarkan dirinya sebagai admin atau konselor. Untuk versi saat ini, matikan konfirmasi email di Supabase agar akun baru langsung mendapat sesi login. Data diri mahasiswa dilengkapi saat pengajuan sesi pertama dan disimpan di `profiles`; pengajuan berikutnya hanya meminta informasi sesi konseling.

## Struktur proyek

- `index.html`, `admin.html`, `counselor.html`, dan `set-password.html` berisi markup tiap halaman.
- `assets/css/` menyimpan stylesheet masing-masing halaman.
- `assets/js/` menyimpan interaksi frontend masing-masing halaman.
- `assets/supabase.js` berisi helper backend bersama; konfigurasi URL dan anon key berada di `assets/supabase-config.js`.
- `supabase/` berisi skema, migrasi database, dan Edge Functions; `scripts/` berisi utilitas lokal.

Saat mengubah tampilan, edit CSS halaman terkait. Untuk perilaku halaman, edit berkas JavaScript terkait. Fungsi autentikasi dan akses Supabase yang dipakai lintas halaman tetap berada di `assets/supabase.js`.

## 1. Buat proyek dan tabel

1. Buat proyek PostgreSQL di Supabase.
2. Buka **SQL Editor**, jalankan seluruh isi [`supabase/schema.sql`](./supabase/schema.sql).
3. Buka **Project Settings → API** dan salin Project URL serta `anon`/publishable key.
4. Salin `assets/supabase-config.example.js` menjadi `assets/supabase-config.js`, lalu isikan URL dan anon key. File konfigurasi ini diabaikan Git.
5. Buka **Authentication → URL Configuration**, atur Site URL dan Redirect URLs ke alamat lokal yang dipakai untuk menjalankan preview (misalnya `http://localhost:8000/index.html` dan `http://127.0.0.1:8000/index.html`).
6. Agar akun mahasiswa dapat langsung digunakan setelah pendaftaran, buka **Authentication → Providers → Email** dan nonaktifkan **Confirm email**. Pendaftaran tetap memakai Supabase Auth dan kata sandi; hanya verifikasi email yang dilewati. Aktifkan kembali verifikasi email ketika kebijakan layanan mengharuskannya. Tanpa verifikasi email, sistem tidak memastikan bahwa pendaftar menguasai alamat email yang digunakan.
7. Deploy Edge Functions untuk pembuatan akun staf dan penggantian kata sandi awal:

```sh
supabase functions deploy create-counselor --project-ref YOUR_PROJECT_ID
supabase functions deploy create-staff --project-ref YOUR_PROJECT_ID
supabase functions deploy complete-staff-setup --project-ref YOUR_PROJECT_ID
supabase secrets set APP_ORIGIN=http://localhost:8000 --project-ref YOUR_PROJECT_ID
```

Untuk hosting nanti, ganti `APP_ORIGIN` dengan origin HTTPS aplikasi tersebut.
Pendaftaran staf melalui dashboard tidak mengirim email undangan. Pengguna mendapat kata sandi acak sementara saat akun dibuat dan harus menggantinya pada login pertama. Sampaikan kata sandi sementara melalui jalur aman; SMTP tidak dibutuhkan untuk alur ini.

### Deploy ke GitHub Pages

Workflow `.github/workflows/pages.yml` menerbitkan halaman statis saat ada push ke branch `main`. Sebelum workflow berjalan, tambahkan konfigurasi di repository GitHub melalui **Settings → Secrets and variables → Actions**:

- Repository variable `SUPABASE_URL`: URL proyek Supabase.
- Repository secret `SUPABASE_ANON_KEY`: anon/publishable key Supabase. Jangan gunakan service-role/secret key.

Workflow membuat `assets/supabase-config.js` hanya di artifact deployment; file lokal dan key tidak dimasukkan ke Git. Di **Supabase → Authentication → URL Configuration**, tambahkan `https://rinaldijasmi.github.io/konselingtelu/` sebagai Site URL dan `https://rinaldijasmi.github.io/konselingtelu/**` ke Redirect URLs. Atur Edge Function secret `APP_ORIGIN` ke `https://rinaldijasmi.github.io` (origin tidak mencakup path `/konselingtelu`):

```sh
supabase secrets set APP_ORIGIN=https://rinaldijasmi.github.io
```

Setelah konfigurasi GitHub dan Supabase siap, buka **Actions** dan jalankan ulang workflow bila push awal terjadi sebelum variable/secret disetel. Situs akan tersedia di `https://rinaldijasmi.github.io/konselingtelu/`.

Jalankan preview melalui server HTTP lokal, bukan membuka file HTML langsung. Contoh dari folder proyek:

```sh
python3 -m http.server 8000
```

Buka `http://localhost:8000`. Supabase JS dimuat dari CDN sehingga browser perlu akses internet.

### Jika muncul `infinite recursion detected in policy for relation "profiles"`

Jalankan seluruh isi [`supabase/fix-profile-rls-recursion.sql`](./supabase/fix-profile-rls-recursion.sql) satu kali di **Supabase → SQL Editor → New query**, lalu klik **Run**. File ini memperbaiki kebijakan baca profil tanpa mengubah atau menghapus data. Setelah berhasil, muat ulang halaman aplikasi dan coba masuk lagi.

### Memperbarui pengaturan jadwal

Untuk proyek yang sudah menjalankan skema lama, jalankan seluruh isi [`supabase/service-scheduling-revision.sql`](./supabase/service-scheduling-revision.sql) satu kali melalui **SQL Editor → New query**. Migrasi ini mempertahankan pengaturan jam mingguan yang sudah ada, menambahkan slot terpisah Online/Tatap muka dan pengecualian tanggal tertentu, serta memperbarui fungsi ketersediaan jadwal. Setelah berhasil, muat ulang aplikasi.

Admin kemudian dapat menambahkan sesi terkonfirmasi melalui **Jadwal & jam layanan → Tambah sesi konseling**. Pada pengaturan jam, pilih tanggal, jenis sesi, lalu pilih apakah perubahan berlaku untuk tanggal itu saja atau berulang setiap minggu. Slot yang dipilih tetap dibatasi pada pukul 08.00–16.00 dan dicek kembali di database.

### Data program studi dan filter laporan

Form pengajuan mahasiswa menyediakan pilihan fakultas kampus utama dan program studi yang mengikuti fakultas terpilih. Kelas internasional, lanjutan, PJJ, serta variasi reguler/blended digabung ke satu program studi; kampus Jakarta, Surabaya, dan Purwokerto tidak disertakan. Dashboard admin dapat difilter dengan rentang tanggal, sementara **Laporan Konseling** dapat difilter berdasarkan rentang tanggal sesi, fakultas, program studi, dan konselor.

### Sesi manual untuk mahasiswa tanpa akun

Jalankan [`supabase/manual-guest-students.sql`](./supabase/manual-guest-students.sql) di SQL Editor sebelum menggunakan pilihan **Mahasiswa belum terdaftar** pada formulir **Tambah sesi konseling**. Mahasiswa tamu dicatat sebagai data kontak tanpa membuat akun Auth/login; NIM harus unik dan digunakan kembali bila mahasiswa tersebut dijadwalkan lagi. Data tamu dibatasi ke admin dan konselor yang ditugaskan.

### Mengaktifkan superadmin

Untuk proyek Supabase yang sudah berjalan, jalankan ulang versi terbaru [`supabase/superadmin-role.sql`](./supabase/superadmin-role.sql) di SQL Editor. Migrasi ini aman dijalankan ulang; selain role `superadmin`, migrasi menambahkan metadata akun staf dan penanda penggantian kata sandi awal. Migrasi juga memberi superadmin akses data admin melalui policy yang sudah ada dan membatasi perubahan role akun hanya untuk superadmin atau provisioning tepercaya.

Pilih akun yang tepercaya melalui **Authentication → Users**, lalu naikkan akun tersebut menggunakan email yang tepat:

```sql
update public.profiles as profile
set role = 'superadmin'
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.email = 'email-pemilik-superadmin@telkomuniversity.ac.id';
```

Superadmin masuk melalui halaman admin yang sama. Di **Bagian konselor**, form superadmin membuat akun admin atau konselor langsung tanpa undangan email. Setiap akun mendapat kata sandi sementara yang unik, dibuat acak di server, dan ditampilkan sekali setelah pembuatan. Kata sandi tidak disimpan atau ditampilkan kembali di daftar akun; daftar hanya menampilkan role, status akun, dan apakah pengguna sudah mengganti kata sandi. Pengguna wajib menggantinya saat login pertama; sebelum itu, akun belum dapat mengakses data layanan. Bagikan kata sandi sementara melalui jalur aman. Role superadmin tidak dapat dibuat dari form tersebut; gunakan SQL Editor untuk menetapkannya setelah verifikasi. Deploy `create-staff`, `create-counselor`, dan `complete-staff-setup` sesuai perintah di atas.

## 2. Buat akun dummy

Buat tiga akun demo melalui Supabase Auth menggunakan alamat berikut:

| Role | Email |
| --- | --- |
| Admin | `admin.demo@telkomuniversity.ac.id` |
| Konselor | `konselor.demo@telkomuniversity.ac.id` |
| Mahasiswa | `mahasiswa.demo@student.telkomuniversity.ac.id` |

Cara yang disarankan adalah menggunakan script seeder dari komputer lokal. Simpan kredensial seeder di luar folder proyek yang disajikan web server. Pada macOS, buat `/private/tmp/telkom-counseling-seed.env` dan batasi aksesnya dengan `chmod 600 /private/tmp/telkom-counseling-seed.env`, lalu isi:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DEMO_ACCOUNT_PASSWORD=Use-A-Unique-Password-At-Least-12-Chars
```

Jalankan dari folder proyek dengan Node.js 20 atau lebih baru:

```sh
node --env-file=/private/tmp/telkom-counseling-seed.env scripts/seed-demo-users.mjs
```

Service-role key hanya digunakan script lokal untuk provisioning akun; jangan pernah menyalinnya ke `assets/supabase-config.js`, HTML, browser, atau repository. Jangan letakkan file kredensial dalam folder yang menjadi root server preview karena server statis dapat menyajikannya. Jangan kirim isi file tersebut melalui chat. Password demo ditentukan sendiri melalui `DEMO_ACCOUNT_PASSWORD` dan harus sedikitnya 12 karakter. Hapus file lokal tersebut, ganti password, atau hapus akun demo sebelum memakai proyek dengan data sebenarnya.

## 3. Mengubah role seseorang

Role ada di `public.profiles.role`, bernilai `student`, `counselor`, `admin`, atau `superadmin`. Ubah hanya setelah memverifikasi identitas akun dan memberi tahu pemilik akun. Gunakan Supabase **SQL Editor** sebagai administrator; jangan izinkan pengguna mengubah role akunnya sendiri.

Cari UUID pengguna melalui **Authentication → Users**, lalu jalankan:

```sql
-- Pastikan target tepat sebelum mengubah role.
select id, email from auth.users where email = 'konselor.demo@telkomuniversity.ac.id';

-- Ganti UUID dengan hasil query di atas.
update public.profiles
set role = 'counselor'
where id = 'PASTE-USER-UUID-HERE';
```

Mengubah role tidak membuat atau mengubah kata sandi. Untuk menonaktifkan akses tanpa menghapus riwayat, set `is_active = false` di `profiles`; akun tersebut akan ditolak saat login. Untuk mengaktifkan lagi, set kembali menjadi `true`.

Jangan membuat role `admin` atau `superadmin` dari halaman publik. Gunakan Supabase SQL Editor/akun provisioning tepercaya untuk menetapkan administrator pertama dan superadmin. Superadmin dapat mengundang admin serta konselor melalui dashboard; role superadmin hanya dapat diberikan melalui proses provisioning tepercaya. Kebijakan Row Level Security pada skema membatasi mahasiswa ke pengajuannya sendiri dan konselor ke sesi yang ditugaskan, sementara admin/superadmin mengelola data layanan.

## Sebelum memakai data sebenarnya

Nama, NIM, kontak, alamat, agama, alasan konseling, dan catatan konselor adalah data sensitif. Gunakan hanya data fiktif selama pengujian. Sebelum peluncuran, minta persetujuan unit keamanan/privasi Telkom University tentang region penyimpanan, retensi/penghapusan, backup, pengelolaan akses admin, autentikasi multifaktor, dan prosedur insiden. Skema RLS ini membatasi akses aplikasi berdasarkan role, tetapi bukan pengganti tinjauan keamanan dan kebijakan institusi.

## Status integrasi

Skema, autentikasi role, penyimpanan pengajuan/jam layanan/laporan, dan guard halaman telah disiapkan. Sebelum login dapat tersambung, proyek Supabase harus dibuat, skema/migrasi dijalankan, akun demo diprovisikan bila diperlukan, Edge Functions untuk akun staf di-deploy, dan `assets/supabase-config.js` diisi secara lokal.
