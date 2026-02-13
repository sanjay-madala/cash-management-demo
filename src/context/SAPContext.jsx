import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { postDocument } from '../services/sapSimulator.js';

const SAPContext = createContext(null);

const GL_ACCOUNTS = {
  advance: {
    debit: { account: '3100054', name: 'Staff Advance' },
    credit: { account: '2302688', name: 'Bank' },
  },
  payment: {
    debit: { account: 'VENDOR', name: 'Vendor Account' },
    credit: { account: '2302688', name: 'Bank' },
  },
  expense: {
    debit: { account: 'EXPENSE', name: 'Expense Account' },
    credit: { account: '3100054', name: 'Staff Advance (Clearing)' },
  },
  pettyCash: {
    debit: { account: 'EXPENSE', name: 'Expense Account' },
    credit: { account: '210103', name: 'Petty Cash Payable' },
  },
  reconciliation: {
    debit: { account: 'EXPENSE', name: 'Expense Account' },
    credit: { account: '3100054', name: 'Staff Advance (Clearing)' },
  },
};

function buildLineItems(module, data) {
  const mapping = GL_ACCOUNTS[module];
  if (!mapping) return [];

  const amount = data.totalAmount || data.netPayment || 0;

  const debitAccount =
    mapping.debit.account === 'VENDOR'
      ? data.vendorId || 'VENDOR'
      : mapping.debit.account === 'EXPENSE'
        ? data.lineItems?.[0]?.glAccount || '6200010'
        : mapping.debit.account;

  const debitName =
    mapping.debit.account === 'VENDOR'
      ? data.payee || 'Vendor Account'
      : mapping.debit.account === 'EXPENSE'
        ? data.lineItems?.[0]?.description || 'Expense'
        : mapping.debit.name;

  const lineItems = [
    {
      lineNumber: 1,
      glAccount: debitAccount,
      glAccountName: debitName,
      debit: amount,
      credit: 0,
      costCenter: data.costCenter || data.lineItems?.[0]?.costCenter || '',
      profitCenter: data.lineItems?.[0]?.profitCenter || '',
      text: data.purpose || data.memo || data.reference || '',
    },
    {
      lineNumber: 2,
      glAccount: mapping.credit.account,
      glAccountName: mapping.credit.name,
      debit: 0,
      credit: amount,
      costCenter: '',
      profitCenter: '',
      text: data.purpose || data.memo || data.reference || '',
    },
  ];

  return lineItems;
}

export function SAPProvider({ children }) {
  const [sapDocuments, setSapDocuments] = useState([]);

  const postToSAP = useCallback(
    async (module, recordId, data) => {
      const lineItems = buildLineItems(module, data);

      const postingData = {
        ...data,
        sourceModule: module,
        sourceRecordId: recordId,
        glLineItems: lineItems,
      };

      const result = await postDocument(module, postingData);

      const sapDoc = {
        ...result,
        sourceModule: module,
        sourceRecordId: recordId,
        lineItems,
      };

      setSapDocuments((prev) => [...prev, sapDoc]);

      return sapDoc;
    },
    []
  );

  const getSAPDocument = useCallback(
    (recordId) => {
      return sapDocuments.find((doc) => doc.sourceRecordId === recordId) || null;
    },
    [sapDocuments]
  );

  const value = useMemo(
    () => ({
      sapDocuments,
      postToSAP,
      getSAPDocument,
    }),
    [sapDocuments, postToSAP, getSAPDocument]
  );

  return (
    <SAPContext.Provider value={value}>
      {children}
    </SAPContext.Provider>
  );
}

export function useSAP() {
  const context = useContext(SAPContext);
  if (!context) {
    throw new Error('useSAP must be used within a SAPProvider');
  }
  return context;
}

export default SAPContext;
