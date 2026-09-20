/* 製造DXデモの処理と画面。共通台帳・元INPUTには書き込まない。 */
(() => {
  'use strict';

  const data = window.DEMO_SHARED_DATA;
  const required = ['products', 'materials', 'productMaterials', 'lines', 'workClasses', 'productWorkRules', 'standardTimes', 'orders'];
  if (!data || data.schemaVersion !== 1 || required.some(key => !Array.isArray(data[key]))) {
    document.getElementById('load-error').textContent = '共通データを読み込めませんでした。demo-shared-data.jsをHTMLと同じフォルダに置いてください。対応データ形式はv1です。';
    return;
  }

  const byId = (rows, key) => new Map(rows.map(row => [row[key], row]));
  const products = byId(data.products, 'productId');
  const materials = byId(data.materials, 'materialId');
  const lines = byId(data.lines, 'lineId');
  const classes = byId(data.workClasses, 'workClassId');
  const number = value => new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 }).format(value);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const code = value => `<span class="code">${escape(value)}</span>`;
  const pill = (text, warning = false) => `<span class="pill${warning ? ' warn' : ''}">${escape(text)}</span>`;
  const state = { step: 'input', query: '', lineId: '' };
  const steps = ['input', 'day', 'cross', 'standard', 'workload'];
  const stepNames = ['INPUT', 'DAY LIST', 'CROSS LIST', '標準時間', 'WORKLOAD'];

  // INPUT → 品番照合 → ルール1件 → 作業区分・ライン → 標準時間。
  // qtyValid / classified / minutesを分け、欠落を0や既定値で補完しない。
  const records = data.orders.map(order => {
    const issues = [];
    const product = products.get(order.productId);
    const qtyValid = typeof order.quantity === 'number' && Number.isSafeInteger(order.quantity) && order.quantity > 0;
    if (!qtyValid) issues.push('数量不正');
    if (!product) issues.push('未登録品番');
    const rules = product ? data.productWorkRules.filter(rule => rule.productId === order.productId) : [];
    const workClass = rules.length === 1 ? classes.get(rules[0].workClassId) : undefined;
    const line = workClass ? lines.get(workClass.lineId) : undefined;
    if (product && (!workClass || !line)) issues.push('作業区分未解決');
    const times = workClass ? data.standardTimes.filter(time => time.workClassId === workClass.workClassId) : [];
    const timeValid = times.length === 1 && typeof times[0].minutesPerUnit === 'number' && Number.isFinite(times[0].minutesPerUnit) && times[0].minutesPerUnit > 0;
    if (workClass && line && !timeValid) issues.push(times.length === 0 ? '標準時間欠落' : '標準時間不正');
    const classified = Boolean(product && qtyValid && workClass && line);
    const minutesPerUnit = timeValid ? times[0].minutesPerUnit : null;
    const minutes = classified && timeValid ? order.quantity * minutesPerUnit : null;
    return { order, product, rule: rules.length === 1 ? rules[0] : null, workClass, line, classified, minutesPerUnit, minutes, issues };
  });

  function table(caption, headers, rows) {
    const head = headers.map(text => `<th scope="col">${escape(text)}</th>`).join('');
    return `<div class="tablewrap" tabindex="0" role="region" aria-label="${escape(caption)}（横スクロール可）"><table><caption>${escape(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}">該当する明細はありません。</td></tr>`}</tbody></table></div>`;
  }

  function visibleRecords() {
    return records.filter(record => {
      const text = `${record.order.productId} ${record.product?.name || ''}`.toLowerCase();
      return text.includes(state.query) && (!state.lineId || record.line?.lineId === state.lineId);
    });
  }

  function renderInput(visible) {
    const rows = visible.map(r => `<tr><th scope="row">${code(r.order.orderId)}</th><td>${escape(r.order.plannedDate)}</td><td>${code(r.order.projectId)}</td><td>${code(r.order.productId)}<br>${escape(r.product?.name || '未登録')}</td><td class="num">${escape(r.order.quantity)}</td><td>${r.rule ? code(r.rule.ruleId) : '未解決'}</td><td>${escape(r.workClass?.name || '未解決')}</td><td>${escape(r.line?.name || '未解決')}</td><td>${r.issues.length ? r.issues.map(issue => pill(issue, true)).join(' ') : pill('計算可能')}</td></tr>`);
    document.getElementById('input-table').innerHTML = table('元INPUTと照合結果（元の値を保持）', ['明細ID', '計画日', '架空案件', '品番／品名', '数量（個）', '照合ルール', '作業区分', 'ライン', '確認状態'], rows);
  }

  function renderDay(classified) {
    const sorted = [...classified].sort((a, b) => `${a.order.plannedDate}|${a.line.lineId}|${a.order.projectId}|${a.order.orderId}`.localeCompare(`${b.order.plannedDate}|${b.line.lineId}|${b.order.projectId}|${b.order.orderId}`));
    const rows = sorted.map(r => `<tr><th scope="row">${code(r.order.orderId)}</th><td>${escape(r.order.plannedDate)}</td><td>${escape(r.line.name)}</td><td>${code(r.order.projectId)}</td><td>${code(r.order.productId)}</td><td>${escape(r.workClass.name)}</td><td class="num">${number(r.order.quantity)}</td><td>${r.minutes === null ? pill('標準時間未登録', true) : pill('照合済み')}</td></tr>`);
    if (rows.length) rows.push(`<tr class="total"><th scope="row" colspan="6">数量合計</th><td class="num" data-total="day">${number(classified.reduce((sum, r) => sum + r.order.quantity, 0))}</td><td>個</td></tr>`);
    document.getElementById('day-table').innerHTML = table('計画日・ライン・案件別の明細', ['明細ID', '計画日', 'ライン', '架空案件', '品番', '作業区分', '数量（個）', '標準時間'], rows);
  }

  function renderCross(classified) {
    const groups = new Map();
    classified.forEach(r => {
      const key = `${r.order.productId}|${r.workClass.workClassId}`;
      if (!groups.has(key)) groups.set(key, { record: r, days: new Map(), total: 0 });
      const group = groups.get(key);
      group.days.set(r.order.plannedDate, (group.days.get(r.order.plannedDate) || 0) + r.order.quantity);
      group.total += r.order.quantity;
    });
    const rows = [...groups.values()].map(g => `<tr><th scope="row">${code(g.record.order.productId)}</th><td>${escape(g.record.workClass.name)}${g.record.minutesPerUnit === null ? '<br>' + pill('標準時間欠落', true) : ''}</td>${data.meta.dates.map(date => `<td class="num${g.days.has(date) ? ' hot' : ''}">${g.days.has(date) ? number(g.days.get(date)) : '—'}</td>`).join('')}<td class="num total">${number(g.total)}</td></tr>`);
    if (rows.length) rows.push(`<tr class="total"><th scope="row" colspan="2">数量合計</th>${data.meta.dates.map(date => `<td class="num">${number(classified.filter(r => r.order.plannedDate === date).reduce((sum, r) => sum + r.order.quantity, 0))}</td>`).join('')}<td class="num" data-total="cross">${number(classified.reduce((sum, r) => sum + r.order.quantity, 0))}</td></tr>`);
    document.getElementById('cross-table').innerHTML = table('品番別・日別の数量（個）', ['品番', '作業区分', ...data.meta.dates.map(date => date.slice(5)), '期間合計'], rows);
  }

  function renderStandard(classified) {
    const unique = [...new Map(classified.map(r => [r.order.productId, r])).values()];
    document.getElementById('standard-table').innerHTML = table('品番 → ルール → 作業区分 → 標準時間', ['品番', 'ルール', '作業区分ID', '作業区分', 'ライン', '標準分／個'], unique.map(r => `<tr><th scope="row">${code(r.order.productId)}</th><td>${code(r.rule.ruleId)}</td><td>${code(r.workClass.workClassId)}</td><td>${escape(r.workClass.name)}</td><td>${escape(r.line.name)}</td><td class="num">${r.minutesPerUnit === null ? pill('未登録・工数未計算', true) : number(r.minutesPerUnit)}</td></tr>`));
    const sample = classified.find(r => r.minutes !== null);
    document.getElementById('calculation-example').textContent = sample ? `計算例：${sample.order.orderId} / ${sample.order.productId} → ${sample.workClass.name}。${number(sample.order.quantity)}個 × ${number(sample.minutesPerUnit)}分／個 ＝ ${number(sample.minutes)}分。` : 'この絞り込みには、標準時間まで照合できた明細がありません。';
  }

  function renderWorkload(classified) {
    const groups = new Map();
    classified.forEach(r => {
      const key = `${r.order.plannedDate}|${r.line.lineId}`;
      if (!groups.has(key)) groups.set(key, { date: r.order.plannedDate, line: r.line, minutes: 0, computed: 0, pending: 0 });
      const g = groups.get(key);
      if (r.minutes === null) g.pending += r.order.quantity;
      else { g.minutes += r.minutes; g.computed += 1; }
    });
    const list = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, group]) => group);
    const computed = classified.filter(r => r.minutes !== null);
    const pending = classified.filter(r => r.minutes === null);
    const minutes = computed.reduce((sum, r) => sum + r.minutes, 0);
    const computedText = computed.length ? `${computed.length}明細 / ${number(minutes)}分（${number(minutes / 60)}時間）` : '計算できる明細なし';
    const pendingText = pending.length ? `${pending.length}明細 / ${number(pending.reduce((sum, r) => sum + r.order.quantity, 0))}個は工数未計算` : 'なし';
    document.getElementById('workload-summary').textContent = `計算可能分：${computedText}。標準時間未登録：${pendingText}。確認対象はページ下部に表示しています。`;
    const max = Math.max(1, ...list.map(g => g.minutes));
    document.getElementById('workload-chart').innerHTML = list.length ? list.map(g => `<div><div class="bar-label"><span>${escape(g.date.slice(5))} / ${escape(g.line.name)}</span><strong>${g.computed ? `${number(g.minutes)}分` : '未計算'}${g.pending ? ` ＋ 未計算${number(g.pending)}個` : ''}</strong></div>${g.computed ? `<div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${g.minutes / max * 100}%"></div></div>` : ''}</div>`).join('') : '<p class="note">表示できる予定工数はありません。</p>';
    const rows = list.map(g => `<tr><th scope="row">${escape(g.date)}</th><td>${escape(g.line.name)}</td><td class="num">${g.computed ? number(g.minutes) : '未計算'}</td><td class="num">${g.computed ? number(g.minutes / 60) : '未計算'}</td><td>${g.pending ? pill(`${number(g.pending)}個・工数未計算`, true) : 'なし'}</td></tr>`);
    if (rows.length) rows.push(`<tr class="total"><th scope="row" colspan="2">計算可能分の合計</th><td class="num" data-total="minutes">${computed.length ? number(minutes) : '未計算'}</td><td class="num">${computed.length ? number(minutes / 60) : '未計算'}</td><td>${pending.length ? `${pending.length}明細が未計算` : '未計算なし'}</td></tr>`);
    document.getElementById('workload-table').innerHTML = table('日別・ライン別の予定工数', ['計画日', 'ライン', '計算可能分（分）', '計算可能分（時間）', '標準時間未登録の数量'], rows);
  }

  function render() {
    const visible = visibleRecords();
    const classified = visible.filter(r => r.classified);
    document.getElementById('filter-status').textContent = `表示対象：元INPUT ${visible.length}明細 → 数量集計 ${classified.length}明細 → 工数計算 ${classified.filter(r => r.minutes !== null).length}明細。計画日は全工程で共通です。`;
    renderInput(visible);
    renderDay(classified);
    renderCross(classified);
    renderStandard(classified);
    renderWorkload(classified);
  }

  function showStep(step, focusHeading = false) {
    state.step = step;
    steps.forEach(name => { document.getElementById(`panel-${name}`).hidden = name !== step; });
    document.querySelectorAll('[data-step]').forEach(button => {
      if (button.dataset.step === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const position = steps.indexOf(step);
    document.getElementById('previous-step').hidden = position === 0;
    document.getElementById('next-step').hidden = position === steps.length - 1;
    document.getElementById('next-step').textContent = `次へ：${stepNames[position + 1] || ''}`;
    if (focusHeading) document.getElementById(`heading-${step}`).focus();
  }

  const problems = records.filter(r => r.issues.length);
  document.getElementById('summary').innerHTML = [
    ['元INPUT', `${records.length}<small> 明細</small>`],
    ['数量集計に進める', `${records.filter(r => r.classified).length}<small> 明細</small>`],
    ['工数を計算できる', `${records.filter(r => r.minutes !== null).length}<small> 明細</small>`],
    ['確認対象', `${problems.length}<small> 明細</small>`]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  document.getElementById('issue-count').textContent = `／ ${problems.length}明細`;
  document.getElementById('issue-list').innerHTML = problems.map(r => `<li>${code(r.order.orderId)} · ${code(r.order.productId)}：<strong class="warning">${escape(r.issues.join('・'))}</strong>（入力数量：${escape(r.order.quantity)}）。${r.classified ? '数量は集計に保持し、工数は未計算。' : '数量集計・工数計算の対象外。元INPUTは保持。'}</li>`).join('');
  document.getElementById('materials-table').innerHTML = table('新規の架空品番・材料台帳（全件）', ['品番／品名', '材料ID／名称', '架空寸法：厚 × 幅 × 長（mm）', '取数（個／枚）'], data.productMaterials.map(link => {
    const p = products.get(link.productId);
    const m = materials.get(link.materialId);
    return `<tr><th scope="row">${code(link.productId)}<br>${escape(p?.name || '未登録')}</th><td>${code(link.materialId)}<br>${escape(m?.name || '未登録')}</td><td>${m ? `${m.thicknessMm} × ${m.widthMm} × ${m.lengthMm}` : '未登録'}</td><td class="num">${number(link.piecesPerSheet)}</td></tr>`;
  }));
  data.lines.forEach(line => {
    const option = document.createElement('option');
    option.value = line.lineId;
    option.textContent = line.name;
    document.getElementById('line-filter').appendChild(option);
  });
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => showStep(button.dataset.step, true)));
  document.getElementById('next-step').addEventListener('click', () => showStep(steps[steps.indexOf(state.step) + 1], true));
  document.getElementById('previous-step').addEventListener('click', () => showStep(steps[steps.indexOf(state.step) - 1], true));
  document.getElementById('product-search').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); render(); });
  document.getElementById('line-filter').addEventListener('change', event => { state.lineId = event.target.value; render(); });
  document.getElementById('reset-filters').addEventListener('click', () => {
    state.query = '';
    state.lineId = '';
    document.getElementById('product-search').value = '';
    document.getElementById('line-filter').value = '';
    render();
  });
  render();
  document.getElementById('load-error').hidden = true;
  document.getElementById('demo-content').hidden = false;
})();
