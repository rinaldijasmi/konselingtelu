      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const shortDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const counselors = [
        { name: "Dr. Rani Putri", phone: "6281234567001", active: true },
        { name: "Mira Anggraini, M.Psi.", phone: "6281234567002", active: true },
        { name: "Budi Santoso, M.Psi.", phone: "6281234567003", active: false }
      ];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hours = Array.from({ length: 8 }, (_, index) => `${String(index + 8).padStart(2, "0")}.00–${String(index + 9).padStart(2, "0")}.00`);
      const sampleAppointments = [
        { dateOffset: 1, time: "09.00–10.00", name: "Nadia Putri", nim: "1202210031", faculty: "Fakultas Informatika", category: "Akademik", mode: "Online", status: "Terkonfirmasi" },
        { dateOffset: 2, time: "10.00–11.00", name: "Rizky Ramadhan", nim: "1202220018", faculty: "Fakultas Ekonomi dan Bisnis", category: "Pribadi", mode: "Tatap muka", status: "Menunggu" },
        { dateOffset: 3, time: "13.00–14.00", name: "Salsabila Aulia", nim: "1202230042", faculty: "Fakultas Komunikasi dan Ilmu Sosial", category: "Sosial", mode: "Online", status: "Terkonfirmasi" },
        { dateOffset: 1, time: "14.00–15.00", name: "Dimas Pratama", nim: "1202210025", faculty: "Fakultas Teknik Elektro", category: "Akademik", mode: "Tatap muka", status: "Terlaksana" },
        { dateOffset: 3, time: "10.00–11.00", name: "Intan Maharani", nim: "1202240007", faculty: "Fakultas Industri Kreatif", category: "Karier", mode: "Online", status: "Menunggu" },
        { dateOffset: 6, time: "09.00–10.00", name: "Fajar Maulana", nim: "1202230020", faculty: "Fakultas Rekayasa Industri", category: "Keluarga", mode: "Tatap muka", status: "Terkonfirmasi" },
        { dateOffset: 7, time: "13.00–14.00", name: "Citra Lestari", nim: "1202250011", faculty: "Fakultas Ilmu Terapan", category: "Pribadi", mode: "Online", status: "Terkonfirmasi" },
        { dateOffset: 8, time: "14.00–15.00", name: "Bagas Saputra", nim: "1202220046", faculty: "Fakultas Informatika", category: "Akademik", mode: "Tatap muka", status: "Terlaksana" },
        { dateOffset: 8, time: "09.00–10.00", name: "Ayu Nirmala", nim: "1202240022", faculty: "Fakultas Ekonomi dan Bisnis", category: "Karier", mode: "Online", status: "Menunggu" },
        { dateOffset: 10, time: "13.00–14.00", name: "Reza Firmansyah", nim: "1202230015", faculty: "Fakultas Teknik Elektro", category: "Sosial", mode: "Tatap muka", status: "Terkonfirmasi" },
        { dateOffset: 15, time: "10.00–11.00", name: "Nabila Zahra", nim: "1202250009", faculty: "Fakultas Ilmu Terapan", category: "Pribadi", mode: "Online", status: "Terlaksana" },
        { dateOffset: 13, time: "14.00–15.00", name: "Arif Hidayat", nim: "1202210063", faculty: "Fakultas Rekayasa Industri", category: "Keluarga", mode: "Online", status: "Terkonfirmasi" }
      ].map((appointment, index) => {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + appointment.dateOffset);
        if (appointment.status === "Terlaksana") {
          date.setTime(today.getTime());
          date.setDate(today.getDate() - (index + 1));
        } else if (date.getDay() === 0 || date.getDay() === 6) {
          date.setDate(date.getDate() + (date.getDay() === 6 ? 2 : 1));
        }
        const programs = {
          "Fakultas Informatika": "S1 Informatika",
          "Fakultas Ekonomi dan Bisnis": "S1 Manajemen",
          "Fakultas Komunikasi dan Ilmu Sosial": "S1 Ilmu Komunikasi",
          "Fakultas Teknik Elektro": "S1 Teknik Telekomunikasi",
          "Fakultas Industri Kreatif": "S1 Desain Komunikasi Visual",
          "Fakultas Rekayasa Industri": "S1 Teknik Industri",
          "Fakultas Ilmu Terapan": "D3 Sistem Informasi"
        };
        return {
          ...appointment,
          date,
          id: `KN-${String(1042 + index).padStart(4, "0")}`,
          phone: `0812345678${String(10 + index).padStart(2, "0")}`,
          program: programs[appointment.faculty] || "Program studi mahasiswa",
          reason: [
            "Kesulitan menjaga keseimbangan antara kuliah dan waktu istirahat.",
            "Ingin berdiskusi tentang relasi keluarga dan cara berkomunikasi.",
            "Merasa cemas menghadapi perubahan dan tanggung jawab baru.",
            "Ingin mendapat dukungan untuk mengelola stres akademik."
          ][index % 4],
          details: [
            "Beberapa minggu terakhir sulit berkonsentrasi. Ingin berdiskusi tentang strategi mengelola waktu dan mencari dukungan yang sesuai.",
            "Ada situasi di rumah yang terasa membebani. Berharap dapat membahas langkah yang nyaman dan aman untuk dilakukan.",
            "Belakangan sering merasa khawatir menjelang kegiatan kampus. Ingin memahami pemicunya dan belajar cara mengelola kecemasan.",
            "Tugas kuliah terasa menumpuk dan pola istirahat berubah. Ingin mencari cara agar aktivitas sehari-hari lebih seimbang."
          ][index % 4],
          birthDate: `${2002 + index % 5}-0${index % 8 + 1}-${String(index % 27 + 1).padStart(2, "0")}`,
          ethnicity: ["Sunda", "Jawa", "Minang", "Bugis"][index % 4],
          religion: ["Islam", "Kristen Protestan", "Katolik", "Islam"][index % 4],
          city: ["Bandung", "Jakarta", "Bekasi", "Tasikmalaya"][index % 4],
          address: ["Sukapura, Dayeuhkolot, Kabupaten Bandung", "Sukabirus, Dayeuhkolot, Kabupaten Bandung", "Jl. Telekomunikasi, Bandung"][index % 3],
          birthOrder: index % 3 + 1,
          siblings: index % 4,
          counselor: appointment.status === "Terkonfirmasi" || appointment.status === "Terlaksana" ? ["Dr. Rani Putri", "Mira Anggraini, M.Psi.", "Budi Santoso, M.Psi."][index % 3] : "",
          counselorPhone: appointment.status === "Terkonfirmasi" || appointment.status === "Terlaksana" ? counselors[index % counselors.length].phone : "",
          location: appointment.mode === "Online" ? "https://zoom.us/j/123456789" : "Ruang Konseling Kemahasiswaan",
          scheduleChanged: false,
          reminderOpened: { student: false, counselor: false }
        };
      });
      const reportDate = daysAgo => new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
      const counselingReports = [
        {
          nim: "1202210025",
          sessions: [
          { date: reportDate(18), time: "10.00–11.00", counselor: "Dr. Rani Putri", mode: "Tatap muka", category: "Akademik", diagnosis: "Kesulitan mengelola waktu dan menjaga keseimbangan aktivitas.", description: "Mahasiswa membahas kesulitan membagi waktu antara tugas dan istirahat serta mengidentifikasi pola kegiatan harian.", intervention: "Konselor memfasilitasi identifikasi prioritas dan penyusunan alternatif pengelolaan waktu.", conclusion: "Mahasiswa memahami beberapa faktor yang memengaruhi keseimbangan aktivitas dan bersedia mencoba strategi yang dibahas.", recommendation: "Mencoba menyusun jadwal mingguan yang realistis dan mengevaluasi waktu istirahat." },
          { date: sampleAppointments.find(item => item.nim === "1202210025").date, time: sampleAppointments.find(item => item.nim === "1202210025").time, counselor: "Dr. Rani Putri", mode: "Tatap muka", category: "Akademik", diagnosis: "Kesulitan mempertahankan pengelolaan waktu saat beban tugas meningkat.", description: "Sesi meninjau penerapan jadwal mingguan. Mahasiswa merasa lebih terbantu, namun masih mengalami kesulitan saat beban tugas meningkat.", intervention: "Konselor meninjau strategi yang sudah dicoba dan membantu mahasiswa menyesuaikan target aktivitas.", conclusion: "Mahasiswa menunjukkan perkembangan dalam mengatur rutinitas dan mengidentifikasi situasi yang membutuhkan penyesuaian.", recommendation: "Melanjutkan pencatatan aktivitas dan menghubungi layanan kembali bila memerlukan dukungan." }
          ]
        },
        {
          nim: "1202220046",
          sessions: [
          { date: sampleAppointments.find(item => item.nim === "1202220046").date, time: sampleAppointments.find(item => item.nim === "1202220046").time, counselor: "Mira Anggraini, M.Psi.", mode: "Tatap muka", category: "Akademik", diagnosis: "Tekanan akademik dan kebutuhan mengidentifikasi dukungan.", description: "Sesi membahas tekanan akademik dan strategi mencari dukungan di lingkungan kampus.", intervention: "Konselor membantu mahasiswa memetakan sumber dukungan yang tersedia dan menyusun langkah yang dapat dicoba.", conclusion: "Mahasiswa dapat mengidentifikasi beberapa langkah dan sumber dukungan yang relevan.", recommendation: "Mencoba langkah yang telah disepakati dan melakukan sesi lanjutan bila diperlukan." }
          ]
        },
        {
          nim: "1202250009",
          sessions: [
          { date: reportDate(32), time: "13.00–14.00", counselor: "Budi Santoso, M.Psi.", mode: "Online", category: "Pribadi", diagnosis: "Kekhawatiran terkait perubahan rutinitas.", description: "Mahasiswa membicarakan rasa khawatir yang muncul menjelang perubahan rutinitas dan dukungan yang tersedia.", intervention: "Konselor membantu mengenali situasi pemicu dan mengeksplorasi strategi pengelolaan yang sesuai.", conclusion: "Mahasiswa mulai memahami beberapa pemicu kekhawatiran dan dukungan yang dapat diakses.", recommendation: "Mencatat situasi yang memicu kekhawatiran dan teknik pengelolaan yang dirasa membantu." },
          { date: reportDate(20), time: "13.00–14.00", counselor: "Budi Santoso, M.Psi.", mode: "Online", category: "Pribadi", diagnosis: "Kekhawatiran terkait perubahan rutinitas.", description: "Sesi meninjau catatan pemicu dan latihan pengelolaan. Mahasiswa mulai mengenali pola dan merasa lebih siap menghadapi aktivitas tertentu.", intervention: "Konselor meninjau strategi yang dicoba dan mendiskusikan penerapannya secara bertahap.", conclusion: "Mahasiswa melaporkan mulai mengenali pola dan merasa lebih siap menghadapi beberapa aktivitas.", recommendation: "Melanjutkan latihan secara bertahap dan menghubungi konselor jika kondisi memburuk." },
          { date: sampleAppointments.find(item => item.nim === "1202250009").date, time: sampleAppointments.find(item => item.nim === "1202250009").time, counselor: "Budi Santoso, M.Psi.", mode: "Online", category: "Pribadi", diagnosis: "Kekhawatiran terkait perubahan rutinitas.", description: "Sesi tindak lanjut berfokus pada perkembangan strategi yang dicoba dan dukungan yang dapat diakses.", intervention: "Konselor mengevaluasi strategi yang telah dicoba dan membantu mengidentifikasi dukungan lanjutan.", conclusion: "Mahasiswa menyampaikan beberapa strategi terasa bermanfaat dan dapat mengidentifikasi dukungan yang tersedia.", recommendation: "Mempertahankan strategi yang sesuai dan menjadwalkan sesi lanjutan sesuai kebutuhan." }
          ]
        }
      ];
      const state = {
        view: "overview",
        range: 30,
        month: new Date(today.getFullYear(), today.getMonth(), 1),
        selectedDate: new Date(today),
        selectedDay: today.getDay(),
        weeklySettings: Array.from({ length: 7 }, (_, weekday) => ({
          onlineOpen: weekday >= 1 && weekday <= 5,
          onlineHours: Array.from({ length: 8 }, (_, index) => weekday >= 1 && weekday <= 4 || weekday === 5 && index < 6),
          offlineOpen: weekday >= 1 && weekday <= 5,
          offlineHours: Array.from({ length: 8 }, (_, index) => weekday >= 1 && weekday <= 4 || weekday === 5 && index < 6)
        })),
        dateOverrides: {},
        settingScope: "date",
        settingMode: "Online",
        settingsDraft: null,
        settingsDirty: false,
        queueFilter: "Menunggu",
        selectedApplicationId: null,
        approvingApplicationId: null,
        editingApplicationId: null,
        staffAccounts: [],
        selectedReportNim: counselingReports[0].nim
      };
      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const newScheduleStudents = [];
      const parseDate = value => {
        const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      const formatDate = (date, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) => new Intl.DateTimeFormat("id-ID", options).format(date);
      const isSameDate = (left, right) => dateKey(left) === dateKey(right);
      const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[character]);
      const telkomLogoDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIwAAAA0CAMAAABvhyAUAAAAflBMVEVHcEw2MzQ2MzQ2MzQ2MzRTNjc5Njc2MzQ2MzQ2MzRXNzg2MzQ2MzQ4NTY2MzQ2MzQ2MzQ+MzSEhoiEhoiEhojILjKDhYeyLC86NzjuMTbRLzNyc3VtbnDDLTG1LTBfX2HLLjJfX2Fyc3U3NDWEhog2MzTtMTZfX2GyLTCyLC/b0tGBAAAAI3RSTlMARdzz+xAjtWfGCKCSLIDpNRdc6yAim+5U6EX8+8H9jn/W5eSNQEwAAAXVSURBVHja7ZfrdqM6DIVtbAyYiyG9pT0n03Y0mrbv/4JHkt04QJM1aWdlzo/ZTYOXUMKXLdkG9VfH9PTw8HAj8jnopxiic6W6oH6S7qN2TzccuXna7e5E397e7ih0Of2caXdTPt29vr29vr7SP+myMPdzmvsdUbxFGvr7c86IXqPe0vufhflGDOxMep0D48ZR2t33o/tNMNmZWc8MxVzN6npjsLYhGl8Za7Zf65kMI81COuyZKSALEOIRsFYL1RQ3vVJlQYPu9zhDBMIy7xkXmEBeIoQ1DOxhAD4Hs7tP2jsTHYna7aZ5mZAkg8p94AxEGPisM8r7UnTz8HQfYXZPDzeTxLzPeRLYWkAY5ZRaO5NhyJmvyj/c//x29+TVUWmLAGNqo7qNGlyCgSXMls5KOd2QcuvotK9pOFKwq8up7viE+4Dm7kGp0zA4xiFfk4QIoZ6XCRNMbQFtzYMgzc/5hZaZZxGs4YgtCstxDOsJeHOSxWsLyZk+QJbVc2dAYLShQcsDC1nBpQgCKx/NqM6TBsAI0yJbQp0c2JzGM8y8gR13e0Nl8Q3QyFCuBTmVym1DsEiyoZBjdTZMcsYXbLnjxm7k566ckbhkuICUIeZZjvnkTO39wIGmVFpSPumMLCbppwxIEG7mDGDnW4totHSv2a+CzR4GEbT8puhIx959AgYjDBDMRHItjQQGAbMzNUjzRhgKDDKsKPruDOhExzAD26o2SddqputNkl/AIGRnTGBJQ7j5CoyNkSm1gkHcO4MRBjHD/HjXRh1oc5WiV3NIbSHDJKFYv+iZYAUgwSDg3hk45gwKTNL1gS+JJcOsy4QikDej5xslYNfE8L5nlmVCjDAI0RnECLO2ZvPjKAxp3zOhYVXV4GYrsMCMBsAW07pnlmWCZZlEt78CYxEzTLXem/KuPQCpPVGmZc/gOTDrBi7KFUxeZzwXym4TDAj4VGRn4IvO5AbmS/HXDEmxZzIMLyujwbjqTQEAbKe1riiCjVo08GkYf8qZtB3UMo0wbZYhrzP5fmawgHKlFigi6Zxdq3nPfLpMedcuK0hCaVyBOSxTGtiadynIqsoE81VnZK8uJiU0XbCAGO3h2BhQzvnW2Hg/MBbGWg65KoD4YkNHLIyHcfvuLNoh7fDNmc4op7XL46QU69Ox3D+qTP0ow5zrFt/jKebTh6cznLmAPnTm/wRz3BmfXO9HvyzfdM7mH+eAdov41UfO3B6D2dpQci8Yq9VMDXRnsFjjZAYVR2G+7znL7xlm7kCNRmAsbNVMQ1OrX1ZfyfzuMszKhH8efYo9/ruwK8NAgrEMo/WktS73ZdJpl+ZQqUm94mTtHGXyQMd0r0dOqKCIc6p/D24yzMtjKb48vsxgjjrjrA0WbNGnMpXB1swSzKimxloLppP1NxiwrdKBIsAp2lonay5YaLzyBVBwC4ZuXTLMy/Pjdvv4/HIAc72Cyc70CEVbGawYBjvekxvJKbwa0LRdBXYkGDRV22nfQNGRHMOAU33XQOi6LXkScJCvpjplmL3+zcacKFMPVgtBdEZ+3MjDgaOVVw44rcVGqhWglsflBJN7xgdgGCCY61MwmyUMrmDaDDMVOChnrCMYvvMqJCHB+AooVNWeYGABgwkmWbOGycacdqbFPQyBFX6AxrMzYEhVGRNYrqCAhSE7gytnqGuOwVxdH4UBhsEDZ94fFHUDtWJnmr53fElJEHnnHAGUSgNmmMOeyTQrmKuNWmoLUPd9P7An6zLxvGhMcNEjPfIumWHKnkTx8t2ZAYzunXyqGnt2Jj+YLGHWLNwV6W6qKGU2SZmK5AypS7dTShsERDBTLlMVbzfqfZl6A4B2VHGWgzgj3qxghGWtvqtYnTxltxUdtlXN9au09EVbVaNi6ZbzWp8SJIUkDeyqtuTI2FIGW8OnCnFGaG6XMLfX6rKSMiVtbg9hbjfqgtIVKcx2qv7x+ZlJnp8fe3VR1YZVjPNo6UilVxeWd6xS/dUx/Qfq7x0xtyeVcQAAAABJRU5ErkJggg==";
      let toastTimer;
      let adminContext = null;

      async function loadAdminData(context) {
        const { client } = context;
        const staffRegistryQuery = context.profile.role === "superadmin"
          ? client.from("staff_account_registry").select("user_id,account_email")
          : Promise.resolve({ data: [], error: null });
        const [appointments, profilesResult, settingsResult, overrideResult, studentsResult, staffProfilesResult, staffRegistryResult] = await Promise.all([
          window.counselingBackend.loadAppointments(client),
          client.from("profiles").select("*").eq("role", "counselor").order("full_name"),
          client.from("service_hours").select("*").order("weekday"),
          client.from("service_date_overrides").select("*").gte("available_date", dateKey(today)),
          client.from("profiles").select("id,full_name,nim").eq("role", "student").order("full_name"),
          client.from("profiles").select("id,full_name,role,is_active,must_change_password").in("role", ["admin", "counselor"]).order("full_name"),
          staffRegistryQuery
        ]);
        if (profilesResult.error) throw profilesResult.error;
        if (settingsResult.error) throw settingsResult.error;
        if (overrideResult.error) throw overrideResult.error;
        if (studentsResult.error) throw studentsResult.error;
        if (staffProfilesResult.error) throw staffProfilesResult.error;
        if (staffRegistryResult.error) throw staffRegistryResult.error;
        const staffEmails = new Map(staffRegistryResult.data.map(account => [account.user_id, account.account_email]));
        state.staffAccounts = staffProfilesResult.data.map(profile => ({
          ...profile,
          account_email: staffEmails.get(profile.id) || ""
        }));
        sampleAppointments.splice(0, sampleAppointments.length, ...appointments.map(record => {
          const student = record.student || {};
          const counselorProfile = record.counselor || {};
          const start = record.start_time || record.requested_start_time;
          const end = record.end_time || record.requested_end_time;
          return {
            id: record.code,
            dbId: record.id,
            date: parseDate(record.scheduled_date || record.requested_date),
            time: window.counselingBackend.displayTime(start, end),
            name: student.full_name || "Mahasiswa",
            nim: student.nim || "",
            faculty: student.faculty || "",
            program: student.program || "",
            phone: student.phone || "",
            birthDate: student.birth_date || "",
            ethnicity: student.ethnicity || "",
            religion: student.religion || "",
            city: student.city || "",
            address: student.address || "",
            birthOrder: student.birth_order ?? "",
            siblings: student.sibling_count ?? "",
            category: record.category,
            mode: record.mode,
            status: ({ pending: "Menunggu", confirmed: "Terkonfirmasi", completed: "Terlaksana", rejected: "Ditolak" })[record.status],
            reason: record.reason,
            details: record.issue_details,
            issue: record.issue_summary,
            counselorId: record.counselor_id,
            counselor: counselorProfile.full_name || "",
            counselorPhone: counselorProfile.phone || "",
            location: record.location || "",
            scheduleChanged: record.schedule_changed,
            createdAt: (() => { const value = new Date(record.created_at); value.setHours(0, 0, 0, 0); return value; })(),
            reminderOpened: { student: record.reminder_student_opened, counselor: record.reminder_counselor_opened },
            reminderFeedback: ""
          };
        }));
        counselors.splice(0, counselors.length, ...profilesResult.data.map(profile => ({
          id: profile.id,
          name: profile.full_name,
          phone: profile.phone || "",
          active: profile.is_active,
          mustChangePassword: profile.must_change_password
        })));
        state.weeklySettings = Array.from({ length: 7 }, (_, weekday) => {
          const setting = settingsResult.data.find(item => item.weekday === weekday);
          return setting
            ? {
              onlineOpen: setting.online_is_open,
              onlineHours: setting.online_open_slots,
              offlineOpen: setting.offline_is_open,
              offlineHours: setting.offline_open_slots
            }
            : { onlineOpen: false, onlineHours: Array(8).fill(false), offlineOpen: false, offlineHours: Array(8).fill(false) };
        });
        state.dateOverrides = Object.fromEntries(overrideResult.data.map(item => [String(item.available_date).slice(0, 10), {
          onlineOpen: item.online_is_open,
          onlineHours: item.online_open_slots,
          offlineOpen: item.offline_is_open,
          offlineHours: item.offline_open_slots
        }]));
        newScheduleStudents.splice(0, newScheduleStudents.length, ...studentsResult.data);
        initializeSettingsDraft();
        const reportRows = await window.counselingBackend.loadReports(client, appointments);
        const reportsByNim = new Map();
        reportRows.forEach(row => {
          const student = row.appointment?.student;
          if (!student?.nim) return;
          if (!reportsByNim.has(student.nim)) reportsByNim.set(student.nim, []);
          reportsByNim.get(student.nim).push({
            date: parseDate(row.appointment.scheduled_date),
            time: window.counselingBackend.displayTime(row.appointment.start_time, row.appointment.end_time),
            counselor: row.appointment.counselor?.full_name || "",
            mode: row.appointment.mode,
            category: row.appointment.category,
            diagnosis: row.diagnosis,
            description: row.description,
            intervention: row.intervention,
            conclusion: row.conclusion,
            recommendation: row.recommendation
          });
        });
        counselingReports.splice(0, counselingReports.length, ...[...reportsByNim].map(([nim, sessions]) => ({ nim, sessions })));
        state.selectedReportNim = counselingReports[0]?.nim || null;
        state.selectedApplicationId = sampleAppointments[0]?.id || null;
      }

      function barMarkup(items) {
        return items.map((item, index) => `<div class="bar-item"><div class="bar-label-row"><span>${escapeHtml(item.label)}</span><strong>${item.count} · ${item.percent}%</strong></div><div class="bar-track"><div class="bar-fill ${index ? `alt-${Math.min(index, 4)}` : ""}" style="width:${item.percent}%"></div></div></div>`).join("");
      }

      function renderOverview(range = state.range) {
        const ranges = {
          7: { applications: 64, scheduled: 49, completed: 36, pending: 10, cancelled: 5, start: "7 hari terakhir", labels: ["7 Okt", "8 Okt", "9 Okt", "10 Okt", "11 Okt", "12 Okt", "13 Okt"] },
          30: { applications: 248, scheduled: 186, completed: 141, pending: 42, cancelled: 20, start: "30 hari terakhir", labels: ["14 Sep", "19 Sep", "24 Sep", "29 Sep", "4 Okt", "9 Okt", "13 Okt"] },
          90: { applications: 712, scheduled: 528, completed: 403, pending: 120, cancelled: 64, start: "90 hari terakhir", labels: ["16 Jul", "31 Jul", "15 Agu", "30 Agu", "14 Sep", "29 Sep", "13 Okt"] }
        };
        const report = ranges[range];
        const rate = `${(report.completed / report.scheduled * 100).toFixed(1).replace(".", ",")}%`;
        const scheduledPercent = `${(report.scheduled / report.applications * 100).toFixed(1).replace(".", ",")}%`;
        $$("[data-metric]").forEach(element => {
          element.textContent = element.dataset.metric === "rate" ? rate : report[element.dataset.metric].toLocaleString("id-ID");
        });
        $("#executionRate").textContent = rate;
        $("#completedLegend").textContent = `${report.completed} sesi`;
        $("#remainingLegend").textContent = `${report.scheduled - report.completed} sesi`;
        $("#chartPeriod").textContent = report.start;
        $$(".metric-card").forEach(card => {
          const label = $(".metric-label", card).textContent;
          if (label === "Jumlah terjadwal") $(".metric-change", card).textContent = scheduledPercent;
          if (label === "Jumlah pengajuan") $(".metric-note", card).textContent = report.start;
        });
        $$(".chart-axis-label").forEach(label => {
          const index = Number(label.getAttribute("text-anchor") === "middle" ? label.getAttribute("x") : -1);
          if (index >= 0) {
            const point = [55, 145, 235, 325, 415, 505, 595].indexOf(index);
            if (point >= 0) label.textContent = report.labels[point];
          }
        });
        $$('[data-total="applications"]').forEach(element => { element.textContent = `${report.applications.toLocaleString("id-ID")} pengajuan`; });
        $$('[data-total="scheduled"]').forEach(element => { element.textContent = `${report.scheduled.toLocaleString("id-ID")} terjadwal`; });
        const scaled = (items, total) => items.map(([label, share], index) => {
          const count = index === items.length - 1
            ? total - items.slice(0, -1).reduce((sum, [, priorShare]) => sum + Math.round(total * priorShare), 0)
            : Math.round(total * share);
          return { label, count, percent: Math.round(count / total * 100) };
        });
        $("#categoryChart").innerHTML = barMarkup(scaled([
          ["Akademik", .35], ["Pribadi", .25], ["Keluarga", .16], ["Sosial", .14], ["Karier & lainnya", .10]
        ], report.applications));
        $("#statusChart").innerHTML = barMarkup([
          { label: "Terlaksana", count: report.completed, percent: Math.round(report.completed / report.applications * 100) },
          { label: "Terjadwal", count: report.scheduled - report.completed, percent: Math.round((report.scheduled - report.completed) / report.applications * 100) },
          { label: "Menunggu konfirmasi", count: report.pending, percent: Math.round(report.pending / report.applications * 100) },
          { label: "Dibatalkan", count: report.cancelled, percent: Math.round(report.cancelled / report.applications * 100) }
        ]);
        const faculty = scaled([
          ["Fakultas Informatika", .26],
          ["Fakultas Ekonomi dan Bisnis", .19],
          ["Fakultas Teknik Elektro", .16],
          ["Fakultas Rekayasa Industri", .14],
          ["Fakultas Komunikasi dan Ilmu Sosial", .11],
          ["Fakultas Industri Kreatif", .08],
          ["Fakultas Ilmu Terapan", .06]
        ], report.applications);
        $("#facultyChart").innerHTML = faculty.map(({ label, count, percent }) => `<div class="faculty-item"><span class="faculty-name" title="${label}">${label}</span><span class="faculty-track"><span style="width:${percent * 3.2}%"></span></span><span class="faculty-count">${count}</span></div>`).join("");
        const online = Math.round(report.scheduled * .64);
        const offline = report.scheduled - online;
        const onlinePercent = Math.round(online / report.scheduled * 100);
        $(".channel-donut").style.background = `conic-gradient(#c41230 0 ${onlinePercent}%, #6b86bb ${onlinePercent}% 100%)`;
        $(".channel-donut").setAttribute("aria-label", `${onlinePercent} persen online dan ${100 - onlinePercent} persen tatap muka`);
        $(".channel-donut .donut-content strong").textContent = report.scheduled.toLocaleString("id-ID");
        $$(".channel-key-row span").forEach((element, index) => {
          const count = index === 0 ? online : offline;
          const percent = index === 0 ? onlinePercent : 100 - onlinePercent;
          element.textContent = `${count} sesi · ${percent}%`;
        });
      }

      function renderLiveOverview() {
        const rangeDays = state.range;
        const rangeStart = new Date(today);
        rangeStart.setDate(today.getDate() - rangeDays + 1);
        const reportAppointments = sampleAppointments.filter(item => item.createdAt >= rangeStart);
        const total = reportAppointments.length;
        const rangeSessions = reportAppointments.filter(item => item.status === "Terkonfirmasi" || item.status === "Terlaksana");
        const completed = rangeSessions.filter(item => item.status === "Terlaksana").length;
        const scheduled = rangeSessions.length;
        const pending = reportAppointments.filter(item => item.status === "Menunggu").length;
        const rejected = reportAppointments.filter(item => item.status === "Ditolak").length;
        const rate = scheduled ? completed / scheduled * 100 : 0;
        const scheduledPercent = total ? scheduled / total * 100 : 0;
        const percentText = value => `${Math.round(value)}%`;
        $$("[data-metric]").forEach(element => {
          const value = element.dataset.metric === "rate" ? percentText(rate) :
            element.dataset.metric === "applications" ? total :
              element.dataset.metric === "scheduled" ? scheduled : completed;
          element.textContent = typeof value === "number" ? value.toLocaleString("id-ID") : value;
        });
        $("#executionRate").textContent = percentText(rate);
        $("#completedLegend").textContent = `${completed} sesi`;
        $("#remainingLegend").textContent = `${scheduled - completed} sesi`;
        $$(".metric-card").forEach(card => {
          const label = $(".metric-label", card).textContent;
          if (label === "Jumlah terjadwal") $(".metric-change", card).textContent = percentText(scheduledPercent);
          $(".metric-note", card).textContent = "Data tersimpan di database";
        });
        $$('[data-total="applications"]').forEach(element => { element.textContent = `${total.toLocaleString("id-ID")} pengajuan`; });
        $$('[data-total="scheduled"]').forEach(element => { element.textContent = `${scheduled.toLocaleString("id-ID")} terjadwal`; });

        const distribution = (key, labelFor = value => value || "Belum diisi", records = reportAppointments) => {
          const counts = new Map();
          records.forEach(item => {
            const label = labelFor(item[key]);
            counts.set(label, (counts.get(label) || 0) + 1);
          });
          return [...counts].map(([label, count]) => ({ label, count, percent: total ? Math.round(count / total * 100) : 0 }))
            .sort((left, right) => right.count - left.count);
        };
        const categories = distribution("category");
        $("#categoryChart").innerHTML = categories.length ? barMarkup(categories) : '<div class="review-empty">Belum ada data pengajuan.</div>';
        const statusRows = [
          ["Terlaksana", completed],
          ["Terjadwal", scheduled - completed],
          ["Menunggu konfirmasi", pending],
          ["Ditolak", rejected]
        ].map(([label, count]) => ({ label, count, percent: total ? Math.round(count / total * 100) : 0 }));
        $("#statusChart").innerHTML = barMarkup(statusRows);
        const facultyRows = distribution("faculty").slice(0, 7);
        $("#facultyChart").innerHTML = facultyRows.length
          ? facultyRows.map(({ label, count, percent }) => `<div class="faculty-item"><span class="faculty-name" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="faculty-track"><span style="width:${percent * 3.2}%"></span></span><span class="faculty-count">${count}</span></div>`).join("")
          : '<div class="review-empty">Belum ada data fakultas.</div>';

        const channelRows = [
          { label: "Online", count: rangeSessions.filter(item => item.mode === "Online" && ["Terkonfirmasi", "Terlaksana"].includes(item.status)).length },
          { label: "Tatap muka", count: rangeSessions.filter(item => item.mode === "Tatap muka" && ["Terkonfirmasi", "Terlaksana"].includes(item.status)).length }
        ];
        const channelTotal = channelRows.reduce((sum, row) => sum + row.count, 0);
        const onlinePercent = channelTotal ? Math.round(channelRows[0].count / channelTotal * 100) : 0;
        $(".channel-donut").style.background = `conic-gradient(#c41230 0 ${onlinePercent}%, #6b86bb ${onlinePercent}% 100%)`;
        $(".channel-donut").setAttribute("aria-label", `${onlinePercent} persen online dan ${100 - onlinePercent} persen tatap muka`);
        $(".channel-donut .donut-content strong").textContent = channelTotal.toLocaleString("id-ID");
        $$(".channel-key-row span").forEach((element, index) => {
          const count = channelRows[index].count;
          element.textContent = `${count} sesi · ${channelTotal ? Math.round(count / channelTotal * 100) : 0}%`;
        });

        const bucketDays = rangeDays / 7;
        const buckets = Array.from({ length: 7 }, (_, index) => {
          const start = new Date(rangeStart);
          start.setDate(rangeStart.getDate() + Math.floor(index * bucketDays));
          const end = new Date(rangeStart);
          end.setDate(rangeStart.getDate() + Math.floor((index + 1) * bucketDays));
          return {
            start,
            requests: sampleAppointments.filter(item => item.createdAt >= start && item.createdAt < end).length,
            completed: sampleAppointments.filter(item => item.status === "Terlaksana" && item.date >= start && item.date < end).length
          };
        });
        const maxValue = Math.max(1, ...buckets.flatMap(item => [item.requests, item.completed]));
        const scale = Math.max(4, Math.ceil(maxValue / 4) * 4);
        const xs = [55, 145, 235, 325, 415, 505, 595];
        const y = value => 185 - (value / scale) * 150;
        const requestPoints = buckets.map((item, index) => `${xs[index]} ${y(item.requests)}`);
        const completedPoints = buckets.map((item, index) => `${xs[index]} ${y(item.completed)}`);
        $(".chart-area-fill").setAttribute("d", `M${requestPoints.join(" L")} L595 185 L55 185 Z`);
        $(".chart-line").setAttribute("d", `M${requestPoints.join(" L")}`);
        $('path[stroke="#65a47c"]').setAttribute("d", `M${completedPoints.join(" L")}`);
        $$(".chart-dot").forEach((dot, index) => dot.setAttribute("cy", String(y(buckets[index].requests))));
        $$('text.chart-axis-label:not([text-anchor="middle"])').forEach((label, index) => {
          label.textContent = String(Math.round(scale * (4 - index) / 4));
        });
        $$('text.chart-axis-label[text-anchor="middle"]').forEach((label, index) => {
          label.textContent = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(buckets[index].start);
        });
        $("#chartPeriod").textContent = `${rangeDays} hari terakhir`;
      }

      function appointmentsForDate(date) {
        return sampleAppointments.filter(appointment => isSameDate(appointment.date, date)).sort((a, b) => a.time.localeCompare(b.time));
      }

      function renderCalendar() {
        const calendar = $("#calendar");
        calendar.replaceChildren();
        shortDays.forEach(name => {
          const heading = document.createElement("div");
          heading.className = "weekday";
          heading.setAttribute("role", "columnheader");
          heading.textContent = name;
          calendar.append(heading);
        });
        const year = state.month.getFullYear();
        const month = state.month.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let index = 0; index < firstWeekday; index += 1) {
          const blank = document.createElement("div");
          blank.className = "day-cell";
          blank.setAttribute("role", "gridcell");
          blank.setAttribute("aria-hidden", "true");
          calendar.append(blank);
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
          const date = new Date(year, month, day);
          const dayAppointments = appointmentsForDate(date);
          const button = document.createElement("button");
          button.className = "day-cell";
          button.type = "button";
          button.setAttribute("role", "gridcell");
          button.setAttribute("aria-label", `${formatDate(date)}${dayAppointments.length ? `, ${dayAppointments.length} pengajuan` : ""}`);
          button.setAttribute("aria-selected", String(isSameDate(date, state.selectedDate)));
          button.innerHTML = `<span>${day}</span>`;
          if (isSameDate(date, today)) button.classList.add("today");
          if (isSameDate(date, state.selectedDate)) button.classList.add("selected");
          if (dayAppointments.length) {
            const marker = document.createElement("span");
            marker.className = "day-marker";
            marker.setAttribute("aria-hidden", "true");
            dayAppointments.slice(0, 3).forEach(appointment => {
              const dot = document.createElement("i");
              dot.className = appointment.status === "Terlaksana" ? "done" : appointment.status === "Menunggu" ? "pending" : "";
              marker.append(dot);
            });
            button.append(marker);
          } else if (!["Online", "Tatap muka"].some(mode => openedServiceHours(date, mode).length)) {
            button.classList.add("closed");
          }
          button.addEventListener("click", () => {
            if (!allowSettingsNavigation()) return;
            state.selectedDate = date;
            state.selectedDay = date.getDay();
            initializeSettingsDraft();
            renderCalendar();
            renderSelectedDay();
            renderDaySettings();
          });
          calendar.append(button);
        }
        $("#monthLabel").textContent = `${monthNames[month]} ${year}`;
        $("#previousMonth").disabled = state.month <= new Date(today.getFullYear(), today.getMonth(), 1);
      }

      function renderSelectedDay() {
        const appointments = appointmentsForDate(state.selectedDate);
        $("#dayAppointmentTitle").textContent = `Mahasiswa · ${formatDate(state.selectedDate)}`;
        $("#dayAppointmentCount").textContent = appointments.length
          ? `${appointments.length} mahasiswa`
          : "Belum ada pengajuan";
        const statusSummary = $("#dayStatusSummary");
        statusSummary.replaceChildren();
        [
          { status: "Menunggu", label: "Menunggu konfirmasi", className: "waiting" },
          { status: "Terkonfirmasi", label: "Terkonfirmasi", className: "confirmed" },
          { status: "Terlaksana", label: "Terlaksana", className: "completed" }
        ].forEach(({ status, label, className }) => {
          const count = appointments.filter(appointment => appointment.status === status).length;
          if (!count) return;
          const badge = document.createElement("span");
          badge.className = className;
          badge.textContent = `${count} ${label}`;
          statusSummary.append(badge);
        });
        const list = $("#dayAppointments");
        list.replaceChildren();
        if (!appointments.length) {
          const empty = document.createElement("div");
          empty.className = "slot-empty";
          empty.style.cssText = "padding:15px 6px;color:#8b878a;font-size:9px;text-align:center";
          empty.textContent = "Belum ada pengajuan pada tanggal ini.";
          list.append(empty);
          return;
        }
        appointments.forEach(appointment => {
          const row = document.createElement("button");
          row.className = "activity-row actionable";
          row.type = "button";
          const actionLabel = appointment.status === "Menunggu"
            ? "Klik untuk konfirmasi jadwal"
            : appointment.status === "Terkonfirmasi"
              ? "Klik untuk melihat jadwal dan reminder"
              : "Klik untuk melihat pengajuan";
          row.setAttribute("aria-label", `${appointment.name}, ${appointment.time}, ${appointment.status}. ${actionLabel}.`);
          row.title = actionLabel;
          const badgeClass = appointment.status === "Terlaksana" ? "done" : appointment.status === "Terkonfirmasi" ? "confirmed" : "";
          const statusLabel = appointment.status === "Menunggu" ? "Menunggu konfirmasi" : appointment.status;
          row.innerHTML = `<span class="activity-time">${escapeHtml(appointment.time)}</span><span class="activity-student"><strong>${escapeHtml(appointment.name)}</strong><span>${escapeHtml(appointment.nim)} · ${escapeHtml(appointment.faculty)}</span></span><span class="activity-mode">${escapeHtml(appointment.mode)}</span><span class="status-badge ${badgeClass}">${escapeHtml(statusLabel)}</span>`;
          row.addEventListener("click", () => openDayAppointment(appointment));
          list.append(row);
        });
      }

      function openDayAppointment(appointment) {
        state.selectedApplicationId = appointment.id;
        state.queueFilter = appointment.status === "Menunggu"
          ? "Menunggu"
          : appointment.status === "Terkonfirmasi"
            ? "Terkonfirmasi"
            : "Semua";
        $$(".queue-filter").forEach(filter => {
          const active = filter.dataset.queueFilter === state.queueFilter;
          filter.classList.toggle("active", active);
          filter.setAttribute("aria-pressed", String(active));
        });
        switchView("applications");
        renderApplications();
        if (appointment.status === "Menunggu") openApproval(appointment);
        else $("#reviewDetail").scrollIntoView({ behavior: "smooth", block: "start" });
      }

      function renderDaySettings() {
        const selected = state.settingsDraft || cloneSettings(settingsForDate(state.selectedDate));
        state.settingsDraft = selected;
        const { openKey, hoursKey } = modeSettings(selected, state.settingMode);
        $("#daySettingTitle").textContent = `${state.settingMode} · ${formatDate(state.selectedDate)}`;
        $("#dayOpenToggle").setAttribute("aria-checked", String(selected[openKey]));
        $("#dayOpenLabel").textContent = selected[openKey] ? "Buka" : "Tutup";
        $("#settingScopeNote").textContent = state.settingScope === "date"
          ? "Perubahan hanya berlaku pada tanggal yang dipilih; jadwal mingguan tetap sama."
          : `Perubahan berlaku setiap ${dayNames[state.selectedDay].toLowerCase()}, kecuali tanggal yang memiliki pengaturan khusus.`;
        $$("[name='settingScope']").forEach(radio => { radio.checked = radio.value === state.settingScope; });
        $$(".setting-mode").forEach(button => {
          const active = button.dataset.settingMode === state.settingMode;
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        const tabs = $("#weekdayTabs");
        tabs.replaceChildren();
        dayNames.forEach((name, index) => {
          const button = document.createElement("button");
          const daySettings = state.weeklySettings[index];
          button.className = `weekday-tab${index === state.selectedDay ? " active" : ""}${daySettings.onlineOpen || daySettings.offlineOpen ? " open" : ""}`;
          button.type = "button";
          button.setAttribute("role", "tab");
          button.setAttribute("aria-selected", String(index === state.selectedDay));
          button.innerHTML = `<strong>${shortDays[index]}</strong><span aria-hidden="true"></span>`;
          button.addEventListener("click", () => {
            if (!allowSettingsNavigation()) return;
            state.selectedDay = index;
            state.selectedDate = nextDateForDay(index);
            state.month = new Date(state.selectedDate.getFullYear(), state.selectedDate.getMonth(), 1);
            initializeSettingsDraft();
            renderCalendar();
            renderDaySettings();
            renderSelectedDay();
          });
          tabs.append(button);
        });
        const hoursGrid = $("#hoursGrid");
        hoursGrid.replaceChildren();
        hours.forEach((hour, index) => {
          const button = document.createElement("button");
          button.className = "hour-toggle";
          button.type = "button";
          button.setAttribute("aria-pressed", String(selected[hoursKey][index]));
          button.disabled = !selected[openKey];
          button.innerHTML = `<span>${hour}</span><small>${selected[hoursKey][index] && selected[openKey] ? "Dibuka" : "Ditutup"}</small>`;
          button.addEventListener("click", () => {
            selected[hoursKey][index] = !selected[hoursKey][index];
            state.settingsDirty = true;
            renderDaySettings();
          });
          hoursGrid.append(button);
        });
        $("#settingStatus").textContent = state.settingsDirty ? "Ada perubahan yang belum disimpan." : "";
        $("#saveSettings").textContent = state.settingScope === "date" ? "Simpan tanggal ini" : "Simpan mingguan";
      }

      function nextDateForDay(dayIndex) {
        const candidate = new Date(today);
        let offset = (dayIndex - candidate.getDay() + 7) % 7;
        if (offset === 0 && !appointmentsForDate(candidate).length) offset = 7;
        candidate.setDate(candidate.getDate() + offset);
        return candidate;
      }

      function renderCounselorOptions() {
        const activeCounselors = counselors.filter(counselor => counselor.active);
        [["#assignedCounselor", "Pilih konselor"], ["#rescheduleCounselor", "Pilih konselor"]].forEach(([selector, placeholder]) => {
          const select = $(selector);
          const currentValue = select.value;
          select.replaceChildren();
          const option = document.createElement("option");
          option.value = "";
          option.disabled = true;
          option.selected = true;
          option.textContent = placeholder;
          select.append(option);
          activeCounselors.forEach(counselor => {
            const counselorOption = document.createElement("option");
            counselorOption.value = counselor.id || counselor.name;
            counselorOption.textContent = counselor.name;
            select.append(counselorOption);
          });
          if (activeCounselors.some(counselor => counselor.id === currentValue || counselor.name === currentValue)) select.value = currentValue;
        });
      }

      function renderCounselors() {
        const list = $("#counselorsList");
        list.replaceChildren();
        const activeCount = counselors.filter(counselor => counselor.active).length;
        $("#counselorCount").textContent = `${activeCount} aktif · ${counselors.length - activeCount} tidak aktif`;
        counselors.forEach(counselor => {
          const row = document.createElement("div");
          row.className = "counselor-row";
          const identity = document.createElement("div");
          identity.className = "counselor-identity";
          const name = document.createElement("strong");
          name.textContent = counselor.name;
          const phone = document.createElement("span");
          phone.textContent = `WhatsApp · +${counselor.phone}`;
          identity.append(name, phone);
          const status = document.createElement("span");
          status.className = `counselor-status${counselor.active ? "" : " inactive"}`;
          status.textContent = counselor.mustChangePassword ? "Belum aktivasi awal" : counselor.active ? "Aktif" : "Tidak aktif";
          if (counselor.mustChangePassword) status.classList.add("inactive");
          const toggle = document.createElement("button");
          toggle.className = "counselor-toggle";
          toggle.type = "button";
          toggle.setAttribute("role", "switch");
          toggle.setAttribute("aria-checked", String(counselor.active));
          toggle.setAttribute("aria-label", `${counselor.active ? "Nonaktifkan" : "Aktifkan"} konselor ${counselor.name}`);
          toggle.disabled = counselor.mustChangePassword;
          toggle.innerHTML = '<span class="counselor-toggle-track" aria-hidden="true"></span><span></span>';
          toggle.lastElementChild.textContent = counselor.active ? "Aktif" : "Nonaktif";
          toggle.addEventListener("click", async () => {
            const nextActive = !counselor.active;
            const { error } = await adminContext.client.from("profiles").update({ is_active: nextActive }).eq("id", counselor.id);
            if (error) {
              showToast(`Status konselor gagal diperbarui: ${error.message}`);
              return;
            }
            counselor.active = nextActive;
            renderCounselors();
          });
          row.append(identity, status, toggle);
          list.append(row);
        });
        renderCounselorOptions();
      }

      async function addCounselor(name, rawPhone, email) {
        const normalizedName = name.trim().replace(/\s+/g, " ");
        const digits = rawPhone.replace(/\D/g, "");
        const normalizedPhone = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
        if (counselors.some(counselor => counselor.name.toLocaleLowerCase("id-ID") === normalizedName.toLocaleLowerCase("id-ID"))) {
          $("#counselorFormMessage").textContent = "Nama konselor sudah terdaftar.";
          return;
        }
        if (counselors.some(counselor => counselor.phone === normalizedPhone)) {
          $("#counselorFormMessage").textContent = "Nomor WhatsApp sudah digunakan oleh konselor lain.";
          return;
        }
        $("#counselorFormMessage").textContent = "";
        try {
          const { data, error } = await adminContext.client.functions.invoke("create-counselor", {
            body: { full_name: normalizedName, phone: normalizedPhone, email: email.trim() }
          });
          if (error) throw error;
          counselors.push({ id: data.id, name: normalizedName, phone: normalizedPhone, active: false, mustChangePassword: true });
          $("#addCounselorForm").reset();
          $("#addCounselorForm").hidden = true;
          renderCounselors();
          showTemporaryPassword(data, "konselor");
          try {
            await refreshStaffAccounts();
          } catch (error) {
            $("#counselorFormMessage").textContent = `Akun sudah dibuat, tetapi daftar belum diperbarui: ${error.message}`;
          }
        } catch (error) {
          $("#counselorFormMessage").textContent = `Akun gagal dibuat: ${error.message}. Pastikan fungsi create-counselor telah di-deploy.`;
          return;
        }
      }

      function updateStaffAccountFields() {
        const isCounselor = $("#staffAccountRole").value === "counselor";
        $("#staffAccountPhoneField").hidden = !isCounselor;
        $("#staffAccountPhone").required = isCounselor;
      }

      async function createStaffAccount(account) {
        const message = $("#staffAccountMessage");
        message.textContent = "";
        try {
          const { data, error } = await adminContext.client.functions.invoke("create-staff", {
            body: account
          });
          if (error) throw error;
          $("#staffAccountForm").reset();
          updateStaffAccountFields();
          message.textContent = `Akun ${account.role === "admin" ? "admin" : "konselor"} berhasil dibuat untuk ${data.email}. Pengguna dapat login untuk mengganti kata sandi awal.`;
          showTemporaryPassword(data, account.role);
          if (account.role === "counselor") {
            counselors.push({
              id: data.id,
              name: account.full_name,
              phone: data.phone || "",
              active: false,
              mustChangePassword: true
            });
            renderCounselors();
          }
          try {
            await refreshStaffAccounts();
          } catch (error) {
            message.textContent += ` Daftar akun gagal diperbarui: ${error.message}`;
          }
        } catch (error) {
          message.textContent = `Akun gagal dibuat: ${error.message}. Pastikan fungsi create-staff telah di-deploy.`;
        }
      }

      function showTemporaryPassword(account, role) {
        const hasPassword = typeof account.temporary_password === "string" && account.temporary_password.length > 0;
        $("#temporaryPasswordNote").textContent = hasPassword
          ? `Akun ${role} ${account.email} berhasil dibuat. Bagikan kata sandi sementara ini dengan aman.`
          : `Akun ${role} ${account.email} dibuat, tetapi kata sandi sementara tidak diterima. Jangan coba buat ulang sebelum memeriksa akun.`;
        $("#temporaryPasswordValue").textContent = hasPassword ? account.temporary_password : "Tidak tersedia";
        $("#copyTemporaryPassword").hidden = !hasPassword;
        $("#temporaryPasswordPanel").hidden = false;
      }

      function hasUnsharedTemporaryPassword() {
        return !$("#temporaryPasswordPanel").hidden && !$("#copyTemporaryPassword").hidden;
      }

      async function refreshStaffAccounts() {
        if (adminContext.profile.role !== "superadmin") return;
        const [profilesResult, registryResult] = await Promise.all([
          adminContext.client
            .from("profiles")
            .select("id,full_name,role,is_active,must_change_password")
            .in("role", ["admin", "counselor"])
            .order("full_name"),
          adminContext.client.from("staff_account_registry").select("user_id,account_email")
        ]);
        if (profilesResult.error) throw profilesResult.error;
        if (registryResult.error) throw registryResult.error;
        const staffEmails = new Map(registryResult.data.map(account => [account.user_id, account.account_email]));
        state.staffAccounts = profilesResult.data.map(profile => ({
          ...profile,
          account_email: staffEmails.get(profile.id) || ""
        }));
        renderStaffAccounts();
      }

      function renderStaffAccounts() {
        const list = $("#staffAccounts");
        if (!list) return;
        list.replaceChildren();
        if (!state.staffAccounts.length) {
          const empty = document.createElement("p");
          empty.className = "counselor-form-message";
          empty.textContent = "Belum ada akun admin atau konselor.";
          list.append(empty);
          return;
        }
        state.staffAccounts.forEach(account => {
          const row = document.createElement("div");
          row.className = "staff-account-row";
          const identity = document.createElement("div");
          identity.className = "staff-account-identity";
          const name = document.createElement("strong");
          name.textContent = account.full_name || "Tanpa nama";
          const email = document.createElement("span");
          email.textContent = account.account_email || "Email tidak tercatat";
          identity.append(name, email);
          const meta = document.createElement("div");
          meta.className = "staff-account-meta";
          [
            { label: account.role === "admin" ? "Admin" : "Konselor", className: "" },
            {
              label: account.must_change_password ? "Belum aktivasi awal" : account.is_active ? "Aktif" : "Nonaktif",
              className: account.must_change_password ? "pending" : account.is_active ? "active" : ""
            },
            { label: account.must_change_password ? "Belum ganti kata sandi" : "Kata sandi diperbarui", className: account.must_change_password ? "pending" : "active" }
          ].forEach(({ label, className }) => {
            const badge = document.createElement("span");
            badge.className = `staff-account-badge ${className}`.trim();
            badge.textContent = label;
            meta.append(badge);
          });
          row.append(identity, meta);
          list.append(row);
        });
      }

      function renderApplications() {
        const waiting = sampleAppointments.filter(appointment => appointment.status === "Menunggu");
        $("#queueCount").textContent = `${waiting.length} menunggu`;
        $("#pendingNavCount").textContent = String(waiting.length);
        const visible = sampleAppointments.filter(appointment =>
          state.queueFilter === "Semua" || appointment.status === state.queueFilter
        );
        const queue = $("#reviewQueue");
        queue.replaceChildren();
        if (!visible.length) {
          const empty = document.createElement("div");
          empty.className = "review-empty";
          empty.textContent = state.queueFilter === "Terkonfirmasi"
            ? "Belum ada jadwal terkonfirmasi."
            : "Tidak ada pengajuan untuk ditampilkan.";
          queue.append(empty);
        } else {
          visible.forEach(appointment => {
            const button = document.createElement("button");
            button.className = `queue-item${appointment.id === state.selectedApplicationId ? " active" : ""}`;
            button.type = "button";
            button.setAttribute("aria-pressed", String(appointment.id === state.selectedApplicationId));
            const badgeClass = appointment.status === "Terlaksana" ? "done" : appointment.status === "Terkonfirmasi" ? "confirmed" : "";
            button.innerHTML = `<span><strong>${escapeHtml(appointment.name)}</strong><span>${escapeHtml(appointment.id)} · ${escapeHtml(formatDate(appointment.date, { day: "numeric", month: "short" }))} · ${escapeHtml(appointment.time)}</span></span><span class="status-badge ${badgeClass}">${escapeHtml(appointment.status)}</span>`;
            button.addEventListener("click", () => {
              state.selectedApplicationId = appointment.id;
              renderApplications();
            });
            queue.append(button);
          });
        }
        const selected = sampleAppointments.find(appointment => appointment.id === state.selectedApplicationId) || visible[0];
        if (!selected) {
          $("#reviewDetail").innerHTML = '<div class="review-empty">Pilih pengajuan untuk melihat detail.</div>';
          return;
        }
        state.selectedApplicationId = selected.id;
        const isWaiting = selected.status === "Menunggu";
        const statusClass = selected.status === "Terkonfirmasi" ? "confirmed" : selected.status === "Terlaksana" ? "done" : "";
        const safe = value => escapeHtml(value);
        $("#reviewDetail").innerHTML = `
          <div class="review-head">
            <div><h2>Detail pengajuan</h2><p>${safe(selected.id)} · Jadwal pilihan ${safe(formatDate(selected.date, { day: "numeric", month: "long", year: "numeric" }))}</p></div>
            <span class="status-badge ${statusClass}">${safe(selected.status)}</span>
          </div>
          <h3 class="review-section-title">Identitas mahasiswa</h3>
          <div class="review-fields">
            <div class="review-field"><span>Nama</span><strong>${safe(selected.name)}</strong></div>
            <div class="review-field"><span>NIM</span><strong>${safe(selected.nim)}</strong></div>
            <div class="review-field"><span>Program studi</span><strong>${safe(selected.program)}</strong></div>
            <div class="review-field"><span>Fakultas</span><strong>${safe(selected.faculty)}</strong></div>
            <div class="review-field"><span>Kontak</span><strong>${safe(selected.phone)}</strong></div>
            <div class="review-field"><span>Tanggal lahir</span><strong>${safe(selected.birthDate)}</strong></div>
            <div class="review-field"><span>Suku bangsa</span><strong>${safe(selected.ethnicity)}</strong></div>
            <div class="review-field"><span>Agama</span><strong>${safe(selected.religion)}</strong></div>
            <div class="review-field"><span>Asal kota</span><strong>${safe(selected.city)}</strong></div>
            <div class="review-field wide"><span>Alamat tinggal</span><strong>${safe(selected.address)}</strong></div>
            <div class="review-field"><span>Anak ke-</span><strong>${safe(selected.birthOrder)}</strong></div>
            <div class="review-field"><span>Jumlah saudara kandung</span><strong>${safe(selected.siblings)}</strong></div>
          </div>
          <h3 class="review-section-title">Kebutuhan konseling</h3>
          <div class="review-fields">
            <div class="review-field"><span>Kategori</span><strong>${safe(selected.category)}</strong></div>
            <div class="review-field"><span>Jenis sesi</span><strong>${safe(selected.mode)}</strong></div>
            <div class="review-field wide"><span>Masalah</span><strong>${safe(selected.issue || selected.category)} · ${safe(selected.reason)}</strong></div>
            <div class="review-field wide"><span>Alasan melakukan konseling</span><strong>${safe(selected.reason)}</strong></div>
            <div class="review-field wide"><span>Detail masalah</span><strong>${safe(selected.details)}</strong></div>
          </div>
          <p class="review-privacy">Informasi pengajuan bersifat rahasia. Gunakan hanya untuk keperluan verifikasi dan pelayanan konseling; jangan cantumkan detail masalah atau data demografis dalam pesan WhatsApp.</p>
          ${selected.status === "Terkonfirmasi" ? `<h3 class="review-section-title">Jadwal konseling</h3><div class="review-fields"><div class="review-field"><span>Tanggal & waktu</span><strong>${safe(formatDate(selected.date))} · ${safe(selected.time)}</strong></div><div class="review-field"><span>Konselor</span><strong>${safe(selected.counselor || "Belum ditetapkan")}</strong></div><div class="review-field wide"><span>${selected.mode === "Online" ? "Link sesi online" : "Lokasi"}</span><strong>${safe(selected.location)}</strong></div><div class="review-field"><span>Kontak konselor</span><strong>${safe(selected.counselorPhone ? `+${selected.counselorPhone}` : "Belum tersedia")}</strong></div></div>${selected.scheduleChanged ? '<div class="schedule-updated">Jadwal ini telah diubah. Kirim informasi terbaru kepada mahasiswa dan konselor menggunakan tombol WhatsApp di bawah.</div>' : ""}<div class="reminder-panel"><h3>Reminder & informasi sesi</h3><p>${selected.scheduleChanged ? "Pesan memuat jadwal terbaru serta tautan Zoom atau ruangan sesi." : "Pengingat memuat detail jadwal dan tautan/ruangan yang dapat dibagikan kembali saat hari pelaksanaan."} Detail masalah konseling tidak disertakan.</p><div class="reminder-actions"><button class="whatsapp-button" id="remindStudent" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.7a8.5 8.5 0 1 1 16.3-3.8Z"/><path d="M8 8.5c.5 2.7 2.2 4.4 4.9 5l1.2-1.2 2 .9c-.2 1.2-1.1 1.9-2.3 1.8-3.8-.5-6.9-3.6-7.4-7.4-.1-1.2.6-2.1 1.8-2.3l.9 2L8 8.5Z"/></svg>${selected.reminderOpened.student ? "Kirim reminder mahasiswa lagi" : "Reminder mahasiswa"}</button><button class="whatsapp-button" id="remindCounselor" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.7a8.5 8.5 0 1 1 16.3-3.8Z"/><path d="M8 8.5c.5 2.7 2.2 4.4 4.9 5l1.2-1.2 2 .9c-.2 1.2-1.1 1.9-2.3 1.8-3.8-.5-6.9-3.6-7.4-7.4-.1-1.2.6-2.1 1.8-2.3l.9 2L8 8.5Z"/></svg>${selected.reminderOpened.counselor ? "Kirim reminder konselor lagi" : "Reminder konselor"}</button></div><div class="reminder-feedback" id="reminderFeedback" aria-live="polite">${safe(selected.reminderFeedback || "")}</div></div>` : ""}
          <div class="review-actions">${isWaiting ? '<button class="danger-button" id="rejectApplication" type="button">Tolak pengajuan</button><button class="primary-button" id="approveApplication" type="button">Konfirmasi & tugaskan konselor</button>' : selected.status === "Terkonfirmasi" ? '<button class="primary-button" id="editSchedule" type="button">Ubah jadwal / konselor</button>' : ""}</div>
        `;
        $("#approveApplication")?.addEventListener("click", () => openApproval(selected));
        $("#rejectApplication")?.addEventListener("click", () => rejectApplication(selected));
        $("#editSchedule")?.addEventListener("click", () => openReschedule(selected));
        $("#remindStudent")?.addEventListener("click", () => openReminder(selected, "student"));
        $("#remindCounselor")?.addEventListener("click", () => openReminder(selected, "counselor"));
      }

      function counselingSessionEntries() {
        return counselingReports.flatMap(report => {
          const student = sampleAppointments.find(appointment => appointment.nim === report.nim);
          if (!student) return [];
          return [...report.sessions]
            .sort((left, right) => left.date - right.date)
            .map((session, index) => ({
              report,
              student,
              session,
              sessionNumber: index + 1,
              key: `${report.nim}:${report.sessions.indexOf(session)}`
            }));
        });
      }

      function sessionReportHtml(entry) {
        const { report, student, session, sessionNumber } = entry;
        const fields = [
          ["Nama Mahasiswa", student.name],
          ["NIM Mahasiswa", report.nim],
          ["Nama Konselor", session.counselor],
          ["Waktu Pelaksanaan Konseling", `${formatDate(session.date)} · ${session.time}`],
          ["Pertemuan ke", String(sessionNumber)],
          ["Diagnosis Kasus", session.diagnosis],
          ["Deskripsi Kasus", session.description],
          ["Hasil Intervensi", session.intervention],
          ["Kesimpulan Hasil", session.conclusion],
          ["Rekomendasi", session.recommendation]
        ];
        const rows = fields.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>:</td><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`).join("");
        return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Laporan Konseling - ${escapeHtml(student.name)} - Sesi ${sessionNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.45; }
    header { min-height: 23mm; display: flex; align-items: flex-start; justify-content: space-between; gap: 12mm; }
    header img { width: 42mm; height: auto; }
    header div { max-width: 62mm; font-size: 9pt; font-weight: 700; text-align: right; }
    h1 { margin: 3mm 0 10mm; font-size: 12pt; text-align: center; text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { padding: 2.2mm 0; vertical-align: top; text-align: left; font-weight: 400; }
    th { width: 47mm; }
    td:nth-child(2) { width: 5mm; }
    tr:nth-child(n+6) th, tr:nth-child(n+6) td { padding-top: 7mm; }
    @media screen { body { max-width: 210mm; min-height: 297mm; margin: 15mm auto; padding: 18mm 20mm; box-shadow: 0 2px 18px #0002; } }
  </style>
</head>
<body>
  <header><img src="${telkomLogoDataUri}" alt="Telkom University"><div>Direktorat Kemahasiswaan,<br>Karier dan Alumni</div></header>
  <h1>Laporan Pelaksanaan Konseling Universitas Telkom</h1>
  <table><tbody>${rows}</tbody></table>
</body>
</html>`;
      }

      function downloadSessionReport(entry) {
        const blob = new Blob([sessionReportHtml(entry)], { type: "text/html;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = entry.student.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
        link.href = objectUrl;
        link.download = `Laporan_Konseling_${safeName}_${entry.report.nim}_Sesi_${entry.sessionNumber}.html`;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }

      function printSessionReport(entry) {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          showToast("Jendela cetak diblokir browser. Izinkan pop-up untuk mencetak atau menyimpan PDF.");
          return;
        }
        printWindow.document.open();
        printWindow.document.write(sessionReportHtml(entry));
        printWindow.document.close();
        window.setTimeout(() => {
          if (printWindow.closed) return;
          printWindow.focus();
          printWindow.print();
        }, 500);
      }

      function renderCounselingReports() {
        const query = $("#reportSearch").value.trim().toLocaleLowerCase("id-ID");
        const students = counselingReports
          .map(report => ({ report, student: sampleAppointments.find(appointment => appointment.nim === report.nim) }))
          .filter(({ report, student }) => student && (
            !query ||
            student.name.toLocaleLowerCase("id-ID").includes(query) ||
            report.nim.includes(query)
          ));
        const list = $("#reportStudentList");
        list.replaceChildren();
        if (!students.length) {
          const empty = document.createElement("div");
          empty.className = "review-empty";
          empty.textContent = "Tidak ada mahasiswa dengan riwayat konseling yang cocok.";
          list.append(empty);
          $("#reportDetail").innerHTML = '<div class="review-empty">Tidak ada riwayat untuk ditampilkan.</div>';
          return;
        }
        if (!students.some(({ report }) => report.nim === state.selectedReportNim)) {
          state.selectedReportNim = students[0].report.nim;
        }
        students.forEach(({ report, student }) => {
          const button = document.createElement("button");
          button.className = `report-student${report.nim === state.selectedReportNim ? " active" : ""}`;
          button.type = "button";
          button.setAttribute("aria-pressed", String(report.nim === state.selectedReportNim));
          const name = document.createElement("strong");
          name.textContent = student.name;
          const details = document.createElement("span");
          details.textContent = `${report.nim} · ${report.sessions.length} ${report.sessions.length === 1 ? "sesi" : "sesi"} · ${student.faculty}`;
          button.append(name, details);
          button.addEventListener("click", () => {
            state.selectedReportNim = report.nim;
            renderCounselingReports();
          });
          list.append(button);
        });
        renderCounselingReportDetail(students.find(({ report }) => report.nim === state.selectedReportNim));
      }

      function renderCounselingReportDetail(entry) {
        const detail = $("#reportDetail");
        if (!entry) {
          detail.innerHTML = '<div class="review-empty">Pilih mahasiswa untuk melihat riwayat konseling.</div>';
          return;
        }
        const { report, student } = entry;
        detail.replaceChildren();
        const heading = document.createElement("div");
        heading.className = "report-student-heading";
        const identity = document.createElement("div");
        const name = document.createElement("h2");
        name.textContent = student.name;
        const metadata = document.createElement("p");
        metadata.textContent = `${report.nim} · ${student.program} · ${student.faculty}`;
        identity.append(name, metadata);
        const count = document.createElement("span");
        count.className = "report-session-count";
        count.textContent = `${report.sessions.length} ${report.sessions.length === 1 ? "sesi" : "sesi"} tercatat`;
        heading.append(identity, count);
        detail.append(heading);

        [...report.sessions]
          .sort((left, right) => right.date - left.date)
          .forEach((session, index) => {
            const card = document.createElement("article");
            card.className = "counseling-session";
            const sessionHeading = document.createElement("div");
            sessionHeading.className = "counseling-session-head";
            const title = document.createElement("strong");
            title.textContent = `Sesi ${report.sessions.length - index}`;
            const date = document.createElement("span");
            date.textContent = formatDate(session.date);
            sessionHeading.append(title, date);
            const sessionMeta = document.createElement("div");
            sessionMeta.className = "counseling-session-meta";
            [session.counselor, session.category, session.mode].forEach(value => {
              const tag = document.createElement("span");
              tag.textContent = value;
              sessionMeta.append(tag);
            });
            const summaryHeading = document.createElement("h3");
            summaryHeading.textContent = "Catatan konselor";
            const summary = document.createElement("p");
            summary.textContent = session.description;
            const followUpHeading = document.createElement("h3");
            followUpHeading.textContent = "Hasil Intervensi";
            const intervention = document.createElement("p");
            intervention.textContent = session.intervention;
            const conclusionHeading = document.createElement("h3");
            conclusionHeading.textContent = "Kesimpulan Hasil";
            const conclusion = document.createElement("p");
            conclusion.textContent = session.conclusion;
            const recommendationHeading = document.createElement("h3");
            recommendationHeading.textContent = "Rekomendasi";
            const followUp = document.createElement("p");
            followUp.textContent = session.recommendation;
            const diagnosisHeading = document.createElement("h3");
            diagnosisHeading.textContent = "Diagnosis Kasus";
            const diagnosis = document.createElement("p");
            diagnosis.textContent = session.diagnosis;
            summaryHeading.textContent = "Deskripsi Kasus";
            const actions = document.createElement("div");
            actions.className = "counseling-session-actions";
            const downloadButton = document.createElement("button");
            downloadButton.className = "report-action";
            downloadButton.type = "button";
            downloadButton.textContent = "Unduh laporan (.html)";
            downloadButton.addEventListener("click", () => downloadSessionReport({ report, student, session, sessionNumber: report.sessions.length - index }));
            const printButton = document.createElement("button");
            printButton.className = "report-action";
            printButton.type = "button";
            printButton.textContent = "Cetak / Simpan PDF";
            printButton.addEventListener("click", () => printSessionReport({ report, student, session, sessionNumber: report.sessions.length - index }));
            actions.append(downloadButton, printButton);
            card.append(sessionHeading, sessionMeta, diagnosisHeading, diagnosis, summaryHeading, summary, followUpHeading, intervention, conclusionHeading, conclusion, recommendationHeading, followUp, actions);
            detail.append(card);
          });
        const confidentiality = document.createElement("p");
        confidentiality.className = "report-confidential";
        confidentiality.textContent = "Laporan konseling bersifat rahasia dan hanya dapat diakses oleh pihak berwenang. Data laporan berasal dari penyimpanan konseling.";
        detail.append(confidentiality);
      }

      function openApproval(application) {
        state.approvingApplicationId = application.id;
        $("#approvalDate").min = dateKey(today);
        $("#approvalDate").value = dateKey(application.date);
        $("#approvalMessage").textContent = "";
        renderApprovalTimes(application);
        $("#approvalSummary").textContent = `${application.name} · ${application.id} · Jadwal pilihan mahasiswa: ${formatDate(application.date)} · ${application.time} · ${application.mode}`;
        $("#assignedCounselor").value = "";
        const location = $("#sessionLocation");
        const label = $("#locationField label");
        if (application.mode === "Online") {
          label.textContent = "Link Zoom";
          location.type = "url";
          location.placeholder = "https://zoom.us/j/...";
          location.value = "";
        } else {
          label.textContent = "Lokasi sesi";
          location.type = "text";
          location.placeholder = "Masukkan lokasi sesi";
          location.value = "Ruang Konseling Kemahasiswaan";
        }
        $("#approvalBackdrop").hidden = false;
        $("#approvalDate").focus();
      }

      function counselorConflict(date, time, counselorName, excludeId) {
        return sampleAppointments.find(appointment =>
          appointment.id !== excludeId &&
          appointment.status === "Terkonfirmasi" &&
          appointment.counselor === counselorName &&
          isSameDate(appointment.date, date) &&
          appointment.time === time
        );
      }

      function cloneSettings(settings) {
        return {
          onlineOpen: settings.onlineOpen,
          onlineHours: [...settings.onlineHours],
          offlineOpen: settings.offlineOpen,
          offlineHours: [...settings.offlineHours]
        };
      }

      function weeklySettingsForDate(date) {
        return state.weeklySettings[date.getDay()];
      }

      function settingsForDate(date) {
        return state.dateOverrides[dateKey(date)] || weeklySettingsForDate(date);
      }

      function initializeSettingsDraft() {
        const source = state.settingScope === "date"
          ? settingsForDate(state.selectedDate)
          : weeklySettingsForDate(state.selectedDate);
        state.settingsDraft = cloneSettings(source);
        state.settingsDirty = false;
      }

      function allowSettingsNavigation() {
        return !state.settingsDirty || window.confirm("Perubahan jam belum disimpan. Buang perubahan tersebut?");
      }

      function modeSettings(settings, mode) {
        const prefix = mode === "Online" ? "online" : "offline";
        return { openKey: `${prefix}Open`, hoursKey: `${prefix}Hours` };
      }

      function openedServiceHours(date, mode, excludeId = null) {
        const settings = settingsForDate(date);
        const { openKey, hoursKey } = modeSettings(settings, mode);
        if (!settings[openKey]) return [];
        return hours.filter((time, index) => {
          if (!settings[hoursKey][index]) return false;
          const occupied = sampleAppointments.some(appointment =>
            appointment.id !== excludeId &&
            (appointment.status === "Menunggu" || appointment.status === "Terkonfirmasi") &&
            appointment.mode === mode &&
            isSameDate(appointment.date, date) &&
            appointment.time === time
          );
          return !occupied;
        });
      }

      function renderApprovalTimes(application) {
        const dateValue = $("#approvalDate").value;
        const select = $("#approvalTime");
        const previousValue = select.value;
        select.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.textContent = "Pilih jam";
        select.append(placeholder);
        if (!dateValue) return;
        const [year, month, day] = dateValue.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const availableTimes = openedServiceHours(date, application.mode, application.id);
        availableTimes.forEach(time => {
          const option = document.createElement("option");
          option.value = time;
          option.textContent = time;
          select.append(option);
        });
        if (availableTimes.includes(previousValue)) {
          select.value = previousValue;
        } else if (availableTimes.includes(application.time)) {
          select.value = application.time;
        } else {
          select.value = "";
        }
        if (!availableTimes.length) {
          $("#approvalMessage").textContent = `Jam layanan ${dayNames[date.getDay()]} sedang tutup atau belum memiliki jam yang dibuka. Pilih tanggal lain atau atur jam layanan.`;
        } else {
          $("#approvalMessage").textContent = "";
        }
      }

      function closeApproval() {
        $("#approvalBackdrop").hidden = true;
        state.approvingApplicationId = null;
      }

      function openReschedule(application) {
        state.editingApplicationId = application.id;
        $("#rescheduleSummary").textContent = `${application.name} · ${application.id} · Saat ini: ${formatDate(application.date)} · ${application.time} · ${application.counselor}`;
        $("#rescheduleDate").min = dateKey(today);
        $("#rescheduleDate").value = dateKey(application.date);
        $("#rescheduleCounselor").value = application.counselorId || application.counselor;
        $("#rescheduleMessage").textContent = "";
        const location = $("#rescheduleLocation");
        const label = $("#rescheduleLocationField label");
        if (application.mode === "Online") {
          label.textContent = "Link Zoom baru";
          location.type = "url";
          location.placeholder = "https://zoom.us/j/...";
        } else {
          label.textContent = "Ruangan sesi";
          location.type = "text";
          location.placeholder = "Masukkan ruangan sesi";
        }
        location.value = application.location;
        renderRescheduleTimes(application);
        $("#rescheduleBackdrop").hidden = false;
        $("#rescheduleDate").focus();
      }

      function renderRescheduleTimes(application) {
        const dateValue = $("#rescheduleDate").value;
        const select = $("#rescheduleTime");
        const previousValue = select.value;
        select.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.textContent = "Pilih jam";
        select.append(placeholder);
        if (!dateValue) return;
        const parts = dateValue.split("-").map(Number);
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        const dailySettings = settingsForDate(date);
        const availableTimes = openedServiceHours(date, application.mode, application.id);
        availableTimes.forEach(time => {
          const option = document.createElement("option");
          option.value = time;
          option.textContent = time;
          select.append(option);
        });
        if (availableTimes.includes(previousValue)) {
          select.value = previousValue;
        } else if (availableTimes.includes(application.time)) {
          select.value = application.time;
        } else {
          select.value = "";
        }
        if (!dailySettings[modeSettings(dailySettings, application.mode).openKey]) {
          $("#rescheduleMessage").textContent = `Jam layanan ${dayNames[date.getDay()]} sedang ditutup. Pilih tanggal hari layanan lain.`;
        } else if (!availableTimes.length) {
          $("#rescheduleMessage").textContent = "Tidak ada jam dibuka pada hari tersebut. Atur jam layanan atau pilih tanggal lain.";
        } else {
          $("#rescheduleMessage").textContent = "";
        }
      }

      function closeReschedule() {
        $("#rescheduleBackdrop").hidden = true;
        state.editingApplicationId = null;
      }

      function renderManualSessionTimes() {
        const dateValue = $("#manualDate").value;
        const mode = $("#manualMode").value;
        const select = $("#manualTime");
        const previousValue = select.value;
        select.replaceChildren();
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.textContent = "Pilih jam";
        select.append(placeholder);
        if (!dateValue) return;
        const date = parseDate(dateValue);
        const available = openedServiceHours(date, mode);
        available.forEach(time => {
          const option = document.createElement("option");
          option.value = time;
          option.textContent = time;
          select.append(option);
        });
        select.value = available.includes(previousValue) ? previousValue : "";
        $("#manualSessionMessage").textContent = available.length
          ? ""
          : `Tidak ada slot ${mode} yang tersedia pada tanggal ini. Periksa jam layanan atau pilih tanggal lain.`;
      }

      function openAddSession() {
        if (!allowSettingsNavigation()) return;
        const studentSelect = $("#manualStudent");
        const counselorSelect = $("#manualCounselor");
        studentSelect.replaceChildren(new Option("Pilih mahasiswa", ""));
        newScheduleStudents.forEach(student => studentSelect.add(new Option(
          `${student.full_name || "Mahasiswa"}${student.nim ? ` · ${student.nim}` : ""}`,
          student.id
        )));
        counselorSelect.replaceChildren(new Option("Pilih konselor aktif", ""));
        counselors.filter(counselor => counselor.active).forEach(counselor => {
          counselorSelect.add(new Option(counselor.name, counselor.id));
        });
        $("#manualDate").min = dateKey(today);
        $("#manualDate").value = dateKey(state.selectedDate);
        $("#manualMode").value = "Online";
        $("#manualSessionMessage").textContent = "";
        updateManualLocationField();
        renderManualSessionTimes();
        $("#addSessionBackdrop").hidden = false;
        $("#manualStudent").focus();
      }

      function updateManualLocationField() {
        const online = $("#manualMode").value === "Online";
        const input = $("#manualLocation");
        $("#manualLocationField label").textContent = online ? "Link Zoom" : "Ruangan";
        input.type = online ? "url" : "text";
        input.placeholder = online ? "https://..." : "Contoh: Ruang Konseling A-204";
      }

      function closeAddSession() {
        $("#addSessionBackdrop").hidden = true;
        $("#manualSessionForm").reset();
        $("#manualSessionMessage").textContent = "";
      }

      async function createManualSession(event) {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const student = newScheduleStudents.find(item => item.id === $("#manualStudent").value);
        const counselor = counselors.find(item => item.id === $("#manualCounselor").value && item.active);
        if (!student || !counselor) {
          $("#manualSessionMessage").textContent = "Pilih mahasiswa dan konselor yang aktif.";
          return;
        }
        const date = parseDate($("#manualDate").value);
        const mode = $("#manualMode").value;
        const time = $("#manualTime").value;
        if (date < today || !openedServiceHours(date, mode).includes(time)) {
          $("#manualSessionMessage").textContent = `Slot ${mode} pada tanggal dan jam tersebut tidak tersedia.`;
          return;
        }
        if (counselorConflict(date, time, counselor.name, null)) {
          $("#manualSessionMessage").textContent = "Konselor sudah memiliki sesi pada tanggal dan jam itu.";
          return;
        }
        const times = window.counselingBackend.normalizeTime(time);
        const { error } = await adminContext.client.from("appointments").insert({
          student_id: student.id,
          counselor_id: counselor.id,
          requested_date: dateKey(date),
          requested_start_time: times.start_time,
          requested_end_time: times.end_time,
          scheduled_date: dateKey(date),
          ...times,
          mode,
          status: "confirmed",
          category: $("#manualCategory").value,
          issue_summary: $("#manualIssue").value.trim(),
          reason: $("#manualReason").value.trim(),
          issue_details: $("#manualDetails").value.trim(),
          location: $("#manualLocation").value.trim()
        });
        if (error) {
          $("#manualSessionMessage").textContent = `Sesi gagal dibuat: ${error.message}`;
          return;
        }
        state.selectedDate = date;
        state.selectedDay = date.getDay();
        state.month = new Date(date.getFullYear(), date.getMonth(), 1);
        await loadAdminData(adminContext);
        render();
        closeAddSession();
        showToast("Sesi konseling berhasil ditambahkan dan dikonfirmasi.");
      }

      async function openReminder(application, recipient) {
        const phone = recipient === "student"
          ? application.phone
          : application.counselorPhone || counselors.find(item => item.name === application.counselor)?.phone;
        const normalizedPhone = String(phone || "").replace(/\D/g, "").replace(/^0/, "62");
        if (!normalizedPhone || normalizedPhone.length < 10) {
          showToast(`Nomor WhatsApp ${recipient === "student" ? "mahasiswa" : "konselor"} belum tersedia.`);
          return;
        }
        const scheduleLabel = `${formatDate(application.date)} pukul ${application.time}`;
        const locationLabel = application.mode === "Online" ? "Link Zoom" : "Ruangan";
        const updatePrefix = application.scheduleChanged ? "PEMBARUAN JADWAL KONSELING" : "REMINDER SESI KONSELING";
        const message = recipient === "student"
          ? `Halo ${application.name}, ${updatePrefix} Telkom University. Sesi Anda bersama ${application.counselor} dijadwalkan ${scheduleLabel}. ${locationLabel}: ${application.location}. Jenis sesi: ${application.mode}. Mohon konfirmasi kehadiran.`
          : `Halo ${application.counselor}, ${updatePrefix} Telkom University. Sesi bersama mahasiswa ${application.name} (NIM ${application.nim}) dijadwalkan ${scheduleLabel}. Jenis sesi: ${application.mode}. ${locationLabel}: ${application.location}. Mohon konfirmasi ketersediaan Anda.`;
        const whatsappUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        application.reminderOpened[recipient] = true;
        const reminderField = recipient === "student" ? "reminder_student_opened" : "reminder_counselor_opened";
        const { error } = await adminContext.client.from("appointments").update({ [reminderField]: true }).eq("id", application.dbId);
        if (error) {
          showToast(`WhatsApp terbuka, tetapi status reminder gagal disimpan: ${error.message}`);
          return;
        }
        const recipientLabel = recipient === "student" ? "mahasiswa" : "konselor";
        application.reminderFeedback = `WhatsApp ${recipientLabel} dibuka. Periksa pesan lalu tekan Kirim di WhatsApp.`;
        renderApplications();
      }

      async function rejectApplication(application) {
        if (!window.confirm(`Tolak pengajuan ${application.id} dari ${application.name}?`)) return;
        const { error } = await adminContext.client.from("appointments").update({ status: "rejected" }).eq("id", application.dbId);
        if (error) {
          showToast(`Pengajuan gagal ditolak: ${error.message}`);
          return;
        }
        application.status = "Ditolak";
        renderApplications();
        renderCalendar();
        renderSelectedDay();
        showToast(`Pengajuan ${application.id} ditolak.`);
      }

      function switchView(view) {
        const viewDetails = {
          overview: ["overviewView", "Dashboard eksekutif"],
          schedule: ["scheduleView", "Jadwal & jam layanan"],
          applications: ["applicationsView", "Pengajuan masuk"],
          counselors: ["counselorsView", "Bagian konselor"],
          reports: ["reportsView", "Laporan Konseling"]
        };
        state.view = view;
        Object.entries(viewDetails).forEach(([key, [id]]) => { $(`#${id}`).hidden = key !== view; });
        $("#breadcrumbCurrent").textContent = viewDetails[view][1];
        $$(".nav-button[data-view]").forEach(button => {
          const active = button.dataset.view === view;
          button.classList.toggle("active", active);
          if (active) button.setAttribute("aria-current", "page");
          else button.removeAttribute("aria-current");
        });
      }

      async function saveSettings() {
        const selected = cloneSettings(state.settingsDraft);
        const openSlots = selected.onlineHours.map((isOpen, index) => isOpen || selected.offlineHours[index]);
        const commonSettings = {
          online_is_open: selected.onlineOpen,
          online_open_slots: selected.onlineHours,
          offline_is_open: selected.offlineOpen,
          offline_open_slots: selected.offlineHours
        };
        const request = state.settingScope === "date"
          ? adminContext.client.from("service_date_overrides").upsert({
            available_date: dateKey(state.selectedDate),
            ...commonSettings
          }, { onConflict: "available_date" })
          : adminContext.client.from("service_hours").upsert({
            weekday: state.selectedDay,
            is_open: selected.onlineOpen || selected.offlineOpen,
            open_slots: openSlots,
            ...commonSettings
          }, { onConflict: "weekday" });
        const { error } = await request;
        if (error) {
          showToast(`Pengaturan jam gagal disimpan: ${error.message}`);
          return;
        }
        if (state.settingScope === "date") {
          state.dateOverrides[dateKey(state.selectedDate)] = selected;
        } else {
          state.weeklySettings[state.selectedDay] = selected;
        }
        state.settingsDraft = selected;
        state.settingsDirty = false;
        $("#settingStatus").textContent = state.settingScope === "date"
          ? `Tersimpan · ${formatDate(state.selectedDate)}`
          : `Tersimpan · setiap ${dayNames[state.selectedDay]}`;
        showToast(state.settingScope === "date"
          ? `Pengaturan tanggal ${formatDate(state.selectedDate)} tersimpan.`
          : `Pengaturan mingguan hari ${dayNames[state.selectedDay]} tersimpan.`);
        renderCalendar();
        renderSelectedDay();
      }

      function showToast(message) {
        $("#toastMessage").textContent = message;
        $("#toast").classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => $("#toast").classList.remove("show"), 3200);
      }

      function render() {
        renderOverview();
        renderLiveOverview();
        renderCalendar();
        renderDaySettings();
        renderSelectedDay();
        state.selectedApplicationId = sampleAppointments.find(appointment => appointment.status === "Menunggu")?.id || sampleAppointments[0]?.id || null;
        renderApplications();
        renderCounselingReports();
        renderCounselors();
        renderStaffAccounts();
      }

      $$("[data-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
      $$("[data-queue-filter]").forEach(button => button.addEventListener("click", () => {
        state.queueFilter = button.dataset.queueFilter;
        $$(".queue-filter").forEach(filter => {
          const active = filter === button;
          filter.classList.toggle("active", active);
          filter.setAttribute("aria-pressed", String(active));
        });
        renderApplications();
      }));
      $("#reportSearch").addEventListener("input", renderCounselingReports);
      $("#showAddCounselor").addEventListener("click", () => {
        $("#counselorFormMessage").textContent = "";
        $("#addCounselorForm").hidden = false;
        $("#newCounselorName").focus();
      });
      $("#cancelAddCounselor").addEventListener("click", () => {
        $("#addCounselorForm").reset();
        $("#addCounselorForm").hidden = true;
        $("#counselorFormMessage").textContent = "";
      });
      $("#addCounselorForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        if (hasUnsharedTemporaryPassword()) {
          showToast("Salin dan tutup kata sandi sementara sebelumnya sebelum membuat akun lain.");
          return;
        }
        await addCounselor($("#newCounselorName").value, $("#newCounselorPhone").value, $("#newCounselorEmail").value);
      });
      $("#staffAccountRole").addEventListener("change", updateStaffAccountFields);
      $("#copyTemporaryPassword").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText($("#temporaryPasswordValue").textContent);
          showToast("Kata sandi sementara disalin. Bagikan melalui jalur yang aman.");
        } catch (error) {
          showToast(`Gagal menyalin kata sandi: ${error.message}`);
        }
      });
      $("#dismissTemporaryPassword").addEventListener("click", () => {
        if (!$("#copyTemporaryPassword").hidden &&
            !window.confirm("Pastikan kata sandi sudah disalin dan dibagikan dengan aman. Kata sandi ini tidak dapat dilihat lagi. Tutup sekarang?")) return;
        $("#temporaryPasswordValue").textContent = "";
        $("#temporaryPasswordPanel").hidden = true;
      });
      $("#staffAccountForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        if (hasUnsharedTemporaryPassword()) {
          showToast("Salin dan tutup kata sandi sementara sebelumnya sebelum membuat akun lain.");
          return;
        }
        await createStaffAccount({
          full_name: $("#staffAccountName").value.trim().replace(/\s+/g, " "),
          email: $("#staffAccountEmail").value.trim(),
          role: $("#staffAccountRole").value,
          phone: $("#staffAccountPhone").value.trim()
        });
      });
      $("#approvalForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const application = sampleAppointments.find(item => item.id === state.approvingApplicationId);
        if (!application || application.status !== "Menunggu") {
          closeApproval();
          renderApplications();
          showToast("Pengajuan ini sudah tidak menunggu konfirmasi.");
          return;
        }
        const assignedCounselor = counselors.find(item => item.id === $("#assignedCounselor").value || item.name === $("#assignedCounselor").value);
        if (!assignedCounselor) {
          $("#approvalMessage").textContent = "Pilih konselor yang aktif.";
          return;
        }
        const [year, month, day] = $("#approvalDate").value.split("-").map(Number);
        const appointmentDate = new Date(year, month - 1, day);
        const appointmentTime = $("#approvalTime").value;
        if (appointmentDate < today) {
          $("#approvalMessage").textContent = "Tanggal konseling tidak boleh berada di masa lalu.";
          return;
        }
        if (!openedServiceHours(appointmentDate, application.mode, application.id).includes(appointmentTime)) {
          $("#approvalMessage").textContent = `Jam ${appointmentTime} tidak dibuka pada hari ${dayNames[appointmentDate.getDay()]}. Pilih jam layanan yang tersedia.`;
          return;
        }
        if (counselorConflict(appointmentDate, appointmentTime, assignedCounselor.name, application.id)) {
          $("#approvalMessage").textContent = "Konselor sudah memiliki sesi pada tanggal dan jam tersebut. Pilih jadwal atau konselor lain.";
          return;
        }
        const scheduleChanged = !isSameDate(application.date, appointmentDate) || application.time !== appointmentTime;
        const times = window.counselingBackend.normalizeTime(appointmentTime);
        const { error } = await adminContext.client.from("appointments").update({
          status: "confirmed",
          counselor_id: assignedCounselor.id,
          scheduled_date: dateKey(appointmentDate),
          ...times,
          location: $("#sessionLocation").value.trim(),
          schedule_changed: scheduleChanged,
          reminder_student_opened: false,
          reminder_counselor_opened: false
        }).eq("id", application.dbId);
        if (error) {
          $("#approvalMessage").textContent = `Gagal menyimpan konfirmasi: ${error.message}`;
          return;
        }
        application.date = appointmentDate;
        application.time = appointmentTime;
        application.status = "Terkonfirmasi";
        application.counselor = assignedCounselor.name;
        application.counselorId = assignedCounselor.id;
        application.counselorPhone = assignedCounselor.phone || "";
        application.location = $("#sessionLocation").value.trim();
        application.scheduleChanged = scheduleChanged;
        application.reminderOpened = { student: false, counselor: false };
        application.reminderFeedback = "";
        state.queueFilter = "Terkonfirmasi";
        $$(".queue-filter").forEach(filter => {
          const active = filter.dataset.queueFilter === state.queueFilter;
          filter.classList.toggle("active", active);
          filter.setAttribute("aria-pressed", String(active));
        });
        closeApproval();
        renderApplications();
        renderCalendar();
        renderSelectedDay();
        $("#approvalForm").reset();
        showToast(`Jadwal ${application.id} terkonfirmasi dan ${application.counselor} telah ditugaskan.`);
      });
      $("#approvalDate").addEventListener("change", () => {
        const application = sampleAppointments.find(item => item.id === state.approvingApplicationId);
        if (application) renderApprovalTimes(application);
      });
      $("#rescheduleDate").addEventListener("change", () => {
        const application = sampleAppointments.find(item => item.id === state.editingApplicationId);
        if (application) renderRescheduleTimes(application);
      });
      $("#rescheduleForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const application = sampleAppointments.find(item => item.id === state.editingApplicationId);
        if (!application || application.status !== "Terkonfirmasi") {
          closeReschedule();
          renderApplications();
          showToast("Jadwal ini tidak lagi tersedia untuk diubah.");
          return;
        }
        const [year, month, day] = $("#rescheduleDate").value.split("-").map(Number);
        const newDate = new Date(year, month - 1, day);
        const newTime = $("#rescheduleTime").value;
        const newCounselor = counselors.find(item => item.id === $("#rescheduleCounselor").value || item.name === $("#rescheduleCounselor").value);
        if (!newCounselor) {
          $("#rescheduleMessage").textContent = "Pilih konselor yang aktif.";
          return;
        }
        if (newDate < today) {
          $("#rescheduleMessage").textContent = "Tanggal baru tidak boleh berada di masa lalu.";
          return;
        }
        if (!openedServiceHours(newDate, application.mode, application.id).includes(newTime)) {
          $("#rescheduleMessage").textContent = `Jam ${newTime} tidak dibuka pada hari ${dayNames[newDate.getDay()]}.`;
          return;
        }
        const conflict = counselorConflict(newDate, newTime, newCounselor.name, application.id);
        if (conflict) {
          $("#rescheduleMessage").textContent = `${newCounselor.name} sudah memiliki sesi ${conflict.id} pada tanggal dan jam tersebut. Pilih waktu atau konselor lain.`;
          return;
        }
        const times = window.counselingBackend.normalizeTime(newTime);
        const { error } = await adminContext.client.from("appointments").update({
          counselor_id: newCounselor.id,
          scheduled_date: dateKey(newDate),
          ...times,
          location: $("#rescheduleLocation").value.trim(),
          schedule_changed: true,
          reminder_student_opened: false,
          reminder_counselor_opened: false
        }).eq("id", application.dbId);
        if (error) {
          $("#rescheduleMessage").textContent = `Perubahan gagal disimpan: ${error.message}`;
          return;
        }
        application.date = newDate;
        application.time = newTime;
        application.counselor = newCounselor.name;
        application.counselorId = newCounselor.id;
        application.counselorPhone = newCounselor.phone || "";
        application.location = $("#rescheduleLocation").value.trim();
        application.scheduleChanged = true;
        application.reminderOpened = { student: false, counselor: false };
        application.reminderFeedback = "";
        closeReschedule();
        renderApplications();
        renderCalendar();
        renderSelectedDay();
        showToast("Perubahan jadwal tersimpan. Kirim pembaruan WhatsApp ke mahasiswa dan konselor.");
      });
      $("#cancelReschedule").addEventListener("click", closeReschedule);
      $("#rescheduleBackdrop").addEventListener("click", event => {
        if (event.target === $("#rescheduleBackdrop")) closeReschedule();
      });
      $("#cancelApproval").addEventListener("click", closeApproval);
      $("#approvalBackdrop").addEventListener("click", event => {
        if (event.target === $("#approvalBackdrop")) closeApproval();
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !$("#approvalBackdrop").hidden) closeApproval();
        if (event.key === "Escape" && !$("#rescheduleBackdrop").hidden) closeReschedule();
        if (event.key === "Escape" && !$("#addSessionBackdrop").hidden) closeAddSession();
      });
      $$("[data-range]").forEach(button => button.addEventListener("click", () => {
        state.range = Number(button.dataset.range);
        $$(".range-button").forEach(rangeButton => {
          const active = rangeButton === button;
          rangeButton.classList.toggle("active", active);
          rangeButton.setAttribute("aria-pressed", String(active));
        });
        renderOverview(state.range);
        renderLiveOverview();
      }));
      $("#previousMonth").addEventListener("click", () => {
        if (!allowSettingsNavigation()) return;
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1);
        if (month < currentMonth) return;
        state.month = month;
        state.selectedDate = new Date(month.getFullYear(), month.getMonth(), 1);
        state.selectedDay = state.selectedDate.getDay();
        initializeSettingsDraft();
        renderCalendar();
        renderSelectedDay();
        renderDaySettings();
      });
      $("#nextMonth").addEventListener("click", () => {
        if (!allowSettingsNavigation()) return;
        state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1);
        state.selectedDate = new Date(state.month.getFullYear(), state.month.getMonth(), 1);
        state.selectedDay = state.selectedDate.getDay();
        initializeSettingsDraft();
        renderCalendar();
        renderSelectedDay();
        renderDaySettings();
      });
      $("#dayOpenToggle").addEventListener("click", () => {
        const selected = state.settingsDraft;
        const { openKey } = modeSettings(selected, state.settingMode);
        selected[openKey] = !selected[openKey];
        state.settingsDirty = true;
        renderDaySettings();
        renderCalendar();
      });
      $$("[name='settingScope']").forEach(radio => radio.addEventListener("change", () => {
        if (!allowSettingsNavigation()) {
          renderDaySettings();
          return;
        }
        state.settingScope = radio.value;
        initializeSettingsDraft();
        renderDaySettings();
        renderCalendar();
      }));
      $$(".setting-mode").forEach(button => button.addEventListener("click", () => {
        state.settingMode = button.dataset.settingMode;
        renderDaySettings();
      }));
      $("#saveSettings").addEventListener("click", saveSettings);
      $("#showAddSession").addEventListener("click", openAddSession);
      $("#manualDate").addEventListener("change", renderManualSessionTimes);
      $("#manualMode").addEventListener("change", () => {
        updateManualLocationField();
        renderManualSessionTimes();
      });
      $("#manualSessionForm").addEventListener("submit", createManualSession);
      $("#cancelAddSession").addEventListener("click", closeAddSession);
      $("#addSessionBackdrop").addEventListener("click", event => {
        if (event.target === $("#addSessionBackdrop")) closeAddSession();
      });
      $("#notificationButton").addEventListener("click", () => showToast("Notifikasi pengajuan layanan."));
      $("#adminLogout").addEventListener("click", async () => {
        try {
          await window.counselingBackend.signOut();
        } catch (error) {
          showToast(`Gagal keluar: ${error.message}`);
        }
      });
      window.counselingBackend.guardPage("admin").then(async context => {
        if (!context) return;
        try {
          adminContext = context;
          $("#signedInAdmin").textContent = context.profile.full_name || context.user.email;
          const isSuperadmin = context.profile.role === "superadmin";
          $("#signedInRole").textContent = isSuperadmin ? "Superadmin" : "Administrator";
          $("#accessRoleLabel").textContent = isSuperadmin ? "Akses superadmin" : "Akses administrator";
          $("#accessRoleDescription").textContent = isSuperadmin
            ? "Anda dapat mengelola layanan dan membuat akun admin serta konselor."
            : "Data ditampilkan sesuai role admin akun yang sedang masuk.";
          $("#superadminAccountPanel").hidden = !isSuperadmin;
          updateStaffAccountFields();
          await loadAdminData(context);
          render();
        } catch (error) {
          window.counselingBackend.showAuthError(new Error(`Gagal memuat data admin: ${error.message}`));
        }
      });

