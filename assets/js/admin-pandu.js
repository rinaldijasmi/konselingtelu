(() => {
  const { PD_LABELS, FACTOR_LABELS, VALIDITY_LABELS, NORMAL_LABELS } = window.PANDU_LABELS;
  const withCode = (labels, code) => labels[code] && labels[code] !== code ? `${labels[code]} (${code})` : code;
  const THRESHOLD = 70;
  const PAGE_SIZE = 100;
  const MISSING_TABLE_CODES = ["42P01", "PGRST205"];

  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const formatNumber = (value, digits = 1) => value === null || value === undefined
    ? "–"
    : Number(value).toLocaleString("id-ID", { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const state = { client: null, analyses: new Map(), rows: [], loaded: false, loading: false, selected: null, limit: PAGE_SIZE };

  const pdName = code => PD_LABELS[code] ? `${code} · ${PD_LABELS[code]}` : code;
  const hasReview = row => row.pd_status === "Perlu telaah profesional";

  const countBy = (rows, labelFor) => {
    const counts = new Map();
    rows.forEach(row => {
      const label = labelFor(row);
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return counts;
  };

  function barMarkup(entries, total) {
    if (!entries.length) return '<div class="review-empty">Belum ada data.</div>';
    return entries.map(([label, count], index) => {
      const percent = total ? Math.round(count / total * 100) : 0;
      return `<div class="bar-item"><div class="bar-label-row"><span>${escapeHtml(label)}</span><strong>${count.toLocaleString("id-ID")} · ${percent}%</strong></div><div class="bar-track"><div class="bar-fill ${index ? `alt-${Math.min(index, 4)}` : ""}" style="width:${percent}%"></div></div></div>`;
    }).join("");
  }

  function renderSummary() {
    const rows = state.rows;
    const complete = rows.filter(row => row.is_complete);
    const review = complete.filter(hasReview);
    const percent = (part, whole) => whole ? `${Math.round(part / whole * 100)}%` : "";

    $("#panduTotal").textContent = rows.length.toLocaleString("id-ID");
    $("#panduComplete").textContent = complete.length.toLocaleString("id-ID");
    $("#panduCompleteRate").textContent = percent(complete.length, rows.length);
    $("#panduIncompleteNote").textContent = `${(rows.length - complete.length).toLocaleString("id-ID")} belum lengkap`;
    $("#panduReview").textContent = review.length.toLocaleString("id-ID");
    $("#panduReviewRate").textContent = percent(review.length, complete.length);
    const indices = rows.map(row => row.resilience_index).filter(value => value !== null);
    const average = indices.length ? indices.reduce((sum, value) => sum + value, 0) / indices.length : null;
    $("#panduResilience").textContent = formatNumber(average);

    const topCounts = [...countBy(complete.filter(row => row.pd_top_scale), row => row.pd_top_scale)]
      .sort((left, right) => right[1] - left[1])
      .map(([code, count]) => [pdName(code), count]);
    $("#panduTopChart").innerHTML = barMarkup(topCounts, complete.length);

    const statusCounts = [...countBy(complete, row => row.pd_status || "Tidak tersedia")].sort((left, right) => right[1] - left[1]);
    $("#panduStatusChart").innerHTML = barMarkup(statusCounts, complete.length);

    const bandOrder = ["Rendah (0–33)", "Sedang (34–66)", "Tinggi (67–100)", "Belum tersedia"];
    const bandCounts = countBy(rows, row => resilienceBand(row.resilience_index));
    $("#panduResilienceChart").innerHTML = barMarkup(bandOrder.filter(label => bandCounts.has(label)).map(label => [label, bandCounts.get(label)]), rows.length);

    const flagLabel = row => row.pd_flag_count >= 4 ? "4 skala atau lebih" : row.pd_flag_count === 0 ? "Tidak ada" : `${row.pd_flag_count} skala`;
    const flagOrder = ["Tidak ada", "1 skala", "2 skala", "3 skala", "4 skala atau lebih"];
    const flagCounts = countBy(complete.filter(row => row.pd_flag_count !== null), flagLabel);
    $("#panduFlagChart").innerHTML = barMarkup(flagOrder.filter(label => flagCounts.has(label)).map(label => [label, flagCounts.get(label)]), complete.length);

    fillFilterOptions();
    const scaleFilter = $("#panduScaleFilter");
    const current = scaleFilter.value;
    scaleFilter.innerHTML = '<option value="">Semua skala</option>' + Object.keys(PD_LABELS)
      .map(code => `<option value="${code}">${escapeHtml(pdName(code))}</option>`).join("");
    scaleFilter.value = current;
  }

  const resilienceBand = index => {
    if (index === null || index === undefined) return "Belum tersedia";
    if (index < 34) return "Rendah (0–33)";
    if (index < 67) return "Sedang (34–66)";
    return "Tinggi (67–100)";
  };
  const sortedUnique = (rows, key) => [...new Set(rows.map(row => row[key]).filter(Boolean))].sort((left, right) => left.localeCompare(right, "id"));

  function setOptions(select, placeholder, values) {
    const current = select.value;
    select.innerHTML = `<option value="">${placeholder}</option>` + values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    select.value = values.includes(current) ? current : "";
  }

  function fillFilterOptions() {
    setOptions($("#panduFacultyFilter"), "Semua fakultas", sortedUnique(state.rows, "faculty"));
    setOptions($("#panduCohortFilter"), "Semua angkatan", sortedUnique(state.rows, "cohort").reverse());
    updateProgramOptions();
  }

  function updateProgramOptions() {
    const faculty = $("#panduFacultyFilter").value;
    setOptions($("#panduProgramFilter"), "Semua program studi", sortedUnique(faculty ? state.rows.filter(row => row.faculty === faculty) : state.rows, "program_study"));
  }

  function filteredRows() {
    const query = $("#panduSearch").value.trim().toLowerCase();
    const fill = $("#panduFillFilter").value;
    const status = $("#panduStatusFilter").value;
    const scale = $("#panduScaleFilter").value;
    const faculty = $("#panduFacultyFilter").value;
    const program = $("#panduProgramFilter").value;
    const cohort = $("#panduCohortFilter").value;
    const rows = state.rows.filter(row =>
      (!query || row.full_name.toLowerCase().includes(query) || row.nim.includes(query)) &&
      (!fill || (fill === "complete") === row.is_complete) &&
      (!status || (status === "review" ? hasReview(row) : row.pd_status === "Tidak ada flag")) &&
      (!scale || row.pd_top_scale === scale) &&
      (!faculty || row.faculty === faculty) &&
      (!program || row.program_study === program) &&
      (!cohort || row.cohort === cohort));
    const sorters = {
      name: (left, right) => left.full_name.localeCompare(right.full_name, "id"),
      pd: (left, right) => (right.pd_top_t ?? -1) - (left.pd_top_t ?? -1),
      "resilience-low": (left, right) => (left.resilience_index ?? 101) - (right.resilience_index ?? 101),
      "resilience-high": (left, right) => (right.resilience_index ?? -1) - (left.resilience_index ?? -1)
    };
    return rows.sort(sorters[$("#panduSort").value] || sorters.name);
  }

  function renderList() {
    const rows = filteredRows();
    const visible = rows.slice(0, state.limit);
    $("#panduListCount").textContent = `${rows.length.toLocaleString("id-ID")} dari ${state.rows.length.toLocaleString("id-ID")} mahasiswa`;
    $("#panduList").innerHTML = visible.length ? visible.map(row => {
      const badge = !row.is_complete
        ? '<span class="status-badge">Belum lengkap</span>'
        : hasReview(row) ? '<span class="status-badge confirmed">Perlu telaah</span>' : '<span class="status-badge done">Tidak ada flag</span>';
      return `<button class="report-student ${state.selected === row.nim ? "active" : ""}" data-pandu-nim="${escapeHtml(row.nim)}" type="button"><strong>${escapeHtml(row.full_name)}</strong><span>${escapeHtml(row.nim)}${row.program_study ? ` · ${escapeHtml(row.program_study)}` : ""}${row.cohort ? ` · ${escapeHtml(row.cohort)}` : ""}${row.pd_top_scale ? ` · ${escapeHtml(row.pd_top_scale)} ${formatNumber(row.pd_top_t)}` : ""}</span>${badge}</button>`;
    }).join("") : '<div class="review-empty">Tidak ada mahasiswa yang cocok dengan filter.</div>';
    $("#panduMore").hidden = rows.length <= state.limit;
  }

  function scaleRow(code, value, label) {
    const flagged = value >= THRESHOLD;
    return `<div class="pandu-scale ${flagged ? "flagged" : ""}"><span class="pandu-scale-name" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="pandu-scale-track"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></span><strong>${formatNumber(value)}</strong></div>`;
  }


  const AI_SECTIONS = [
    ["pertimbangan", "Hal yang perlu dipertimbangkan", "consider"],
    ["mencolok", "Hal yang mencolok", "notable"],
    ["risiko", "Risiko terbesar", "risk"],
    ["kelebihan", "Kelebihan", "strength"],
    ["potensi", "Potensi yang bisa dikembangkan", "potential"]
  ];

  function renderAnalysis(analysis, model) {
    const validity = analysis.validitas || {};
    const tone = validity.status === "Valid" ? "ok" : validity.status === "Tidak dapat dinilai" ? "alert" : "warn";
    const list = items => `<ul>${(items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Tidak ada catatan.</li>"}</ul>`;
    return `<div class="pandu-ai-heading"><h3>Analisis AI</h3><span>${escapeHtml(model || "")}</span></div>
      <article class="pandu-ai-card validity ${tone}"><h4>Validitas hasil profiling <b>${escapeHtml(validity.status || "–")}</b></h4>${list(validity.poin)}</article>
      <div class="pandu-ai-grid">${AI_SECTIONS.map(([key, title, kind]) => `<article class="pandu-ai-card ${kind}"><h4>${title}</h4>${list(analysis[key])}</article>`).join("")}</div>
      <p class="report-confidential">Dihasilkan oleh AI dari skor tes PANDU TEL-U. Ini alat bantu skrining, bukan diagnosis; tetap perlu ditelaah psikolog.</p>`;
  }

  async function analyzeWithAi(row, button) {
    const panel = $("#panduAiPanel");
    panel.hidden = false;
    if (state.analyses.has(row.nim)) {
      const cached = state.analyses.get(row.nim);
      panel.innerHTML = renderAnalysis(cached.analysis, cached.model);
      return;
    }
    button.disabled = true;
    panel.innerHTML = '<p class="pandu-ai-status">Menganalisis hasil profiling dengan AI… biasanya 10–20 detik.</p>';
    const { data, error } = await state.client.functions.invoke("analyze-pandu", { body: { nim: row.nim } });
    button.disabled = false;
    if (state.selected !== row.nim) return;
    let message = error ? "Analisis AI gagal. Coba lagi sebentar lagi." : data?.error;
    if (error?.context?.json) {
      try { message = (await error.context.json()).error || message; } catch { /* pakai pesan umum */ }
    }
    if (message || !data?.analysis) {
      panel.innerHTML = `<p class="pandu-callout alert">${escapeHtml(message || "Analisis AI gagal.")}</p>`;
      return;
    }
    state.analyses.set(row.nim, data);
    panel.innerHTML = renderAnalysis(data.analysis, data.model);
  }

  function scaleGroup(title, scales, labels = {}, note = "") {
    const entries = Object.entries(scales || {});
    if (!entries.length) return "";
    return `<section class="pandu-group"><h3>${escapeHtml(title)}</h3>${note ? `<p class="pandu-note">${escapeHtml(note)}</p>` : ""}<div class="pandu-scale-grid">${entries.map(([code, value]) => scaleRow(code, value, withCode(labels, code))).join("")}</div></section>`;
  }

  function renderDetail(row) {
    const resilience = row.resilience_index;
    const incompleteNote = row.is_complete ? "" : `<p class="pandu-callout warn">Pengisian belum lengkap (${escapeHtml(row.fill_status.replace("Belum lengkap", "").trim() || "–")} butir). Skor skala validitas, normal, PD, dan faktor belum tersedia.</p>`;
    const reviewCallout = row.is_complete ? `<p class="pandu-callout ${hasReview(row) ? "alert" : "ok"}"><strong>${escapeHtml(row.pd_status || "Tidak tersedia")}</strong> · ${row.pd_flag_count ?? 0} skala PD ditandai${row.pd_top_scale ? ` · tertinggi ${escapeHtml(pdName(row.pd_top_scale))} (${formatNumber(row.pd_top_t)})` : ""}</p>` : "";
    $("#panduDetail").innerHTML = `
      <div class="report-student-heading"><div><h2>${escapeHtml(row.full_name)}</h2><p>NIM ${escapeHtml(row.nim)} · ${escapeHtml(row.fill_status)}</p><p>${[row.program_study, row.faculty, row.cohort ? `Angkatan ${row.cohort}` : ""].filter(Boolean).map(escapeHtml).join(" · ") || "Program studi belum tercatat"}</p></div>${row.is_complete ? '<div class="pandu-actions"><button class="secondary-button" data-pandu-print type="button">Cetak hasil</button><button class="primary-button" data-pandu-ai type="button">Analisis Hasil dengan AI</button></div>' : ""}</div>
      ${incompleteNote}${reviewCallout}
      <section class="pandu-ai" id="panduAiPanel" hidden></section>
      <section class="pandu-group"><h3>Resiliensi</h3>
        <div class="pandu-resilience"><div><strong>${formatNumber(resilience)}</strong><span>Indeks (0–100) · ${escapeHtml(resilienceBand(resilience))}</span></div><div class="pandu-resilience-bar"><i style="width:${Math.max(0, Math.min(100, resilience ?? 0))}%"></i></div></div>
        <div class="counseling-session-meta"><span>Skor total: <b>${formatNumber(row.resilience_score, 0)}</b></span></div>
      </section>
      ${scaleGroup("Personality Disorder Scales (T-score)", row.pd_scales, PD_LABELS, `Batang merah menandai T ≥ ${THRESHOLD}; garis putus-putus berada di T = 70.`)}
      ${scaleGroup("Factor Scales (T-score)", row.factor_scales, FACTOR_LABELS)}
      ${scaleGroup("Validity Scales", row.validity, VALIDITY_LABELS)}
      ${scaleGroup("Normal Scales (T-score)", row.normal_scales, NORMAL_LABELS)}
      <p class="report-confidential">Data profiling bersifat rahasia. Hasil skrining ini bukan diagnosis dan perlu ditelaah oleh psikolog sebelum dipakai untuk tindak lanjut.</p>`;
  }

  function printReport(row) {
    const rowsFor = (scales, labels) => Object.entries(scales || {})
      .map(([code, value]) => `<tr><td>${escapeHtml(withCode(labels, code))}</td><td class="v">${formatNumber(value, 2)}</td></tr>`).join("");
    const table = (title, scales, labels) => Object.keys(scales || {}).length
      ? `<h3>${title}</h3><div class="sub">Scale</div><table>${rowsFor(scales, labels)}</table>` : "";
    const logo = new URL("assets/telkom-university-logo.png", document.baseURI).href;
    const printed = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Hasil PANDU - ${escapeHtml(row.full_name)}</title><style>
      @page { size: A4; margin: 14mm 16mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #111; font: 10.5px/1.35 Calibri, Carlito, Arial, sans-serif; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 8px; border-bottom: 2px solid #c41230; }
      header img { height: 42px; }
      header .org { text-align: right; font-size: 11px; font-weight: 700; line-height: 1.3; }
      header .org span { display: block; color: #555; font-size: 9px; font-weight: 400; }
      h1 { margin: 12px 0 8px; font-size: 13px; text-align: center; letter-spacing: .3px; }
      .id td { padding: 1px 0; border: 0; font-size: 11.5px; }
      .id td:first-child { width: 120px; } .id td:nth-child(2) { width: 14px; } .id td:last-child { font-weight: 700; }
      .cols { display: grid; grid-template-columns: 1fr 14px 1fr; margin-top: 12px; }
      .bar { background: #8b8b8b; }
      h3 { margin: 10px 0 0; font-size: 11px; } h3:first-child { margin-top: 0; }
      .sub { font-weight: 700; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; }
      .cols td { padding: 1px 0; border-bottom: 1px solid #222; font-size: 10.5px; }
      td.v { width: 44px; text-align: right; font-weight: 700; }
      .col-left { padding-right: 18px; } .col-right { padding-left: 18px; }
      .conclusion { display: grid; grid-template-columns: 110px 10px 1fr; gap: 6px; margin-top: 16px; }
      .conclusion .box { min-height: 74px; border: 1px solid #222; }
      .conclusion small { display: block; font-weight: 400; }
      footer { margin-top: 10px; color: #666; font-size: 8px; }
    </style></head><body>
      <header><img src="${logo}" alt="Telkom University"><div class="org">Direktorat Kemahasiswaan, Karier dan Alumni<span>Telkom University · Profiling PANDU</span></div></header>
      <h1>HASIL PROFILING PANDU TEL-U</h1>
      <table class="id"><tr><td>NIM</td><td>:</td><td>${escapeHtml(row.nim)}</td></tr><tr><td>Nama Lengkap</td><td>:</td><td>${escapeHtml(row.full_name)}</td></tr>${row.program_study ? `<tr><td>Program Studi</td><td>:</td><td>${escapeHtml(row.program_study)}</td></tr>` : ""}${row.faculty ? `<tr><td>Fakultas</td><td>:</td><td>${escapeHtml(row.faculty)}</td></tr>` : ""}${row.cohort ? `<tr><td>Angkatan</td><td>:</td><td>${escapeHtml(row.cohort)}</td></tr>` : ""}<tr><td>Tanggal Cetak</td><td>:</td><td>${printed}</td></tr></table>
      <div class="cols">
        <div class="col-left">${table("Validity scales", row.validity, VALIDITY_LABELS)}<div style="height:12px"></div>${table("Normal scales", row.normal_scales, NORMAL_LABELS)}</div>
        <div class="bar"></div>
        <div class="col-right">${table("Personality Disorder scales", row.pd_scales, PD_LABELS)}<div style="height:12px"></div>${table("Factor scales", row.factor_scales, FACTOR_LABELS)}</div>
      </div>
      <div class="conclusion"><div><strong>Kesimpulan</strong><small>(diisi oleh Profesional)</small></div><div>:</div><div class="box"></div></div>
      <footer>Dokumen rahasia. Hasil skrining ini bukan diagnosis dan perlu ditelaah oleh profesional.</footer>
    </body></html>`;
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.append(frame);
    frame.srcdoc = html;
    frame.onload = () => {
      const image = frame.contentDocument.querySelector("img");
      const go = () => { frame.contentWindow.focus(); frame.contentWindow.print(); };
      if (image.complete) go(); else image.onload = image.onerror = go;
      frame.contentWindow.onafterprint = () => frame.remove();
    };
  }

  async function fetchAll(client) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await client.from("pandu_results").select("*").order("full_name").range(from, from + 999);
      if (error) return { error };
      rows.push(...data);
      if (data.length < 1000) return { rows };
    }
  }

  async function show(client) {
    if (client) state.client = client;
    if (state.loaded || state.loading || !client) return;
    state.loading = true;
    $("#panduListCount").textContent = "Memuat data…";
    const { rows, error } = await fetchAll(client);
    state.loading = false;
    if (error) {
      const missing = MISSING_TABLE_CODES.includes(error.code);
      $("#panduMigrationNotice").hidden = !missing;
      $("#panduListCount").textContent = missing ? "Tabel belum tersedia." : `Data gagal dimuat: ${error.message}`;
      return;
    }
    state.rows = rows;
    state.loaded = true;
    $("#panduMigrationNotice").hidden = true;
    renderSummary();
    renderList();
    if (!rows.length) $("#panduListCount").textContent = "Belum ada data. Impor hasil PANDU sesuai SETUP-SUPABASE.md.";
  }


  const XLSX_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
  const IMPORT_CHUNK = 300;
  const importState = { records: [], skipped: 0, busy: false };

  function loadSheetLibrary() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = XLSX_URL;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Pustaka pembaca Excel gagal dimuat. Periksa koneksi internet."));
      document.head.append(script);
    });
  }

  const cellText = value => value === null || value === undefined ? "" : String(value).trim();
  const optionalText = value => { const text = cellText(value); return text && !text.startsWith("#") ? text : null; };
  const cellNumber = (value, digits = 2) => {
    const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
    if (!Number.isFinite(parsed)) return null;
    return digits === 0 ? Math.round(parsed) : Number(parsed.toFixed(digits));
  };

  // Format kolom sama dengan Excel PANDU: baris judul kolom memuat "NIM / ID".
  function parseRecords(matrix) {
    const headerRow = matrix.findIndex(row => row.some(cell => cellText(cell) === "NIM / ID"));
    if (headerRow < 0) throw new Error('Kolom "NIM / ID" tidak ditemukan. Pastikan format file sama dengan file PANDU.');
    const header = new Map();
    matrix[headerRow].forEach((cell, index) => { const name = cellText(cell); if (name && !header.has(name)) header.set(name, index); });
    const required = ["NIM / ID", "Nama", "Status Pengisian", "VRIN", "CD", "AE", "WR", "PAR", "OBC", "AGRE", "SENS"];
    const missing = required.filter(name => !header.has(name));
    if (missing.length) throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}.`);
    const names = [...header.keys()];
    const span = (first, last) => names.filter(name => header.get(name) >= header.get(first) && header.get(name) <= header.get(last));
    const groups = { validity: span("VRIN", "CD"), normal_scales: span("AE", "WR"), pd_scales: span("PAR", "OBC"), factor_scales: span("AGRE", "SENS") };
    const get = (row, name) => header.has(name) ? row[header.get(name)] : undefined;

    const records = new Map();
    let skipped = 0;
    for (const row of matrix.slice(headerRow + 1)) {
      const nim = cellText(get(row, "NIM / ID"));
      const name = cellText(get(row, "Nama"));
      if (!nim || !name) { skipped += 1; continue; }
      const status = cellText(get(row, "Status Pengisian"));
      const isComplete = status === "Lengkap";
      if (records.get(nim)?.is_complete && !isComplete) continue;
      const progress = status.match(/\((\d+)\/(\d+)\)/);
      const record = {
        nim, full_name: name,
        program_study: optionalText(get(row, "Program Studi")),
        faculty: optionalText(get(row, "Fakultas")),
        cohort: optionalText(get(row, "Angkatan")),
        fill_status: status || "Tidak diketahui",
        answered_items: progress ? Number(progress[1]) : null,
        total_items: progress ? Number(progress[2]) : null,
        is_complete: isComplete,
        pd_flag_count: cellNumber(get(row, "Jumlah PD ≥70"), 0),
        pd_top_scale: optionalText(get(row, "Skala PD Tertinggi")),
        pd_top_t: cellNumber(get(row, "T-score PD Tertinggi")),
        pd_status: optionalText(get(row, "Status PD")),
        resilience_score: cellNumber(get(row, "Skor Resiliensi")),
        resilience_index: cellNumber(get(row, "Indeks Resiliensi (0-100)"))
      };
      for (const [key, scales] of Object.entries(groups)) {
        record[key] = Object.fromEntries(scales
          .map(scale => [scale, cellNumber(get(row, scale))])
          .filter(([, value]) => value !== null));
      }
      records.set(nim, record);
    }
    return { records: [...records.values()], skipped };
  }

  function openImport() {
    importState.records = [];
    $("#panduImportFile").value = "";
    $("#panduImportSummary").innerHTML = "";
    $("#panduImportMessage").textContent = "";
    $("#panduImportConfirm").disabled = true;
    $("#panduImportBackdrop").hidden = false;
  }

  const closeImport = () => { if (!importState.busy) $("#panduImportBackdrop").hidden = true; };

  async function readImportFile(file) {
    const message = $("#panduImportMessage");
    const summary = $("#panduImportSummary");
    importState.records = [];
    $("#panduImportConfirm").disabled = true;
    message.textContent = "";
    summary.innerHTML = "";
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { message.textContent = "File terlalu besar (maksimal 20 MB). Pecah menjadi beberapa file."; return; }
    summary.textContent = "Membaca file…";
    try {
      await loadSheetLibrary();
      const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
      const { records, skipped } = parseRecords(matrix);
      if (!records.length) throw new Error("Tidak ada baris data yang valid di file.");
      const known = new Set(state.rows.map(row => row.nim));
      const updated = records.filter(record => known.has(record.nim)).length;
      const incomplete = records.filter(record => !record.is_complete).length;
      importState.records = records;
      summary.innerHTML = `<strong class="ok">${records.length.toLocaleString("id-ID")} mahasiswa siap disimpan</strong>
        <ul><li>${(records.length - updated).toLocaleString("id-ID")} NIM baru, ${updated.toLocaleString("id-ID")} NIM diperbarui</li>
        ${incomplete ? `<li class="warn">${incomplete.toLocaleString("id-ID")} pengisian belum lengkap (skor belum tersedia)</li>` : ""}
        ${skipped ? `<li class="warn">${skipped.toLocaleString("id-ID")} baris tanpa NIM/nama dilewati</li>` : ""}</ul>`;
      $("#panduImportConfirm").disabled = false;
    } catch (error) {
      summary.innerHTML = "";
      message.textContent = error.message || "File tidak dapat dibaca.";
    }
  }

  async function saveImport() {
    const message = $("#panduImportMessage");
    const button = $("#panduImportConfirm");
    if (!importState.records.length || importState.busy) return;
    importState.busy = true;
    button.disabled = true;
    message.textContent = "";
    try {
      for (let start = 0; start < importState.records.length; start += IMPORT_CHUNK) {
        button.textContent = `Menyimpan ${Math.min(start + IMPORT_CHUNK, importState.records.length)}/${importState.records.length}…`;
        const { error } = await state.client.rpc("admin_upsert_pandu_results", { p_rows: importState.records.slice(start, start + IMPORT_CHUNK) });
        if (error) throw error;
      }
      const total = importState.records.length;
      importState.records = [];
      importState.busy = false;
      $("#panduImportBackdrop").hidden = true;
      state.analyses.clear();
      state.loaded = false;
      await show(state.client);
      $("#toastMessage").textContent = `${total.toLocaleString("id-ID")} data profiling berhasil disimpan.`;
      $("#toast").classList.add("show");
      setTimeout(() => $("#toast").classList.remove("show"), 3500);
    } catch (error) {
      message.textContent = MISSING_TABLE_CODES.includes(error?.code) || error?.code === "PGRST202"
        ? "Fungsi impor belum tersedia. Jalankan supabase/pandu-input-counselor-access.sql."
        : `Gagal menyimpan: ${error?.message || "kesalahan tidak diketahui"}`;
      button.disabled = false;
    } finally {
      importState.busy = false;
      button.textContent = "Simpan data";
    }
  }


  async function downloadTemplate() {
    const message = $("#panduImportMessage");
    try {
      await loadSheetLibrary();
      const labels = window.PANDU_LABELS;
      const headers = [
        "No", "NIM / ID", "Nama", "Program Studi", "Fakultas", "Angkatan", "Status Pengisian",
        ...Object.keys(labels.VALIDITY_LABELS), ...Object.keys(labels.NORMAL_LABELS),
        ...Object.keys(labels.PD_LABELS), ...Object.keys(labels.FACTOR_LABELS),
        "Jumlah PD ≥70", "Skala PD Tertinggi", "T-score PD Tertinggi", "Status PD", "Skor Resiliensi", "Indeks Resiliensi (0-100)"
      ];
      const notes = [
        ["Petunjuk pengisian template PANDU Tel-U"],
        ["1. Isi data mulai baris 2 pada sheet \"Data\". Jangan mengubah, menghapus, atau mengurutkan ulang judul kolom."],
        ["2. NIM / ID dan Nama wajib diisi. Baris tanpa NIM atau nama dilewati."],
        ["3. Status Pengisian: tulis persis \"Lengkap\" bila selesai, atau \"Belum lengkap (120/375)\" bila belum. Skor boleh kosong untuk yang belum lengkap."],
        ["4. Skor skala berupa angka T-score (boleh desimal). Skala PD Tertinggi diisi kode skala, misalnya PAR."],
        ["5. Status PD: \"Perlu telaah profesional\" atau isi sesuai file tes."],
        ["6. NIM yang sudah ada akan diperbarui; NIM baru akan ditambahkan."],
        [],
        ["Contoh isi satu baris (jangan dimasukkan ke sheet Data kecuali sebagai format):"],
        ["NIM / ID", "102012600225"], ["Nama", "Nama Mahasiswa"], ["Program Studi", "S1 Teknik Industri"],
        ["Fakultas", "Fakultas Rekayasa Industri"], ["Angkatan", "2026"], ["Status Pengisian", "Lengkap"],
        ["VRIN", "44.8"], ["PAR", "52.3"], ["Jumlah PD ≥70", "1"], ["Skala PD Tertinggi", "SCT"],
        ["T-score PD Tertinggi", "72.1"], ["Status PD", "Perlu telaah profesional"], ["Indeks Resiliensi (0-100)", "46.9"]
      ];
      const workbook = window.XLSX.utils.book_new();
      const data = window.XLSX.utils.aoa_to_sheet([headers]);
      data["!cols"] = headers.map(name => ({ wch: Math.max(8, name.length + 2) }));
      window.XLSX.utils.book_append_sheet(workbook, data, "Data");
      const guide = window.XLSX.utils.aoa_to_sheet(notes);
      guide["!cols"] = [{ wch: 28 }, { wch: 40 }];
      window.XLSX.utils.book_append_sheet(workbook, guide, "Petunjuk");
      window.XLSX.writeFile(workbook, "Template-Profiling-PANDU.xlsx");
    } catch (error) {
      message.textContent = error.message || "Template gagal dibuat.";
    }
  }
  $("#panduTemplateButton").addEventListener("click", downloadTemplate);
  $("#panduAddButton").addEventListener("click", openImport);
  $("#panduImportCancel").addEventListener("click", closeImport);
  $("#panduImportBackdrop").addEventListener("click", event => { if (event.target.id === "panduImportBackdrop") closeImport(); });
  $("#panduImportFile").addEventListener("change", event => readImportFile(event.target.files[0]));
  $("#panduImportConfirm").addEventListener("click", saveImport);

  const resetLimitAndRender = () => { state.limit = PAGE_SIZE; renderList(); };
  ["#panduSearch"].forEach(selector => $(selector).addEventListener("input", resetLimitAndRender));
  ["#panduFillFilter", "#panduStatusFilter", "#panduScaleFilter", "#panduCohortFilter", "#panduProgramFilter", "#panduSort"].forEach(selector => $(selector).addEventListener("change", resetLimitAndRender));
  $("#panduFacultyFilter").addEventListener("change", () => { updateProgramOptions(); resetLimitAndRender(); });
  $("#panduResetFilters").addEventListener("click", () => {
    $("#panduSearch").value = "";
    ["#panduFillFilter", "#panduStatusFilter", "#panduScaleFilter", "#panduFacultyFilter", "#panduProgramFilter", "#panduCohortFilter"].forEach(selector => { $(selector).value = ""; });
    updateProgramOptions();
    $("#panduSort").value = "name";
    resetLimitAndRender();
  });
  $("#panduMore").addEventListener("click", () => { state.limit += PAGE_SIZE; renderList(); });
  $("#panduList").addEventListener("click", event => {
    const button = event.target.closest("[data-pandu-nim]");
    if (!button) return;
    state.selected = button.dataset.panduNim;
    const row = state.rows.find(item => item.nim === state.selected);
    if (row) renderDetail(row);
    renderList();
  });

  $("#panduDetail").addEventListener("click", event => {
    const row = state.rows.find(item => item.nim === state.selected);
    if (!row) return;
    if (event.target.closest("[data-pandu-print]")) printReport(row);
    const aiButton = event.target.closest("[data-pandu-ai]");
    if (aiButton) analyzeWithAi(row, aiButton);
  });

  window.panduProfiling = { show };
})();
