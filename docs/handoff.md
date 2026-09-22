# Handoff — mori-portfolio

正本1本（SSOT）。次に開くセッションはこれだけ読めば再開できる。
ファイル名に日付・バージョンは付けない。正本は常に本ファイル `docs/handoff.md` を
上書き更新し、版の履歴は Git が保持する。

## §0 現在テーマ・クローズ状態

**現在テーマ：Portfolio再編 CLOSED**

2026-09-22、ユーザー指定のクローズ条件を実ファイル・Git履歴と照合し、CLOSEDとして最終確定した。
現在の未完了タスクはない。将来の品質確認候補は§4に分離し、再編を自動で再開しない。

### クローズ条件

- [x] TOP5案件完成
- [x] CASE4事例完成
- [x] 新3デモ完成
- [x] 既存2デモ継続
- [x] 旧アンカー互換維持
- [x] 公開データは架空データ

## §1 完成構成とGitの確定事実（2026-09-22確認）

### Gitの確認時点

- 正本の実体パス：`~/Documents/GitHub/mori-portfolio`。branchは `main`。
- 最終確認の開始時点では、本HandoffにCLOSED化する未コミットの更新が存在した。
  既存の更新内容を保持・バックアップして最終確認し、確認日とGit状態の記録を更新した。
  それ以外の追跡ファイルに変更はなかった。
- 更新前の `HEAD` / `main` / `origin/main` は
  `92603eea3127b030ad425439fd3d27d6090e4641`。
- 件名：`ケーススタディを4事例の設計説明へ再編`。
- 2026-09-22 20:49 JST、`git ls-remote --heads origin main`でGitHubの同一commitを直接確認。
  **Portfolio実装分は`92603ee`までpush済み**。§6の主要6commitも履歴に存在する。
- この照会は本Handoff更新前の記録。今回のHandoff更新は別のローカルcommitとし、pushは行わない。
  文書更新commitのIDと、その後の最新push状態はGit履歴・remoteで確認する。実装完了と文書commitのpush状態は区別する。

### 完成TOP（`index.html`）

1. **01 製造DX基盤｜入力から予定工数まで**
2. **02 図面・品番検索**
3. **03 原盤発注**
4. **04 Receipt AI**
5. **05 物件整形**

- HeroのNOW：`製造DX基盤 / 図面・品番検索 / AI監査フロー`。CAREER側も同じ方向へ更新済み。
- 01の主技術：Power Query / Excel / VBA / マスター照合 / 標準時間。
  補足の「実運用構造を公開用HTML / JavaScriptで再現」で実運用と公開デモを区別する。
- 新01・02・04は`data-demo-toggle`を使う共通の折りたたみ処理。
  初期`hidden`、iframeは`data-src`のみ。初回展開でのみ`src`を設定し、同時に1件だけ展開する。
- 別デモを開くと現在のデモを閉じる。手動・自動どちらの閉鎖でもiframeを破棄・再読込せず、再展開で状態を保持する。
- ボタンは「デモを見る / デモを閉じる」、`aria-expanded`・`aria-controls`を使用。
  Enter / Spaceは標準buttonの動作。新3件の「別タブで開く」は閉じた状態でも利用可能。
- 03原盤発注・05物件整形は別タブ導線。Receiptのレビュー結果は別タブへ引き継がない。
- 配色・書体・余白、ISSUE / ACTION / RESULTのPC3列・スマートフォン1列を維持。

### 完成CASE STUDIES（`works_casestudies.html`）

| CASE | 見出し | セクションID / 主デモ |
|---|---|---|
| CASE01 | 製造DX基盤 | `case-pq` / `manufacturing-dx-demo.html` |
| CASE02 | 図面・品番検索 | `case-drawing` / `drawing-search-demo.html` |
| CASE03 | 原盤発注 | `case-order` / `demo-order-trigger.html` |
| CASE04 | Receipt AI | `case-ocr` / `receipt-ai-demo.html` |

- 各CASEは、入力 → 処理フロー → 設計判断 → 例外処理 → 検証 → 結果 → 実装範囲を説明。
  TOPのISSUE / ACTION / RESULTの単純コピーではない。
- 旧アンカー互換：`#case-pq`→新CASE01、`#case-order`→新CASE03、`#case-ocr`→新CASE04。
  IDを統合先に維持し、旧本文を重複掲載しない。固定ヘッダー対策に`scroll-margin-top`を設定。
