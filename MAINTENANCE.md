# メンテナンス手順書

Excel データを更新してサイトに反映するまでの手順をまとめています。

---

## 0. 前提

- リポジトリ: <https://github.com/shiga-h/angio-trainings>
- 本番URL: Vercel が `main` ブランチへの push を検知して自動デプロイ
- データ原本: `2026年度研修会_統合版.xlsx`（リポジトリにコミット済み）
- 変換ツール: `convert.py` (`openpyxl` のみ依存)
- **自動変換**: GitHub Actions が Excel の変更を検知して data.json を自動生成（`.github/workflows/convert.yml`）

---

## 1. 通常の更新フロー（ブラウザだけで完結・推奨）

先輩から新しい Excel が届いたら、以下のみで反映できます。**Mac もターミナルも不要**、スマホからでも可能です。

### 手順

1. リポジトリを開く: <https://github.com/shiga-h/angio-trainings>
2. **「Add file」** → **「Upload files」** をクリック
3. 届いた Excel ファイルを **ファイル選択欄にドラッグ**（ファイル名は `2026年度研修会_統合版.xlsx` にしておく）
4. 「Commit changes」を押す
   - コミットメッセージはそのままでもOK（例: `Update 2026年度研修会_統合版.xlsx`）

### 反映までの流れ

```
Excelアップロード
   ↓
GitHub Actions が自動起動（.github/workflows/convert.yml）
   ↓ 30秒〜1分
python3 convert.py で data.json を再生成 → 自動 commit
   ↓
Vercel が再デプロイ
   ↓ 30秒〜1分
サイトに反映（合計1〜2分）
```

### 進捗確認

- GitHub の **「Actions」タブ**でワークフローの実行状況を確認できます
- 緑チェック = 成功、赤バツ = 失敗（下記トラブルシューティング参照）

### 編集時の注意

Excel を編集する時は以下を守ってください。GitHub Actions は Excel の構造が壊れていると失敗します。

- シート名は `研究会一覧` のまま（変更しない）
- 列順は固定: ID／開始日／終了日／時間／名称／テーマ／開催場所／開催形式／参加費／認定単位／HP／タグ1／タグ2
- 日付は `YYYY-MM-DD` 形式（Excelの日付セル書式でもOK、テキストでもOK）
- 開催形式は `web` / `現地` / `Hybrid` / `オンデマンド` / `未定` のいずれか
- タグは固定の8種類: `循環器` / `脳神経` / `消化器` / `その他アンギオ` / `画像診断` / `線量管理` / `画像管理` / `その他モダリティ`
- **名称が空の行はサイトには出ません**（IDだけ振ってある予備行はそのままでOK）

### ファイル名を変えたい場合

年度切替などで `2027年度研修会_統合版.xlsx` に変更したい場合:

1. `convert.py` の `SRC` のデフォルト値を新ファイル名に変更
2. 旧ファイルを削除し、新ファイル名の Excel をアップロード

---

## 2. ローカル（Mac）で更新するフロー（旧・任意）

インターネットが不安定、または手元で先に確認したい時に使えます。ただし通常は §1 で十分です。

### 2-1. リポジトリの最新を取得

```sh
cd /Users/hirokishiga/Documents/development/angio-trainings
git pull
```

### 2-2. Excel を編集

Finder で以下を開いて編集・保存:

```
/Users/hirokishiga/Documents/development/angio-trainings/2026年度研修会_統合版.xlsx
```

編集時の注意は §1 と同じ。

### 2-3. 一発更新スクリプトを実行

```sh
./update.sh
```

スクリプトは以下を順に実行します:

1. `python3 convert.py` で `data.json` を再生成
2. 変更があれば `data.json` と Excel を `git add` & `commit`
3. `git push` で GitHub に送信

ローカルで data.json を生成済みなので、GitHub Actions は「変更なし」でスキップされます（`convert.py` は冪等）。

### 2-4. 手動でやる場合

`update.sh` を使わずコマンドで実行する場合:

