import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PD_LABELS: Record<string, string> = {
  PAR: "Paranoid", SCH: "Schizoid", SCT: "Schizotypal", ANT: "Antisocial", BOR: "Borderline",
  HIS: "Histrionic", NAR: "Narcissistic", AVD: "Avoidant", DEP: "Dependent", OBC: "Obsessive-Compulsive"
};
const FACTOR_LABELS: Record<string, string> = {
  AGRE: "Agreeableness", CONC: "Conscientiousness", EXTR: "Extraversion", NARC: "Narcissism",
  NEUR: "Neuroticism", OPEN: "Openness", SENS: "Sensation-Seeking"
};
const NORMAL_LABELS: Record<string, string> = {
  AE: "Aestheticism", AM: "Ambition", AN: "Anxiety", AS: "Assertiveness", CO: "Conventionality",
  DE: "Depression", DU: "Dutifulness", EC: "Excitement", EH: "Exhibitionism", EN: "Energy",
  FL: "Flexibility", HS: "Hostility", IM: "Impulsiveness", IT: "Intellect", IR: "Irritability",
  MD: "Modesty", MO: "Moodiness", OR: "Orderliness", SI: "Self-Indulgence", SN: "Sincerity",
  SO: "Sociability", SR: "Self-Reliance", TO: "Tolerance", TR: "Trustfulness", WR: "Warmth"
};
const VALIDITY_LABELS: Record<string, string> = { VRIN: "VRIN (Variable Response Inconsistency)", CD: "Current Distress" };

const LIST_SECTIONS = ["pertimbangan", "mencolok", "risiko", "kelebihan", "potensi"];

const SYSTEM_PROMPT = `Kamu adalah asisten analisis untuk psikolog dan staf layanan konseling Direktorat Kemahasiswaan, Karier dan Alumni Telkom University.
Kamu menerima skor tes PANDU Tel-U (Personality, Adaptability, and Resilience Diagnostic) seorang mahasiswa: skala validitas, normal scales, personality disorder (PD) scales, factor scales, dan indeks resiliensi 0-100. Skor skala adalah T-score (rata-rata 50, simpangan baku 10); T >= 70 dianggap tinggi/ditandai.
Aturan:
- Tulis dalam Bahasa Indonesia yang sederhana dan mudah dipahami admin non-psikolog. Hindari jargon; jika perlu istilah teknis, beri penjelasan singkat dalam kurung.
- Ini hasil skrining, BUKAN diagnosis. Jangan memberi label diagnosis klinis. Gunakan bahasa hati-hati seperti "cenderung", "mengindikasikan", "perlu ditelaah".
- Tulis nama skala persis seperti di data (misalnya "Conventionality (CO)", "Sensation-Seeking (SENS)"); jangan menerjemahkan atau mengubah artinya. Jelaskan maknanya dengan kata sederhana bila perlu.
- Hanya gunakan data yang diberikan; jangan mengarang skor atau fakta lain. Sebut nama skala dan angkanya bila relevan.
- Jika validitas diragukan, katakan dengan jelas dan batasi kesimpulan.
- Setiap bagian berisi 2 sampai 5 poin ringkas (satu kalimat per poin, maksimal sekitar 30 kata).
- Bagian "validitas" berisi "status" (salah satu: "Valid", "Perlu kehati-hatian", "Tidak dapat dinilai") dan "poin".
Balas HANYA dengan JSON berbentuk:
{"validitas":{"status":"...","poin":["..."]},"pertimbangan":["..."],"mencolok":["..."],"risiko":["..."],"kelebihan":["..."],"potensi":["..."]}
Arti bagian: validitas = apakah hasil dapat dipercaya; pertimbangan = hal yang perlu dipertimbangkan konselor/psikolog tentang mahasiswa ini; mencolok = skor atau pola yang paling menonjol; risiko = risiko terbesar yang mungkin dihadapi mahasiswa; kelebihan = kekuatan mahasiswa; potensi = potensi yang bisa dikembangkan beserta saran singkat.`;

