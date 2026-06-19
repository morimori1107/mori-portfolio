---

name: portfolio-demo-maintenance
description: Use this skill when editing the mori-portfolio GitHub Pages site, especially when fixing demo links, sample CSV loading, index.html project order, works_casestudies.html links, or safety checks before commit.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Portfolio Demo Maintenance Skill

## Purpose

Maintain the `mori-portfolio` GitHub Pages site safely.

The site presents:

1. Manufacturing field improvement and factory management experience
2. Genban order trigger demo
3. Power Query × Excel workflow design
4. Rental property data formatter demo

The main positioning is:

* Primary: factory manager, manufacturing improvement, inventory/order logic
* Secondary: business DX, AI-assisted workflow improvement, and small MVP demos
* Supporting: rental real estate domain learning and property data formatter

## Always preserve this project order in index.html

1. 原盤発注トリガー判定ツール
2. Power Query × Excel 集計・帳票自動生成
3. 物件データ整形ツール

Do not make the rental property demo the first project unless the user explicitly asks.

## Main files

* `index.html`
* `works_casestudies.html`
* `demo-order-trigger.html`
* `demo_input_sample.csv`
* `property_formatter_demo.html`
* `property-sample-utf8.csv`
* `property-sample-sjis.csv`

Future Power Query demo names:

* `pq-excel-demo.html`
* `pq-sample-input.csv`
* `pq-sample-master.csv`

## Link rules

Use relative links without leading slash.

Good:

```html
<a href="demo-order-trigger.html">
```

Bad:

Leading-slash paths such as `/demo-order-trigger.html`.

## Genban order trigger demo workflow

When editing `demo-order-trigger.html`:

1. Keep manual CSV upload.
2. Keep internal `SAMPLE_INPUT`.
3. Keep or add a button to load `demo_input_sample.csv`.
4. Use fetch only for same-directory sample CSV.
5. Show a clear success message.
6. Show a clear error message if CSV loading fails.
7. Keep all data public-safe and fictitious.

## Safety rules

Never add:

* `.env`
* API keys
* real business data
* company names
* customer names
* real product codes
* real quantities
* internal folder paths
* personal information
* `.DS_Store`

Do not use external APIs or unknown URLs.

Local browser testing should use only:

* `http://localhost:8000`
* `http://127.0.0.1:8000`

Prefer:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Stop the local server after testing.

## Ask before doing

Ask for confirmation before:

* Adding dependencies
* Renaming many files
* Deleting files
* Changing GitHub visibility
* Opening network access beyond localhost
* Changing repository structure
* Adding any file that may contain real data
* Committing generated binary files

## Post-change checklist

After editing, check:

1. `index.html` opens.
2. `demo-order-trigger.html` opens.
3. `demo_input_sample.csv` opens.
4. Demo CSV load button works.
5. `property_formatter_demo.html` opens.
6. `property-sample-utf8.csv` opens.
7. `property-sample-sjis.csv` opens.
8. `works_casestudies.html` opens.
9. No old Japanese filename links remain.
10. `.DS_Store` is not included in commit.

## Preferred commit summary examples

* `原盤発注デモにサンプルCSV読込を追加`
* `トップページのプロジェクトリンクを整理`
* `物件整形デモのサンプルCSVリンクを修正`
* `Power Queryデモ差し替え準備を追加`
