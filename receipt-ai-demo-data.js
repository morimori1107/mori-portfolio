/* 公開説明用に新規作成した架空データ。実資料・実SHA・モデル出力は含まない。 */
(() => {
  'use strict';
  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  window.RECEIPT_DEMO_DATA = freeze({
    sources: [
      { id: 'DEMO-R01', title: '単一取引のレシート', asset: 'demo-receipts/receipt-01.svg', description: '架空店舗の領収資料。取引番号 DEMO-T01。' },
      { id: 'DEMO-R02', title: '施設名と販売店名の区別', asset: 'demo-receipts/receipt-02.svg', description: '施設の見出しと、販売店の表記を照合する例。' },
      { id: 'DEMO-R03', title: '1ページに2取引', asset: 'demo-receipts/receipt-03.svg', description: '資料種別・取引数・複数レシートを別々に確認する例。' },
      { id: 'DEMO-R04', title: '別資料のカード利用票', asset: 'demo-receipts/receipt-04.svg', description: 'R01と照合できる架空のカード利用票。カード番号・個人情報なし。' },
      { id: 'DEMO-R05', title: '同日・同額でも別取引', asset: 'demo-receipts/receipt-05.svg', description: 'R01と店舗・日付・金額は同じ。取引番号と時刻は異なる。' },
      { id: 'DEMO-R06', title: '同じ資料のコピー候補', asset: 'demo-receipts/receipt-01.svg', description: 'R01と同じ架空SVGを使うコピー例。ハッシュ検証は行っていない。' },
      { id: 'DEMO-R07', title: '情報が不足した資料', asset: 'demo-receipts/receipt-07.svg', description: '販売店・取引番号などが不明。推測せず保留する例。' }
    ],
    fields: [
      { key: 'seller', label: '販売店名', type: 'text' },
      { key: 'business', label: '業種', type: 'select', options: [['retail', '物販'], ['food', '飲食'], ['mixed', '複数業種']] },
      { key: 'documentType', label: '資料種別', type: 'select', options: [['receipt', 'receipt / レシート'], ['card_slip', 'card_slip / カード利用票'], ['mixed_documents', 'mixed_documents / 複数種別'], ['other', 'other / その他']] },
      { key: 'transactionCount', label: '取引数', type: 'number' },
      { key: 'multiReceiptPage', label: '複数レシートのページ', type: 'select', options: [[false, 'いいえ'], [true, 'はい']] }
    ],
    observations: [
      { sourceId: 'DEMO-R01', tier: 'HIGH', reason: '販売店・種別・取引番号の表記が明確という想定。HIGHも人間確定ではありません。', values: { seller: '架空店・星砂文具', business: 'retail', documentType: 'receipt', transactionCount: 1, multiReceiptPage: false } },
      { sourceId: 'DEMO-R02', tier: 'REVIEW', reason: '施設名を販売店名と取り違えた候補。Sourceの「販売店」行を照合してください。', values: { seller: '架空施設・灯台テラス', business: 'food', documentType: 'receipt', transactionCount: 1, multiReceiptPage: false } },
      { sourceId: 'DEMO-R03', tier: 'REVIEW', reason: '1ページの2取引を1件と観測した候補。レシート2枚でも資料種別はreceiptです。', values: { seller: '架空店・雲粒茶房', business: 'food', documentType: 'receipt', transactionCount: 1, multiReceiptPage: false } },
      { sourceId: 'DEMO-R04', tier: 'HIGH', reason: 'カード利用票の表記が明確という想定。R01との取引関係は別途人間が判定します。', values: { seller: '架空店・星砂文具', business: 'retail', documentType: 'card_slip', transactionCount: 1, multiReceiptPage: false } },
      { sourceId: 'DEMO-R05', tier: 'HIGH', reason: '単一のレシートという想定。店舗・日付・金額の一致だけで同一取引とは判定しません。', values: { seller: '架空店・星砂文具', business: 'retail', documentType: 'receipt', transactionCount: 1, multiReceiptPage: false } },
      { sourceId: 'DEMO-R06', tier: 'REVIEW', reason: 'ファイルのコピー候補。R01の人間確定値は自動で引き継ぎません。', values: { seller: '架空店・星砂文具', business: 'retail', documentType: 'receipt', transactionCount: 1, multiReceiptPage: false } },
      { sourceId: 'DEMO-R07', tier: 'REVIEW', reason: '文字・取引情報が不足。未取得値を0や推測値で補完しません。', values: { seller: null, business: null, documentType: null, transactionCount: null, multiReceiptPage: null } }
    ],
    fileDuplicateCandidates: [
      { id: 'DEMO-FD01', sourceIds: ['DEMO-R01', 'DEMO-R06'], group: 'DEMO-COPY-GROUP-A', reason: '同じ架空SVGを参照する説明用のコピー候補。実SHAの計算・照合結果ではありません。' }
    ],
    transactionRelationCandidates: [
      { id: 'DEMO-REL01', sourceIds: ['DEMO-R01', 'DEMO-R04'], reason: 'レシートとカード利用票。架空取引番号 DEMO-T01・時刻・金額を照合。' },
      { id: 'DEMO-REL02', sourceIds: ['DEMO-R01', 'DEMO-R05'], reason: '店舗・日付・金額は一致。取引番号 DEMO-T01 / DEMO-T05 と時刻は異なる。' },
      { id: 'DEMO-REL03', sourceIds: ['DEMO-R02', 'DEMO-R07'], reason: '施設名の一部は似ているが、R07は販売店・取引番号・金額が不明。' }
    ]
  });
})();
