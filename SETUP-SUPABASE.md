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
3. Jalankan [`supabase/counselor-directory-booking.sql`](./supabase/counselor-directory-booking.sql) agar jadwal direktori yang diatur admin dapat tampil dan diajukan mahasiswa tanpa akun konselor aktif. Untuk database lama, jalankan dahulu migrasi booking serta [`supabase/counselor-schedule-management.sql`](./supabase/counselor-schedule-management.sql).
4. Buka **Project Settings → API** dan salin Project URL serta `anon`/publishable key.
5. Salin `assets/supabase-config.example.js` menjadi `assets/supabase-config.js`, lalu isikan URL dan anon key. File konfigurasi ini diabaikan Git.
6. Buka **Authentication → URL Configuration**, atur Site URL dan Redirect URLs ke alamat lokal yang dipakai untuk menjalankan preview (misalnya `http://localhost:8000/index.html` dan `http://127.0.0.1:8000/index.html`).
7. Agar akun mahasiswa dapat langsung digunakan setelah pendaftaran, buka **Authentication → Providers → Email** dan nonaktifkan **Confirm email**. Pendaftaran tetap memakai Supabase Auth dan kata sandi; hanya verifikasi email yang dilewati. Aktifkan kembali verifikasi email ketika kebijakan layanan mengharuskannya. Tanpa verifikasi email, sistem tidak memastikan bahwa pendaftar menguasai alamat email yang digunakan.
8. Deploy Edge Functions untuk pembuatan akun staf dan penggantian kata sandi awal:

```sh
supabase functions deploy create-counselor --project-ref YOUR_PROJECT_ID
supabase functions deploy create-staff --project-ref YOUR_PROJECT_ID
supabase functions deploy complete-staff-setup --project-ref YOUR_PROJECT_ID
supabase secrets set APP_ORIGIN=http://localhost:8000 --project-ref YOUR_PROJECT_ID
```

Untuk hosting nanti, ganti `APP_ORIGIN` dengan origin HTTPS aplikasi tersebut.
Pendaftaran staf melalui dashboard tidak mengirim email undangan. Pengguna mendapat kata sandi acak sementara saat akun dibuat dan harus menggantinya pada login pertama. Sampaikan kata sandi sementara melalui jalur aman; SMTP tidak dibutuhkan untuk alur ini.

### Hosting Cloudflare

Untuk aplikasi yang di-host di Cloudflare, buka proyek Supabase yang dipakai aplikasi (`rakqjbzbuctkzbgjueyu`) lalu pilih **Authentication → URL Configuration**:

- Isi **Site URL** dengan `https://konseling.kkatelkomuniversity.com`.
- Tambahkan `https://konseling.kkatelkomuniversity.com/**` pada **Redirect URLs**. Pola ini menerima callback di halaman situs, termasuk redirect Cloudflare dari URL `.html` ke clean URL.

Klik **Save changes**, lalu uji login dan alur yang memakai redirect email. Edge Function secret `APP_ORIGIN` sudah diarahkan ke origin Cloudflare (hanya domain, tanpa path). Jangan tambahkan GitHub Pages atau `localhost` sebagai origin produksi.

Cloudflare terhubung ke GitHub untuk deploy otomatis. Pastikan build Cloudflare menyediakan `assets/supabase-config.js` berisi Project URL dan anon/publishable key; jangan pernah menaruh service-role/secret key di frontend.

Workflow GitHub Pages sudah dihapus agar tidak menerbitkan ulang situs lama. Untuk menghentikan situs Pages yang sudah terbit, buka repository GitHub → **Settings → Pages**, lalu pilih **Unpublish site** bila tombol tersedia. Verifikasi alamat GitHub Pages lama tidak lagi menyajikan aplikasi. Secret dan variable Actions khusus Pages dapat dihapus setelah Cloudflare terverifikasi.

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

### Direktori, jadwal praktik, dan penutupan sesi

