import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { anonClient, loginViaUi, signedInClient, state } from "../helpers.js";

const omniRow = nim => ({
  nim, full_name: "UAT Impor OMNI", program_study: "S1 Uji", faculty: "Fakultas Uji", cohort: "2026",
  fill_status: "Lengkap", is_complete: true, validity: { VRIN: 40 }, normal_scales: { AE: 50 },
  pd_scales: { PAR: 50 }, factor_scales: { AGRE: 50 }, pd_flag_count: 0, pd_top_scale: "PAR", pd_top_t: 50, pd_status: "Tidak perlu telaah"
});

const serviceClient = () => createClient(state().supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

test.describe("Profiling OMNI (API)", () => {
  test("anon dan mahasiswa tidak bisa membaca atau mengisi data OMNI", async () => {
    const anon = anonClient();
    const anonRead = await anon.from("omni_results").select("nim").limit(1);
    expect(Boolean(anonRead.error) || anonRead.data.length === 0).toBe(true);
    expect((await anon.rpc("admin_upsert_omni_results", { p_rows: [omniRow("9900000011")] })).error).toBeTruthy();

    const student = await signedInClient("student");
    const read = await student.from("omni_results").select("nim").limit(5);
    expect(Boolean(read.error) || read.data.length === 0).toBe(true);
    expect((await student.rpc("admin_upsert_omni_results", { p_rows: [omniRow("9900000011")] })).error).toBeTruthy();
    expect((await student.rpc("counselor_omni_result", { p_nim: state().nim })).data ?? null).toBeNull();
  });

  test("konselor hanya melihat OMNI mahasiswanya sendiri", async () => {
    const client = await signedInClient("counselor");
    const own = await client.rpc("counselor_omni_result", { p_nim: state().nim });
    expect(own.error).toBeNull();
    expect(own.data?.nim).toBe(state().nim);
    expect(own.data).not.toHaveProperty("resilience_index");
    expect(own.data?.imported_at).toBeUndefined();

    const { data: others } = await serviceClient().from("omni_results").select("nim").neq("nim", state().nim).limit(1);
    if (others?.length) expect((await client.rpc("counselor_omni_result", { p_nim: others[0].nim })).data).toBeNull();
    expect((await client.rpc("admin_upsert_omni_results", { p_rows: [omniRow("9900000011")] })).error).toBeTruthy();
    const direct = await client.from("omni_results").select("nim").limit(5);
    expect(Boolean(direct.error) || direct.data.length === 0).toBe(true);
  });

  test("admin: tambah data OMNI dan analisis AI tanpa resiliensi", async () => {
    const admin = await signedInClient("admin");
    const saved = await admin.rpc("admin_upsert_omni_results", { p_rows: [omniRow("9900000011")] });
    expect(saved.error).toBeNull();
    expect(saved.data).toBe(1);
    expect((await admin.rpc("admin_upsert_omni_results", { p_rows: "bukan-array" })).error).toBeTruthy();

    const ai = await admin.functions.invoke("analyze-pandu", { body: { nim: state().nim, source: "omni" } });
    expect(ai.error).toBeNull();
    expect(ai.data?.analysis?.validitas?.status).toBeTruthy();
    expect(JSON.stringify(ai.data.analysis).toLowerCase()).not.toContain("resiliensi");
  });
});

test.describe("Profiling OMNI (UI)", () => {
  test("admin: menu OMNI terpisah, tanpa resiliensi, detail dan unggah", async ({ page }) => {
    test.setTimeout(300_000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await loginViaUi(page, "admin");
    await expect(page.locator('.nav-button[data-view="omni"]')).toBeVisible();
    await page.locator('.nav-button[data-view="omni"]').click();
    await expect(page.locator("#breadcrumbCurrent")).toContainText("OMNI");
    await expect(page.locator("#omniTotal")).not.toHaveText("0", { timeout: 180_000 });
    await expect(page.locator("#omniList [data-omni-nim]")).toHaveCount(100);
    await expect(page.locator("#omniPageInfo")).toContainText("Halaman 1");
    await page.locator("#omniNext").click();
    await expect(page.locator("#omniPageInfo")).toContainText("Halaman 2");
    await expect(page.locator("#omniList [data-omni-nim]")).toHaveCount(100);
    await page.locator("#omniPrevious").click();
    await expect(page.locator("#omniPageInfo")).toContainText("Halaman 1");
    await expect(page.locator("#omniView")).not.toContainText("esiliensi");

    await page.locator("#omniSearch").fill(state().nim);
    const row = page.locator(`#omniList [data-omni-nim="${state().nim}"]`);
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.locator("#omniDetail")).toContainText(state().name);
    await expect(page.locator("#omniDetail")).not.toContainText("esiliensi");
    await expect(page.locator("#omniDetail [data-omni-print]")).toBeVisible();

    await page.locator("#omniDetail [data-omni-ai]").click();
    await expect(page.locator("#omniAiPanel")).toContainText("Validitas hasil profiling", { timeout: 60_000 });

    await page.locator("#omniAddButton").click();
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 40_000 }), page.locator("#omniTemplateButton").click()]);
    expect(download.suggestedFilename()).toBe("Template-Profiling-OMNI.xlsx");

    const csv = join(mkdtempSync(join(tmpdir(), "uat-")), "omni.csv");
    const header = ["No", "NIM / ID", "Nama", "Program Studi", "Fakultas", "Angkatan", "Status Pengisian", "VRIN", "CD", "AE", "WR", "PAR", "OBC", "AGRE", "SENS", "Jumlah PD ≥70", "Skala PD Tertinggi", "T-score PD Tertinggi", "Status PD"];
    const values = ["1", "9900000012", "UAT Unggah OMNI", "S1 Uji", "Fakultas Uji", "2026", "Lengkap", "44", "50", "52", "48", "55", "50", "49", "51", "0", "PAR", "55", "Tidak perlu telaah"];
    writeFileSync(csv, `${header.join(",")}\n${values.join(",")}\n`);
    await page.locator("#omniImportFile").setInputFiles(csv);
    await expect(page.locator("#omniImportSummary")).toContainText("1 mahasiswa siap disimpan", { timeout: 40_000 });
    await page.locator("#omniImportConfirm").click();
    await expect(page.locator("#omniImportBackdrop")).toBeHidden({ timeout: 40_000 });
    const { data } = await serviceClient().from("omni_results").select("nim,full_name,is_complete").eq("nim", "9900000012").single();
    expect(data).toMatchObject({ full_name: "UAT Unggah OMNI", is_complete: true });
    expect(errors).toEqual([]);
  });

  test("konselor: melihat hasil PANDU dan OMNI mahasiswanya", async ({ page }) => {
    await loginViaUi(page, "counselor");
    await expect(page.locator("#scheduleList button, #scheduleList .session-card, #scheduleList [role=button]").first()).toBeVisible({ timeout: 30_000 });
    await page.locator("#scheduleList button, #scheduleList .session-card, #scheduleList [role=button]").first().click();
    await expect(page.locator("#scheduleDetail")).toContainText("Hasil Tes OMNI");
    const omniBox = page.locator("#scheduleDetail .pandu-box").nth(1);
    await expect(omniBox).toContainText("Borderline", { timeout: 20_000 });
    await expect(omniBox).not.toContainText("esiliensi");
    await expect(page.locator("#scheduleDetail .pandu-box").first()).toContainText("Schizotypal");
  });
});
