/* 読取専用データ → 関連付け → 検索 → 詳細・部材・図面。外部APIや保存処理なし。 */
(() => {
  'use strict';
  const shared = window.DEMO_SHARED_DATA;
  const source = window.DRAWING_SEARCH_DATA;
  const fail = text => { document.getElementById('load-error').textContent = text; };
  if (!shared || shared.schemaVersion !== 1 || !['products', 'materials', 'productMaterials'].every(key => Array.isArray(shared[key]))) {
    fail('共通データを読み込めません。demo-shared-data.jsの配置・データ形式を確認してください。');
    return;
  }
  if (!source || source.schemaVersion !== 1 || !['productDetails', 'parts', 'drawings'].every(key => Array.isArray(source[key]))) {
    fail('図面検索データを読み込めません。drawing-search-demo-data.jsの配置・データ形式を確認してください。');
    return;
  }

  const index = (items, key) => new Map(items.map(item => [item[key], item]));
  const productMap = index(shared.products, 'productId');
  const materialMap = index(shared.materials, 'materialId');
  const partMap = index(source.parts, 'partId');
  const details = index(source.productDetails, 'productId');
  const normalize = text => String(text ?? '').normalize('NFKC').trim().toUpperCase();
  const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
  const measure = value => value == null ? '未登録' : positive(value) ? String(value) : '不正値';
  const dimensions = value => ['thicknessMm', 'widthMm', 'lengthMm'].map(key => measure(value?.[key])).join(' × ');
  const hasDimensions = value => ['thicknessMm', 'widthMm', 'lengthMm'].every(key => positive(value?.[key]));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const code = value => `<span class="code">${escape(value)}</span>`;
  const badge = (text, warning = false) => `<span class="pill${warning ? ' warn' : ''}">${escape(text)}</span>`;
  // 専用フォルダ内のSVGだけを参照する。外部URLや上位ディレクトリは使わない。
  const validPath = path => typeof path === 'string' && /^demo-drawings\/[A-Za-z0-9_-]+\.svg$/.test(path);
  const state = { query: '', materials: new Set(), thicknesses: new Set(), categories: new Set(), openProductId: null };

  function drawingIssue(drawing, productId) {
    const part = partMap.get(drawing.partId);
    if (drawing.productId !== productId || !part || part.productId !== productId) return '参照不整合：図面と品番・部材の対応を確認してください';
    if (!drawing.imagePath) return '図面画像未登録';
    if (!validPath(drawing.imagePath)) return '参照不整合：図面画像の参照先が不正です';
    return null;
  }

  const records = shared.products.map(product => {
    const detail = details.get(product.productId);
    const parts = source.parts.filter(part => part.productId === product.productId);
    const drawings = source.drawings.filter(drawing => drawing.productId === product.productId);
    // 共通の使用材料と図面検索専用の部材材料の和集合。名称・厚みは共通台帳から引く。
    const materialIds = new Set([
      ...shared.productMaterials.filter(link => link.productId === product.productId).map(link => link.materialId),
      ...parts.map(part => part.materialId)
    ]);
    const relatedMaterials = [...materialIds].map(id => materialMap.get(id)).filter(Boolean);
    const issues = [];
    if (!hasDimensions(detail?.dimensions)) issues.push('製品寸法未登録・不正：未確定の項目を確認してください');
    if (!parts.length) issues.push('部材情報なし');
    parts.forEach(part => {
      if (!hasDimensions(part.dimensions)) issues.push(`${part.partId}：部材寸法未登録・不正`);
      if (!Number.isSafeInteger(part.quantity) || part.quantity <= 0) issues.push(`${part.partId}：構成数量未登録・不正`);
    });
    [...materialIds].filter(id => !materialMap.has(id)).forEach(id => issues.push(`参照不整合：材料 ${id} は共通台帳に未登録`));
    relatedMaterials.filter(material => !positive(material.thicknessMm)).forEach(material => issues.push(`${material.materialId}：材料厚み未登録・不正`));
    if (!drawings.length) issues.push('図面未登録');
    drawings.forEach(drawing => { const issue = drawingIssue(drawing, product.productId); if (issue) issues.push(`${drawing.drawingId}：${issue}`); });
    return { product, detail, parts, drawings, materialIds, relatedMaterials, issues };
  });
  const recordMap = new Map(records.map(record => [record.product.productId, record]));

  function matches(record) {
    if (!normalize(record.product.productId).includes(normalize(state.query))) return false;
    if (state.categories.size && !state.categories.has(record.product.category)) return false;
    if (!state.materials.size && !state.thicknesses.size) return true;
    // 重要：材料と厚みを別々のsomeで判定しない。同じ1材料で両条件を満たす必要がある。
    return record.relatedMaterials.some(material =>
      (!state.materials.size || state.materials.has(material.materialId)) &&
      (!state.thicknesses.size || (positive(material.thicknessMm) && state.thicknesses.has(String(material.thicknessMm))))
    );
  }

  function renderFilters(target, values, selected) {
    const container = document.getElementById(target);
    values.forEach(({ id, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.value = id;
      button.setAttribute('aria-pressed', 'false');
      button.textContent = label;
      button.addEventListener('click', () => {
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        button.setAttribute('aria-pressed', String(selected.has(id)));
        renderResults();
      });
      container.appendChild(button);
    });
  }

  function materialLabel(materialId) {
    const material = materialMap.get(materialId);
    return material ? `${material.name}（${measure(material.thicknessMm)} mm）` : `参照不整合：${materialId}`;
  }

  function renderResults() {
    state.openProductId = null;
    const list = records.filter(matches).sort((a, b) => a.product.productId.localeCompare(b.product.productId));
    document.getElementById('result-count').textContent = `${records.length}品番中 ${list.length}品番を表示`;
    document.getElementById('empty-state').hidden = list.length !== 0;
    document.getElementById('results-table').hidden = list.length === 0;
    document.getElementById('result-body').innerHTML = list.map(r => `<tr class="result-row" data-product-id="${escape(r.product.productId)}">
      <th scope="row" data-label="品番 / 品名"><div>${code(r.product.productId)}<span class="product-name">${escape(r.product.name)}</span></div></th>
      <td data-label="製品寸法"><span>${escape(dimensions(r.detail?.dimensions))}</span></td>
      <td data-label="材料 / 分類"><div>${[...r.materialIds].map(id => `<div>${escape(materialLabel(id))}</div>`).join('') || '材料情報未登録'}<span class="note">${escape(r.product.category || '分類未登録')}</span></div></td>
      <td data-label="確認状態"><div>${r.detail?.isSet ? badge('複数部材') : ''}${r.issues.length ? badge('要確認', true) : badge('登録あり')}</div></td>
      <td data-label="詳細"><button type="button" class="detail-toggle" data-product="${escape(r.product.productId)}" aria-label="${escape(r.product.productId)}の詳細を見る" aria-expanded="false" aria-controls="detail-${escape(r.product.productId)}">詳細を見る</button></td>
    </tr><tr class="detail-row" id="detail-${escape(r.product.productId)}" hidden><td class="detail-cell" colspan="5"></td></tr>`).join('');
    document.querySelectorAll('.detail-toggle').forEach(button => button.addEventListener('click', () => toggleDetail(button)));
  }

  function toggleDetail(button) {
    const productId = button.dataset.product;
    const opening = state.openProductId !== productId;
    document.querySelectorAll('.detail-row').forEach(row => { row.hidden = true; });
    document.querySelectorAll('.detail-toggle').forEach(toggle => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '詳細を見る';
      toggle.setAttribute('aria-label', `${toggle.dataset.product}の詳細を見る`);
    });
    state.openProductId = opening ? productId : null;
    if (!opening) return;
    const record = recordMap.get(productId);
    const row = document.getElementById(`detail-${productId}`);
    renderDetail(row.firstElementChild, record);
    row.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    button.textContent = '詳細を閉じる';
    button.setAttribute('aria-label', `${productId}の詳細を閉じる`);
  }

  function renderDetail(container, record) {
    const r = record;
    container.innerHTML = `<h2 class="detail-title">${code(r.product.productId)} ／ ${escape(r.product.name)}</h2>
      <dl class="detail-summary"><div><dt>製品の加工後寸法（厚 × 幅 × 長 mm）</dt><dd>${escape(dimensions(r.detail?.dimensions))}</dd></div><div><dt>製品分類</dt><dd>${escape(r.product.category || '未登録')}</dd></div><div><dt>部材情報</dt><dd>${r.parts.length ? `${r.parts.length}種類` : '部材情報なし'}</dd></div></dl>
      ${r.issues.length ? `<ul class="warnings">${r.issues.map(issue => `<li>${escape(issue)}</li>`).join('')}</ul>` : ''}
      <h3>部材を確認</h3><p class="note">材料名・材料厚みは共通台帳を参照しています。下記の寸法は部材の加工後寸法で、原盤の幅・長さとは異なります。</p>
      <div class="part-grid">${r.parts.length ? r.parts.map(part => `<article class="part"><h4>${code(part.partId)} ／ ${escape(part.label)}</h4><p>関連材料：${escape(materialLabel(part.materialId))}</p><p>加工後寸法：${escape(dimensions(part.dimensions))} mm</p><p>構成数量：${Number.isSafeInteger(part.quantity) && part.quantity > 0 ? `${part.quantity}個` : '未登録・不正'}</p></article>`).join('') : '<p class="message">部材情報なし。構成や寸法は推測で補完しません。</p>'}</div>
      <h3>図面を確認</h3><p class="note">架空図面 / 製造使用不可。図面を拡大すると、部材IDと寸法を確認できます。</p><div class="drawing-grid"></div>`;
    const drawings = container.querySelector('.drawing-grid');
    if (!r.drawings.length) {
      const message = document.createElement('p');
      message.className = 'message';
      message.textContent = '図面未登録。この品番に関連する図面はありません。';
      drawings.appendChild(message);
    } else r.drawings.forEach(drawing => drawings.appendChild(drawingFigure(drawing, r.product.productId)));
  }

  function makeImage(drawing, enlarged = false) {
    const image = document.createElement('img');
    image.alt = `${drawing.productId} / ${drawing.partId} の架空図面 ${drawing.drawingId}。製造使用不可。`;
    image.width = 1000;
    image.height = 707;
    if (enlarged) image.id = 'dialog-image'; else image.loading = 'lazy';
    return image;
  }

  function drawingFigure(drawing, productId) {
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption');
    caption.textContent = `${drawing.drawingId} / ${drawing.partId}`;
    const issue = drawingIssue(drawing, productId);
    if (issue) {
      const message = document.createElement('p');
      message.className = 'message';
      message.textContent = issue;
      figure.append(message, caption);
      return figure;
    }
    const image = makeImage(drawing);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'drawing-open';
    button.textContent = `図面 ${drawing.drawingId} を拡大`;
    button.addEventListener('click', () => openDrawing(drawing, button));
    image.addEventListener('error', () => {
      const message = document.createElement('p');
      message.className = 'message';
      message.setAttribute('role', 'status');
      message.textContent = '画像読込失敗：図面画像を読み込めませんでした。部材情報は引き続き確認できます。';
      image.replaceWith(message);
      button.hidden = true;
    }, { once: true });
    image.src = drawing.imagePath;
    figure.append(image, caption, button);
    return figure;
  }

  const dialog = document.getElementById('drawing-dialog');
  let opener = null;
  function openDrawing(drawing, button) {
    opener = button;
    document.getElementById('dialog-title').textContent = `図面 ${drawing.drawingId}`;
    const part = partMap.get(drawing.partId);
    document.getElementById('dialog-info').textContent = `${drawing.productId} / ${drawing.partId} ｜ 加工後寸法：${dimensions(part.dimensions)} mm`;
    const area = document.getElementById('dialog-image-area');
    area.replaceChildren();
    const image = makeImage(drawing, true);
    image.addEventListener('error', () => {
      const message = document.createElement('p');
      message.className = 'message';
      message.setAttribute('role', 'status');
      message.textContent = '画像読込失敗：拡大画像を読み込めませんでした。閉じるボタンで詳細に戻れます。';
      image.replaceWith(message);
    }, { once: true });
    image.src = drawing.imagePath;
    area.appendChild(image);
    dialog.showModal();
  }
  document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
  // Escapeは標準dialogのcancel動作を利用。どちらの閉じ方でも操作元へ戻す。
  dialog.addEventListener('close', () => {
    document.getElementById('dialog-image-area').replaceChildren();
    if (opener?.isConnected && !opener.hidden) opener.focus();
    else document.getElementById('search-query').focus();
    opener = null;
  });

  function clearSearch() {
    state.query = '';
    state.materials.clear(); state.thicknesses.clear(); state.categories.clear();
    document.getElementById('search-query').value = '';
    document.querySelectorAll('.chips button').forEach(button => button.setAttribute('aria-pressed', 'false'));
    renderResults();
  }
  document.getElementById('search-query').addEventListener('input', event => { state.query = event.target.value; renderResults(); });
  document.getElementById('clear-filters').addEventListener('click', clearSearch);
  document.getElementById('empty-clear').addEventListener('click', () => { clearSearch(); document.getElementById('search-query').focus(); });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    clearSearch();
    state.query = button.dataset.example;
    document.getElementById('search-query').value = state.query;
    renderResults();
  }));
  renderFilters('material-filters', shared.materials.map(material => ({ id: material.materialId, label: material.name })), state.materials);
  renderFilters('thickness-filters', [...new Set(shared.materials.filter(material => positive(material.thicknessMm)).map(material => material.thicknessMm))].sort((a, b) => a - b).map(value => ({ id: String(value), label: `${value} mm` })), state.thicknesses);
  renderFilters('category-filters', [...new Set(shared.products.map(product => product.category).filter(Boolean))].map(category => ({ id: category, label: category })), state.categories);

  const exceptions = records.flatMap(record => record.issues.map(issue => `${record.product.productId}：${issue}`));
  for (const collection of [source.productDetails, source.parts, source.drawings]) {
    collection.filter(row => !productMap.has(row.productId)).forEach(row => exceptions.push(`参照不整合：${row.productId} は共通品番台帳に未登録`));
  }
  document.getElementById('exception-count').textContent = `／ ${exceptions.length}項目`;
  document.getElementById('exception-list').innerHTML = exceptions.length ? exceptions.map(issue => `<li>${escape(issue)}</li>`).join('') : '<li>確認事項はありません。</li>';
  renderResults();
  document.getElementById('load-error').hidden = true;
  document.getElementById('search-app').hidden = false;
})();
