#!/usr/bin/env python3
"""Ubah Excel hasil PANDU menjadi SQL impor untuk tabel public.pandu_results.

Pemakaian: python3 scripts/build-pandu-import.py "/path/pandu mahasiswa.xlsx"

Keluaran ditulis ke supabase/private/ (pandu-import-00-clear.sql lalu pandu-import-01..NN.sql) yang diabaikan Git karena berisi data
pribadi mahasiswa. Jangan pernah meng-commit hasilnya.
"""
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
CHUNK = 800
OUT_DIR = Path(__file__).resolve().parent.parent / "supabase" / "private"


def column_index(ref):
    letters = re.match(r"[A-Z]+", ref).group()
    number = 0
    for char in letters:
        number = number * 26 + ord(char) - 64
    return number - 1


def read_rows(path):
    with zipfile.ZipFile(path) as archive:
        shared = [
            "".join(node.text or "" for node in item.iter(NS + "t"))
            for item in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall(NS + "si")
        ]
        rows = []
        with archive.open("xl/worksheets/sheet1.xml") as sheet:
            for _, element in ET.iterparse(sheet):
                if element.tag != NS + "row":
                    continue
                cells = {}
                for cell in element.findall(NS + "c"):
                    value = cell.find(NS + "v")
                    if value is None or value.text in (None, ""):
                        continue
                    cells[column_index(cell.get("r"))] = shared[int(value.text)] if cell.get("t") == "s" else value.text
                rows.append(cells)
                element.clear()
    return rows


def number(value, digits=2):
    try:
        result = round(float(value), digits)
    except (TypeError, ValueError):
        return None
    return int(result) if digits == 0 else result


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    rows = read_rows(sys.argv[1])
    header = {rows[1][index]: index for index in rows[1]}
    names = [rows[1].get(index) for index in range(max(rows[1]) + 1)]

    def span(first, last):
        return [names[index] for index in range(header[first], header[last] + 1)]

    groups = {
        "validity": span("VRIN", "CD"),
        "normal_scales": span("AE", "WR"),
        "pd_scales": span("PAR", "OBC"),
        "factor_scales": span("AGRE", "SENS"),
    }

    records = {}
    duplicates = []
    for row in rows[2:]:
        nim = str(row.get(header["NIM / ID"], "")).strip()
        if not nim:
            continue
        if nim in records:
            duplicates.append(nim)
            continue
        status = row.get(header["Status Pengisian"], "")
        progress = re.search(r"\((\d+)/(\d+)\)", status)
        record = {
            "nim": nim,
            "full_name": row.get(header["Nama"], "").strip(),
            "fill_status": status,
            "answered_items": int(progress.group(1)) if progress else None,
            "total_items": int(progress.group(2)) if progress else None,
            "is_complete": status == "Lengkap",
            "pd_flag_count": int(float(row[header["Jumlah PD ≥70"]])) if header["Jumlah PD ≥70"] in row else None,
            "pd_top_scale": row.get(header["Skala PD Tertinggi"]),
            "pd_top_t": number(row.get(header["T-score PD Tertinggi"])),
            "pd_status": row.get(header["Status PD"]),
            "resilience_score": number(row.get(header["Skor Resiliensi"])),
            "resilience_index": number(row.get(header["Indeks Resiliensi (0-100)"])),
            "resilience_items": {
                name.split()[0]: number(row.get(header[name]), 0)
                for name in names if name and name.startswith("Q4")
            },
        }
        for key, scales in groups.items():
            record[key] = {
                scale: number(row.get(header[scale]))
                for scale in scales if row.get(header[scale]) not in (None, "")
            }
        records[nim] = record

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("pandu-import-*.sql"):
        old.unlink()
    (OUT_DIR / "pandu-import-00-clear.sql").write_text(
        "-- Kosongkan data PANDU lama sebelum mengimpor data baru.\ntruncate public.pandu_results;\n", encoding="utf-8")
    items = list(records.values())
    parts = [items[start:start + CHUNK] for start in range(0, len(items), CHUNK)]
    for number_, part in enumerate(parts, 1):
        payload = json.dumps(part, ensure_ascii=False, separators=(",", ":"))
        sql = f"""-- Impor PANDU bagian {number_}/{len(parts)} ({len(part)} baris). Data pribadi: jangan di-commit.
insert into public.pandu_results (
  nim, full_name, fill_status, answered_items, total_items, is_complete,
  validity, normal_scales, pd_scales, factor_scales,
  pd_flag_count, pd_top_scale, pd_top_t, pd_status,
  resilience_items, resilience_score, resilience_index
)
select
  nim, full_name, fill_status, answered_items, total_items, is_complete,
  validity, normal_scales, pd_scales, factor_scales,
  pd_flag_count, pd_top_scale, pd_top_t, pd_status,
  resilience_items, resilience_score, resilience_index
from jsonb_to_recordset($pandu${payload}$pandu$::jsonb) as x(
  nim text, full_name text, fill_status text, answered_items integer, total_items integer, is_complete boolean,
  validity jsonb, normal_scales jsonb, pd_scales jsonb, factor_scales jsonb,
  pd_flag_count integer, pd_top_scale text, pd_top_t numeric, pd_status text,
  resilience_items jsonb, resilience_score numeric, resilience_index numeric
)
on conflict (nim) do update set
  full_name = excluded.full_name, fill_status = excluded.fill_status,
  answered_items = excluded.answered_items, total_items = excluded.total_items,
  is_complete = excluded.is_complete, validity = excluded.validity,
  normal_scales = excluded.normal_scales, pd_scales = excluded.pd_scales,
  factor_scales = excluded.factor_scales, pd_flag_count = excluded.pd_flag_count,
  pd_top_scale = excluded.pd_top_scale, pd_top_t = excluded.pd_top_t,
  pd_status = excluded.pd_status, resilience_items = excluded.resilience_items,
  resilience_score = excluded.resilience_score, resilience_index = excluded.resilience_index,
  imported_at = now();
"""
        target = OUT_DIR / f"pandu-import-{number_:02d}.sql"
        target.write_text(sql, encoding="utf-8")
        print(f"{target.name}: {len(part)} baris, {target.stat().st_size // 1024} KB")
    print(f"Total {len(items)} mahasiswa unik dari {len(rows) - 2} baris Excel ({len(duplicates)} baris NIM ganda dilewati).")


if __name__ == "__main__":
    main()
