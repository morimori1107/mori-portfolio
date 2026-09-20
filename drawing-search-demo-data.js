/* 図面・品番検索専用の架空データ。既存資料・図面を転用していない。
 * 品名・分類・材料名は保持せず、DEMO_SHARED_DATAのIDを参照する。
 * 製品・部材の寸法は加工後の架空寸法。共通材料の原盤寸法とは別の情報。
 * P003の補助板はこの公開デモ専用の部材構成であり、共通マスターは変更しない。
 */
(() => {
  'use strict';
  const data = {
    schemaVersion: 1,
    productDetails: [
      { productId: 'DEMO-P001', dimensions: { thicknessMm: 12, widthMm: 200, lengthMm: 240 }, isSet: false },
      { productId: 'DEMO-P002', dimensions: { thicknessMm: 12, widthMm: 200, lengthMm: 360 }, isSet: false },
      { productId: 'DEMO-P003', dimensions: { thicknessMm: 30, widthMm: 160, lengthMm: 220 }, isSet: true },
      { productId: 'DEMO-P004', dimensions: { thicknessMm: 24, widthMm: 220, lengthMm: 320 }, isSet: false },
      { productId: 'DEMO-P005', dimensions: null, isSet: false },
      { productId: 'DEMO-P006', dimensions: { thicknessMm: null, widthMm: 160, lengthMm: 180 }, isSet: false }
    ],
    parts: [
      { partId: 'DEMO-B001', productId: 'DEMO-P001', label: '基板', materialId: 'DEMO-M001', quantity: 1, dimensions: { thicknessMm: 12, widthMm: 200, lengthMm: 240 } },
      { partId: 'DEMO-B002', productId: 'DEMO-P002', label: '長板', materialId: 'DEMO-M001', quantity: 1, dimensions: { thicknessMm: 12, widthMm: 200, lengthMm: 360 } },
      { partId: 'DEMO-B003', productId: 'DEMO-P003', label: '主板', materialId: 'DEMO-M002', quantity: 1, dimensions: { thicknessMm: 18, widthMm: 160, lengthMm: 220 } },
      { partId: 'DEMO-B004', productId: 'DEMO-P003', label: '補助板', materialId: 'DEMO-M001', quantity: 1, dimensions: { thicknessMm: 12, widthMm: 100, lengthMm: 140 } },
      { partId: 'DEMO-B005', productId: 'DEMO-P004', label: '枠板', materialId: 'DEMO-M003', quantity: 1, dimensions: { thicknessMm: 24, widthMm: 220, lengthMm: 320 } },
      // 架空の参照不整合・寸法欠落を画面で確認するサンプル。
      { partId: 'DEMO-B006', productId: 'DEMO-P006', label: '確認用板', materialId: 'DEMO-M999', quantity: 1, dimensions: { thicknessMm: null, widthMm: 160, lengthMm: 180 } }
    ],
    drawings: [
      { drawingId: 'DEMO-D001', productId: 'DEMO-P001', partId: 'DEMO-B001', shape: 'plate', imagePath: 'demo-drawings/DEMO-D001.svg' },
      { drawingId: 'DEMO-D002', productId: 'DEMO-P002', partId: 'DEMO-B002', shape: 'plate', imagePath: 'demo-drawings/DEMO-D002.svg' },
      { drawingId: 'DEMO-D003', productId: 'DEMO-P003', partId: 'DEMO-B003', shape: 'plate', imagePath: 'demo-drawings/DEMO-D003.svg' },
      { drawingId: 'DEMO-D004', productId: 'DEMO-P003', partId: 'DEMO-B004', shape: 'plate', imagePath: 'demo-drawings/DEMO-D004.svg' },
      { drawingId: 'DEMO-D005', productId: 'DEMO-P004', partId: 'DEMO-B005', shape: 'frame', opening: { widthMm: 120, lengthMm: 220 }, imagePath: 'demo-drawings/DEMO-D005.svg' },
      // 図面台帳はあるが画像は未登録。存在しないURLへはアクセスしない。
      { drawingId: 'DEMO-D006', productId: 'DEMO-P006', partId: 'DEMO-B006', shape: null, imagePath: null }
    ]
  };
  function freezeDeep(value) {
    Object.values(value).forEach(child => {
      if (child && typeof child === 'object') freezeDeep(child);
    });
    return Object.freeze(value);
  }
  window.DRAWING_SEARCH_DATA = freezeDeep(data);
})();
