      const counselor = { id: null, name: "Konselor" };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const addDays = days => {
        const date = new Date(today);
        date.setDate(date.getDate() + days);
        if (date.getDay() === 6) date.setDate(date.getDate() + 2);
        if (date.getDay() === 0) date.setDate(date.getDate() + 1);
        return date;
      };
      const daysAgo = days => new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
      const formatDate = date => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
      const formatShortDate = date => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
      const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const monthStart = date => new Date(date.getFullYear(), date.getMonth(), 1);
      const parseDate = value => {
        const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[character]);
      const telkomLogoDataUri = "data:image/png;base64,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";
      const students = [
        {
          name: "Nadia Putri", nim: "1202210031", program: "S1 Informatika", faculty: "Fakultas Informatika",
          phone: "081234567810", birthDate: "2003-08-11", ethnicity: "Sunda", religion: "Islam", city: "Bandung",
          address: "Sukabirus, Dayeuhkolot, Kabupaten Bandung", birthOrder: 1, siblings: 2,
          category: "Akademik", reason: "Merasa sulit menjaga konsistensi belajar dan mengatur waktu istirahat.",
          details: "Mahasiswa ingin membahas strategi mengelola beban kuliah dan membangun rutinitas belajar yang lebih seimbang."
        },
        {
          name: "Dimas Pratama", nim: "1202210025", program: "S1 Teknik Telekomunikasi", faculty: "Fakultas Teknik Elektro",
          phone: "081234567813", birthDate: "2003-04-18", ethnicity: "Jawa", religion: "Islam", city: "Bekasi",
          address: "Jl. Telekomunikasi, Bandung", birthOrder: 2, siblings: 1,
          category: "Akademik", reason: "Ingin mengevaluasi strategi pengelolaan waktu perkuliahan.",
          details: "Mahasiswa mengikuti sesi lanjutan untuk melihat perkembangan rutinitas dan strategi yang dicoba."
        },
        {
          name: "Salsabila Aulia", nim: "1202230042", program: "S1 Ilmu Komunikasi", faculty: "Fakultas Komunikasi dan Ilmu Sosial",
          phone: "081234567812", birthDate: "2004-03-22", ethnicity: "Sunda", religion: "Islam", city: "Bandung",
          address: "Sukapura, Dayeuhkolot, Kabupaten Bandung", birthOrder: 3, siblings: 2,
          category: "Sosial", reason: "Ingin membicarakan hubungan pertemanan dan komunikasi.",
          details: "Mahasiswa ingin mengeksplorasi cara membangun komunikasi yang nyaman dalam lingkungan pertemanan."
        },
        {
          name: "Intan Maharani", nim: "1202240007", program: "S1 Desain Komunikasi Visual", faculty: "Fakultas Industri Kreatif",
          phone: "081234567814", birthDate: "2006-05-05", ethnicity: "Sunda", religion: "Islam", city: "Bandung",
          address: "Sukabirus, Dayeuhkolot, Kabupaten Bandung", birthOrder: 2, siblings: 0,
          category: "Karier", reason: "Ingin mengenali pilihan karier dan kekuatan diri.",
          details: "Mahasiswa ingin berdiskusi mengenai minat, pilihan karier, dan langkah pengembangan diri."
        }
      ];
      const sessions = [
        { id: "CS-2101", studentNim: "1202210031", date: addDays(1), time: "09.00–10.00", mode: "Online", location: "https://zoom.us/j/987654321", status: "Terkonfirmasi", report: null },
        { id: "CS-2102", studentNim: "1202240007", date: addDays(3), time: "10.00–11.00", mode: "Tatap muka", location: "Ruang Konseling A-204", status: "Terkonfirmasi", report: null },
        { id: "CS-2103", studentNim: "1202230042", date: addDays(5), time: "13.00–14.00", mode: "Online", location: "https://zoom.us/j/123456789", status: "Terkonfirmasi", report: null },
        {
          id: "CS-2040", studentNim: "1202210025", date: daysAgo(5), time: "14.00–15.00", mode: "Tatap muka", location: "Ruang Konseling A-204", status: "Terlaksana",
          report: { diagnosis: "Kesulitan mempertahankan pengelolaan waktu saat beban tugas meningkat.", description: "Sesi meninjau penerapan jadwal mingguan. Mahasiswa merasa lebih terbantu, namun masih mengalami kesulitan saat beban tugas meningkat.", intervention: "Konselor meninjau strategi yang sudah dicoba dan membantu mahasiswa menyesuaikan target aktivitas.", conclusion: "Mahasiswa menunjukkan perkembangan dalam mengatur rutinitas dan mengidentifikasi situasi yang membutuhkan penyesuaian.", recommendation: "Melanjutkan pencatatan aktivitas dan menghubungi layanan kembali bila memerlukan dukungan." }
        },
        {
          id: "CS-1982", studentNim: "1202210025", date: daysAgo(19), time: "10.00–11.00", mode: "Tatap muka", location: "Ruang Konseling A-204", status: "Terlaksana",
          report: { diagnosis: "Kesulitan mengelola waktu dan menjaga keseimbangan aktivitas.", description: "Mahasiswa membahas kesulitan membagi waktu antara tugas dan istirahat serta mengidentifikasi pola kegiatan harian.", intervention: "Konselor memfasilitasi identifikasi prioritas dan penyusunan alternatif pengelolaan waktu.", conclusion: "Mahasiswa memahami beberapa faktor yang memengaruhi keseimbangan aktivitas dan bersedia mencoba strategi yang dibahas.", recommendation: "Mencoba menyusun jadwal mingguan yang realistis dan mengevaluasi waktu istirahat." }
        }
      ].map(session => ({ ...session, counselor: counselor.name }));
      let selectedScheduleId = sessions.find(session => session.status === "Terkonfirmasi")?.id || null;
      let selectedHistoryId = sessions.find(session => session.status === "Terlaksana")?.id || null;
      let selectedCalendarDate = new Date(sessions.find(session => session.status === "Terkonfirmasi")?.date || today);
      let calendarMonthDate = monthStart(selectedCalendarDate);
      let pendingReportSessionId = null;
      let toastTimer;
      let counselorDirectoryId = null;
      const availabilityDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const availabilityModes = ["Online", "Tatap muka"];
      const availabilityHours = Array.from({ length: 8 }, (_, index) => `${String(index + 8).padStart(2, "0")}.00–${String(index + 9).padStart(2, "0")}.00`);
      const availability = new Map();
      const $ = selector => document.querySelector(selector);
      const $$ = selector => [...document.querySelectorAll(selector)];

      function availabilityKey(weekday, mode) {
        return `${weekday}-${mode}`;
      }

      function renderAvailability() {
        const grid = $("#availabilityGrid");
        grid.replaceChildren();
        const header = document.createElement("div");
        header.className = "availability-row header";
        header.innerHTML = `<span>Hari</span><span>Jenis sesi</span>${availabilityHours.map(hour => `<span>${escapeHtml(hour)}</span>`).join("")}`;
        grid.append(header);
        availabilityDays.forEach((day, weekday) => availabilityModes.forEach(mode => {
          const row = document.createElement("div");
          row.className = "availability-row";
          const dayLabel = document.createElement("span");
          dayLabel.className = "availability-day";
          dayLabel.textContent = mode === "Online" ? day : "";
          const modeLabel = document.createElement("span");
          modeLabel.className = "availability-mode";
          modeLabel.textContent = mode;
          row.append(dayLabel, modeLabel);
          const slots = availability.get(availabilityKey(weekday, mode)) || Array(8).fill(false);
          slots.forEach((open, index) => {
            const label = document.createElement("label");
            label.className = "availability-slot";
            label.title = availabilityHours[index];
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = open;
            input.setAttribute("aria-label", `${day}, ${mode}, ${availabilityHours[index]}`);
            input.addEventListener("change", () => {
              const updated = [...(availability.get(availabilityKey(weekday, mode)) || Array(8).fill(false))];
              updated[index] = input.checked;
              availability.set(availabilityKey(weekday, mode), updated);
            });
            label.append(input, document.createTextNode(availabilityHours[index]));
            row.append(label);
          });
          grid.append(row);
        }));
      }

      async function loadCounselorAvailability(context) {
        const { data: directory, error: directoryError } = await context.client
          .from("counselor_directory")
          .select("id")
          .eq("linked_profile_id", counselor.id)
          .maybeSingle();
        if (directoryError) throw directoryError;
        counselorDirectoryId = directory?.id || null;
        const notice = $("#availabilityNotice");
        if (!counselorDirectoryId) {
          notice.classList.add("error");
          notice.textContent = "Akun Anda belum ditautkan ke direktori konselor. Hubungi admin untuk mengaktifkan pengaturan jadwal.";
          $("#saveAvailability").disabled = true;
          renderAvailability();
          return;
        }
        const { data: rows, error } = await context.client
          .from("counselor_availability")
          .select("weekday,mode,open_slots")
          .eq("directory_id", counselorDirectoryId);
        if (error) throw error;
        availability.clear();
        rows.forEach(row => availability.set(availabilityKey(row.weekday, row.mode), row.open_slots));
        notice.classList.remove("error");
        notice.textContent = "Centang jam praktik yang ingin ditawarkan. Perubahan berlaku untuk pendaftaran baru.";
        $("#saveAvailability").disabled = false;
        renderAvailability();
      }

      async function loadCounselorData(context) {
        const { client } = context;
        const appointments = await window.counselingBackend.loadAppointments(client);
        const reportRows = await window.counselingBackend.loadReports(client, appointments);
        const reportsByAppointment = new Map(reportRows.map(row => [row.appointment_id, row]));
        const studentsByNim = new Map();
        const mapped = appointments
          .filter(record => record.counselor_id === counselor.id)
          .map(record => {
            const profile = record.student || record.guestStudent || {};
            const student = {
              name: profile.full_name || "Mahasiswa",
              nim: profile.nim || "",
              program: profile.program || "",
              faculty: profile.faculty || "",
              phone: profile.phone || "",
              birthDate: profile.birth_date || "",
              ethnicity: profile.ethnicity || "",
              religion: profile.religion || "",
              city: profile.city || "",
              address: profile.address || "",
              birthOrder: profile.birth_order ?? "",
              siblings: profile.sibling_count ?? ""
            };
            studentsByNim.set(student.nim, student);
            const report = reportsByAppointment.get(record.id);
            return {
              id: record.code,
              dbId: record.id,
              studentNim: student.nim,
              date: parseDate(record.scheduled_date || record.requested_date),
              time: window.counselingBackend.displayTime(record.start_time || record.requested_start_time, record.end_time || record.requested_end_time),
              mode: record.mode,
              location: record.location || "",
              category: record.category,
              issue: record.issue_summary,
              reason: record.reason,
              details: record.issue_details,
              status: ({ pending: "Menunggu", confirmed: "Terkonfirmasi", completed: "Terlaksana", rejected: "Ditolak" })[record.status],
              report: report ? {
                diagnosis: report.diagnosis,
                description: report.description,
                intervention: report.intervention,
                conclusion: report.conclusion,
                recommendation: report.recommendation
              } : null
            };
          });
        students.splice(0, students.length, ...studentsByNim.values());
        sessions.splice(0, sessions.length, ...mapped);
        selectedScheduleId = sessions.find(session => session.status === "Terkonfirmasi")?.id || null;
        selectedHistoryId = sessions.find(session => session.status === "Terlaksana")?.id || null;
        selectedCalendarDate = new Date(sessions.find(session => session.status === "Terkonfirmasi")?.date || today);
        calendarMonthDate = monthStart(selectedCalendarDate);
      }

      async function initializeCounselorWorkspace() {
        document.body.style.visibility = "hidden";
        const context = await window.counselingBackend.guardPage("counselor");
        if (!context) {
          document.body.style.visibility = "";
          return;
        }
        try {
          counselor.id = context.profile.id;
          counselor.name = context.profile.full_name || context.user.email;
          $("#signedInCounselor").textContent = counselor.name;
          await Promise.all([loadCounselorData(context), loadCounselorAvailability(context)]);
          render();
        } catch (error) {
          window.counselingBackend.showAuthError(new Error(`Gagal memuat jadwal konselor: ${error.message}`));
        } finally {
          document.body.style.visibility = "";
        }
      }

      function getStudent(session) {
        return students.find(student => student.nim === session.studentNim);
      }

      function renderCalendar(scheduled) {
        const grid = $("#calendarGrid");
        grid.replaceChildren();
        $("#calendarMonth").textContent = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(calendarMonthDate);
        ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].forEach(day => {
          const heading = document.createElement("span");
          heading.className = "calendar-weekday";
          heading.setAttribute("role", "columnheader");
          heading.textContent = day;
          grid.append(heading);
        });

        const firstDay = monthStart(calendarMonthDate);
        const calendarStart = new Date(firstDay);
        calendarStart.setDate(firstDay.getDate() - firstDay.getDay());
        const dayCount = Math.ceil((firstDay.getDay() + new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate()) / 7) * 7;
        for (let offset = 0; offset < dayCount; offset += 1) {
          const date = new Date(calendarStart);
          date.setDate(calendarStart.getDate() + offset);
          const dateSessions = scheduled.filter(session => dateKey(session.date) === dateKey(date));
          const button = document.createElement("button");
          button.className = "calendar-day";
          button.type = "button";
          button.setAttribute("role", "gridcell");
          button.setAttribute("aria-pressed", String(dateKey(date) === dateKey(selectedCalendarDate)));
          button.setAttribute("aria-label", `${formatDate(date)}${dateSessions.length ? `, ${dateSessions.length} sesi` : ", tidak ada sesi"}`);
          if (date.getMonth() !== calendarMonthDate.getMonth()) button.classList.add("outside-month");
          if (dateKey(date) === dateKey(today)) button.classList.add("today");
          if (dateKey(date) === dateKey(selectedCalendarDate)) button.classList.add("selected");

          const dayNumber = document.createElement("span");
          dayNumber.className = "calendar-date";
          dayNumber.textContent = String(date.getDate());
          button.append(dayNumber);
          if (dateSessions.length) {
            const event = document.createElement("span");
            event.className = "calendar-event has-session";
            event.textContent = `${dateSessions.length} sesi · ${dateSessions[0].time.split("–")[0]}`;
            button.append(event);
            if (dateSessions.length > 1) {
              const more = document.createElement("span");
              more.className = "calendar-event";
              more.textContent = `+${dateSessions.length - 1} sesi lainnya`;
              button.append(more);
            }
          } else {
            const empty = document.createElement("span");
            empty.className = "calendar-event";
            empty.textContent = "—";
            button.append(empty);
          }
          button.addEventListener("click", () => {
            selectedCalendarDate = date;
            selectedScheduleId = dateSessions[0]?.id || null;
            render();
          });
          grid.append(button);
        }
      }

      function meetingNumber(session) {
        const completed = sessions
          .filter(item => item.studentNim === session.studentNim && item.status === "Terlaksana")
          .sort((left, right) => left.date - right.date);
        if (session.status === "Terlaksana") return completed.findIndex(item => item.id === session.id) + 1;
        return completed.length + 1;
      }

      function renderSessionList(target, entries, selectedId, onSelect, type) {
        const list = $(target);
        list.replaceChildren();
        entries.forEach(session => {
          const student = getStudent(session);
          const button = document.createElement("button");
          button.className = `session-item${session.id === selectedId ? " active" : ""}`;
          button.type = "button";
          button.setAttribute("aria-pressed", String(session.id === selectedId));
          const name = document.createElement("strong");
          name.textContent = student.name;
          const date = document.createElement("span");
          date.textContent = `${formatShortDate(session.date)} · ${session.time}`;
          const badge = document.createElement("small");
          badge.className = type === "history" ? "done" : "";
          badge.textContent = type === "history" ? `${meetingNumber(session)} pertemuan` : session.mode;
          button.append(name, date, badge);
          button.addEventListener("click", () => onSelect(session.id));
          list.append(button);
        });
        if (!entries.length) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.textContent = type === "history" ? "Belum ada sesi konseling yang selesai." : "Belum ada jadwal konseling.";
          list.append(empty);
        }
      }

      function field(label, value, wide = false) {
        const wrapper = document.createElement("div");
        wrapper.className = `field${wide ? " wide" : ""}`;
        const caption = document.createElement("span");
        caption.textContent = label;
        const content = /^https:\/\//.test(value || "") ? document.createElement("a") : document.createElement("strong");
        content.textContent = value || "—";
        if (content instanceof HTMLAnchorElement) {
          content.href = value;
          content.target = "_blank";
          content.rel = "noopener noreferrer";
        }
        wrapper.append(caption, content);
        return wrapper;
      }

      const panduCache = new Map();

      function panduScaleList(scales, labels) {
        const entries = Object.entries(scales || {});
        if (!entries.length) return "";
        return `<div class="pandu-scales">${entries.map(([code, value]) => {
          const high = value >= 70;
          const name = labels[code] && labels[code] !== code ? `${labels[code]} (${code})` : code;
          return `<div class="pandu-scale ${high ? "high" : ""}"><span>${escapeHtml(name)}</span><div class="pandu-track"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div><b>${Number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}</b></div>`;
        }).join("")}</div>`;
      }

      function panduHtml(result) {
        const { PD_LABELS, FACTOR_LABELS, VALIDITY_LABELS, NORMAL_LABELS } = window.PANDU_LABELS;
        if (!result.is_complete) {
          return `<p class="pandu-note warn">Mahasiswa ini sudah mengisi tes PANDU tetapi belum lengkap (${escapeHtml(result.fill_status || "")}). Skor belum tersedia.</p>`;
        }
        const review = result.pd_status === "Perlu telaah profesional";
        const resilience = result.resilience_index;
        return `<p class="pandu-note ${review ? "alert" : "ok"}"><strong>${escapeHtml(result.pd_status || "Tidak tersedia")}</strong> · ${result.pd_flag_count ?? 0} skala PD ditandai${result.pd_top_scale ? ` · tertinggi ${escapeHtml(PD_LABELS[result.pd_top_scale] || result.pd_top_scale)} (T ${Number(result.pd_top_t).toLocaleString("id-ID", { maximumFractionDigits: 1 })})` : ""}</p>
          ${resilience === null || resilience === undefined ? "" : `<div class="pandu-scale"><span>Indeks resiliensi (0–100)</span><div class="pandu-track resilience"><i style="width:${Math.max(0, Math.min(100, resilience))}%"></i></div><b>${Number(resilience).toLocaleString("id-ID", { maximumFractionDigits: 1 })}</b></div>`}
          <h4>Personality Disorder Scales (T-score)</h4>${panduScaleList(result.pd_scales, PD_LABELS)}
          <h4>Factor Scales (T-score)</h4>${panduScaleList(result.factor_scales, FACTOR_LABELS)}
          <details><summary>Validity &amp; Normal Scales</summary><h4>Validity Scales</h4>${panduScaleList(result.validity, VALIDITY_LABELS)}<h4>Normal Scales (T-score)</h4>${panduScaleList(result.normal_scales, NORMAL_LABELS)}</details>
          <p class="pandu-note">Batang merah menandai T-score ≥ 70. Hasil skrining ini bukan diagnosis dan perlu ditelaah profesional.</p>`;
      }

      async function renderPanduSection(detail, student) {
        const title = document.createElement("h3");
        title.className = "section-title";
        title.textContent = "Hasil profiling PANDU Tel-U";
        const box = document.createElement("div");
        box.className = "pandu-box";
        box.innerHTML = '<p class="pandu-note">Memeriksa data profiling…</p>';
        detail.append(title, box);
        if (!student.nim) { box.innerHTML = '<p class="pandu-note">NIM mahasiswa tidak tersedia.</p>'; return; }
        try {
          if (!panduCache.has(student.nim)) {
            const { data, error } = await window.counselingBackend.getClient().rpc("counselor_pandu_result", { p_nim: student.nim });
            if (error) throw error;
            panduCache.set(student.nim, data);
          }
          if (!box.isConnected) return;
          const result = panduCache.get(student.nim);
          box.innerHTML = result ? panduHtml(result) : '<p class="pandu-note">Belum ada hasil profiling PANDU untuk NIM ini.</p>';
        } catch (error) {
          if (box.isConnected) box.innerHTML = '<p class="pandu-note">Hasil profiling belum dapat dimuat. Pastikan fungsi database terbaru sudah dijalankan.</p>';
        }
      }

      function renderScheduleDetail(session) {
        const detail = $("#scheduleDetail");
        detail.replaceChildren();
        if (!session) {
          detail.innerHTML = '<div class="empty-state">Pilih jadwal untuk melihat detail mahasiswa dan sesi.</div>';
          return;
        }
        const student = getStudent(session);
        const heading = document.createElement("div");
        heading.className = "detail-heading";
        const title = document.createElement("div");
        title.innerHTML = `<h2>${escapeHtml(student.name)}</h2><p>${escapeHtml(student.nim)} · ${escapeHtml(student.program)}</p>`;
        const badge = document.createElement("span");
        badge.className = "status";
        badge.textContent = session.status;
        heading.append(title, badge);
        detail.append(heading);
        const identityTitle = document.createElement("h3");
        identityTitle.className = "section-title";
        identityTitle.textContent = "Detail mahasiswa";
        detail.append(identityTitle);
        const identity = document.createElement("div");
        identity.className = "fields";
        [
          ["Fakultas", student.faculty], ["Kontak", student.phone], ["Tanggal lahir", student.birthDate],
          ["Suku bangsa", student.ethnicity], ["Agama", student.religion], ["Asal kota", student.city],
          ["Alamat tinggal", student.address, true], ["Anak ke-", String(student.birthOrder)],
          ["Jumlah saudara kandung", String(student.siblings)]
        ].forEach(([label, value, wide]) => identity.append(field(label, value, wide)));
        detail.append(identity);
        const sessionTitle = document.createElement("h3");
        sessionTitle.className = "section-title";
        sessionTitle.textContent = "Jadwal & kebutuhan konseling";
        detail.append(sessionTitle);
        const sessionFields = document.createElement("div");
        sessionFields.className = "fields";
        [
          ["Tanggal", formatDate(session.date)], ["Waktu", session.time],
          ["Jenis sesi", session.mode], ["Konselor", session.counselor],
          [session.mode === "Online" ? "Link Zoom" : "Lokasi sesi", session.location, true],
          ["Kategori", session.category], ["Masalah", session.issue, true],
          ["Alasan konseling", session.reason, true], ["Detail masalah", session.details, true]
        ].forEach(([label, value, wide]) => sessionFields.append(field(label, value, wide)));
        detail.append(sessionFields);
        renderPanduSection(detail, student);
        const privacy = document.createElement("p");
        privacy.className = "private-note";
        privacy.textContent = "Informasi mahasiswa bersifat rahasia. Gunakan hanya untuk pelayanan konseling dan pengisian laporan sesi.";
        detail.append(privacy);
        const actions = document.createElement("div");
        actions.className = "detail-actions";
        const complete = document.createElement("button");
        complete.className = "primary-button";
        complete.type = "button";
        complete.textContent = "Sesi selesai & isi laporan";
        complete.addEventListener("click", () => openReportForm(session));
        actions.append(complete);
        detail.append(actions);
      }

      function reportHtml(session) {
        const student = getStudent(session);
        const report = session.report;
        const fields = [
          ["Nama Mahasiswa", student.name],
          ["NIM Mahasiswa", student.nim],
          ["Nama Konselor", counselor.name],
          ["Waktu Pelaksanaan Konseling", `${formatDate(session.date)} · ${session.time}`],
          ["Pertemuan ke", String(meetingNumber(session))],
          ["Diagnosis Kasus", report.diagnosis],
          ["Deskripsi Kasus", report.description],
          ["Hasil Intervensi", report.intervention],
          ["Kesimpulan Hasil", report.conclusion],
          ["Rekomendasi", report.recommendation]
        ];
        const rows = fields.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>:</td><td>${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`).join("");
        return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Laporan Konseling - ${escapeHtml(student.name)}</title>
<style>
@page{size:A4 portrait;margin:18mm 20mm}*{box-sizing:border-box}body{margin:0;color:#111;font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45}header{min-height:23mm;display:flex;align-items:flex-start;justify-content:space-between;gap:12mm}header img{width:42mm;height:auto}header div{max-width:62mm;font-size:9pt;font-weight:700;text-align:right}h1{margin:3mm 0 10mm;font-size:12pt;text-align:center;text-decoration:underline}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:2.2mm 0;vertical-align:top;text-align:left;font-weight:400}th{width:47mm}td:nth-child(2){width:5mm}tr:nth-child(n+6)th,tr:nth-child(n+6)td{padding-top:7mm}@media screen{body{max-width:210mm;min-height:297mm;margin:15mm auto;padding:18mm 20mm;box-shadow:0 2px 18px #0002}}
</style></head><body><header><img src="${telkomLogoDataUri}" alt="Telkom University"><div>Direktorat Kemahasiswaan,<br>Karier dan Alumni</div></header><h1>Laporan Pelaksanaan Konseling Universitas Telkom</h1><table><tbody>${rows}</tbody></table></body></html>`;
      }

      function renderHistoryDetail(session) {
        const detail = $("#historyDetail");
        detail.replaceChildren();
        if (!session) {
          detail.innerHTML = '<div class="empty-state">Pilih sesi riwayat untuk melihat laporan.</div>';
          return;
        }
        const student = getStudent(session);
        const heading = document.createElement("div");
        heading.className = "detail-heading";
        const title = document.createElement("div");
        title.innerHTML = `<h2>${escapeHtml(student.name)}</h2><p>${escapeHtml(student.nim)} · ${escapeHtml(student.program)}</p>`;
        const badge = document.createElement("span");
        badge.className = "status done";
        badge.textContent = `Pertemuan ke-${meetingNumber(session)}`;
        heading.append(title, badge);
        detail.append(heading);
        const info = document.createElement("div");
        info.className = "fields";
        [
          ["Tanggal & waktu", `${formatDate(session.date)} · ${session.time}`],
          ["Konselor", session.counselor], ["Jenis sesi", session.mode],
          [session.mode === "Online" ? "Link Zoom" : "Lokasi", session.location, true],
          ["Fakultas", student.faculty], ["Kontak", student.phone]
        ].forEach(([label, value, wide]) => info.append(field(label, value, wide)));
        detail.append(info);
        const card = document.createElement("article");
        card.className = "report-card";
        const cardHeading = document.createElement("div");
        cardHeading.className = "report-card-head";
        const reportTitle = document.createElement("strong");
        reportTitle.textContent = "Laporan pelaksanaan konseling";
        const date = document.createElement("span");
        date.textContent = formatDate(session.date);
        cardHeading.append(reportTitle, date);
        const meta = document.createElement("div");
        meta.className = "report-meta";
        [student.category, session.mode, session.counselor].forEach(value => {
          const tag = document.createElement("span");
          tag.textContent = value;
          meta.append(tag);
        });
        card.append(cardHeading, meta);
        [
          ["Diagnosis Kasus", session.report.diagnosis], ["Deskripsi Kasus", session.report.description],
          ["Hasil Intervensi", session.report.intervention], ["Kesimpulan Hasil", session.report.conclusion],
          ["Rekomendasi", session.report.recommendation]
        ].forEach(([label, value]) => {
          const titleNode = document.createElement("h3");
          titleNode.textContent = label;
          const textNode = document.createElement("p");
          textNode.textContent = value;
          card.append(titleNode, textNode);
        });
        const actions = document.createElement("div");
        actions.className = "report-actions";
        const download = document.createElement("button");
        download.className = "report-action";
        download.type = "button";
        download.textContent = "Unduh laporan (.html)";
        download.addEventListener("click", () => {
          const blob = new Blob([reportHtml(session)], { type: "text/html;charset=utf-8" });
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = `Laporan_Konseling_${student.nim}_Pertemuan_${meetingNumber(session)}.html`;
          document.body.append(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        });
        const print = document.createElement("button");
        print.className = "report-action";
        print.type = "button";
        print.textContent = "Cetak / Simpan PDF";
        print.addEventListener("click", () => {
          const printWindow = window.open("", "_blank");
          if (!printWindow) {
            showToast("Jendela cetak diblokir. Izinkan pop-up untuk mencetak atau menyimpan PDF.");
            return;
          }
          printWindow.document.open();
          printWindow.document.write(reportHtml(session));
          printWindow.document.close();
          window.setTimeout(() => {
            if (printWindow.closed) return;
            printWindow.focus();
            printWindow.print();
          }, 500);
        });
        actions.append(download, print);
        card.append(actions);
        detail.append(card);
      }

      function render() {
        const scheduled = sessions.filter(session => session.status === "Terkonfirmasi").sort((a, b) => a.date - b.date || a.time.localeCompare(b.time));
        const history = sessions.filter(session => session.status === "Terlaksana").sort((a, b) => b.date - a.date);
        const selectedDaySessions = scheduled.filter(session => dateKey(session.date) === dateKey(selectedCalendarDate));
        $("#dayScheduleTitle").textContent = `Jadwal ${formatDate(selectedCalendarDate)}`;
        $("#dayScheduleSubtitle").textContent = "Sesi yang ditugaskan kepada Anda pada tanggal ini.";
        $("#scheduleCount").textContent = `${selectedDaySessions.length} sesi`;
        $("#historyCount").textContent = `${history.length} sesi`;
        if (!selectedDaySessions.some(session => session.id === selectedScheduleId)) selectedScheduleId = selectedDaySessions[0]?.id || null;
        if (!history.some(session => session.id === selectedHistoryId)) selectedHistoryId = history[0]?.id || null;
        renderCalendar(scheduled);
        renderSessionList("#scheduleList", selectedDaySessions, selectedScheduleId, id => {
          selectedScheduleId = id;
          render();
        }, "schedule");
        renderSessionList("#historyList", history, selectedHistoryId, id => {
          selectedHistoryId = id;
          render();
        }, "history");
        renderScheduleDetail(scheduled.find(session => session.id === selectedScheduleId));
        renderHistoryDetail(history.find(session => session.id === selectedHistoryId));
      }

      $("#previousMonth").addEventListener("click", () => {
        calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1);
        selectedCalendarDate = new Date(calendarMonthDate);
        selectedScheduleId = null;
        render();
      });
      $("#nextMonth").addEventListener("click", () => {
        calendarMonthDate = new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1);
        selectedCalendarDate = new Date(calendarMonthDate);
        selectedScheduleId = null;
        render();
      });
      $("#calendarToday").addEventListener("click", () => {
        selectedCalendarDate = new Date(today);
        calendarMonthDate = monthStart(today);
        selectedScheduleId = null;
        render();
      });
      $("#counselorLogout").addEventListener("click", async () => {
        try {
          await window.counselingBackend.signOut();
        } catch (error) {
          showToast(`Gagal keluar: ${error.message}`);
        }
      });

      function openReportForm(session) {
        pendingReportSessionId = session.id;
        const student = getStudent(session);
        $("#reportStudent").value = student.name;
        $("#reportNim").value = student.nim;
        $("#reportCounselor").value = counselor.name;
        $("#reportTime").value = `${formatDate(session.date)} · ${session.time}`;
        $("#reportMeeting").value = String(meetingNumber(session));
        $("#reportDiagnosis").value = "";
        $("#reportDescription").value = "";
        $("#reportIntervention").value = "";
        $("#reportConclusion").value = "";
        $("#reportRecommendation").value = "";
        $("#reportModal").hidden = false;
        $("#reportDiagnosis").focus();
      }

      function closeReportForm() {
        $("#reportModal").hidden = true;
        pendingReportSessionId = null;
      }

      function showToast(message) {
        $("#toast").textContent = message;
        $("#toast").classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => $("#toast").classList.remove("show"), 3200);
      }

      $$(".nav-tab").forEach(button => button.addEventListener("click", () => {
        const tab = button.dataset.tab;
        $$(".nav-tab").forEach(item => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        $("#scheduleView").hidden = tab !== "schedule";
        $("#historyView").hidden = tab !== "history";
        $("#availabilityView").hidden = tab !== "availability";
      }));
      $("#saveAvailability").addEventListener("click", async () => {
        if (!counselorDirectoryId) return;
        const settings = [];
        availabilityDays.forEach((_, weekday) => availabilityModes.forEach(mode => {
          settings.push({
            weekday,
            mode,
            open_slots: availability.get(availabilityKey(weekday, mode)) || Array(8).fill(false)
          });
        }));
        $("#saveAvailability").disabled = true;
        try {
          const { error } = await window.counselingBackend.getClient().rpc("save_counselor_availability", { p_settings: settings });
          if (error) throw error;
          $("#availabilityNotice").textContent = "Ketersediaan praktik berhasil disimpan.";
          showToast("Jadwal praktik berhasil disimpan.");
        } catch (error) {
          $("#availabilityNotice").classList.add("error");
          $("#availabilityNotice").textContent = `Jadwal gagal disimpan: ${error.message}`;
          showToast(`Jadwal gagal disimpan: ${error.message}`);
        } finally {
          $("#saveAvailability").disabled = false;
        }
      });
      $("#cancelReport").addEventListener("click", closeReportForm);
      $("#reportModal").addEventListener("click", event => {
        if (event.target === $("#reportModal")) closeReportForm();
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !$("#reportModal").hidden) closeReportForm();
      });
      $("#reportForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const session = sessions.find(item => item.id === pendingReportSessionId);
        if (!session || session.status !== "Terkonfirmasi") {
          closeReportForm();
          await initializeCounselorWorkspace();
          showToast("Sesi ini tidak lagi tersedia untuk dilengkapi.");
          return;
        }
        const report = {
          diagnosis: $("#reportDiagnosis").value.trim(),
          description: $("#reportDescription").value.trim(),
          intervention: $("#reportIntervention").value.trim(),
          conclusion: $("#reportConclusion").value.trim(),
          recommendation: $("#reportRecommendation").value.trim()
        };
        const { error } = await window.counselingBackend.getClient().rpc("complete_counseling_session", {
          p_appointment_id: session.dbId,
          p_diagnosis: report.diagnosis,
          p_description: report.description,
          p_intervention: report.intervention,
          p_conclusion: report.conclusion,
          p_recommendation: report.recommendation
        });
        if (error) {
          showToast(`Laporan gagal disimpan: ${error.message}`);
          return;
        }
        session.report = report;
        session.status = "Terlaksana";
        selectedHistoryId = session.id;
        closeReportForm();
        await initializeCounselorWorkspace();
        $("#historyView").hidden = false;
        $("#scheduleView").hidden = true;
        $$(".nav-tab").forEach(button => {
          const active = button.dataset.tab === "history";
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        showToast("Sesi diselesaikan dan laporan ditambahkan ke riwayat konseling.");
      });
      initializeCounselorWorkspace();
