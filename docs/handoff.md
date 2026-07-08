# Handoff — mori-portfolio

正本1本（SSOT）。次に開くセッションはこれだけ読めば再開できる。
ファイル名に日付・バージョンは付けない。正本は常に本ファイル `docs/handoff.md` を
上書き更新し、版の履歴は Git が保持する。

## §0 本命進捗（今回のテーマ）

**テーマ：配布用サンプル `slip-sample.csv` の文字化け解消（UTF-8+BOM化）**

- 症状：ポートフォリオのサンプルCSVがExcelで文字化け。ただし「全端末で化ける」ではなく、
  **Excelでダブルクリックした時だけ**。GitHub Web / GitHub Desktop / ブラウザでは正常。
- 診断：`slip-sample.csv` は**BOMなしUTF-8**だった（先頭バイト `e4 bc 9d`＝「伝」の
  1文字目、BOM `ef bb bf` 無し）。Excelは既定でcp932として読むため化ける。
  → **ファイル破損ではなく、読み手のエンコード取り違え**。
- 実装：`utf-8-sig`（UTF-8+BOM）で再出力。改行はLF維持（＝エンコードのみの1テーマ1変更）。
- 状態：新ファイル生成・差し替え済み。`slip-sample.csv` が uncommitted。**未コミット**。

## §1 確定事実（すべてファイル本体で検証済み）

- `slip-sample.csv` はBOMなしUTF-8だった（`file`判定＝"UTF-8 text"、od先頭に `ef bb bf` 無し）。
- `slip-sample.csv` の参照は**リンクのみ**。fetch/パースされていない：
  - `index.html:255` … `<a href="slip-sample.csv">`
  - `ocr-slip-demo.html:142` … `<a href="slip-sample.csv" target="_blank">`
  - （`ocr-slip-demo.html:83` は本文で名前に触れているだけ）
- コード内で唯一 fetch しているCSVは**別ファイル** `demo-order-trigger.html:603` の
  `fetch("demo_input_sample.csv")`。解析は同HTML `591行` の自作パーサ。
- **その自作パーサは `\r` は除去するがBOMは除去しない**。→ `demo_input_sample.csv` に
  BOMを付けるとヘッダ先頭が `﻿伝票番号` 化し発注デモが壊れる。
- 生成物の検証：BOM以外のバイトは変更前と**完全一致**（中身データ不変）。CSVパースOK＝
  **5行7列**、ヘッダ先頭セル＝`'伝票番号'`（BOMがヘッダに漏れていない）。改行LF維持。
- 正本の実体パス：`~/Documents/GitHub/mori-portfolio`。

## §2 推測・未確認（次セッションが事実扱いしないこと）

- ⚠️【最優先の未確認】**実機での化け解消は未検証**。生成物のバイトを検証しただけ。
  ユーザー環境のExcelで開いて化けないこと・ブラウザで開いて化けないことを確認して
  **初めて事実**になる。
- 日本語名の重複 `スリップサンプル.csv` は現在のローカルFinderに**見当たらない**＝恐らく
  既に1本化済み。リモート/GitHub Pages側は未確認。「恐らく解消済み・未検証」ラベル。

## §3 今回の決定と却下案

- 採用：**BOM付与（`utf-8-sig`）だけ**。改行はLFのまま。
- 却下1：全CSV一括でBOM付与 → **却下**。`demo_input_sample.csv` はfetch対象でBOM禁止（§1）。
- 却下2：改行もCRLF化 → 見送り。今回の症状はエンコードのみが原因。
- 却下3：中身を作り直す → 却下。データは正しかった。目印（BOM）だけの問題。

## §4 次に拾う点

1. **【最優先】実機確認**：差し替え済みの `slip-sample.csv` を、Excelでダブルクリック→
   化けないこと／ブラウザで「抽出結果サンプルCSVを見る」→化けないこと。
2. **アプリ増設**（v0.1から継続のTODO）：本体側で「1テーマ1変更・設計先行」で進める。
   着手時は 設計→推奨案提示→確認→実装 の順。
3. （任意・後日）原則「配布専用CSV＝BOM付き / fetch対象CSV＝BOMなし」をグローバル指示へ
   昇格するか判断。昇格条件は「別プロジェクトで2回目の観測」または「実機確認完了」。

## §5 触ってよい範囲 / 触ってはいけないファイル

- 触ってよい：`slip-sample.csv` のみ。
- 🚫 触るな：`demo_input_sample.csv`（BOM禁止。fetch＋BOM非除去パーサのため）。

## §6 コミットサマリー（slip-sample.csv）

```
fix: slip-sample.csv を UTF-8+BOM 化（Excel文字化け解消・中身不変）

なぜ: 配布用サンプルCSVがExcelでcp932誤読され化けていた。BOMでUTF-8を明示。
層:   表示（配布ファイルのエンコードのみ。アプリ挙動・ロジックは不変）。
前方効果のみ: 過去データに遡及なし。中身バイトはBOM3バイト(ef bb bf)以外同一。
検証: CSVパースOK（5行7列/ヘッダ先頭='伝票番号'）。※実機Excel/ブラウザ確認はユーザー側。
revert: このコミットを git revert、またはBOMなし版へ git checkout。
```

## §6.5 Git手順（静的リポ向け）

スキル定型はFlaskアプリ用（py_compile / 再起動）。本リポは静的サイトでapp.pyが無いため、
py_compile→CSVパース検証、再起動→無し、実機確認→Excel/ブラウザでの化け無し、に読み替える。

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

---
更新履歴（Git管理。ファイル名には残さない）:
- 2026-06-25: SKILL.md を skills/portfolio-demo-maintenance/ へ移設、index.html.bak.20260621 追加
- 2026-07-04: slip-sample.csv を UTF-8+BOM化（実機確認は保留）
- 2026-07-08: handoff を docs/handoff.md 1本へSSOT統合、v0.1/v0.2 を廃止
