      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const state = {
        month: new Date(today.getFullYear(), today.getMonth(), 1),
        selectedDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        filter: "semua",
        selectedSlot: null,
        availableSlots: {},
        userName: "Alya Rahma",
        requests: []
      };

      const $ = (selector, root = document) => root.querySelector(selector);
      const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
      const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const formatDate = (date, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) => new Intl.DateTimeFormat("id-ID", options).format(date);
      const isSameDate = (left, right) => dateKey(left) === dateKey(right);
      const makeDate = (year, month, day) => new Date(year, month, day);
      const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[character]);
      const parseDate = value => {
        const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      const studentEmail = $("#loginEmail");
      const loginNotice = $("#loginNotice");
      const signupNotice = $("#signupNotice");
      let studentProfile = null;
      let toastTimer;
      let showingSignup = false;
      $("#studentBirthDate").max = dateKey(today);

      function slotsForDate(date) {
        return state.availableSlots[dateKey(date)] || [];
      }

      async function refreshAvailability(month) {
        const startDate = makeDate(month.getFullYear(), month.getMonth(), 1);
        const endDate = makeDate(month.getFullYear(), month.getMonth() + 1, 0);
        const rows = await window.counselingBackend.loadAvailableSlots(
          window.counselingBackend.getClient(),
          dateKey(startDate),
          dateKey(endDate)
        );
        state.availableSlots = {};
        rows.forEach(row => {
          const date = String(row.available_date).slice(0, 10);
          if (!state.availableSlots[date]) state.availableSlots[date] = [];
          state.availableSlots[date].push({
            time: window.counselingBackend.displayTime(row.start_time, row.end_time),
            mode: row.mode,
            available: true
          });
        });
      }

      function visibleSlots(date) {
        const slots = slotsForDate(date);
        return state.filter === "semua" ? slots : slots.filter(slot =>
          (slot.mode === "Online" ? "online" : "offline") === state.filter
        );
      }

      function renderCalendar() {
        const calendar = $("#calendar");
        calendar.replaceChildren();
        dayNames.forEach(name => {
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
          const date = makeDate(year, month, day);
          const button = document.createElement("button");
          const hasSlots = visibleSlots(date).some(slot => slot.available);
          button.className = "day-cell";
          button.type = "button";
          button.setAttribute("role", "gridcell");
          button.setAttribute("aria-label", `${formatDate(date)}${hasSlots ? ", jadwal tersedia" : ""}`);
          button.textContent = String(day);
          if (isSameDate(date, today)) button.classList.add("today");
          if (isSameDate(date, state.selectedDate)) button.classList.add("selected");
          if (hasSlots) button.classList.add("has-slots");
          if (!hasSlots) button.disabled = true;
          button.addEventListener("click", () => {
            state.selectedDate = date;
            renderCalendar();
            renderSlots();
          });
          calendar.append(button);
        }
        $("#monthLabel").textContent = `${monthNames[month]} ${year}`;
        const available = visibleSlots(state.selectedDate).filter(slot => slot.available).length;
        $("#availableCount").textContent = `${available} slot`;
        $("#previousMonth").disabled = state.month <= new Date(today.getFullYear(), today.getMonth(), 1);
      }

      function renderSlots() {
        $("#selectedDateLabel").textContent = formatDate(state.selectedDate);
        const list = $("#slotList");
        list.replaceChildren();
        const slots = visibleSlots(state.selectedDate);
        const matches = slots.filter(slot => slot.available);
        if (!matches.length) {
          const empty = document.createElement("div");
          empty.className = "slot-empty";
          empty.textContent = slots.length ? "Belum ada jadwal tersedia untuk pilihan ini. Coba tanggal lain." : "Belum ada jadwal pada tanggal ini. Silakan pilih tanggal bertitik hijau.";
          list.append(empty);
          return;
        }
        matches.forEach(slot => {
          const button = document.createElement("button");
          button.className = "slot-button";
          button.type = "button";
          button.innerHTML = `<span><span class="slot-time">${escapeHtml(slot.time)}</span><span class="slot-kind">${escapeHtml(slot.mode)}</span></span><span class="slot-status">Tersedia</span>`;
          button.addEventListener("click", () => openBooking(slot));
          list.append(button);
        });
      }

      function setDashboardName(name) {
        const cleanName = name.trim().split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
        state.userName = cleanName || "Alya Rahma";
        $("#userName").textContent = state.userName;
        $("#welcomeName").textContent = state.userName.split(" ")[0];
        $("#studentName").value = state.userName;
        const initials = state.userName.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
        $(".avatar").textContent = initials || "AR";
      }

      function renderRequests() {
        const pending = state.requests.filter(request => request.status === "Menunggu").length;
        const confirmed = state.requests.filter(request => request.status === "Terkonfirmasi").length;
        $("#pendingCount").textContent = String(pending);
        $("#confirmedCount").textContent = String(confirmed);
        $("#historyCount").textContent = String(state.requests.length);
        const appointmentList = $("#appointmentList");
        appointmentList.replaceChildren();
        const sortedRequests = [...state.requests].sort((a, b) => a.date - b.date);
        if (!sortedRequests.length) {
          appointmentList.innerHTML = '<div class="history-empty">Belum ada pengajuan konseling.</div>';
        } else {
          sortedRequests.slice(0, 2).forEach(request => {
            const item = document.createElement("div");
            item.className = "appointment-item";
            item.innerHTML = `<div class="appointment-date"><strong>${request.date.getDate()}</strong><span>${monthNames[request.date.getMonth()].slice(0, 3)}</span></div><div class="appointment-copy"><strong>${escapeHtml(request.time)} · ${escapeHtml(request.mode)}</strong><span>${escapeHtml(formatDate(request.date, { weekday: "long", month: "long", year: "numeric" }))}${request.counselor ? ` · ${escapeHtml(request.counselor)}` : ""}</span></div><span class="status-badge ${request.status === "Terkonfirmasi" ? "confirmed" : ""}">${escapeHtml(request.status)}</span>`;
            appointmentList.append(item);
          });
        }
        const historyList = $("#historyList");
        historyList.replaceChildren();
        if (!state.requests.length) {
          const empty = document.createElement("div");
          empty.className = "history-empty";
          empty.textContent = "Belum ada pengajuan. Pilih jadwal yang tersedia untuk memulai.";
          historyList.append(empty);
        } else {
          sortedRequests.forEach(request => {
            const item = document.createElement("article");
            item.className = "history-item";
            item.innerHTML = `<div><h3>Pengajuan ${escapeHtml(request.id)}</h3><p>${escapeHtml(formatDate(request.date))} · ${escapeHtml(request.time)} · ${escapeHtml(request.mode)}${request.counselor ? ` · ${escapeHtml(request.counselor)}` : ""}</p></div><span class="status-badge ${request.status === "Terkonfirmasi" ? "confirmed" : ""}">${escapeHtml(request.status)}</span>`;
            historyList.append(item);
          });
        }
      }

      function updateView(view) {
        const showHistory = view === "history";
        $("#scheduleView").hidden = showHistory;
        $("#historyView").hidden = !showHistory;
        $("#breadcrumbCurrent").textContent = showHistory ? "Riwayat pengajuan" : "Jadwal konseling";
        $$("[data-view]").forEach(button => {
          const active = button.dataset.view === view;
          button.classList.toggle("active", active);
          if (active) button.setAttribute("aria-current", "page");
          else button.removeAttribute("aria-current");
        });
      }

      function openBooking(slot) {
        state.selectedSlot = slot;
        $("#bookingDate").textContent = formatDate(state.selectedDate);
        $("#bookingSession").textContent = `${slot.time} · ${slot.mode} · 60 menit`;
        const personalFields = $("#personalFields");
        const savedProfileSummary = $("#savedProfileSummary");
        const profileComplete = hasCompleteStudentProfile(studentProfile);
        personalFields.hidden = profileComplete;
        personalFields.querySelectorAll("input, select, textarea").forEach(field => { field.disabled = profileComplete; });
        savedProfileSummary.hidden = !profileComplete;
        $("#bookingIntro").textContent = profileComplete
          ? "Data diri Anda sudah tersimpan. Lengkapi informasi untuk sesi konseling ini."
          : "Lengkapi data diri dan kebutuhan konseling Anda.";
        if (profileComplete) {
          savedProfileSummary.textContent = `Data diri tersimpan untuk ${studentProfile.full_name} · NIM ${studentProfile.nim}. Pengajuan ini hanya meminta informasi sesi konseling.`;
        }
        $("#bookingBackdrop").hidden = false;
        $(profileComplete ? "#studentIssue" : "#studentName").focus();
      }

      function hasCompleteStudentProfile(profile) {
        return Boolean(profile &&
          ["full_name", "nim", "program", "faculty", "phone", "birth_date", "ethnicity", "religion", "city", "address"].every(key => String(profile[key] ?? "").trim()) &&
          Number(profile.birth_order) > 0 &&
          Number.isInteger(Number(profile.sibling_count)) &&
          Number(profile.sibling_count) >= 0);
      }

      function normalizeIndonesianPhone(value) {
        let digits = String(value ?? "").replace(/\D/g, "");
        if (!digits) return "";
        if (digits.startsWith("00")) digits = digits.slice(2);
        if (digits.startsWith("62")) return digits;
        return `62${digits.startsWith("0") ? digits.slice(1) : digits}`;
      }

      function closeBooking() {
        $("#bookingBackdrop").hidden = true;
        state.selectedSlot = null;
      }

      function showToast(message) {
        $("#toastMessage").textContent = message;
        $("#toast").classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => $("#toast").classList.remove("show"), 3600);
      }

      async function changeMonth(offset) {
        const nextMonth = new Date(state.month.getFullYear(), state.month.getMonth() + offset, 1);
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (nextMonth < currentMonth) return;
        state.month = nextMonth;
        try {
          await refreshAvailability(nextMonth);
        } catch (error) {
          showToast(`Gagal memuat ketersediaan jadwal: ${error.message}`);
        }
        const daysInMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        state.selectedDate = makeDate(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
        for (let day = 1; day <= daysInMonth; day += 1) {
          const date = makeDate(nextMonth.getFullYear(), nextMonth.getMonth(), day);
          if (visibleSlots(date).some(slot => slot.available)) {
            state.selectedDate = date;
            break;
          }
        }
        renderCalendar();
        renderSlots();
      }

      async function openDashboard(profile) {
        studentProfile = profile;
        $("#loginScreen").hidden = true;
        $("#dashboard").hidden = false;
        setDashboardName(profile.full_name || "");
        $("#studentNim").value = profile.nim || "";
        $("#studentProgram").value = profile.program || "";
        $("#studentFaculty").value = profile.faculty || "";
        $("#studentPhone").value = profile.phone || "";
        $("#studentBirthDate").value = profile.birth_date || "";
        $("#studentEthnicity").value = profile.ethnicity || "";
        $("#studentReligion").value = profile.religion || "";
        $("#studentCity").value = profile.city || "";
        $("#studentAddress").value = profile.address || "";
        $("#studentBirthOrder").value = profile.birth_order || "";
        $("#studentSiblingCount").value = profile.sibling_count ?? "";
        const client = window.counselingBackend.getClient();
        const records = await window.counselingBackend.loadAppointments(client);
        state.requests = records.map(record => ({
          id: record.code,
          dbId: record.id,
          date: parseDate(record.scheduled_date || record.requested_date),
          time: window.counselingBackend.displayTime(
            record.start_time || record.requested_start_time,
            record.end_time || record.requested_end_time
          ),
          mode: record.mode,
          status: ({ pending: "Menunggu", confirmed: "Terkonfirmasi", completed: "Terlaksana", rejected: "Ditolak" })[record.status],
          counselor: record.counselor?.full_name || ""
        }));
        await refreshAvailability(state.month);
        renderCalendar();
        renderSlots();
        renderRequests();
        $("#todayLabel span").textContent = formatDate(today);
      }

      $("#loginForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (!$("#loginForm").reportValidity()) return;
        loginNotice.textContent = "";
        try {
          await window.counselingBackend.login(studentEmail.value, $("#loginPassword").value);
        } catch (error) {
          loginNotice.textContent = error.message || "Email atau kata sandi tidak valid.";
        }
      });
      $("#authSwitchButton").addEventListener("click", () => {
        showingSignup = !showingSignup;
        $("#loginTitle").textContent = showingSignup ? "Buat akun mahasiswa" : "Masuk ke akun Anda";
        $(".login-intro").textContent = showingSignup
          ? "Daftar untuk mengakses layanan konseling mahasiswa Telkom University."
          : "Akses layanan konseling dengan mudah dan nyaman. Masukkan akun Telkom University Anda untuk melanjutkan.";
        $("#loginForm").hidden = showingSignup;
        $("#signupForm").hidden = !showingSignup;
        $("#authSwitchPrompt").textContent = showingSignup ? "Sudah memiliki akun?" : "Belum memiliki akun?";
        $("#authSwitchButton").textContent = showingSignup ? "Masuk" : "Daftar sebagai mahasiswa";
        loginNotice.textContent = "";
        signupNotice.textContent = "";
        (showingSignup ? $("#signupName") : studentEmail).focus();
      });
      $("#signupForm").addEventListener("submit", async event => {
        event.preventDefault();
        const signupForm = event.currentTarget;
        if (!signupForm.reportValidity()) return;
        signupNotice.textContent = "";
        const name = $("#signupName").value.trim().replace(/\s+/g, " ");
        const email = $("#signupEmail").value.trim();
        const password = $("#signupPassword").value;
        if (name.length < 2) {
          signupNotice.textContent = "Masukkan nama lengkap yang valid.";
          $("#signupName").focus();
          return;
        }
        if (password !== $("#signupPasswordConfirm").value) {
          signupNotice.textContent = "Kata sandi dan konfirmasinya belum sama.";
          $("#signupPasswordConfirm").focus();
          return;
        }
        try {
          const result = await window.counselingBackend.signUpStudent(name, email, password);
          if (result.session) {
            window.location.assign(window.counselingBackend.rolePage(result.profile.role));
            return;
          }
          signupForm.reset();
          signupNotice.textContent = "Akun mahasiswa berhasil dibuat. Periksa email Anda dan klik tautan konfirmasi sebelum masuk.";
        } catch (error) {
          signupNotice.textContent = error.message || "Pendaftaran gagal. Silakan coba kembali.";
        }
      });
      $("#togglePassword").addEventListener("click", () => {
        const password = $("#loginPassword");
        const showing = password.type === "password";
        password.type = showing ? "text" : "password";
        $("#togglePassword").setAttribute("aria-label", showing ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
        $("#togglePassword").title = showing ? "Sembunyikan kata sandi" : "Tampilkan kata sandi";
      });
      $("#forgotPassword").addEventListener("click", () => {
        loginNotice.textContent = "Reset kata sandi belum dikonfigurasi untuk pratinjau ini. Hubungi administrator layanan.";
      });
      $("#logoutButton").addEventListener("click", async () => {
        try {
          await window.counselingBackend.signOut();
        } catch (error) {
          showToast(`Gagal keluar: ${error.message}`);
        }
      });
      $("#previousMonth").addEventListener("click", async () => {
        await changeMonth(-1);
      });
      $("#nextMonth").addEventListener("click", async () => {
        await changeMonth(1);
      });
      $$(".filter-button").forEach(button => button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        $$(".filter-button").forEach(filterButton => {
          const active = filterButton === button;
          filterButton.classList.toggle("active", active);
          filterButton.setAttribute("aria-pressed", String(active));
        });
        renderCalendar();
        renderSlots();
      }));
      $$("[data-view]").forEach(button => button.addEventListener("click", () => updateView(button.dataset.view)));
      $$("[data-open-history]").forEach(button => button.addEventListener("click", () => updateView("history")));
      $$("[data-close-modal]").forEach(button => button.addEventListener("click", closeBooking));
      $("#bookingBackdrop").addEventListener("click", event => {
        if (event.target === $("#bookingBackdrop")) closeBooking();
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !$("#bookingBackdrop").hidden) closeBooking();
      });
      $("#bookingForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (!$("#bookingForm").reportValidity() || !state.selectedSlot) return;
        const data = new FormData(event.currentTarget);
        try {
          const client = window.counselingBackend.getClient();
          const profile = $("#personalFields").hidden
            ? {
              full_name: studentProfile.full_name,
              nim: studentProfile.nim,
              program: studentProfile.program,
              faculty: studentProfile.faculty,
              phone: normalizeIndonesianPhone(studentProfile.phone),
              birth_date: studentProfile.birth_date,
              ethnicity: studentProfile.ethnicity,
              religion: studentProfile.religion,
              city: studentProfile.city,
              address: studentProfile.address,
              birth_order: studentProfile.birth_order,
              sibling_count: studentProfile.sibling_count
            }
            : {
              full_name: data.get("nama").trim(),
              nim: data.get("nim").trim(),
              program: data.get("program").trim(),
              faculty: data.get("fakultas").trim(),
              phone: normalizeIndonesianPhone(data.get("phone")),
              birth_date: data.get("tanggal_lahir"),
              ethnicity: data.get("suku_bangsa").trim(),
              religion: data.get("agama"),
              city: data.get("asal_kota").trim(),
              address: data.get("alamat").trim(),
              birth_order: Number(data.get("anak_ke")),
              sibling_count: Number(data.get("jumlah_saudara"))
            };
          if (!hasCompleteStudentProfile(profile)) {
            throw new Error("Lengkapi seluruh data diri sebelum mengirim pengajuan.");
          }
          const profileUpdate = $("#personalFields").hidden ? { phone: profile.phone } : profile;
          const { error: profileError } = await client.from("profiles").update(profileUpdate).eq("id", studentProfile.id);
          if (profileError) throw profileError;
          const times = window.counselingBackend.normalizeTime(state.selectedSlot.time);
          const { data: created, error } = await client.from("appointments").insert({
            student_id: studentProfile.id,
            requested_date: dateKey(state.selectedDate),
            requested_start_time: times.start_time,
            requested_end_time: times.end_time,
            mode: state.selectedSlot.mode,
            category: data.get("kategori"),
            issue_summary: data.get("masalah").trim(),
            reason: data.get("alasan").trim(),
            issue_details: data.get("detail").trim(),
            status: "pending"
          }).select("id,code,requested_date,requested_start_time,requested_end_time,mode,status").single();
          if (error) throw error;
          const newRequest = {
            id: created.code,
            dbId: created.id,
            date: parseDate(created.requested_date),
            time: window.counselingBackend.displayTime(created.requested_start_time, created.requested_end_time),
            mode: created.mode,
            status: "Menunggu",
            counselor: ""
          };
          Object.assign(studentProfile, profile);
          state.requests.unshift(newRequest);
          state.availableSlots[dateKey(state.selectedDate)] = slotsForDate(state.selectedDate)
            .filter(slot => slot.time !== newRequest.time || slot.mode !== newRequest.mode);
          closeBooking();
          renderRequests();
          renderCalendar();
          renderSlots();
          updateView("history");
          $("#bookingForm").reset();
          $("#studentName").value = state.userName;
          showToast(`Pengajuan ${newRequest.id} tersimpan.`);
          const message = `Hallo Kakak, Perkenalkan Nama Saya "${profile.full_name}" dengan NIM ${profile.nim} dari Program Studi ${profile.program}, saya sudah melakukan pendaftaran konseling pada hari ${formatDate(newRequest.date)} pukul ${newRequest.time}, mohon untuk diverifikasi ya kak`;
          window.setTimeout(() => {
            if (window.confirm("Pengajuan tersimpan. Buka WhatsApp untuk memberi tahu admin? Detail konseling dan data demografis tidak disertakan.")) {
              window.open(`https://wa.me/6282130155601?text=${encodeURIComponent(message)}`, "_blank", "noopener");
            }
          }, 180);
        } catch (error) {
          showToast(`Pengajuan gagal disimpan: ${error.message}`);
        }
      });
      $("#notificationButton").addEventListener("click", () => showToast("Belum ada notifikasi baru."));
      if (!window.counselingBackend.isConfigured) {
        loginNotice.textContent = "Backend belum dikonfigurasi. Ikuti langkah pada SETUP-SUPABASE.md terlebih dahulu.";
      } else {
        (async () => {
          try {
            const client = window.counselingBackend.getClient();
            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            if (!data.session) return;
            const profile = await window.counselingBackend.profileFor(client, data.session.user.id);
            if (profile.must_change_password) {
              window.location.replace("set-password.html");
              return;
            }
            if (!profile.is_active) {
              await client.auth.signOut();
              throw new Error("Akun sedang dinonaktifkan. Hubungi administrator layanan.");
            }
            if (profile.role !== "student") {
              window.location.replace(window.counselingBackend.rolePage(profile.role));
              return;
            }
            await openDashboard(profile);
          } catch (error) {
            $("#dashboard").hidden = true;
            $("#loginScreen").hidden = false;
            loginNotice.textContent = `Gagal memuat akun: ${error.message}`;
          }
        })();
      }

