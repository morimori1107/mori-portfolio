/* 公開デモ専用の共通データ正本。すべて新規に作成した架空の名称・値。
 * 実データを匿名化したものではない。既存デモのデータとも独立している。
 * 02図面検索・03原盤発注は、このIDを参照して必要な情報を追加する想定。
 * classic scriptで読み込み、file://でもfetchやモジュールを必要としない。
 */
(() => {
  'use strict';

  const dates = ['2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10'];
  const quantities = [[20, 12, 8, 10], [16, 18, 12, 8], [24, 10, 16, 14], [12, 16, 10, 6], [18, 14, 6, 12]];
  const orders = dates.flatMap((plannedDate, day) => quantities[day].map((quantity, item) => ({
    orderId: `DEMO-O${String(day * 4 + item + 1).padStart(3, '0')}`,
    plannedDate,
    projectId: `DEMO-J00${(day + item) % 3 + 1}`,
    productId: `DEMO-P00${item + 1}`,
    quantity
  })));

  // 確認対象を隠さず扱うための4つの架空サンプル。元明細の値は補正しない。
  orders.push(
    { orderId: 'DEMO-E001', plannedDate: dates[0], projectId: 'DEMO-J001', productId: 'DEMO-P999', quantity: 7 },
    { orderId: 'DEMO-E002', plannedDate: dates[1], projectId: 'DEMO-J002', productId: 'DEMO-P005', quantity: 9 },
    { orderId: 'DEMO-E003', plannedDate: dates[2], projectId: 'DEMO-J003', productId: 'DEMO-P006', quantity: 11 },
    { orderId: 'DEMO-E004', plannedDate: dates[3], projectId: 'DEMO-J001', productId: 'DEMO-P001', quantity: -3 }
  );

  const data = {
    schemaVersion: 1,
    meta: {
      datasetId: 'manufacturing-fiction-v0',
      notice: 'すべて新規作成の架空データです。実社名・実品番・実図面・実顧客・社内データは使用していません。',
      quantityUnit: '個',
      dateMeaning: '計画日（納入日・実績日ではありません）',
      dates
    },
    products: [
      { productId: 'DEMO-P001', name: 'モデルプレート・アオ', category: 'モデル平板' },
      { productId: 'DEMO-P002', name: 'モデルプレート・シロ', category: 'モデル平板' },
      { productId: 'DEMO-P003', name: 'モデルブロック・キイ', category: 'モデル角材' },
      { productId: 'DEMO-P004', name: 'モデルフレーム・ミドリ', category: 'モデル枠材' },
      { productId: 'DEMO-P005', name: 'モデルピース・ムラサキ', category: '確認用モデル' },
      { productId: 'DEMO-P006', name: 'モデルピース・ダイダイ', category: '確認用モデル' }
    ],
    materials: [
      { materialId: 'DEMO-M001', name: '架空モデル材アルファ', thicknessMm: 12, widthMm: 600, lengthMm: 1200, unit: '枚' },
      { materialId: 'DEMO-M002', name: '架空モデル材ベータ', thicknessMm: 18, widthMm: 800, lengthMm: 1600, unit: '枚' },
      { materialId: 'DEMO-M003', name: '架空モデル材ガンマ', thicknessMm: 24, widthMm: 900, lengthMm: 1800, unit: '枚' }
    ],
    productMaterials: [
      { productId: 'DEMO-P001', materialId: 'DEMO-M001', piecesPerSheet: 12 },
      { productId: 'DEMO-P002', materialId: 'DEMO-M001', piecesPerSheet: 8 },
      { productId: 'DEMO-P003', materialId: 'DEMO-M002', piecesPerSheet: 6 },
      { productId: 'DEMO-P004', materialId: 'DEMO-M003', piecesPerSheet: 4 },
      { productId: 'DEMO-P005', materialId: 'DEMO-M002', piecesPerSheet: 10 },
      { productId: 'DEMO-P006', materialId: 'DEMO-M003', piecesPerSheet: 5 }
    ],
    lines: [
      { lineId: 'DEMO-L01', name: '架空ライン・ソラ' },
      { lineId: 'DEMO-L02', name: '架空ライン・モリ' }
    ],
    workClasses: [
      { workClassId: 'DEMO-W01', name: 'モデル直線加工', lineId: 'DEMO-L01' },
      { workClassId: 'DEMO-W02', name: 'モデル輪郭加工', lineId: 'DEMO-L02' },
      { workClassId: 'DEMO-W03', name: 'モデル枠仕上げ', lineId: 'DEMO-L02' },
      { workClassId: 'DEMO-W04', name: 'モデル試作仕上げ', lineId: 'DEMO-L02' }
    ],
    // v0は品番完全一致のルール1件で作業区分を決定。複数一致も確認対象とする。
    productWorkRules: [
      { ruleId: 'DEMO-R01', productId: 'DEMO-P001', workClassId: 'DEMO-W01' },
      { ruleId: 'DEMO-R02', productId: 'DEMO-P002', workClassId: 'DEMO-W01' },
      { ruleId: 'DEMO-R03', productId: 'DEMO-P003', workClassId: 'DEMO-W02' },
      { ruleId: 'DEMO-R04', productId: 'DEMO-P004', workClassId: 'DEMO-W03' },
      { ruleId: 'DEMO-R05', productId: 'DEMO-P006', workClassId: 'DEMO-W04' }
    ],
    standardTimes: [
      { workClassId: 'DEMO-W01', minutesPerUnit: 3 },
      { workClassId: 'DEMO-W02', minutesPerUnit: 5 },
      { workClassId: 'DEMO-W03', minutesPerUnit: 4 }
    ],
    orders
  };

  // 台帳と元明細を凍結。各デモの表示状態・加工後データは別に保持する。
  function freezeDeep(value) {
    Object.values(value).forEach(child => {
      if (child && typeof child === 'object') freezeDeep(child);
    });
    return Object.freeze(value);
  }
  window.DEMO_SHARED_DATA = freezeDeep(data);
})();
