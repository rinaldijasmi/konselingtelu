import { createClient } from "@supabase/supabase-js";

export const state = () => JSON.parse(process.env.UAT_STATE);

export const anonClient = () => {
  const { supabaseUrl, anonKey } = state();
  return createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
};

export async function signedInClient(role) {
  const client = anonClient();
  const { accounts } = state();
  const { error } = await client.auth.signInWithPassword({ email: accounts[role].email, password: accounts[role].password });
  if (error) throw new Error(`Login API ${role} gagal: ${error.message}`);
  return client;
}

export async function loginViaUi(page, role) {
  const { accounts } = state();
  await page.goto("index.html");
  await page.locator("#loginEmail").fill(accounts[role].email);
  await page.locator("#loginPassword").fill(accounts[role].password);
  await page.locator("#loginForm button[type=submit]").click();
  if (role === "student") await page.locator("#dashboard").waitFor({ state: "visible", timeout: 30_000 });
  else await page.waitForURL(new RegExp(`/${role}(\\.html)?(\\?.*)?$`), { timeout: 30_000 });
}
