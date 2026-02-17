import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { COMPANIES, BANKS, PAYMENT_METHODS, COST_CENTERS } from '../../data/constants.js';
import { MATERIAL_CODES } from '../../data/materialCodes.js';
import { SUPPLIERS, PURCHASE_ORDERS } from '../../data/suppliers.js';
import { USERS } from '../../data/users.js';
import { generateId } from '../../utils/formatters.js';
import AttachmentList from '../common/AttachmentList.jsx';

const CURRENCIES = ['THB', 'USD', 'EUR', 'SGD', 'JPY'];
const DOC_TYPES = [
  { id: 'KR', label: { en: 'Normal (KR)', th: 'ปกติ (KR)' } },
  { id: 'KZ', label: { en: 'Special (KZ)', th: 'พิเศษ (KZ)' } },
];

export default function PaymentForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch, state, getRecordById } = useData();
  const { currentUser } = useAuth();

  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);

  const allUsers = USERS;

  const [form, setForm] = useState({
    companyId: currentUser?.company || 'comp-1',
    paymentDate: '',
    currency: 'THB',
    paymentMethod: 'transfer',
    documentType: 'KR',
    paymentRequestType: 'supplier',
    requesterId: currentUser?.id || 'user-03',
    payee: '',
    payeeEmail: '',
    payeeBankId: 'bank-1',
    payeeBankAccount: '',
    paymentDetails: '',
    supplierId: '',
    poReference: '',
  });

  const [lineItems, setLineItems] = useState([
    { wbsCostCenter: 'CC1001', materialCode: '', description: '', amount: 0, additions: [{ type: 'vat', rate: 7, amount: 0 }] },
  ]);

  const [hasMemo, setHasMemo] = useState(false);
  const [memo, setMemo] = useState('');
  const [memoFiles, setMemoFiles] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);

  useEffect(() => {
    if (!editId) return;
    const record = getRecordById('payment', editId);
    if (!record) return;
    setForm({
      companyId: record.companyId || currentUser?.company || 'comp-1',
      paymentDate: record.paymentDate || '',
      currency: record.currency || 'THB',
      paymentMethod: record.paymentMethod || 'transfer',
      documentType: record.documentType || 'KR',
      paymentRequestType: record.paymentRequestType || 'supplier',
      requesterId: record.requesterId || currentUser?.id || 'user-03',
      payee: record.payee || '',
      payeeEmail: record.payeeEmail || '',
      payeeBankId: record.payeeBankId || 'bank-1',
      payeeBankAccount: record.payeeBankAccount || '',
      paymentDetails: record.paymentDetails || '',
      supplierId: record.supplierId || '',
      poReference: record.poReference || '',
    });
    if (record.lineItems?.length > 0) setLineItems(record.lineItems);
    if (record.memo) { setHasMemo(true); setMemo(record.memo); }
    if (record.memoFiles) setMemoFiles(record.memoFiles);
    if (record.otherFiles) setOtherFiles(record.otherFiles);
  }, [editId, getRecordById, currentUser]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'supplierId') {
        const supplier = SUPPLIERS.find((s) => s.id === value);
        if (supplier) {
          next.payee = i18n.language === 'th' ? supplier.name : supplier.nameEn;
          next.payeeBankId = supplier.bankId;
          next.payeeBankAccount = supplier.bankAccount;
        }
      }
      return next;
    });
  };

  const handleLineChange = (index, field, value) => {
    setLineItems((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      if (field === 'materialCode') {
        const mat = MATERIAL_CODES.find((m) => m.code === value);
        if (mat) {
          const desc = i18n.language === 'th' ? mat.description.th : mat.description.en;
          return { ...item, materialCode: value, description: desc };
        }
        return { ...item, materialCode: value };
      }
      const updated = { ...item, [field]: field === 'description' || field === 'wbsCostCenter' ? value : Number(value) || 0 };
      if (field === 'amount') {
        updated.additions = updated.additions.map((a) => ({
          ...a,
          amount: a.type === 'vat'
            ? Math.round(updated.amount * (a.rate / 100))
            : a.type === 'wht'
              ? -Math.round(updated.amount * (a.rate / 100))
              : a.type === 'retention'
                ? -Math.round(updated.amount * (a.rate / 100))
                : a.amount,
        }));
      }
      return updated;
    }));
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, { wbsCostCenter: 'CC1001', materialCode: '', description: '', amount: 0, additions: [{ type: 'vat', rate: 7, amount: 0 }] }]);
  };

  const removeLine = (index) => {
    if (lineItems.length > 1) setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addDeduction = (lineIdx, type) => {
    const rate = type === 'vat' ? 7 : type === 'wht' ? 3 : type === 'retention' ? 5 : 0;
    setLineItems((prev) => prev.map((item, i) => {
      if (i !== lineIdx) return item;
      const amount = type === 'vat' ? Math.round(item.amount * (rate / 100)) : -Math.round(item.amount * (rate / 100));
      return { ...item, additions: [...item.additions, { type, rate, amount }] };
    }));
  };

  const removeAddition = (lineIdx, addIdx) => {
    setLineItems((prev) => prev.map((item, i) => {
      if (i !== lineIdx) return item;
      return { ...item, additions: item.additions.filter((_, j) => j !== addIdx) };
    }));
  };

  const calcLineNet = (item) => item.amount + item.additions.reduce((s, a) => s + a.amount, 0);
  const totalNet = lineItems.reduce((sum, item) => sum + calcLineNet(item), 0);

  const supplierPOs = form.supplierId ? PURCHASE_ORDERS.filter((po) => po.supplierId === form.supplierId) : [];

  const handleSubmit = (asDraft) => {
    const now = new Date().toISOString();
    const commonFields = {
      companyId: form.companyId,
      paymentDate: form.paymentDate,
      currency: form.currency,
      paymentMethod: form.paymentMethod,
      documentType: form.documentType,
      paymentRequestType: form.paymentRequestType,
      payee: form.payee,
      payeeEmail: form.payeeEmail,
      payeeBankId: form.paymentMethod === 'cash' ? null : form.payeeBankId,
      payeeBankAccount: form.paymentMethod === 'cash' ? null : form.payeeBankAccount,
      paymentDetails: form.paymentDetails,
      supplierId: form.supplierId,
      poReference: form.poReference,
      lineItems,
      totalNet,
      memo: hasMemo ? memo : '',
      memoFiles,
      otherFiles,
    };

    if (isEditing) {
      dispatch({ type: 'UPDATE_RECORD', module: 'payment', id: editId, updates: {
        ...commonFields,
        requesterId: form.requesterId,
        approvals: asDraft ? [] : [{ userId: currentUser?.id, action: 'resubmitted', date: now, comment: '' }],
        status: asDraft ? 'draft' : 'pendingApproval',
      } });
      navigate(`/payment/${editId}`);
    } else {
      const docNum = `PAY-2026-${String(state.payments.length + 1).padStart(4, '0')}`;
      const newRecord = {
        id: generateId(),
        docNumber: docNum,
        requesterId: form.requesterId,
        ...commonFields,
        approvals: asDraft ? [] : [{ userId: currentUser?.id, action: 'submitted', date: now, comment: '' }],
        status: asDraft ? 'draft' : 'pendingApproval',
        sapDocNumber: null,
      };
      dispatch({ type: 'ADD_RECORD', module: 'payment', record: newRecord });
      navigate(`/payment/${newRecord.id}`);
    }
  };

  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-brand transition-colors';

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-6">{isEditing ? t('payment.editPayment') : t('payment.newPayment')}</h1>

      {/* Header Fields */}
      <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t('advance.company')}</label>
            <select value={form.companyId} onChange={(e) => handleFieldChange('companyId', e.target.value)} className={inputClass}>
              {COMPANIES.map((c) => <option key={c.id} value={c.id}>{i18n.language === 'th' ? c.name.th : c.name.en} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('payment.documentType', 'Document Type')}</label>
            <select value={form.documentType} onChange={(e) => handleFieldChange('documentType', e.target.value)} className={inputClass}>
              {DOC_TYPES.map((dt) => <option key={dt.id} value={dt.id}>{i18n.language === 'th' ? dt.label.th : dt.label.en}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('payment.requester', 'Requester')}</label>
            <select value={form.requesterId} onChange={(e) => handleFieldChange('requesterId', e.target.value)} className={inputClass}>
              {allUsers.map((u) => <option key={u.id} value={u.id}>{i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('payment.paymentDate')}</label>
            <input type="date" value={form.paymentDate} onChange={(e) => handleFieldChange('paymentDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('payment.currency')}</label>
            <select value={form.currency} onChange={(e) => handleFieldChange('currency', e.target.value)} className={inputClass}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('payment.paymentMethod')}</label>
            <select value={form.paymentMethod} onChange={(e) => handleFieldChange('paymentMethod', e.target.value)} className={inputClass}>
              {PAYMENT_METHODS.map((pm) => <option key={pm.id} value={pm.id}>{i18n.language === 'th' ? pm.label.th : pm.label.en}</option>)}
            </select>
          </div>

          {/* Payment Request Type */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelClass}>{t('payment.paymentRequestType', 'Payment Request Type')}</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="paymentRequestType" value="supplier" checked={form.paymentRequestType === 'supplier'} onChange={(e) => handleFieldChange('paymentRequestType', e.target.value)} className="accent-brand" />
                {t('payment.supplierPayment', 'Supplier Payment')}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="paymentRequestType" value="reimbursement" checked={form.paymentRequestType === 'reimbursement'} onChange={(e) => handleFieldChange('paymentRequestType', e.target.value)} className="accent-brand" />
                {t('payment.employeeReimbursement', 'Employee Reimbursement')}
              </label>
            </div>
          </div>

          {/* Supplier mode */}
          {form.paymentRequestType === 'supplier' && (
            <>
              <div>
                <label className={labelClass}>{t('payment.supplier', 'Supplier')}</label>
                <select value={form.supplierId} onChange={(e) => handleFieldChange('supplierId', e.target.value)} className={inputClass}>
                  <option value="">-- Select Supplier --</option>
                  {SUPPLIERS.map((s) => <option key={s.id} value={s.id}>{i18n.language === 'th' ? s.name : s.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('payment.poReference', 'PO Reference')}</label>
                <select value={form.poReference} onChange={(e) => handleFieldChange('poReference', e.target.value)} className={inputClass}>
                  <option value="">-- Select PO --</option>
                  {supplierPOs.map((po) => <option key={po.id} value={po.poNumber}>{po.poNumber} - {po.description}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>{t('payment.payee')}</label>
            <input type="text" value={form.payee} onChange={(e) => handleFieldChange('payee', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.payeeEmail} onChange={(e) => handleFieldChange('payeeEmail', e.target.value)} className={inputClass} />
          </div>
          {form.paymentMethod !== 'cash' && (
            <>
              <div>
                <label className={labelClass}>{t('payment.payeeBank')}</label>
                <select value={form.payeeBankId} onChange={(e) => handleFieldChange('payeeBankId', e.target.value)} className={inputClass}>
                  {BANKS.map((b) => <option key={b.id} value={b.id}>{i18n.language === 'th' ? b.name.th : b.name.en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('payment.bankAccount')}</label>
                <input type="text" value={form.payeeBankAccount} onChange={(e) => handleFieldChange('payeeBankAccount', e.target.value)} className={inputClass} placeholder="xxx-x-xxxxx-x" />
              </div>
            </>
          )}
          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelClass}>{t('payment.paymentDetails')}</label>
            <textarea value={form.paymentDetails} onChange={(e) => handleFieldChange('paymentDetails', e.target.value)} rows={2} className={inputClass} />
          </div>

          {/* Memo */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary mb-1 cursor-pointer">
              <input type="checkbox" checked={hasMemo} onChange={(e) => setHasMemo(e.target.checked)} className="rounded border-border text-brand focus:ring-brand" />
              {t('payment.attachMemo')}
            </label>
            {hasMemo && (
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder={t('payment.memo')} className={inputClass + ' mt-1'} />
            )}
          </div>

          {/* Separated Attachments */}
          <div className="md:col-span-2 lg:col-span-3">
            <AttachmentList
              files={memoFiles}
              onAdd={(name) => setMemoFiles((prev) => [...prev, name])}
              onRemove={(idx) => setMemoFiles((prev) => prev.filter((_, i) => i !== idx))}
              label={t('payment.memoFiles', 'E-Memo Files')}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <AttachmentList
              files={otherFiles}
              onAdd={(name) => setOtherFiles((prev) => [...prev, name])}
              onRemove={(idx) => setOtherFiles((prev) => prev.filter((_, i) => i !== idx))}
              label={t('payment.otherFiles', 'Other Files')}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">{t('advance.lineItems')}</h2>
          <button onClick={addLine} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
            <Plus size={14} /> Add Line
          </button>
        </div>
        <div className="space-y-4">
          {lineItems.map((item, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-text-secondary">Line {idx + 1}</span>
                <button onClick={() => removeLine(idx)} className="p-1 text-negative hover:bg-negative/10 rounded" disabled={lineItems.length <= 1}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>{t('payment.wbsCostCenter')}</label>
                  <select value={item.wbsCostCenter} onChange={(e) => handleLineChange(idx, 'wbsCostCenter', e.target.value)} className={inputClass}>
                    {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code} - {cc.description}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('advance.materialCode', 'Material Code')}</label>
                  <select value={item.materialCode || ''} onChange={(e) => handleLineChange(idx, 'materialCode', e.target.value)} className={inputClass}>
                    <option value="">--</option>
                    {MATERIAL_CODES.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('advance.description')}</label>
                  <input type="text" value={item.description} onChange={(e) => handleLineChange(idx, 'description', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t('common.amount')}</label>
                  <input type="number" value={item.amount} onChange={(e) => handleLineChange(idx, 'amount', e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {item.additions.map((add, addIdx) => (
                  <span key={addIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-bg-primary rounded text-xs">
                    {add.type.toUpperCase()} {add.rate}% = {add.amount.toLocaleString()}
                    <button onClick={() => removeAddition(idx, addIdx)} className="ml-1 text-negative hover:text-negative/70"><Trash2 size={10} /></button>
                  </span>
                ))}
                <div className="flex gap-1">
                  <button onClick={() => addDeduction(idx, 'vat')} className="px-2 py-0.5 text-xs border border-border rounded hover:bg-bg-primary">+VAT</button>
                  <button onClick={() => addDeduction(idx, 'wht')} className="px-2 py-0.5 text-xs border border-border rounded hover:bg-bg-primary">+WHT</button>
                  <button onClick={() => addDeduction(idx, 'retention')} className="px-2 py-0.5 text-xs border border-border rounded hover:bg-bg-primary">+Retention</button>
                </div>
              </div>
              <div className="mt-2 text-right text-sm font-mono font-medium">
                Net: {calcLineNet(item).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-base font-bold font-mono">
          {t('payment.netPayment')}: {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })} {form.currency}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/payment')} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
          {t('common.cancel')}
        </button>
        <button onClick={() => handleSubmit(true)} className="px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
          {t('payment.saveDraft')}
        </button>
        <button onClick={() => handleSubmit(false)} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
          {t('payment.request')}
        </button>
      </div>
    </div>
  );
}