- 冒頭は「4 設計事例」「4 公開デモ」「公開用架空データ」。根拠不明の`20+`等は削除済み。
- 物件整形はTOPデモのみ。GASとともにCASE本文から退役。既存資産を削除したものではない。
- CASEのPC4列・スマートフォン1列と既存デザインを維持。

### 公開デモと旧資産

| 区分 | ファイル | 状態 |
|---|---|---|
| 新規公開 | `manufacturing-dx-demo.html` | v0完成・TOP01 / CASE01 |
| 新規公開 | `drawing-search-demo.html` | v0完成・TOP02 / CASE02 |
| 新規公開 | `receipt-ai-demo.html` | v0完成・TOP04 / CASE04 |
| 既存継続 | `demo-order-trigger.html` | TOP03 / CASE03 |
| 既存継続 | `property_formatter_demo.html` | TOP05のみ |
| 旧資産 | `pq-excel-demo.html` / `pq-sample-input.csv` | 独立した主掲載から退役。CASE01の旧版資料として保持 |
| 旧資産 | `ocr-slip-demo.html` / `slip-sample.csv` | 独立した主掲載から退役。CASE04の旧版資料として保持 |

- `demo-shared-data.js`は製造DX・図面検索が参照する共通架空データのSSOT。原盤発注まで統合済みとはしない。
- 製造DXの処理は`manufacturing-dx-demo.js`。図面検索は`drawing-search-demo.js`、
  `drawing-search-demo-data.js`と`demo-drawings/`の架空SVG5枚を使用。
- Receiptは`receipt-ai-demo.js`、`receipt-ai-demo-data.js`と`demo-receipts/`の架空SVG6枚を使用。
  資料は7件で、コピー候補1件は同じSVGを参照する。
- 既存CSV・SVG・デモ・その他資産は保持。公開サンプルに実社名・実品番・実図面・実顧客・社内データ・個人情報を使わない。

## §2 完成実装の仕様と検証記録

### v0の確定範囲

- 製造DX：品番／ルール → 作業区分 → DAY LIST / CROSS LIST → 作業区分別標準時間 → WORKLOAD。
  予定工数は数量×標準分／個。数量集計除外と標準時間欠落を分け、欠落を0扱いしない。
  段取り時間、能力超過判定、予実比較、CSV入出力、保存、自動日程計画は対象外であり、未完了TODOではない。
- 図面検索：品番 → 材料／厚み／分類 → 一覧 → 詳細 → 部材 → 図面 → 拡大。
  同一関連材料が材料・厚み条件をともに満たし、分類は製品属性としてANDする。
  未登録・読込失敗・部材情報なし・寸法欠落・参照不整合・該当なしを明示。
- Receipt：Source → AI Observation → HIGH / REVIEW → Human Review → 項目別Ground Truth。
  元値は読み取り専用。未確認・保留があれば資料全体を確認完了にしない。確定後も元候補との差分を確認できる。
  file duplicate candidateとtransaction relation candidateを分離する。relationは
  `candidate` / `confirmed_same` / `confirmed_separate` / `cannot_determine`。
  SHA一致やコピー候補を同一取引の確定と混同しない。
- Receipt公開版は操作非保存。ライブAI、OCR、SQLite、JSON保存、実SHA計算、外部API、
  モデル自動ルーティング、V2 DB統合は使わない。V1の実装・運用実績とV2の将来設計を区別する。

### 実装時に完了した検証（今回の文書更新で再実行したものではない）

- 新3デモ：各実装時に通常系・例外系・キーボード操作・ChromeのPC／スマートフォン幅・`file://`を確認。
- TOP：Chrome 1280 / 390 / 375 / 320px。PC3列・スマートフォン1列、トップの横はみ出しなし。
  初期デモ通信0回、初回展開各1回、再展開で追加読込なし。排他開閉・状態保持・別タブ・既存03/05リンクを確認。
- CASE：Chrome 1280 / 768pxで4列、390 / 320pxで1列。横はみ出しなし。
  旧3アンカーは4幅の全12組で到達確認。自動検証の一度の待機タイムアウト後、再実行と停止位置の確認が通った。
  主デモ4件、TOP→CASE03、旧資産・CSVの到達を確認。
