export const SUPPLIERS = [
  { id: 'sup-01', name: 'บริษัท สยามอุตสาหกรรม จำกัด', nameEn: 'Siam Industry Co., Ltd.', taxId: '0105548012345', bankId: 'bank-1', bankAccount: '101-2-34567-8' },
  { id: 'sup-02', name: 'บริษัท โกลบอล ชิปปิ้ง จำกัด', nameEn: 'Global Shipping Co., Ltd.', taxId: '0105549023456', bankId: 'bank-3', bankAccount: '456-7-89012-3' },
  { id: 'sup-03', name: 'บริษัท ไอที โซลูชั่นส์ จำกัด', nameEn: 'IT Solutions Co., Ltd.', taxId: '0105550034567', bankId: 'bank-2', bankAccount: '789-0-12345-6' },
  { id: 'sup-04', name: 'บริษัท คลีนเซอร์วิส จำกัด', nameEn: 'Clean Service Co., Ltd.', taxId: '0105551045678', bankId: 'bank-4', bankAccount: '012-3-45678-9' },
  { id: 'sup-05', name: 'บริษัท มารีนเทค จำกัด', nameEn: 'Marine Tech Co., Ltd.', taxId: '0105552056789', bankId: 'bank-1', bankAccount: '234-5-67890-1' },
  { id: 'sup-06', name: 'บริษัท ซอฟต์แวร์พลัส จำกัด', nameEn: 'Software Plus Co., Ltd.', taxId: '0105553067890', bankId: 'bank-2', bankAccount: '567-8-90123-4' },
];

export const PURCHASE_ORDERS = [
  { id: 'po-01', poNumber: 'PO-2025-0892', supplierId: 'sup-01', description: 'วัสดุก่อสร้าง', amount: 380000 },
  { id: 'po-02', poNumber: 'PO-2025-1100', supplierId: 'sup-02', description: 'ค่าระวางเรือขนส่ง', amount: 750000 },
  { id: 'po-03', poNumber: 'PO-2026-0015', supplierId: 'sup-03', description: 'Cloud Server & License', amount: 300000 },
  { id: 'po-04', poNumber: 'PO-2025-0950', supplierId: 'sup-04', description: 'บริการทำความสะอาด', amount: 45000 },
  { id: 'po-05', poNumber: 'PO-2025-1204', supplierId: 'sup-05', description: 'ซ่อมบำรุงเครื่องยนต์เรือ', amount: 730000 },
  { id: 'po-06', poNumber: 'PO-2025-0800', supplierId: 'sup-06', description: 'พัฒนาระบบ ERP Phase 2', amount: 3000000 },
];
