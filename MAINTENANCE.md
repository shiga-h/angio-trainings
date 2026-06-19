# メンテナンス手順書

Excel データを更新してサイトに反映するまでの手順をまとめています。

---

## 0. 前提

- リポジトリ: <https://github.com/shiga-h/angio-trainings>
- ローカル: `/Users/hirokishiga/Documents/development/angio-trainings/`
- 本番URL: Vercel が `main` ブランチへの push を検知して自動デプロイ
- データ原本: `2026年度研修会_統合版.xlsx`（リポジトリにコミット済み）
- 変換ツール: `convert.py` (`openpyxl` のみ依存)

---

## 1. 通常の更新フロー（ローカルでExcelを編集）

最も基本的な流れです。Mac上でExcelを編集→1コマンドで反映します。

### 1-1. リポジトリの最新を取得

```sh
cd /Users/hirokishiga/Documents/development/angio-trainings
git pull
```

### 1-2. Excel を編集

Finder で以下を開いて編集・保存:

```
/Users/hirokishiga/Documents/development/angio-trainings/2026年度研修会_統合版.xlsx
```

> **編集時の注意**
> - シート名は `研究会一覧` のまま（変更しない）
> - 列順は固定: ID／開始日／終了日／時間／名称／テーマ／開催場所／開催形式／参加費／認定単位／HP／タグ1／タグ2
> - 日付は `YYYY-MM-DD` 形式（Excelの日付セル書式でもOK、テキストでもOK）
> - 開催形式は `web` / `現地` / `Hybrid` / `オンデマンド` / `未定` のいずれか（`現地（オンデマンドあり）` のような表記も可）
> - タグは固定の8種類: `循環器` / `脳神経` / `消化器` / `その他アンギオ` / `画像診断` / `線量管理` / `画像管理` / `その他モダリティ`
> - **名称が空の行はサイトには出ません**（IDだけ振ってある予備行はそのままでOK）

### 1-3. 一発更新スクリプトを実行

```sh
./update.sh
```

スクリプトは以下を順に実行します:

1. `python3 convert.py` で `data.json` を再生成
2. 変更があれば `data.json` と Excel を `git add` & `commit`
3. `git push` で GitHub に送信 → Vercel が自動デプロイ

push の数十秒後にサイトが更新されます（同じURL）。

### 1-4. 手動でやる場合

`update.sh` を使わずコマンドで実行する場合:

```sh
cd /Users/hirokishiga/Documents/development/angio-trainings
python3 convert.py 2026年度研修会_統合版.xlsx
git add data.json 2026年度研修会_統合版.xlsx
git commit -m "データ更新: 〇月△日の研修会を追加"
git push
```

---

## 2. ブラウザだけで完結する更新（Mac以外のPCから）

ローカルが手元になく、ブラウザだけで Excel を差し替えたい時の手段。
`data.json` の再生成はローカル環境が必須なので、こちらは **Excel ファイルの差し替えだけ** を行い、その後改めて手順1で `data.json` を再生成します。

1. GitHub のリポジトリページを開く: <https://github.com/shiga-h/angio-trainings>
2. ファイル一覧で `2026年度研修会_統合版.xlsx` をクリック
3. 鉛筆アイコン（編集）の隣にある **「⋯」メニュー → Delete file** を選び、コミット
4. リポジトリトップに戻り、**「Add file → Upload files」** で新しい Excel をアップロード（ファイル名は同じにする）、コミット
5. その後 Mac で `git pull` → 手順1の `update.sh` で `data.json` を再生成

> ※ `data.json` を再生成しないとサイト表示は変わらないので、ブラウザだけで完結する方法は2段階になります。

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
- `url` が空の場合は「HPを開く」ボタンの代わりに「名称をコピー」ボタンが出ます（ユーザーが検索エンジンに貼り付けて辿れるように）
- 「終了済み」判定は `dateEnd` 優先（無ければ `dateStart`）。両方空の行は「日程未定」扱いで常に表示されます

---

## 4. デプロイの仕組み

- Vercel が GitHub の `main` ブランチを監視
- `main` に push が入ると Vercel が自動で再ビルド & デプロイ
- ビルドコマンド・出力ディレクトリ設定はなし（純粋な静的サイト）
- 反映時間: 通常 30秒〜1分

デプロイ状況の確認は Vercel ダッシュボード（<https://vercel.com/dashboard>）の `angio-trainings` プロジェクトから。

---

## 5. トラブルシューティング

### `python3 convert.py` が `ModuleNotFoundError: No module named 'openpyxl'`

```sh
pip3 install openpyxl
# または
python3 -m pip install --user openpyxl
```

### `git push` で認証エラー

GitHub の Personal Access Token / SSH 鍵の設定を確認。`gh auth status` で状態確認できます。

### サイトが更新されない

1. Vercel ダッシュボードで該当 deployment が `Ready` になっているか確認
2. ブラウザのキャッシュをクリア（iPhone Safari は「設定 → Safari → 履歴とWebサイトデータを消去」、または Cmd+R 強制リロード）
3. `data.json` がリポジトリにコミット済みか `git log --oneline data.json` で確認

### 文字化けする

Excel を保存する際に文字コードが UTF-8 になっているか確認。openpyxl は xlsx を内部UTF-8で扱うので通常問題なし。CSVを経由するとエンコーディング事故が起きやすいので Excel (.xlsx) 形式のままで運用する。

### Excel に新しい開催形式やタグを増やしたい

- **開催形式**: コード側 (`app.js` の `FORMAT_CLASS`) に対応するCSSクラスを追加。未対応のままだとデフォルトのグレーバッジになります
- **タグ**: 仕様で固定の8種類以外を増やすと、`app.js` の `ALL_TAGS` に追加してください。それでも動作はしますが、表示順が末尾に回ります

---

## 6. 参考リンク

- リポジトリ: <https://github.com/shiga-h/angio-trainings>
- Vercel ダッシュボード: <https://vercel.com/dashboard>
- 仕様書: [SPEC.md](SPEC.md)