Untuk proyek yang sudah berjalan, jalankan seluruh isi [`supabase/counselor-booking-revision.sql`](./supabase/counselor-booking-revision.sql) satu kali di **SQL Editor → New query** setelah migrasi jam layanan dan mahasiswa tamu. Migrasi ini menambahkan roster konselor, jadwal praktik mingguan per konselor, reservasi slot berdasarkan konselor, serta status penutupan `Tidak ada respons` dan `Dibatalkan`. Setiap penutupan memerlukan catatan admin dan hanya dapat dilakukan pada sesi terkonfirmasi yang jatuh hari ini atau sebelumnya. Slot dari pengajuan mahasiswa akan terkunci sejak statusnya masih menunggu.

Deploy ulang Edge Function setelah migrasi agar admin dapat menghubungkan akun ke roster:

```sh
supabase functions deploy create-counselor --project-ref YOUR_PROJECT_ID
```

Setelah migrasi booking pernah dijalankan, gunakan migrasi tambahan [`supabase/counselor-directory-management.sql`](./supabase/counselor-directory-management.sql) untuk kolom kontak, alamat email placeholder, dan penyimpanan profil dari menu admin. Email `@example.invalid` hanya data contoh, bukan akun login atau alamat yang dapat menerima email. Mahasiswa tetap dapat melihat profil direktori, tetapi pemesanan memerlukan akun konselor nyata yang aktif dan jadwal praktik. Admin dapat mengelola profil dari **Manajemen konselor**; pengelolaan akun admin berada di menu **Admin & akun** khusus superadmin. Email login yang sudah tertaut tetap dikelola sebagai akun Auth, terpisah dari email direktori.

Konselor mengatur hari, mode online/tatap muka, dan slot praktik dari tab **Ketersediaan praktik**. Untuk mengelola jadwal mingguan setiap konselor dan pengecualian jika konselor berhalangan, jalankan migrasi [`supabase/counselor-schedule-management.sql`](./supabase/counselor-schedule-management.sql) satu kali di SQL Editor setelah migrasi booking dan direktori di atas. Setelah itu jalankan [`supabase/counselor-directory-booking.sql`](./supabase/counselor-directory-booking.sql) agar slot yang diatur admin dapat ditampilkan dan diajukan mahasiswa tanpa akun konselor aktif. Lalu buka **Manajemen konselor → Atur jadwal** untuk memilih slot mingguan pukul 08.00–16.00 atau mengatur pengecualian per tanggal dan mode; tanpa pengecualian, jadwal mingguan tetap berlaku. Pengecualian tidak dapat menutup slot yang sudah memiliki pengajuan atau sesi aktif; selesaikan/jadwalkan ulang sesi itu dahulu. Jam layanan kampus tetap berlaku sebagai batas ketersediaan. Pengajuan tanpa akun konselor tetap masuk ke admin dan dapat dikonfirmasi oleh admin; konselor baru dapat mengakses sesi di akunnya setelah akun ditautkan dan aktif. Admin dapat menutup sesi lama yang masih terkonfirmasi dari kalender harian; sesi tertutup tidak masuk ke ruang laporan konselor dan catatannya terlihat oleh mahasiswa.

#### Data dummy Profiling PANDU dan OMNI

Jalankan [`supabase/dummy-profiling.sql`](./supabase/dummy-profiling.sql) untuk mencoba menu Profiling. Isinya 60 mahasiswa dummy (NIM `DUMMY-PROF-001`–`060`, lima di antaranya belum lengkap) di PANDU dan OMNI, serta hasil lengkap untuk mahasiswa demo Nadia Putri (NIM `1202210031`) yang bisa dilihat konselor demo di halaman Jadwal. Aman dijalankan ulang; perintah penghapusan ada di akhir berkas.

Untuk mengisi jadwal konselor demo, jalankan [`supabase/dummy-counselor-sessions.sql`](./supabase/dummy-counselor-sessions.sql) setelah skrip di atas. Skrip membuat entri direktori dan ketersediaan untuk Dr. Rani Putri serta 66 sesi (jam 09.00 dan 13.00) di setiap hari 5 Oktober–6 November 2026, memakai NIM `DUMMY-PROF-*` sehingga hasil PANDU dan OMNI muncul di halaman konselor.

#### Data dummy jadwal untuk preview

