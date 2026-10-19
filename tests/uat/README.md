# UAT otomatis (Playwright)

Menguji situs live: halaman publik, keamanan API/hak akses, dan alur UI mahasiswa, konselor, serta admin.

## Menjalankan

```bash
tests/uat/run-uat.sh                                  # situs GitHub Pages
UAT_BASE_URL=http://localhost:8000/ tests/uat/run-uat.sh   # situs lokal
```

Pertama kali: `cd tests/uat && npm install && npx playwright install chromium`.
Laporan HTML: `tests/uat/playwright-report/`.

## Catatan

- `run-uat.sh` mengambil service-role key lewat Supabase CLI (harus sudah `supabase link`) dan hanya menyimpannya di memori proses. Jangan menulis key ke berkas. Alternatif: set `SUPABASE_SERVICE_ROLE_KEY` sendiri.
- Setup membuat 3 akun uji (`uat.*@example.com`), satu entri direktori konselor, jadwal, pengajuan, dan data PANDU NIM `99000000xx`. Semuanya dihapus otomatis saat selesai, termasuk jika setup gagal.
- Test admin memanggil OpenAI sekitar 2 kali (biaya kecil).
