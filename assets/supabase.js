(function () {
  const config = window.SUPABASE_CONFIG || {};

  function getClient() {
    if (!config.url || !config.anonKey || config.url.includes("YOUR_PROJECT_ID") || config.anonKey.includes("YOUR_")) {
      throw new Error("Supabase belum dikonfigurasi. Salin assets/supabase-config.example.js menjadi assets/supabase-config.js lalu isi URL dan anon key proyek.");
    }
    if (!window.supabase?.createClient) {
      throw new Error("Supabase JS belum termuat. Periksa koneksi internet dan coba muat ulang halaman.");
    }
    if (!window.__counselingSupabase) {
      window.__counselingSupabase = window.supabase.createClient(config.url, config.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return window.__counselingSupabase;
  }

  async function profileFor(client, userId) {
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  }

  function rolePage(role) {
    if (role === "admin" || role === "superadmin") return "admin.html";
    if (role === "counselor") return "counselor.html";
    if (role === "student") return "index.html";
    throw new Error("Role akun tidak dikenal. Minta administrator memeriksa profil akun.");
  }

  async function requireRole(expectedRole) {
    const client = getClient();
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    if (!session) {
      window.location.replace("index.html");
      return null;
    }
    const profile = await profileFor(client, session.user.id);
    if (profile.must_change_password && expectedRole !== "password-change") {
      window.location.replace("set-password.html");
      return null;
    }
    if (!profile.is_active && !(expectedRole === "password-change" && profile.must_change_password)) {
      await client.auth.signOut();
      throw new Error("Akun sedang dinonaktifkan. Hubungi administrator layanan.");
    }
    const roleMatches = expectedRole === "password-change" ||
      profile.role === expectedRole ||
      (expectedRole === "admin" && profile.role === "superadmin");
    if (!roleMatches) {
      window.location.replace(rolePage(profile.role));
      return null;
    }
    return { client, user: session.user, profile };
  }

  async function login(email, password) {
    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    try {
      const profile = await profileFor(client, data.user.id);
      if (profile.must_change_password) {
        window.location.assign("set-password.html");
        return;
      }
      if (!profile.is_active) throw new Error("Akun sedang dinonaktifkan. Hubungi administrator layanan.");
      window.location.assign(rolePage(profile.role));
    } catch (error) {
      await client.auth.signOut();
      throw error;
    }
  }

  async function signUpStudent(fullName, email, password) {
    const client = getClient();
    const redirectTo = new URL("index.html", window.location.href).toString();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: redirectTo
      }
    });
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error("Email ini sudah terdaftar. Silakan masuk dengan akun Anda.");
    }
    if (!data.session || !data.user) return data;

    try {
      const profile = await profileFor(client, data.user.id);
      if (!profile.is_active) throw new Error("Akun sedang dinonaktifkan. Hubungi administrator layanan.");
      return { ...data, profile };
    } catch (error) {
      await client.auth.signOut();
      throw error;
    }
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
    window.location.replace("index.html");
  }

  function showAuthError(error) {
    document.body.classList.add("authenticated");
    const message = document.createElement("main");
    message.setAttribute("role", "alert");
    message.style.cssText = "max-width:620px;margin:12vh auto;padding:28px;border:1px solid #eceaeb;border-radius:12px;background:white;color:#29282a;font:14px/1.6 system-ui,sans-serif";
    const title = document.createElement("h1");
    title.style.cssText = "margin:0 0 10px;font-size:22px";
    title.textContent = "Ruang layanan belum tersambung";
    const detail = document.createElement("p");
    detail.textContent = error.message || "Autentikasi gagal.";
    const setup = document.createElement("a");
    setup.href = "SETUP-SUPABASE.md";
    setup.textContent = "Buka panduan konfigurasi Supabase";
    setup.style.color = "#c41230";
    message.append(title, detail, setup);
    document.body.replaceChildren(message);
  }

  async function guardPage(expectedRole) {
    try {
      const context = await requireRole(expectedRole);
      if (context) document.body.classList.add("authenticated");
      return context;
    } catch (error) {
      showAuthError(error);
      return null;
    }
  }

  async function guardPasswordChangePage() {
    try {
      const context = await requireRole("password-change");
      if (!context) return null;
      if (!context.profile.must_change_password) {
        window.location.replace(rolePage(context.profile.role));
        return null;
      }
      document.body.classList.add("authenticated");
      return context;
    } catch (error) {
      showAuthError(error);
      return null;
    }
  }

  async function completeStaffSetup(password) {
    const { data, error } = await getClient().functions.invoke("complete-staff-setup", {
      body: { password }
    });
    if (error) throw error;
    if (!data?.success) throw new Error("Kata sandi berubah, tetapi status akun belum berhasil diperbarui.");
    return data;
  }

  async function loadAppointments(client, { includeProfiles = true } = {}) {
    const { data: appointments, error } = await client
      .from("appointments")
      .select("*")
      .order("requested_date", { ascending: false });
    if (error) throw error;
    if (!includeProfiles || !appointments.length) return appointments;

    const profileIds = [...new Set(appointments.flatMap(appointment => [appointment.student_id, appointment.counselor_id]).filter(Boolean))];
    const guestStudentIds = [...new Set(appointments.map(appointment => appointment.guest_student_id).filter(Boolean))];
    const [profilesResult, guestStudentsResult] = await Promise.all([
      profileIds.length
        ? client.from("profiles").select("*").in("id", profileIds)
        : Promise.resolve({ data: [], error: null }),
      guestStudentIds.length
        ? client.from("guest_students").select("*").in("id", guestStudentIds)
        : Promise.resolve({ data: [], error: null })
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (guestStudentsResult.error) throw guestStudentsResult.error;
    const byId = new Map(profilesResult.data.map(profile => [profile.id, profile]));
    const guestStudentsById = new Map(guestStudentsResult.data.map(student => [student.id, student]));
    return appointments.map(appointment => ({
      ...appointment,
      student: byId.get(appointment.student_id) || null,
      guestStudent: guestStudentsById.get(appointment.guest_student_id) || null,
      counselor: byId.get(appointment.counselor_id) || null
    }));
  }

  async function loadReports(client, appointments) {
    const { data: reports, error } = await client.from("counseling_reports").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    const appointmentById = new Map(appointments.map(appointment => [appointment.id, appointment]));
    return reports.map(report => ({ ...report, appointment: appointmentById.get(report.appointment_id) || null }));
  }

  async function loadAvailableSlots(client, startDate, endDate) {
    const { data, error } = await client.rpc("available_counseling_slots_range", {
      p_start_date: startDate,
      p_end_date: endDate
    });
    if (error) throw error;
    return data;
  }

  function normalizeTime(timeRange) {
    const [start, end] = String(timeRange || "").split("–").map(value => value.trim().replace(".", ":"));
    if (!start || !end) throw new Error("Format jam sesi tidak valid.");
    return { start_time: `${start}:00`, end_time: `${end}:00` };
  }

  function displayTime(start, end) {
    const format = value => String(value || "").slice(0, 5).replace(":", ".");
    return `${format(start)}–${format(end)}`;
  }

  window.counselingBackend = {
    isConfigured: Boolean(config.url && config.anonKey && !config.url.includes("YOUR_PROJECT_ID") && !config.anonKey.includes("YOUR_")),
    getClient,
    profileFor,
    rolePage,
    requireRole,
    guardPage,
    showAuthError,
    guardPasswordChangePage,
    completeStaffSetup,
    login,
    signUpStudent,
    signOut,
    loadAppointments,
    loadReports,
    loadAvailableSlots,
    normalizeTime,
    displayTime
  };
})();
