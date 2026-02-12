export const COMPANIES = [
  {
    id: 'comp-1',
    code: '1000',
    name: { en: 'Alpha Holdings', th: 'อัลฟ่า โฮลดิ้งส์' },
    shortName: 'AH',
  },
  {
    id: 'comp-2',
    code: '2000',
    name: { en: 'Beta Marine', th: 'เบต้า มารีน' },
    shortName: 'BM',
  },
  {
    id: 'comp-3',
    code: '3000',
    name: { en: 'Gamma Logistics', th: 'แกมม่า โลจิสติกส์' },
    shortName: 'GL',
  },
  {
    id: 'comp-4',
    code: '4000',
    name: { en: 'Delta Energy', th: 'เดลต้า เอนเนอร์จี' },
    shortName: 'DE',
  },
  {
    id: 'comp-5',
    code: '5000',
    name: { en: 'Epsilon Tech', th: 'เอปไซลอน เทค' },
    shortName: 'ET',
  },
];

export const BANKS = [
  {
    id: 'bank-1',
    name: { en: 'Bangkok Bank', th: 'ธนาคารกรุงเทพ' },
    code: 'BBL',
  },
  {
    id: 'bank-2',
    name: { en: 'Kasikorn Bank', th: 'ธนาคารกสิกรไทย' },
    code: 'KBANK',
  },
  {
    id: 'bank-3',
    name: { en: 'Siam Commercial Bank', th: 'ธนาคารไทยพาณิชย์' },
    code: 'SCB',
  },
  {
    id: 'bank-4',
    name: { en: 'TMBThanachart Bank', th: 'ธนาคารทหารไทยธนชาต' },
    code: 'TTB',
  },
];

export const DEPARTMENTS = [
  { id: 'dept-1', name: { en: 'Finance', th: 'การเงิน' } },
  { id: 'dept-2', name: { en: 'IT', th: 'เทคโนโลยีสารสนเทศ' } },
  { id: 'dept-3', name: { en: 'Operations', th: 'ปฏิบัติการ' } },
  { id: 'dept-4', name: { en: 'Marine Operations', th: 'ปฏิบัติการทางทะเล' } },
  { id: 'dept-5', name: { en: 'HR', th: 'ทรัพยากรบุคคล' } },
  { id: 'dept-6', name: { en: 'Procurement', th: 'จัดซื้อจัดจ้าง' } },
  { id: 'dept-7', name: { en: 'Legal', th: 'กฎหมาย' } },
  { id: 'dept-8', name: { en: 'Administration', th: 'ธุรการ' } },
];

export const COST_CENTERS = [
  { code: 'CC1001', description: 'Corporate Administration' },
  { code: 'CC1002', description: 'Finance & Accounting' },
  { code: 'CC2001', description: 'IT Operations' },
  { code: 'CC3001', description: 'Marine Operations' },
  { code: 'CC4001', description: 'Logistics & Warehouse' },
  { code: 'CC5001', description: 'Procurement & Supply Chain' },
];

export const STATUSES = {
  draft: { color: 'gray', bg: '#F3F4F6', text: '#374151' },
  pendingApproval: { color: 'amber', bg: '#FEF3C7', text: '#92400E' },
  approved: { color: 'green', bg: '#D1FAE5', text: '#065F46' },
  rejected: { color: 'red', bg: '#FEE2E2', text: '#991B1B' },
  returned: { color: 'orange', bg: '#FFEDD5', text: '#9A3412' },
  disbursed: { color: 'blue', bg: '#DBEAFE', text: '#1E40AF' },
  cleared: { color: 'teal', bg: '#CCFBF1', text: '#115E59' },
  closed: { color: 'slate', bg: '#E2E8F0', text: '#334155' },
  posted: { color: 'purple', bg: '#EDE9FE', text: '#5B21B6' },
};

export const PAYMENT_METHODS = [
  { id: 'transfer', label: { en: 'Bank Transfer', th: 'โอนเงินผ่านธนาคาร' } },
  { id: 'companyCheque', label: { en: 'Company Cheque', th: 'เช็คบริษัท' } },
  { id: 'cashierCheque', label: { en: 'Cashier Cheque', th: 'แคชเชียร์เช็ค' } },
  { id: 'directDebit', label: { en: 'Direct Debit', th: 'หักบัญชีโดยตรง' } },
  { id: 'cash', label: { en: 'Cash', th: 'เงินสด' } },
];

export const TRAVEL_TYPES = [
  { id: 'companyVehicle', label: { en: 'Company Vehicle', th: 'รถบริษัท' } },
  { id: 'publicTransport', label: { en: 'Public Transport', th: 'ขนส่งสาธารณะ' } },
  { id: 'overseas', label: { en: 'Overseas', th: 'ต่างประเทศ' } },
  { id: 'positionVehicle', label: { en: 'Position Vehicle', th: 'รถประจำตำแหน่ง' } },
  { id: 'grabBusiness', label: { en: 'Grab Business', th: 'แกร็บธุรกิจ' } },
  { id: 'personalInBangkok', label: { en: 'Personal Vehicle (In Bangkok)', th: 'รถส่วนตัว (ในกรุงเทพฯ)' } },
  { id: 'personalOutBangkok', label: { en: 'Personal Vehicle (Outside Bangkok)', th: 'รถส่วนตัว (นอกกรุงเทพฯ)' } },
  { id: 'other', label: { en: 'Other', th: 'อื่นๆ' } },
];

export const EXPENSE_TYPES = [
  { id: 'toll', label: { en: 'Toll', th: 'ค่าทางด่วน' } },
  { id: 'fuel', label: { en: 'Fuel', th: 'ค่าน้ำมัน' } },
  { id: 'transportMileage', label: { en: 'Transport / Mileage', th: 'ค่าเดินทาง / ระยะทาง' } },
  { id: 'meals', label: { en: 'Meals', th: 'ค่าอาหาร' } },
  { id: 'accommodation', label: { en: 'Accommodation', th: 'ค่าที่พัก' } },
  { id: 'certification', label: { en: 'Certification', th: 'ค่าใบรับรอง' } },
  { id: 'parking', label: { en: 'Parking', th: 'ค่าที่จอดรถ' } },
  { id: 'communication', label: { en: 'Communication', th: 'ค่าสื่อสาร' } },
];