- 既知の表示制約：TOPの320px幅ではiframe幅が約170pxになり、製造DX・図面検索の内部に横スクロールが生じる。
  別タブ導線を用意し、既存余白とデモ本体は維持した。再編の未完了作業には戻さない。

## §3 クローズ時の決定

- TOP5件・CASE4件・新3デモ・既存2デモを完成構成として固定。Portfolio再編はCLOSED。
- 旧PQ・旧OCRは主掲載を退役し、関連ファイル・CSVは旧版資料として保持。物件整形・GASのCASE本文は掲載終了。
- 完成機能、実運用の技術、公開用架空デモ、将来設計を区別する。架空サンプル件数を実績値として扱わない。
- 全面リニューアル、CSS全面整理、無関係な改修は行わない。今後の別テーマは新たな依頼・設計確認から開始する。
- SSOTは`docs/handoff.md`1本。過去の判断・CSV対応は§6に保持する。

## §4 将来の品質確認候補（クローズ条件外）

以下は将来の任意テーマであり、今回の未完了作業ではない。着手は別途依頼がある場合に限る。

- Safari / Firefoxでの表示・操作。
- スマートフォン実機でのタッチ操作、狭幅iframeの使い勝手。
- スクリーンリーダーでの読み上げ・フォーカス移動。
- 外部通信を許可した環境でのGoogle Fonts取得時の表示。
- GitHub Pages配信後の実画面・キャッシュ挙動。GitHub mainとの一致と配信表示の確認は別である。
- 過去のCSVについて、Excel実機の文字化け解消、日本語名重複ファイルのリモート／Pages上の有無。
  BOM付与・コミット完了と実機確認完了は区別し、過去の記録を検証済みへ書き換えない。

## §5 今回の変更範囲

- 最終更新対象は**`docs/handoff.md`のみ**。バックアップと実ファイル・Git履歴の確認を経て更新。
- HTML、CSS、JavaScript、CSV、SVG、公開デモ、CASE STUDIES、その他のファイルは変更しない。
- クローズ後に自動で改修を続けない。§4は再開指示ではない。
- `demo_input_sample.csv`のBOM付与禁止という過去の注意は§6に保持する。

## §6 完了履歴

### Portfolio再編（2026-09-22 CLOSED）

| commit | 完了内容 |
|---|---|
| `c30ec76` | 製造DX基盤の公開デモv0と共通架空データを追加 |
| `773e47a` | 製造DXデモのサマリー表記と要確認内訳を明確化 |
| `3959438` | 図面・品番検索の公開v0と架空SVGを追加 |
| `c220a8d` | Receipt AIの公開v0と架空資料を追加 |
| `4b3be3f` | TOPを最終5件構成と共通デモ開閉へ更新（`index.html`のみ） |
| `92603ee` | CASE STUDIESを最終4事例の設計説明へ再編（`works_casestudies.html`のみ） |

- 前段階：`c1b3752`で旧PQデモの初期非表示・初回展開時読込を実装。
  `b33b892`でHandoffのテーマをPortfolio再編に更新した。
- 旧TOPは原盤発注／PQ／OCR／物件整形の4件、旧CASEは原盤発注／PQ／OCR／物件整形／GASの5件だった。
  旧PQケースは新CASE01へ吸収し、旧OCRケースは確認工程の考え方を引き継いで新CASE04へ置換した。
- 当時の「Portfolio再編未実装」「次に01〜05を作る」という候補・TODOは完了履歴であり、現在の作業指示ではない。
- 今回は本Handoffのみを最終更新してCLOSEDとした。更新commitのIDはGit履歴で確認する。

### CSV文字化け対応（過去の完了履歴）

- 対象：配布用 `slip-sample.csv`。**BOM付与・コミットは完了、実機確認は保留**。
- 症状：Excelでダブルクリックした時に文字化け。GitHub Web / GitHub Desktop / ブラウザでは正常という当時の記録。
- 当時の診断：BOMなしUTF-8（先頭 `e4 bc 9d`＝「伝」、`ef bb bf` なし）をExcelがcp932と誤認。
  ファイル破損ではなく読み手のエンコード取り違えと判断した。
