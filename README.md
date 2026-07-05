# アンギオ部門 研修会・学会一覧サイト

アンギオ部門スタッフ向けに、研修会・学会の情報をスマホから見られるようにする静的サイト。
データソースは Excel (`2026年度研修会_統合版.xlsx`)、`convert.py` で `data.json` に変換してフロントエンドが読み込む。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` / `style.css` / `app.js` | フロントエンド（静的、CDN依存なし） |
| `data.json` | フロントエンドが読む配列形式の研修会データ |
| `convert.py` | Excel → JSON 変換スクリプト（`openpyxl` のみ依存） |
| `2026年度研修会_統合版.xlsx` | データの原本 |
| `SPEC.md` | 仕様書 |

## 更新フロー

### ブラウザだけで完結（推奨）

1. GitHub で `2026年度研修会_統合版.xlsx` を差し替え（Add file → Upload files）
2. コミット → GitHub Actions が `data.json` を自動生成
3. Vercel が自動デプロイ（合計1〜2分）

### ローカルで作業する場合（旧・任意）

1. Excel (`2026年度研修会_統合版.xlsx`) を編集
2. `./update.sh "コミットメッセージ"` を実行（変換 → commit → push を一括）
3. Vercel が自動デプロイ

詳細・トラブルシューティングは **[MAINTENANCE.md](MAINTENANCE.md)** を参照。

## ローカルプレビュー

```sh
python3 -m http.server 8000
# → http://localhost:8000/ をブラウザで開く
```

## ホスティング

- GitHub リポジトリと Vercel を GitHub 連携で接続済み
- `main` ブランチへの push で自動デプロイ
- ビルド設定不要（純粋な静的サイト）
