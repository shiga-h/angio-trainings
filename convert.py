import openpyxl
import json
import re
import sys

TARGET_SHEET_NAME = "研究会一覧"
MONTH_PATTERN = re.compile(r"^(1[0-2]|[1-9])月$")
SRC = sys.argv[1] if len(sys.argv) > 1 else "2026年度研修会_統合版.xlsx"
OUT = "data.json"


def parse_row(row):
    """1 行を dict に変換。名前が空の場合は None を返す。"""
    (rid, date_start, date_end, time_, name, theme, loc, fmt,
     fee, points, url, tag1, tag2) = row[:13]

    if not name:
        return None

    tags = [t for t in [tag1, tag2] if t]

    def fmt_date(d):
        if not d:
            return ""
        if hasattr(d, "strftime"):
            return d.strftime("%Y-%m-%d")
        return str(d)

    return {
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
    }


def read_sheet(ws):
    """指定シートからデータ行を読んで dict のリストを返す。"""
    out = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        item = parse_row(row)
        if item is not None:
            out.append(item)
    return out


def collect_rows(wb):
    """優先順位でデータを収集する。

    1. '研究会一覧' シートがあればそれを単体で使う（統合版）
    2. 月別シート（'4月', '5月', ..., '3月'）が2つ以上あれば全部読んで結合
    3. シートが1つだけならそれを使う
    4. それ以外はエラー
    """
    names = wb.sheetnames

    if TARGET_SHEET_NAME in names:
        print(f"シート '{TARGET_SHEET_NAME}' を使用します")
        return read_sheet(wb[TARGET_SHEET_NAME])

    monthly = [n for n in names if MONTH_PATTERN.match(n)]
    if len(monthly) >= 2:
        print(f"月別シート {len(monthly)}枚 ({monthly}) を統合します")
        all_rows = []
        for n in monthly:
            sheet_rows = read_sheet(wb[n])
            print(f"  {n}: {len(sheet_rows)}件")
            all_rows.extend(sheet_rows)
        return all_rows

    if len(names) == 1:
        chosen = names[0]
        print(f"'{TARGET_SHEET_NAME}' なし → 唯一のシート '{chosen}' を使用します")
        return read_sheet(wb[chosen])

    raise SystemExit(
        f"ERROR: '{TARGET_SHEET_NAME}' シートも月別シート群 (2つ以上の '〇月') もなく、"
        f"シートが複数あって特定できません。\n"
        f"  ファイル内のシート: {names}\n"
        f"  対処: 該当シートを '{TARGET_SHEET_NAME}' にリネームするか、"
        f"月名 '4月' 等のシートで揃えてください。"
    )


wb = openpyxl.load_workbook(SRC, data_only=True)
rows = collect_rows(wb)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)

print(f"{len(rows)}件を{OUT}に書き出しました")
