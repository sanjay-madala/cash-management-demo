import { COMPANIES } from '../data/constants.js';

let nextDocNumber = 209000001;

function resolveCompanyCode(data) {
  // Try direct companyCode first
  if (data.companyCode && /^\d+$/.test(data.companyCode)) return data.companyCode;
  // Resolve from companyId (e.g. "comp-1") or company field
  const companyId = data.companyId || data.company;
  if (companyId) {
    const found = COMPANIES.find((c) => c.id === companyId);
    if (found) return found.code;
  }
  return '1000';
}

export async function postDocument(module, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const documentNumber = String(nextDocNumber);
      nextDocNumber += 1;

      const document = {
        documentNumber,
        companyCode: resolveCompanyCode(data),
        fiscalYear: 2026,
        postingDate: now.toISOString().split('T')[0],
        period: now.getMonth() + 1,
        currency: 'THB',
        reference: data.docNumber || data.reference || '',
        documentType: module === 'pettyCash' ? 'KR' : 'KZ',
        lineItems: data.glLineItems || [],
        status: 'Posted',
        createdAt: now.toISOString(),
        sourceModule: module,
      };

      resolve(document);
    }, 1500);
  });
}
