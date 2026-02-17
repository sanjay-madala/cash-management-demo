export const CLEAR_ADVANCES = [
  {
    id: 'clr-01',
    advanceId: 'adv-04',
    advanceDocNumber: 'ADV-2026-0004',
    requesterId: 'user-14',
    companyId: 'comp-4',
    status: 'cleared',
    expenses: [
      { materialCode: 'MAT-004', description: 'ค่าน้ำมันรถบรรทุก (จริง)', amount: 7800, vatRate: 7, whtRate: 0, attachments: ['fuel_receipt_01.jpg'] },
      { materialCode: 'MAT-006', description: 'ค่าทางด่วน (จริง)', amount: 2300, vatRate: 0, whtRate: 0, attachments: ['toll_receipt_01.jpg'] },
    ],
    totalExpenses: 10446,
    advanceAmount: 11060,
    settlement: 614,
    settlementType: 'surplus',
    bankSlip: 'bank_return_slip.pdf',
    approvals: [
      { userId: 'user-14', action: 'submitted', date: '2026-01-10T14:00:00', comment: 'ส่งเคลียร์เงินทดรอง' },
      { userId: 'user-05', action: 'approved', date: '2026-01-10T15:00:00', comment: 'อนุมัติ ตรวจสอบแล้ว' },
      { userId: 'user-02', action: 'validated', date: '2026-01-10T16:00:00', comment: 'ตรวจสอบแล้ว' },
      { userId: 'user-02', action: 'cleared', date: '2026-01-10T16:30:00', comment: 'เคลียร์เรียบร้อย' },
    ],
    createdDate: '2026-01-10T14:00:00',
  },
];