- 実装：`utf-8-sig`（UTF-8+BOM）で再出力。改行LFを維持し、中身のデータは作り直さなかった。
- 当時の検証記録：BOM以外のバイトは変更前と完全一致。CSVは5行7列、ヘッダ先頭は `伝票番号`。
- 実際のcommit：`46a8056`（2026-07-08）、`chore: slip-sample.csv を更新`。
- 2026-09-20再確認：BOM付きUTF-8、5行7列、作業ファイルはHEADと一致。「未コミット」は解消済み。
- `slip-sample.csv` は旧OCRデモの補助資産として保持。現在の参照は
  `works_casestudies.html` のCASE04末尾の旧版資料と `ocr-slip-demo.html`。旧TOPからの直接導線は再編時に退役した。
- 過去の注意：`demo-order-trigger.html` の `fetch("demo_input_sample.csv")` は別CSVを読む。
  当時確認した自作パーサは `\r` を除去するがBOMを除去しないため、**`demo_input_sample.csv` にBOMを付けない**。
- 却下・見送り：全CSV一括BOM付与は発注デモへの影響から却下。CRLF化は見送り。データの作り直しも却下。
- 過去の復旧案：必要になった場合は対象commitと差分を確認し、承認された範囲でrevertを検討する。
- Excel実機・ブラウザでの文字化け解消確認は将来の品質確認候補。過去の未確認記録を残すもので、Portfolio再編の未完了作業ではない。
- 任意の後日判断：「配布専用CSV＝BOM付き / fetch対象CSV＝BOMなし」をグローバル指示へ昇格するか。
  当時の条件は「別プロジェクトで2回目の観測」または「実機確認完了」。

## §6.5 Git手順（静的リポ向け）

- Gitの状態と差分を確認し、承認されたファイルだけを対象にする。
- 検証は変更内容に合わせる。文書のみなら記載内容・Markdown構造・差分、HTML / JavaScriptなら構文とブラウザ動作、
  CSVならバイト・パースと必要な実機表示を確認する。
- 本リポは静的サイト。Flask向けの `py_compile` やアプリ再起動を前提にしない。

## §7 handoff 配置ルール（SSOT・今回確定）

- 正本は **`docs/handoff.md` 1本のみ**。ファイル名に日付・バージョンを付けない。
- 更新は**上書き**。版の履歴は Git（コミット）が持つ。
- 旧 `Handoff … v0.1 .md` / `handoff_20260704_v0.2.md`（日付・版付き）は本ファイルへ
  統合のうえ**廃止**。以後 handoff/archive のような版別退避フォルダは作らない。

## §8 確定した運用ルール（恒久）

- **Git本体は `~/Documents/GitHub/mori-portfolio` の1つだけ。編集・増設は必ずここで。**
- Desktop側コピー（`05_mori-portfolio` 等）は参照専用。`_REF_DO-NOT-EDIT` 付与、編集禁止。
- `.bak` は当面Git内に置く方針。増えたら `backup/` へ集約を検討。
- 着手時は 設計→推奨案提示→確認→実装 の順（1テーマ1変更・設計先行）。
- GitHub Pages更新後、既存タブやブックマークで旧表示が残る場合がある。Git / remote一致を確認後、
  ハードリロードまたは新規タブで切り分ける。**旧表示だけを根拠に再実装・再pushしない**。

---
更新履歴（Git管理。ファイル名には残さない）:
- 2026-06-25: SKILL.md を skills/portfolio-demo-maintenance/ へ移設、index.html.bak.20260621 追加
- 2026-07-04: slip-sample.csv を UTF-8+BOM化（実機確認は保留）
- 2026-07-08: handoff を docs/handoff.md 1本へSSOT統合、v0.1/v0.2 を廃止
- 2026-07-08: slip-sample.csv 更新をコミット（`46a8056`）
- 2026-08-16: ケーススタディリンクとOCR案件を修正（`b297598`）
- 2026-08-28: CASE04にasset_ledgerの対象外処理を追記（`b74b194`）
- 2026-09-03: CASE01にOUT OF SCOPEを追加（`86faf9a`）
- 2026-09-20: Power Queryデモ開閉を実装（`c1b3752`、index.htmlのみ、GitHub mainとの一致確認済み）
- 2026-09-20: 現在テーマをPortfolio再編へ更新。CSV対応を完了済み履歴へ移し、未実装候補とPages表示キャッシュの運用メモを記録
- 2026-09-22: TOP5件・CASE4件・新3デモ・既存2デモ・旧アンカー互換を実ファイル・Git履歴で確認し、既存の未コミット更新を保持してPortfolio再編 CLOSEDを最終確定。品質確認候補をクローズ条件外へ分離
