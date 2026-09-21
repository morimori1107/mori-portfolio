(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const data = window.RECEIPT_DEMO_DATA;
  if (!data) return;
  const relationLabels = {
    candidate: '候補・未確定', confirmed_same: '同一取引・関連証憑と確認',
    confirmed_separate: '別取引と確認', cannot_determine: '判断不能・保留'
  };
  const sources = new Map(data.sources.map(source => [source.id, source]));
  const observations = new Map(data.observations.map(observation => [observation.sourceId, observation]));
  const invalid = sources.size !== data.sources.length || observations.size !== data.observations.length ||
    data.observations.some(o => !sources.has(o.sourceId) || !['HIGH', 'REVIEW'].includes(o.tier)) ||
    [...data.fileDuplicateCandidates, ...data.transactionRelationCandidates].some(pair =>
      pair.sourceIds.length !== 2 || pair.sourceIds.some(id => !sources.has(id)));
  if (invalid) {
    $('load-error').textContent = '参照不整合があります。資料・Observation・候補の対応を確認してください。推測で補完せず操作を停止しました。';
    return;
  }

  // Source / Observation は深くfreezeされた入力。以下だけがページ内の操作状態。
  let reviews = Object.create(null);
  let groundTruth = Object.create(null);
  let relationReviews = Object.create(null);
  let activeId = data.sources[0].id;
  const imageState = new Map();
  let dialogOpener = null;
  const fieldReview = (id, key) => reviews[id]?.[key];
  const confirmedCount = id => Object.keys(groundTruth[id] || {}).length;
  const isFinalRelation = state => ['confirmed_same', 'confirmed_separate'].includes(state);
  const formatValue = (field, value) => {
    if (value === null || value === undefined || value === '') return '未取得 / 未確定';
    const option = field.options?.find(([key]) => key === value);
    return option ? option[1] : String(value);
  };
  const sourceReady = id => imageState.get(id) === 'loaded';
  const announce = message => { $('announcement').textContent = message; };

  function renderSummary() {
    const total = Object.values(groundTruth).reduce((sum, fields) => sum + Object.keys(fields).length, 0);
    $('metrics').innerHTML = [
      ['架空資料', `${data.sources.length}件`], ['HIGH（AI候補）', `${data.observations.filter(o => o.tier === 'HIGH').length}件`],
      ['REVIEW（AI候補）', `${data.observations.filter(o => o.tier === 'REVIEW').length}件`], ['人間確定済み項目', `${total} / ${data.sources.length * data.fields.length}`]
    ].map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('');
    $('source-list').innerHTML = data.sources.map(source => `<button type="button" data-source="${escape(source.id)}" aria-pressed="${source.id === activeId}"><span class="code">${escape(source.id)}</span> <span class="pill ${observations.get(source.id)?.tier === 'REVIEW' ? 'warn' : ''}">${escape(observations.get(source.id)?.tier || '未取得')}</span><strong>${escape(source.title)}</strong><span class="progress">項目確定 ${confirmedCount(source.id)} / ${data.fields.length}</span></button>`).join('');
  }

  function picture(source) {
    return `<figure><img data-source-image="${escape(source.id)}" src="${escape(source.asset)}" alt="${escape(source.id + '：' + source.title)}。公開用架空資料" width="600" height="780"><figcaption>${escape(source.id)} / ${escape(source.title)}</figcaption><p class="error" data-image-error hidden>画像読込失敗：Sourceを確認できないため、この資料の確定操作を停止しています。</p><button type="button" data-enlarge="${escape(source.id)}">資料を拡大</button></figure>`;
  }

  function updateAvailability() {
    document.querySelectorAll('[data-requires-source]').forEach(button => {
      button.disabled = !button.dataset.requiresSource.split(',').every(sourceReady);
    });
  }

  function bindImages(container) {
    container.querySelectorAll('[data-source-image]').forEach(img => {
      const report = success => {
        imageState.set(img.dataset.sourceImage, success ? 'loaded' : 'failed');
        img.hidden = !success;
        img.parentElement.querySelector('[data-image-error]').hidden = success;
        updateAvailability();
      };
      img.addEventListener('load', () => report(true));
      img.addEventListener('error', () => report(false));
      if (img.complete) report(img.naturalWidth > 0);
    });
    updateAvailability();
  }

  function renderSource() {
    const source = sources.get(activeId);
    $('source-panel').innerHTML = `<h2 id="source-heading">1. Source <span class="pill">読取専用</span></h2><h3>${escape(source.title)}</h3><p class="note">${escape(source.description)}</p>${picture(source)}<p class="note">資料画像・識別子はレビュー操作で変わりません。日付や金額は照合の手がかりであり、自動集計の対象ではありません。</p>`;
    bindImages($('source-panel'));
  }

  function renderReview(focusKey) {
    const observation = observations.get(activeId);
    const count = confirmedCount(activeId);
    const held = data.fields.filter(field => fieldReview(activeId, field.key)?.status === 'held').length;
    $('review-panel').innerHTML = `<h2 id="review-heading">2. AI Observation <span class="pill">読取専用</span></h2><p><span class="pill ${observation?.tier === 'REVIEW' ? 'warn' : ''}">${escape(observation?.tier || '未取得')}</span> ${escape(observation?.reason || 'Observation未取得。資料から確認してください。')}</p><p class="note">HIGH / REVIEWは項目の人間確定とは独立しています。レビュー後もAI候補は変わりません。</p><h3 style="margin-top:24px">3. Human Review → 4. Ground Truth</h3><p class="notice" id="document-progress">項目確認：${count === data.fields.length ? `全${count}項目確定（取引関係・重複候補は下欄で別表示）` : `${count} / ${data.fields.length}項目確定・保留${held}項目・未確認${data.fields.length - count - held}項目。資料の確認は未完了です。`}</p><p class="note">Sourceを見て値と根拠を入力し、項目ごとに確定します。情報不足は保留にしてください。確定値はこのページ内で固定されます。やり直す場合は全操作をリセットします。</p>${data.fields.map(field => renderField(field, observation)).join('')}`;
    updateAvailability();
    if (focusKey) $(`state-${focusKey}`).focus();
  }

  function renderField(field, observation) {
    const original = observation?.values[field.key];
    const review = fieldReview(activeId, field.key);
    const truth = groundTruth[activeId]?.[field.key];
    const confirmed = truth !== undefined;
    const value = review?.draft ?? (original === null || original === undefined ? '' : String(original));
    const control = field.options
      ? `<select id="value-${field.key}" name="value"><option value="">未取得 / 選択してください</option>${field.options.map(([key, label]) => `<option value="${key}" ${value === String(key) ? 'selected' : ''}>${escape(label)}</option>`).join('')}</select>`
      : `<input id="value-${field.key}" name="value" ${field.type === 'number' ? 'type="number" min="1" step="1"' : 'type="text" maxlength="100"'} value="${escape(value)}">`;
    const difference = confirmed ? (truth.value === original ? 'AI候補と一致' : 'AI候補から修正') : '人間による確定なし';
    const state = confirmed ? '確定済み' : review?.status === 'held' ? '保留（未確定）' : '未確認';
    return `<article class="review-field" data-field="${field.key}"><h3>${escape(field.label)}</h3><dl class="comparison"><div><dt>AI候補（元値）</dt><dd data-original="${field.key}">${escape(formatValue(field, original))}</dd></div><div class="truth"><dt>人間確定値 / Ground Truth</dt><dd data-truth="${field.key}">${confirmed ? escape(formatValue(field, truth.value)) : '未確定'}</dd></div></dl><p class="field-state" id="state-${field.key}" tabindex="-1">${state} / ${difference}${review?.reason ? ` / 根拠：${escape(review.reason)}` : ''}</p><form data-field-form="${field.key}" novalidate><fieldset ${confirmed ? 'disabled' : ''}><label for="value-${field.key}">確認する値（採用する場合はそのまま）</label>${control}<label for="reason-${field.key}">確認・保留の根拠（必須）</label><textarea id="reason-${field.key}" name="reason" rows="2" maxlength="300" placeholder="例：資料の販売店行を照合">${escape(review?.reason || '')}</textarea><p class="error" id="error-${field.key}" role="alert" hidden></p><div class="actions"><button type="submit" class="primary" ${confirmed ? '' : `data-requires-source="${escape(activeId)}"`}>この項目を確定</button><button type="button" data-hold="${field.key}">保留にする</button></div></fieldset></form></article>`;
  }

  function renderRelations(focusId) {
    const duplicates = data.fileDuplicateCandidates.filter(pair => pair.sourceIds.includes(activeId));
    const pairs = data.transactionRelationCandidates.filter(pair => pair.sourceIds.includes(activeId));
    $('relations').innerHTML = `<h2 id="relations-heading">5. ファイル重複候補と取引関係</h2><h3>file duplicate candidate <span class="pill warn">同じ資料・コピーの可能性</span></h3><p class="note">ファイルの同一性と取引の同一性は別概念です。SHA完全一致を同一取引の確定として扱いません。本デモではSHA計算・照合自体を行いません。</p>${duplicates.length ? duplicates.map(pair => `<div class="notice" data-duplicate="${escape(pair.id)}"><strong>${escape(pair.sourceIds.join(' / '))}</strong><p class="code">${escape(pair.group)}</p><p>${escape(pair.reason)}</p><p>状態：file duplicate candidate（説明用固定候補）</p><p>取引relationの判定・項目Ground Truthへの自動転記はありません。</p></div>`).join('') : '<p class="note">この資料のファイル重複候補はありません。ファイルの一意性を保証する表示ではありません。</p>'}<h3 style="margin-top:24px">transaction relation candidate <span class="pill">別資料の取引関係</span></h3><p class="note">2資料を比較して根拠と人間判定を残します。店舗・日付・金額だけでは確定しません。confirmed_same / confirmed_separateは確定後に固定し、cannot_determineは保留として再検討できます。</p>${pairs.length ? pairs.map(pair => renderRelation(pair)).join('') : '<p class="note">この資料に取引関係の候補はありません。ファイル重複候補から同一取引を推定しません。</p>'}`;
    bindImages($('relations'));
    if (focusId) $(`relation-state-${focusId}`).focus();
  }

  function renderRelation(pair) {
    const review = relationReviews[pair.id];
    const state = review?.status || 'candidate';
    const locked = isFinalRelation(state);
    return `<article class="relation-card" data-relation="${escape(pair.id)}"><h3>${escape(pair.sourceIds.join(' ↔ '))}</h3><p>${escape(pair.reason)}</p><p class="field-state" id="relation-state-${pair.id}" tabindex="-1">人間判定：<strong>${state}</strong> / ${relationLabels[state]}${review?.reason ? ` / 根拠：${escape(review.reason)}` : ''}</p><details><summary>2つのSourceを見比べる</summary><div class="pair-grid">${pair.sourceIds.map(id => picture(sources.get(id))).join('')}</div></details><form data-relation-form="${pair.id}" novalidate><fieldset ${locked ? 'disabled' : ''}><label for="relation-value-${pair.id}">取引関係の人間判定</label><select name="relation" id="relation-value-${pair.id}">${Object.entries(relationLabels).map(([key, label]) => `<option value="${key}" ${(review?.draftStatus || state) === key ? 'selected' : ''}>${key} / ${label}</option>`).join('')}</select><label for="relation-reason-${pair.id}">判定の根拠（必須）</label><textarea name="reason" id="relation-reason-${pair.id}" rows="2" maxlength="300">${escape(review?.draftReason ?? review?.reason ?? '')}</textarea><p class="error" id="relation-error-${pair.id}" role="alert" hidden></p><div class="actions"><button type="submit" ${locked ? '' : `data-requires-source="${escape(pair.sourceIds.join(','))}"`}>取引関係の判定を反映</button></div></fieldset></form></article>`;
  }

  function rememberField(form) {
    const key = form.dataset.fieldForm;
    if (groundTruth[activeId]?.[key]) return;
    reviews[activeId] ||= Object.create(null);
    reviews[activeId][key] = { status: fieldReview(activeId, key)?.status || 'unreviewed', draft: form.elements.value.value, reason: form.elements.reason.value };
  }

  function saveField(form, hold) {
    const key = form.dataset.fieldForm;
    if (groundTruth[activeId]?.[key]) return;
    rememberField(form);
    const review = fieldReview(activeId, key);
    const field = data.fields.find(item => item.key === key);
    const error = $(`error-${key}`);
    const fail = message => { error.textContent = message; error.hidden = false; };
    const reason = review.reason.trim();
    if (!reason) { fail('確定・保留には根拠を入力してください。'); form.elements.reason.focus(); return; }
    if (hold) review.status = 'held';
    else {
      if (!sourceReady(activeId)) { fail('Source画像を確認できないため確定できません。'); return; }
      const raw = review.draft.trim();
      let value = raw;
      if (!raw) { fail('未取得の項目は確定できません。Sourceを確認するか、保留にしてください。'); return; }
      if (field.type === 'number') {
        value = Number(raw);
        if (!Number.isSafeInteger(value) || value < 1) { fail('取引数は1以上の整数で入力してください。不明の場合は保留にします。'); return; }
      }
      if (field.options) {
        const option = field.options.find(([key]) => String(key) === raw);
        if (!option) { fail('選択値を確認してください。'); return; }
        value = option[0];
      }
      review.status = 'confirmed';
      groundTruth[activeId] ||= Object.create(null);
      groundTruth[activeId][key] = Object.freeze({ value, reason, basis: 'human_review' });
    }
    review.reason = reason;
    renderSummary();
    renderReview(key);
    announce(`${field.label}を${hold ? '保留にしました。Ground Truthは未確定です。' : '確定しました。AI候補は変更していません。'}`);
  }

  $('app').addEventListener('input', event => {
    const form = event.target.closest('form');
    if (form?.dataset.fieldForm) rememberField(form);
    if (form?.dataset.relationForm) {
      const id = form.dataset.relationForm;
      if (isFinalRelation(relationReviews[id]?.status)) return;
      relationReviews[id] = { ...relationReviews[id], draftStatus: form.elements.relation.value, draftReason: form.elements.reason.value };
    }
  });

  $('app').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    if (form.dataset.fieldForm) { saveField(form, false); return; }
    const id = form.dataset.relationForm;
    if (!id || isFinalRelation(relationReviews[id]?.status)) return;
    const pair = data.transactionRelationCandidates.find(item => item.id === id);
    const state = form.elements.relation.value;
    const reason = form.elements.reason.value.trim();
    const error = $(`relation-error-${id}`);
    if (!reason || !Object.hasOwn(relationLabels, state) || !pair.sourceIds.every(sourceReady)) {
      error.textContent = '両方のSource画像を確認し、判定と根拠を入力してください。'; error.hidden = false; return;
    }
    relationReviews[id] = { status: state, reason };
    renderRelations(id);
    announce(`取引関係を${state}にしました。ファイル重複候補と各資料の確定値は変わりません。`);
  });

  $('app').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.source) {
      activeId = button.dataset.source;
      renderSummary(); renderSource(); renderReview(); renderRelations();
      document.querySelector(`[data-source="${activeId}"]`).focus();
      announce(`${activeId} ${sources.get(activeId).title}を表示しました。`);
    }
    if (button.dataset.hold) saveField(button.closest('form'), true);
    if (button.dataset.enlarge) {
      const source = sources.get(button.dataset.enlarge);
      dialogOpener = button;
      $('dialog-title').textContent = `${source.id} / ${source.title}`;
      $('large-error').hidden = true;
      $('large-image').hidden = false;
      $('large-image').alt = `${source.title}。公開用架空資料 / 実取引なし`;
      $('large-image').src = source.asset;
      $('source-dialog').showModal();
    }
  });
  $('reset').addEventListener('click', () => {
    reviews = Object.create(null); groundTruth = Object.create(null); relationReviews = Object.create(null);
    renderSummary(); renderReview(); renderRelations();
    announce('全資料のレビュー・Ground Truth・取引関係の人間判定を初期化しました。元資料とAI候補は同じです。');
  });
  $('dialog-close').addEventListener('click', () => $('source-dialog').close());
  $('source-dialog').addEventListener('close', () => dialogOpener?.focus());
  $('large-image').addEventListener('error', () => { $('large-image').hidden = true; $('large-error').hidden = false; });
  renderSummary(); renderSource(); renderReview(); renderRelations();
  $('load-error').hidden = true;
  $('app').hidden = false;
})();
