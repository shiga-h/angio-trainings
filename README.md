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

1. Excel (`2026年度研修会_統合版.xlsx`) を更新
2. `data.json` を再生成
   ```sh
   python3 convert.py 2026年度研修会_統合版.xlsx
   ```
3. コミット & プッシュ
   ```sh
   git add data.json 2026年度研修会_統合版.xlsx
   git commit -m "データ更新: <内容>"
   git push
   ```
4. Vercel が自動的に再デプロイする

## ローカルプレビュー

```sh
python3 -m http.server 8000
# → http://localhost:8000/ をブラウザで開く
```

## ホスティング

- GitHub リポジトリと Vercel を GitHub 連携で接続済み
- `main` ブランチへの push で自動デプロイ
- ビルド設定不要（純粋な静的サイト）
