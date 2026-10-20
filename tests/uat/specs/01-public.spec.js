import { test, expect } from "@playwright/test";
import { state } from "../helpers.js";

const PAGES = ["index.html", "set-password.html"];

test.describe("Publik & keamanan dasar", () => {
  for (const path of PAGES) {
    test(`${path} dapat dibuka tanpa error JavaScript`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const response = await page.goto(path);
      expect(response.status()).toBe(200);
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }

  test("halaman login tampil dengan formulir lengkap", async ({ page }) => {
    await page.goto("index.html");
    await expect(page.locator("#loginForm")).toBeVisible();
    await expect(page.locator("#loginEmail")).toBeVisible();
    await expect(page.locator("#loginPassword")).toBeVisible();
    await expect(page).toHaveTitle(/.+/);
  });

  for (const path of ["admin.html", "counselor.html"]) {
    test(`${path} tanpa login diarahkan ke halaman masuk`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/(index\.html)?(\?.*)?$/, { timeout: 20_000 });
      await expect(page.locator("#loginForm")).toBeVisible();
    });
  }

  test("login dengan kata sandi salah menampilkan pesan error", async ({ page }) => {
    await page.goto("index.html");
    await page.locator("#loginEmail").fill(state().accounts.student.email);
    await page.locator("#loginPassword").fill("kata-sandi-salah-123");
    await page.locator("#loginForm button[type=submit]").click();
    await expect(page.locator("#loginNotice")).not.toBeEmpty();
    await expect(page.locator("#dashboard")).toBeHidden();
  });

  test("tidak ada service-role key atau secret di berkas publik", async ({ request, baseURL }) => {
    const files = ["index.html", "admin.html", "counselor.html", "set-password.html", "assets/supabase-config.js", "assets/supabase.js",
      "assets/js/index.js", "assets/js/admin.js", "assets/js/admin-pandu.js", "assets/js/counselor.js", "assets/js/pandu-labels.js"];
    for (const file of files) {
      const body = await (await request.get(new URL(file, baseURL).toString())).text();
      expect(body, file).not.toMatch(/service_role/i);
      expect(body, file).not.toMatch(/sk-(proj-)?[A-Za-z0-9_-]{20,}/);
      expect(body, file).not.toMatch(/OPENAI_API_KEY\s*[:=]\s*["']/);
    }
    const config = await (await request.get(new URL("assets/supabase-config.js", baseURL).toString())).text();
    const token = config.match(/"?anonKey"?\s*:\s*"([^"]+)"/)[1];
    expect(token).not.toMatch(/^sb_secret_/);
    if (token.startsWith("eyJ")) {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      expect(payload.role).toBe("anon");
    } else {
      expect(token).toMatch(/^sb_publishable_/);
    }
  });

  test("situs memakai HTTPS bila diuji di domain publik", async ({ baseURL }) => {
    test.skip(/localhost|127\.0\.0\.1/.test(baseURL), "Pengujian lokal");
    expect(baseURL.startsWith("https://")).toBe(true);
  });
});
