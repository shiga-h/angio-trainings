#!/usr/bin/env bash
# Excel データ → data.json → GitHub に push → Vercel 自動デプロイ
# 使い方: ./update.sh ["コミットメッセージ"]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

XLSX="2026年度研修会_統合版.xlsx"
JSON="data.json"
MSG="${1:-データ更新}"

if [ ! -f "$XLSX" ]; then
  echo "[エラー] $XLSX が見つかりません。" >&2
  exit 1
fi

echo "▸ convert.py で $JSON を再生成…"
python3 convert.py "$XLSX"

# git diff が空なら何もせず終了
if git diff --quiet -- "$JSON" "$XLSX"; then
  echo "▸ 変更なし。push をスキップします。"
  exit 0
fi

echo "▸ 変更をステージング…"
git add "$JSON" "$XLSX"

echo "▸ コミット: $MSG"
git commit -m "$MSG"

echo "▸ push…"
git push

echo ""
echo "✅ 完了。Vercel が自動で再デプロイします（通常30秒〜1分）。"
echo "   ダッシュボード: https://vercel.com/dashboard"