Untuk mencoba tampilan dengan data contoh, jalankan [`supabase/dummy-schedule-preview.sql`](./supabase/dummy-schedule-preview.sql) di SQL Editor setelah migrasi mahasiswa tamu, jadwal konselor, dan booking direktori. File mengimpor 191 sesi dengan tanggal 30 September–29 Oktober 2026, mempertahankan jam, konselor, media, serta status sumber. Nama/NIM/kontak mahasiswa dan seluruh detail konseling diganti nilai dummy. Data ini hanya untuk proyek preview/pengembangan, bukan produksi; sesi mendatang berstatus terjadwal akan menempati slot konselor terkait. Pengimporan aman dijalankan ulang dan melewati kode `DUMMY-XLSX-*` yang sudah ada. Data tersebut muncul sebagai mahasiswa tamu di akun admin, bukan sebagai riwayat mahasiswa pada akun mahasiswa asli.

Untuk menghapus hanya data contoh ini, jalankan perintah berikut satu per satu di SQL Editor:

```sql
delete from public.appointments where code like 'DUMMY-XLSX-%';
delete from public.guest_students where nim like 'DUMMY-XLSX-%';
delete from public.counselor_directory
where source_key = 'dummy-import-unassigned'
  and not exists (
    select 1 from public.appointments
    where counselor_directory_id = counselor_directory.id
  );
```

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

### Profiling PANDU Tel-U (menu admin)

Menu **Profiling PANDU** menampilkan hasil tes Personality, Adaptability, and Resilience Diagnostic. Data ini sangat sensitif: hanya admin/superadmin yang bisa membacanya (RLS) dan browser tidak punya akses tulis.

1. Jalankan [`supabase/pandu-profiling.sql`](./supabase/pandu-profiling.sql) di SQL Editor untuk membuat tabel `pandu_results` (aman dijalankan ulang: menambah kolom program studi, fakultas, angkatan dan menghapus kolom resiliensi lama).
2. Buat SQL impor dari Excel di komputer sendiri: `python3 scripts/build-pandu-import.py "/path/pandu mahasiswa.xlsx"`. Hasilnya `supabase/private/pandu-import-00-clear.sql` dan `pandu-import-01..NN.sql` (diabaikan Git; **jangan di-commit**, berisi nama dan NIM asli).
3. Jalankan `pandu-import-00-clear.sql` (mengosongkan data lama; lewati jika ini impor pertama), lalu tiap file `pandu-import-01..NN.sql` berurutan di SQL Editor. Bagian bisa diulang karena memakai upsert per NIM; baris ganda untuk NIM yang sama hanya dimasukkan sekali.
4. Untuk menghapus seluruh data: `truncate public.pandu_results;`

#### Tambah data profiling & akses konselor

Jalankan [`supabase/pandu-input-counselor-access.sql`](./supabase/pandu-input-counselor-access.sql) sekali di SQL Editor. File ini membuat dua fungsi:

- `admin_upsert_pandu_results`: dipakai tombol **Tambah data profiling** (menu **Profiling → Profiling PANDU**). Admin mengunggah Excel/CSV berformat sama dengan file PANDU; NIM baru ditambahkan, NIM yang sudah ada diperbarui, dan hasil lengkap tidak tertimpa data yang belum lengkap.
- `counselor_pandu_result`: dipakai halaman konselor. Konselor hanya bisa melihat hasil profiling mahasiswa yang punya pengajuan/sesi dengan dirinya (NIM harus ada di data profiling).

#### Analisis AI (tombol "Analisis Hasil dengan AI")

Tombol ini memanggil Edge Function `analyze-pandu`, yang membaca skor dari database lalu meminta analisis ke OpenAI (ChatGPT). Hanya admin/superadmin aktif yang bisa memakainya. Nama dan NIM tidak dikirim ke OpenAI. API key hanya tersimpan sebagai secret Supabase, bukan di Git atau browser.

```bash
supabase secrets set OPENAI_API_KEY=sk-... --project-ref YOUR_PROJECT_ID
supabase functions deploy analyze-pandu --project-ref YOUR_PROJECT_ID
```

Model bawaan `gpt-4.1-mini`; ganti dengan `supabase secrets set OPENAI_MODEL=<nama-model>`. Setiap klik tombol memakai kuota API (hasil disimpan sementara di halaman, jadi klik ulang pada mahasiswa yang sama tidak memanggil AI lagi sampai halaman dimuat ulang).

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
