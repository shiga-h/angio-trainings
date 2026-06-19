import openpyxl
import json
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "2026年度研修会_統合版.xlsx"
OUT = "data.json"

wb = openpyxl.load_workbook(SRC, data_only=True)
ws = wb["研究会一覧"]

rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    (rid, date_start, date_end, time_, name, theme, loc, fmt,
     fee, points, url, tag1, tag2) = row[:13]

    if not name:
        continue

    tags = [t for t in [tag1, tag2] if t]

    def fmt_date(d):
        if not d:
            return ""
        if hasattr(d, "strftime"):
            return d.strftime("%Y-%m-%d")
        return str(d)

    rows.append({
        "id": rid,
        "dateStart": fmt_date(date_start),
        "dateEnd": fmt_date(date_end),
        "time": time_ or "",
        "name": name,
        "theme": theme or "",
        "loc": loc or "",
        "format": fmt or "未定",
        "fee": fee or "",
        "points": points or "",
        "url": url or "",
        "tags": tags,
    })

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

print(f"{len(rows)}件を{OUT}に書き出しました")
