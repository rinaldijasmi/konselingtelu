import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateTemporaryPassword, normalizeIndonesianPhone } from "../_shared/staff.ts";

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

  const adminClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .single();
  if (profileError || callerProfile?.role !== "superadmin" || !callerProfile.is_active) {
    return Response.json({ error: "Only an active superadmin can create staff accounts" }, { status: 403, headers: corsHeaders });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }
  const input = body as { email?: unknown; full_name?: unknown; role?: unknown; phone?: unknown };

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName = typeof input.full_name === "string" ? input.full_name.trim().replace(/\s+/g, " ") : "";
  const role = input.role;
  const phone = typeof input.phone === "string" ? normalizeIndonesianPhone(input.phone) : "";

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email address is required" }, { status: 400, headers: corsHeaders });
  }
  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return Response.json({ error: "Name must contain between 2 and 120 characters" }, { status: 400, headers: corsHeaders });
  }
  if (role !== "admin" && role !== "counselor") {
    return Response.json({ error: "Only admin and counselor accounts can be created here" }, { status: 400, headers: corsHeaders });
  }
  if (role === "counselor" && (phone.length < 10 || phone.length > 15)) {
    return Response.json({ error: "A valid counselor WhatsApp number is required" }, { status: 400, headers: corsHeaders });
  }

  const temporaryPassword = generateTemporaryPassword();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });
  if (createError || !created.user) {
    return Response.json({ error: createError?.message ?? "Could not create the account" }, { status: 400, headers: corsHeaders });
  }

  const profileUpdate: {
    role: "admin" | "counselor";
    full_name: string;
    phone?: string;
    is_active: boolean;
    must_change_password: boolean;
  } = {
    role,
    full_name: fullName,
    is_active: false,
    must_change_password: true
  };
  if (role === "counselor") profileUpdate.phone = phone;

  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update(profileUpdate)
    .eq("id", created.user.id)
    .select("id")
    .maybeSingle();
  if (updateError || !updatedProfile) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
    const message = updateError?.message ?? "The created user's profile was not updated";
    return Response.json({
      error: rollbackError ? `${message}; additionally failed to remove the incomplete auth account: ${rollbackError.message}` : message
    }, { status: 500, headers: corsHeaders });
  }

  const { error: registryError } = await adminClient.from("staff_account_registry").insert({
    user_id: created.user.id,
    account_email: email,
    created_by: user.id
  });
  if (registryError) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
    return Response.json({
      error: rollbackError
        ? `${registryError.message}; additionally failed to remove the incomplete auth account: ${rollbackError.message}`
        : registryError.message
    }, { status: 500, headers: corsHeaders });
  }

  return Response.json({
    id: created.user.id,
    email,
    role,
    phone: role === "counselor" ? phone : null,
    temporary_password: temporaryPassword
  }, { status: 201, headers: corsHeaders });
});