```sh
cd /Users/hirokishiga/Documents/development/angio-trainings
python3 convert.py 2026年度研修会_統合版.xlsx
git add data.json 2026年度研修会_統合版.xlsx
git commit -m "データ更新: 〇月△日の研修会を追加"
git push
```

---

## 3. データ仕様

`convert.py` が生成する `data.json` の各オブジェクトは次の構造です:

```json
{
  "id":        "2026-001",
  "dateStart": "2026-04-25",
  "dateEnd":   "",
  "time":      "15:00〜18:00",
  "name":      "第424回 循環器画像技術研究会",
  "theme":     "心カテ室の基礎",
  "loc":       "Zoom",
  "format":    "web",
  "fee":       "会員500円",
  "points":    "日本救急撮影技師認定機構／…",
  "url":       "http://…",
  "tags":      ["循環器"]
}
```

- `dateEnd` が空の場合は単日開催として扱われ、表示は `4/25（土）` だけ
- `url` が空の場合は「HPを開く」ボタンの代わりに「名称をコピー」ボタンが出ます
- 「終了済み」判定は `dateEnd` 優先（無ければ `dateStart`）。両方空の行は「日程未定」扱いで常に表示されます

---

## 4. デプロイの仕組み

```
[Excel push]
     ↓
[GitHub Actions: convert.yml]
  - Python 3.11 セットアップ
  - openpyxl インストール
  - python3 convert.py 実行
  - data.json 差分があれば自動 commit + push
     ↓
[Vercel: main ブランチを監視]
  - main への push を検知して自動デプロイ
     ↓
[本番サイト]
```

デプロイ状況の確認は Vercel ダッシュボード（<https://vercel.com/dashboard>）の `angio-trainings` プロジェクトから。

---

## 5. トラブルシューティング

### GitHub Actions が失敗する（赤バツ）

Actions タブから該当ジョブのログを開いて内容を確認:

- **`ModuleNotFoundError: openpyxl`**: `.github/workflows/convert.yml` の `pip install openpyxl` ステップが失敗。GitHub 側の一時障害の可能性が高いので、「Re-run all jobs」で再実行
- **`KeyError: '研究会一覧'`**: Excel のシート名が変わっている。Excel を修正して再アップロード
- **Excel パースエラー**: 列構成やデータ形式が壊れている。§1 の編集時の注意を確認
- **`git push` 失敗**: リポジトリ設定で Actions に write 権限がない可能性。**Settings → Actions → General → Workflow permissions** で「Read and write permissions」を選択

### サイトが更新されない

1. Actions タブで最新のワークフローが緑チェックか確認
2. Vercel ダッシュボードで該当 deployment が `Ready` か確認
3. ブラウザキャッシュをクリア（iPhone Safari は「設定 → Safari → 履歴とWebサイトデータを消去」、Mac は Cmd+Shift+R 強制リロード）
4. `data.json` が最新のコミットに含まれているか確認: <https://github.com/shiga-h/angio-trainings/commits/main>

### ローカルで `python3 convert.py` が `ModuleNotFoundError: No module named 'openpyxl'`

```sh
pip3 install openpyxl
# または
python3 -m pip install --user openpyxl
```

### 文字化けする

Excel を保存する際に文字コードが UTF-8 になっているか確認。openpyxl は xlsx を内部UTF-8で扱うので通常問題なし。CSVを経由するとエンコーディング事故が起きやすいので Excel (.xlsx) 形式のままで運用する。

### Excel に新しい開催形式やタグを増やしたい

- **開催形式**: コード側 (`app.js` の `FORMAT_CLASS`) に対応するCSSクラスを追加。未対応のままだとデフォルトのグレーバッジになります
- **タグ**: 仕様で固定の8種類以外を増やすと、`app.js` の `ALL_TAGS` に追加してください。それでも動作はしますが、表示順が末尾に回ります

---

## 6. 参考リンク

- リポジトリ: <https://github.com/shiga-h/angio-trainings>
- Actions: <https://github.com/shiga-h/angio-trainings/actions>
- Vercel ダッシュボード: <https://vercel.com/dashboard>
- 仕様書: [SPEC.md](SPEC.md)
