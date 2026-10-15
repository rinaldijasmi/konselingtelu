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
  const { data: adminProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .single();
  if (profileError || !["admin", "superadmin"].includes(adminProfile?.role) || !adminProfile.is_active) {
    return Response.json({ error: "Only active administrators can add counselors" }, { status: 403, headers: corsHeaders });
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
  const input = body as { email?: unknown; full_name?: unknown; phone?: unknown; directory_id?: unknown };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const fullName = typeof input.full_name === "string" ? input.full_name.trim().replace(/\s+/g, " ") : "";
  const phone = typeof input.phone === "string" ? normalizeIndonesianPhone(input.phone) : "";
  const directoryId = typeof input.directory_id === "string" ? input.directory_id : null;
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !fullName || fullName.length < 2 || fullName.length > 120 ||
      phone.length < 10 || phone.length > 15 ||
      (directoryId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(directoryId))) {
    return Response.json({ error: "A valid email, name, and WhatsApp number are required" }, { status: 400, headers: corsHeaders });
  }
  if (directoryId) {
    const { data: directoryEntry, error: directoryError } = await adminClient
      .from("counselor_directory")
      .select("id,linked_profile_id")
      .eq("id", directoryId)
      .maybeSingle();
    if (directoryError) return Response.json({ error: directoryError.message }, { status: 500, headers: corsHeaders });
    if (!directoryEntry || directoryEntry.linked_profile_id) {
      return Response.json({ error: "The counselor directory entry is unavailable or already linked" }, { status: 409, headers: corsHeaders });
    }
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

  const { data: updatedProfile, error: updateError } = await adminClient.from("profiles").update({
    role: "counselor",
    full_name: fullName,
    phone,
    is_active: false,
    must_change_password: true
  }).eq("id", created.user.id).select("id").maybeSingle();
  if (updateError || !updatedProfile) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
    const profileMessage = updateError?.message ?? "The counselor profile was not created";
    const errorMessage = rollbackError
      ? `${profileMessage}; additionally failed to remove the incomplete auth account: ${rollbackError.message}`
      : profileMessage;
    return Response.json({ error: errorMessage }, { status: 500, headers: corsHeaders });
  }

  if (directoryId) {
    const { data: linkedEntry, error: linkError } = await adminClient.from("counselor_directory").update({
      full_name: fullName,
      phone,
      contact_email: email,
      linked_profile_id: created.user.id
    }).eq("id", directoryId).is("linked_profile_id", null).select("id").maybeSingle();
    if (linkError || !linkedEntry) {
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
      const linkMessage = linkError?.message ?? "The directory entry was linked to another account";
      const errorMessage = rollbackError
        ? `${linkMessage}; additionally failed to remove the incomplete auth account: ${rollbackError.message}`
        : linkMessage;
      return Response.json({ error: errorMessage }, { status: 500, headers: corsHeaders });
    }
  }

  const { error: registryError } = await adminClient.from("staff_account_registry").insert({
    user_id: created.user.id,
    account_email: email,
    created_by: user.id
  });
  if (registryError) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(created.user.id);
    const errorMessage = rollbackError
      ? `${registryError.message}; additionally failed to remove the incomplete auth account: ${rollbackError.message}`
      : registryError.message;
    return Response.json({ error: errorMessage }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ id: created.user.id, email, phone, temporary_password: temporaryPassword }, { status: 201, headers: corsHeaders });
});
