import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async request => {
  const allowedOrigin = Deno.env.get("APP_ORIGIN") ?? "http://localhost:8000";
  const origin = request.headers.get("Origin");
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin"
  };
  if (origin && origin !== allowedOrigin) {
    return Response.json({ error: "Origin is not allowed" }, { status: 403, headers: corsHeaders });
  }
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const authorization = request.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceRoleKey) {
    return Response.json({ error: "Server environment is not configured" }, { status: 500, headers: corsHeaders });
  }

  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }
  const password = (body as { password?: unknown }).password;
  const passwordBytes = typeof password === "string" ? new TextEncoder().encode(password).length : 0;
  if (typeof password !== "string" || password.length < 12 || passwordBytes > 72) {
    return Response.json({ error: "Password must contain at least 12 characters and no more than 72 UTF-8 bytes" }, { status: 400, headers: corsHeaders });
  }

  const adminClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role,must_change_password")
    .eq("id", user.id)
    .single();
  if (profileError || !profile || !["admin", "counselor", "superadmin"].includes(profile.role)) {
    return Response.json({ error: "Staff account profile not found" }, { status: 403, headers: corsHeaders });
  }
  if (!profile.must_change_password) {
    return Response.json({ error: "This account does not require an initial password change" }, { status: 409, headers: corsHeaders });
  }

  const { error: passwordError } = await adminClient.auth.admin.updateUserById(user.id, { password });
  if (passwordError) {
    return Response.json({ error: passwordError.message }, { status: 400, headers: corsHeaders });
  }

  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update({ must_change_password: false, is_active: true })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (updateError || !updatedProfile) {
    return Response.json({
      error: `Password updated, but the initial-password flag could not be cleared. Submit the new password again to retry. ${updateError?.message ?? ""}`.trim()
    }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ success: true }, { status: 200, headers: corsHeaders });
});
