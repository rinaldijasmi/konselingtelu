import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { anonClient, signedInClient, state } from "../helpers.js";

const adminRow = nim => ({
  nim, full_name: "UAT Impor", program_study: "S1 Uji", faculty: "Fakultas Uji", cohort: "2026",
  fill_status: "Lengkap", is_complete: true, validity: { VRIN: 40 }, normal_scales: { AE: 50 },
  pd_scales: { PAR: 50 }, factor_scales: { AGRE: 50 }, pd_flag_count: 0, pd_top_scale: "PAR", pd_top_t: 50,
  pd_status: "Tidak perlu telaah", resilience_score: 20, resilience_index: 50
});

const denied = result => Boolean(result.error) || result.data === null || (Array.isArray(result.data) && result.data.length === 0);

test.describe("Keamanan data & hak akses (API)", () => {
  test("anon tidak bisa membaca data sensitif", async () => {
    const client = anonClient();
    for (const table of ["pandu_results", "profiles", "appointments", "counseling_reports", "guest_students"]) {
      const result = await client.from(table).select("*").limit(5);
      expect(denied(result), `anon membaca ${table}`).toBe(true);
    }
  });

  test("anon tidak bisa memanggil fungsi admin/konselor", async () => {
    const client = anonClient();
    expect((await client.rpc("admin_upsert_pandu_results", { p_rows: [adminRow("9900000002")] })).error).toBeTruthy();
    expect(denied(await client.rpc("counselor_pandu_result", { p_nim: state().nim }))).toBe(true);
  });

  test("fungsi AI menolak panggilan tanpa login", async () => {
    const { supabaseUrl, anonKey, nim } = state();
    for (const headers of [{}, { Authorization: `Bearer ${anonKey}` }]) {
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-pandu`, {
        method: "POST", headers: { "Content-Type": "application/json", apikey: anonKey, ...headers }, body: JSON.stringify({ nim })
      });
      expect([401, 403]).toContain(response.status);
    }
  });

  test("mahasiswa tidak bisa membaca profiling, mengimpor, atau memakai AI", async () => {
    const client = await signedInClient("student");
    expect(denied(await client.from("pandu_results").select("nim").limit(5))).toBe(true);
    expect((await client.rpc("admin_upsert_pandu_results", { p_rows: [adminRow("9900000002")] })).error).toBeTruthy();
    expect(denied(await client.rpc("counselor_pandu_result", { p_nim: state().nim }))).toBe(true);
    const ai = await client.functions.invoke("analyze-pandu", { body: { nim: state().nim } });
    expect(ai.error).toBeTruthy();
    expect(ai.error.context?.status).toBe(403);
  });

  test("mahasiswa tidak bisa menaikkan role sendiri", async () => {
    const client = await signedInClient("student");
    const { accounts } = state();
    await client.from("profiles").update({ role: "admin" }).eq("id", accounts.student.id);
    const { data } = await client.from("profiles").select("role").eq("id", accounts.student.id).single();
    expect(data.role).toBe("student");
    expect(denied(await client.rpc("admin_upsert_pandu_results", { p_rows: [adminRow("9900000002")] }))).toBe(true);
  });

  test("mahasiswa hanya melihat pengajuannya sendiri", async () => {
    const client = await signedInClient("student");
    const { data, error } = await client.from("appointments").select("id,student_id");
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
    expect(data.every(row => row.student_id === state().accounts.student.id)).toBe(true);
  });

  test("konselor: hanya melihat profiling mahasiswanya sendiri", async () => {
    const client = await signedInClient("counselor");
    const own = await client.rpc("counselor_pandu_result", { p_nim: state().nim });
    expect(own.error).toBeNull();
    expect(own.data?.nim).toBe(state().nim);
    expect(own.data?.imported_at).toBeUndefined();

    const { data: any } = await createClient(state().supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      .from("pandu_results").select("nim").neq("nim", state().nim).limit(1);
    const other = await client.rpc("counselor_pandu_result", { p_nim: any[0].nim });
    expect(other.data).toBeNull();

    expect(denied(await client.from("pandu_results").select("nim").limit(5))).toBe(true);
    expect((await client.rpc("admin_upsert_pandu_results", { p_rows: [adminRow("9900000002")] })).error).toBeTruthy();
    const ai = await client.functions.invoke("analyze-pandu", { body: { nim: state().nim } });
    expect(ai.error?.context?.status).toBe(403);
  });

  test("admin: membaca, menambah, memvalidasi input, dan memakai AI", async () => {
    const client = await signedInClient("admin");
    const { count, error } = await client.from("pandu_results").select("nim", { count: "exact", head: true });
    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);

    const saved = await client.rpc("admin_upsert_pandu_results", { p_rows: [adminRow("9900000002"), { ...adminRow(""), nim: "" }] });
    expect(saved.error).toBeNull();
    expect(saved.data).toBe(1);

    // hasil lengkap tidak tertimpa data belum lengkap
    await client.rpc("admin_upsert_pandu_results", { p_rows: [{ ...adminRow("9900000002"), is_complete: false, fill_status: "Belum lengkap (5/375)" }] });
    const check = await client.from("pandu_results").select("is_complete").eq("nim", "9900000002").single();
    expect(check.data.is_complete).toBe(true);

    expect((await client.rpc("admin_upsert_pandu_results", { p_rows: "bukan-array" })).error).toBeTruthy();
    expect((await client.rpc("admin_upsert_pandu_results", { p_rows: Array.from({ length: 501 }, (_, index) => adminRow(`99${index}`)) })).error).toBeTruthy();

    const notFound = await client.functions.invoke("analyze-pandu", { body: { nim: "0000000000" } });
    expect(notFound.error?.context?.status).toBe(404);
    const badBody = await client.functions.invoke("analyze-pandu", { body: {} });
    expect(badBody.error?.context?.status).toBe(400);

    const ai = await client.functions.invoke("analyze-pandu", { body: { nim: state().nim } });
    expect(ai.error).toBeNull();
    const analysis = ai.data.analysis;
    expect(["Valid", "Perlu kehati-hatian", "Tidak dapat dinilai"]).toContain(analysis.validitas.status);
    for (const key of ["pertimbangan", "mencolok", "risiko", "kelebihan", "potensi"]) expect(analysis[key].length, key).toBeGreaterThan(0);
    expect(JSON.stringify(analysis)).not.toContain(state().name);
  });

  test("analisis AI ditolak untuk pengisian belum lengkap", async () => {
    const client = await signedInClient("admin");
    await client.rpc("admin_upsert_pandu_results", { p_rows: [{ ...adminRow("9900000003"), is_complete: false, fill_status: "Belum lengkap (5/375)" }] });
    const ai = await client.functions.invoke("analyze-pandu", { body: { nim: "9900000003" } });
    expect(ai.error?.context?.status).toBe(422);
    await createClient(state().supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      .from("pandu_results").delete().eq("nim", "9900000003");
  });
});