function labelled(scores: Record<string, unknown> | null, labels: Record<string, string>) {
  return Object.fromEntries(Object.entries(scores ?? {}).map(([code, value]) => [`${labels[code] ?? code} (${code})`, value]));
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(item => typeof item === "string" && item.trim()).map(item => item.trim().slice(0, 400)).slice(0, 6);
}

Deno.serve(async request => {
  const allowedOrigin = Deno.env.get("APP_ORIGIN") ?? "http://localhost:8000";
  const origin = request.headers.get("Origin");
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin"
  };
  const fail = (error: string, status: number) => Response.json({ error }, { status, headers: corsHeaders });

  if (origin && origin !== allowedOrigin) return fail("Origin is not allowed", 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return fail("Method not allowed", 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return fail("Unauthorized", 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!url || !anonKey || !serviceRoleKey) return fail("Server environment is not configured", 500);
  if (!openAiKey) return fail("OPENAI_API_KEY belum diatur di Supabase secrets", 500);

  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) return fail("Unauthorized", 401);

  const adminClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.is_active || !["admin", "superadmin"].includes(profile.role)) {
    return fail("Only active admins can analyze PANDU results", 403);
  }

  let nim = "";
  try {
    const body = await request.json();
    nim = typeof body?.nim === "string" ? body.nim.trim() : "";
  } catch {
    return fail("Invalid JSON body", 400);
  }
  if (!nim || nim.length > 40) return fail("NIM is required", 400);

  const { data: row, error: rowError } = await adminClient
    .from("pandu_results")
    .select("fill_status,is_complete,validity,normal_scales,pd_scales,factor_scales,pd_flag_count,pd_top_scale,pd_top_t,pd_status,resilience_index,resilience_score,program_study,faculty")
    .eq("nim", nim)
    .maybeSingle();
  if (rowError) return fail("Could not read the PANDU result", 500);
  if (!row) return fail("Hasil PANDU tidak ditemukan", 404);
  if (!row.is_complete) return fail("Pengisian belum lengkap, analisis AI tidak tersedia", 422);

  // Nama dan NIM sengaja tidak dikirim ke penyedia AI.
  const payload = {
    program_studi: row.program_study,
    fakultas: row.faculty,
    status_pengisian: row.fill_status,
    validity_scales: labelled(row.validity, VALIDITY_LABELS),
    personality_disorder_scales_T: labelled(row.pd_scales, PD_LABELS),
    factor_scales_T: labelled(row.factor_scales, FACTOR_LABELS),
    normal_scales_T: labelled(row.normal_scales, NORMAL_LABELS),
    ringkasan_pd: {
      jumlah_skala_ditandai: row.pd_flag_count,
      skala_tertinggi: row.pd_top_scale ? `${PD_LABELS[row.pd_top_scale] ?? row.pd_top_scale} (T=${row.pd_top_t})` : null,
      status_file_tes: row.pd_status
    },
    resiliensi: { indeks_0_100: row.resilience_index, skor_total: row.resilience_score }
  };

  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini";
  let aiResponse: Response;
  try {
    aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analisis hasil profiling mahasiswa berikut:\n${JSON.stringify(payload)}` }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });
  } catch {
    return fail("Layanan AI tidak merespons, coba lagi", 504);
  }
  if (!aiResponse.ok) {
    console.error("OpenAI error", aiResponse.status, await aiResponse.text());
    return fail("Layanan AI gagal memproses permintaan", 502);
  }

  let parsed: Record<string, unknown>;
  try {
    const completion = await aiResponse.json();
    parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return fail("Jawaban AI tidak dapat dibaca, coba lagi", 502);
  }

  const validitas = (parsed.validitas ?? {}) as { status?: unknown; poin?: unknown };
  const analysis: Record<string, unknown> = {
    validitas: {
      status: typeof validitas.status === "string" ? validitas.status.slice(0, 40) : "Perlu kehati-hatian",
      poin: cleanList(validitas.poin)
    }
  };
  for (const key of LIST_SECTIONS) analysis[key] = cleanList(parsed[key]);

  return Response.json({ analysis, model }, { headers: corsHeaders });
});
