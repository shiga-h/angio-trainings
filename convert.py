import openpyxl
import json
import sys

TARGET_SHEET_NAME = "研究会一覧"
SRC = sys.argv[1] if len(sys.argv) > 1 else "2026年度研修会_統合版.xlsx"
OUT = "data.json"


def pick_sheet(wb):
    """解析対象シートを選ぶ。

    優先順位:
      1. シート名 '研究会一覧' があればそれを使う
      2. シートが1つしかなければそれを使う（シート名は問わない）
      3. それ以外は曖昧なのでエラーで停止
    """
    names = wb.sheetnames
    if TARGET_SHEET_NAME in names:
        print(f"シート '{TARGET_SHEET_NAME}' を使用します")
        return wb[TARGET_SHEET_NAME]
    if len(names) == 1:
        chosen = names[0]
        print(f"'{TARGET_SHEET_NAME}' なし → 唯一のシート '{chosen}' を使用します")
        return wb[chosen]
    raise SystemExit(
        f"ERROR: シート '{TARGET_SHEET_NAME}' が見つからず、シートが複数あって特定できません。\n"
        f"  ファイル内のシート: {names}\n"
        f"  対処: 該当シートを '{TARGET_SHEET_NAME}' にリネームしてから再アップロードしてください。"
    )


wb = openpyxl.load_workbook(SRC, data_only=True)
ws = pick_sheet(wb)

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
