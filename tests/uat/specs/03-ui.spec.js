import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loginViaUi, state } from "../helpers.js";

const collectErrors = page => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  return errors;
};

test.describe("Alur mahasiswa", () => {
  test("login, dashboard, kalender, direktori konselor, logout", async ({ page }) => {
    const errors = collectErrors(page);
    await loginViaUi(page, "student");
    await expect(page.locator("#userName")).toContainText("UAT");
    await expect(page.locator("#calendar")).toBeVisible();
    await expect(page.locator("#calendar button, #calendar [role=gridcell]").first()).toBeVisible();
    await page.locator("#openCounselorDirectory").click();
    await expect(page.locator("#directoryBackdrop")).toBeVisible();
    await expect(page.locator("#counselorDirectoryList")).not.toBeEmpty();
    await page.locator("#closeCounselorDirectory").click();
    await expect(page.locator("#directoryBackdrop")).toBeHidden();
    await page.locator("#logoutButton").click();
    await expect(page.locator("#loginForm")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("mahasiswa tidak bisa membuka halaman admin & konselor", async ({ page }) => {
    await loginViaUi(page, "student");
    for (const path of ["admin.html", "counselor.html"]) {
      await page.goto(path);
      await page.waitForURL(/index\.html/, { timeout: 20_000 });
      await expect(page.locator("#dashboard")).toBeVisible();
    }
  });
});

test.describe("Alur konselor", () => {
  test("halaman konselor memuat jadwal dan hasil profiling mahasiswa", async ({ page }) => {
    const errors = collectErrors(page);
    await loginViaUi(page, "counselor");
    await expect(page.locator("#signedInCounselor")).toContainText("UAT");
    const session = page.locator("#scheduleList button, #scheduleList .session-card, #scheduleList [role=button]").first();
    await expect(session).toBeVisible({ timeout: 30_000 });
    await session.click();
    await expect(page.locator("#scheduleDetail")).toContainText(state().nim);
    await expect(page.locator("#scheduleDetail")).toContainText("Hasil profiling PANDU Tel-U");
    await expect(page.locator("#scheduleDetail .pandu-box").first()).toContainText("Perlu telaah profesional", { timeout: 20_000 });
    await expect(page.locator("#scheduleDetail .pandu-box").first()).toContainText("Schizotypal");
    await expect(page.locator("body")).not.toContainText("belum tersambung");
    expect(errors).toEqual([]);
  });
});

test.describe("Alur admin", () => {
  test("menu Profiling terpisah dari Pengelolaan", async ({ page }) => {
    const errors = collectErrors(page);
    await loginViaUi(page, "admin");
    const labels = await page.locator(".side-label").allTextContents();
    expect(labels).toContain("Profiling");
    await expect(page.locator('nav[aria-label="Menu pengelolaan"] [data-view="pandu"]')).toHaveCount(0);
    await expect(page.locator('nav[aria-label="Menu profiling"] [data-view="pandu"]')).toBeVisible();
    for (const view of ["schedule", "applications", "counselors", "reports"]) {
      await page.locator(`.nav-button[data-view="${view}"]`).click();
      await expect(page.locator("#breadcrumbCurrent")).not.toBeEmpty();
    }
    expect(errors).toEqual([]);
  });

  test("Profiling PANDU: daftar, filter, detail, cetak, dan analisis AI", async ({ page }) => {
    const errors = collectErrors(page);
    await loginViaUi(page, "admin");
    await page.locator('.nav-button[data-view="pandu"]').click();
    await expect(page.locator("#panduTotal")).not.toHaveText("0", { timeout: 60_000 });
    await expect(page.locator("#panduList .report-student").first()).toBeVisible();
    for (const id of ["panduFacultyFilter", "panduProgramFilter", "panduCohortFilter"]) {
      expect(await page.locator(`#${id} option`).count(), id).toBeGreaterThan(1);
    }

    await page.locator("#panduFacultyFilter").selectOption({ index: 1 });
    await expect(page.locator("#panduListCount")).not.toBeEmpty();
    await page.locator("#panduResetFilters").click();

    await page.locator("#panduSearch").fill(state().nim);
    const row = page.locator(`#panduList [data-pandu-nim="${state().nim}"]`);
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.locator("#panduDetail")).toContainText(state().name);
    await expect(page.locator("#panduDetail")).toContainText("Resiliensi");
    await expect(page.locator("#panduDetail")).not.toContainText("Butir reverse");
    await expect(page.locator("#panduDetail [data-pandu-print]")).toBeVisible();

    await page.evaluate(() => {
      window.__printFrames = 0;
      new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => { if (n.tagName === "IFRAME") window.__printFrames += 1; })))
        .observe(document.body, { childList: true });
    });
    await page.locator("#panduDetail [data-pandu-print]").click();
    await expect.poll(() => page.evaluate(() => window.__printFrames), { timeout: 10_000 }).toBeGreaterThan(0);

    await page.locator("#panduDetail [data-pandu-ai]").click();
    await expect(page.locator("#panduAiPanel")).toContainText("Validitas hasil profiling", { timeout: 60_000 });
    for (const heading of ["Hal yang perlu dipertimbangkan", "Hal yang mencolok", "Risiko terbesar", "Kelebihan", "Potensi yang bisa dikembangkan"]) {
      await expect(page.locator("#panduAiPanel")).toContainText(heading);
    }
    expect(errors).toEqual([]);
  });

  test("Profiling PANDU: unduh template dan unggah data baru", async ({ page }) => {
    await loginViaUi(page, "admin");
    await page.locator('.nav-button[data-view="pandu"]').click();
    await expect(page.locator("#panduTotal")).not.toHaveText("0", { timeout: 60_000 });
    await page.locator("#panduAddButton").click();
    await expect(page.locator("#panduImportBackdrop")).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 40_000 }), page.locator("#panduTemplateButton").click()]);
    expect(download.suggestedFilename()).toBe("Template-Profiling-PANDU.xlsx");

    const csv = join(mkdtempSync(join(tmpdir(), "uat-")), "pandu.csv");
    const header = ["No", "NIM / ID", "Nama", "Program Studi", "Fakultas", "Angkatan", "Status Pengisian", "VRIN", "CD", "AE", "WR", "PAR", "OBC", "AGRE", "SENS", "Jumlah PD ≥70", "Skala PD Tertinggi", "T-score PD Tertinggi", "Status PD", "Skor Resiliensi", "Indeks Resiliensi (0-100)"];
    const rowValues = ["1", "9900000004", "UAT Unggah", "S1 Uji", "Fakultas Uji", "2026", "Lengkap", "44", "50", "52", "48", "55", "50", "49", "51", "0", "PAR", "55", "Tidak perlu telaah", "20", "50"];
    writeFileSync(csv, `${header.join(",")}\n${rowValues.join(",")}\n`);
    await page.locator("#panduImportFile").setInputFiles(csv);
    await expect(page.locator("#panduImportSummary")).toContainText("1 mahasiswa siap disimpan", { timeout: 40_000 });
    await expect(page.locator("#panduImportSummary")).toContainText("1 NIM baru");

    await page.locator("#panduImportConfirm").click();
    await expect(page.locator("#panduImportBackdrop")).toBeHidden({ timeout: 40_000 });
    const service = createClient(state().supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data } = await service.from("pandu_results").select("nim,full_name,is_complete").eq("nim", "9900000004").single();
    expect(data).toMatchObject({ nim: "9900000004", full_name: "UAT Unggah", is_complete: true });

    await page.locator("#panduAddButton").click();
    await page.locator("#panduImportFile").setInputFiles({ name: "salah.csv", mimeType: "text/csv", buffer: Buffer.from("a,b\n1,2\n") });
    await expect(page.locator("#panduImportMessage")).toContainText("NIM / ID", { timeout: 20_000 });
  });
});
