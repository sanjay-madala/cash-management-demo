import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { COMPANIES, BANKS, PAYMENT_METHODS } from '../../data/constants.js';
import { USERS } from '../../data/users.js';
import { generateId } from '../../utils/formatters.js';

const ADVANCE_TYPES = [
  { id: 'site', labelKey: 'advance.siteAdvance' },
  { id: 'driver', labelKey: 'advance.driverAdvance' },
  { id: 'specific', labelKey: 'advance.specificAdvance' },
];

const VAT_OPTIONS = [0, 7];
const WHT_OPTIONS = [0, 1, 2, 3, 5];

const BRANCHES = [
  { id: 'HQ', label: { en: 'Head Office', th: 'สำนักงานใหญ่' } },
  { id: 'BR01', label: { en: 'Branch 01', th: 'สาขา 01' } },
  { id: 'BR02', label: { en: 'Branch 02', th: 'สาขา 02' } },
  { id: 'BR03', label: { en: 'Branch 03', th: 'สาขา 03' } },
];

export default function AdvanceForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch, state, getRecordById } = useData();
  const { currentUser } = useAuth();

  const editId = searchParams.get('edit');
  const editRecord = editId ? getRecordById('advance', editId) : null;

  const employees = USERS.filter((u) => u.role === 'employee');

  const [form, setForm] = useState({
    companyId: editRecord?.companyId || currentUser?.company || 'comp-1',
    branch: editRecord?.branch || 'HQ',
    purpose: editRecord?.purpose || '',
    advanceType: editRecord?.advanceType || 'specific',
    requiredDate: editRecord?.requiredDate || '',
    requestDate: editRecord?.documentDate || new Date().toISOString().split('T')[0],
    advanceReceiverId: editRecord?.cashReceiverId || currentUser?.id || 'user-03',
    advanceOwnerId: editRecord?.cashHolderId || currentUser?.id || 'user-03',
    paymentMethod: editRecord?.paymentMethod || 'transfer',
    bankId: editRecord?.bankId || 'bank-1',
    accountNumber: editRecord?.accountNumber || '',
    chequeReceiveDate: editRecord?.chequeReceiveDate || '',
    chequeDate: editRecord?.chequeDate || '',
    whtCertificate: editRecord?.whtCertificate || 'immediately',
    note: editRecord?.note || '',
    attachFile: editRecord?.attachFile || '',
  });

  const [lineItems, setLineItems] = useState(
    editRecord?.lineItems?.map((li) => ({
      description: li.description,
      amount: li.amount,
      vatRate: li.vatRate,
      whtRate: li.whtRate,
    })) || [{ description: '', amount: 0, vatRate: 7, whtRate: 0 }]
  );

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setLineItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'description' ? value : Number(value) || 0 } : item
    ));
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, { description: '', amount: 0, vatRate: 7, whtRate: 0 }]);
  };

  const removeLine = (index) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const calcNet = (item) => {
    const vat = item.amount * (item.vatRate / 100);
    const wht = item.amount * (item.whtRate / 100);
    return item.amount + vat - wht;
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + calcNet(item), 0);

  const isCheque = form.paymentMethod === 'companyCheque' || form.paymentMethod === 'cashierCheque';

  const handleSubmit = (asDraft) => {
    const now = new Date().toISOString();
    const record = {
      id: editRecord?.id || generateId(),
      docNumber: editRecord?.docNumber || `ADV-2026-${String(state.advances.length + 1).padStart(4, '0')}`,
      requesterId: currentUser?.id || 'user-03',
      companyId: form.companyId,
      branch: form.branch,
      department: currentUser?.department || 'dept-1',
      purpose: form.purpose,
      advanceType: form.advanceType,
      cashReceiverId: form.advanceReceiverId,
      cashHolderId: form.advanceOwnerId,
      requiredDate: form.requiredDate,
      documentDate: form.requestDate,
      status: asDraft ? 'draft' : 'pendingApproval',
      lineItems: lineItems.map((item) => ({
        description: item.description,
        amount: item.amount,
        vatRate: item.vatRate,
        whtRate: item.whtRate,
        netAmount: calcNet(item),
      })),
      paymentMethod: form.paymentMethod,
      bankId: form.paymentMethod === 'cash' ? null : form.bankId,
      accountNumber: form.paymentMethod === 'cash' ? null : form.accountNumber,
      chequeReceiveDate: isCheque ? form.chequeReceiveDate : null,
      chequeDate: isCheque ? form.chequeDate : null,
      whtCertificate: form.whtCertificate,
      note: form.note,
      attachFile: form.attachFile,
      approvals: asDraft
        ? (editRecord?.approvals || [])
        : [...(editRecord?.approvals || []).filter((a) => a.action !== 'submitted'), { userId: currentUser?.id || 'user-03', action: 'submitted', date: now, comment: editRecord ? 'Resubmitted' : '' }],
      totalAmount,
      sapDocNumber: editRecord?.sapDocNumber || null,
    };

    if (editRecord) {
      dispatch({ type: 'UPDATE_RECORD', module: 'advance', id: editRecord.id, updates: record });
    } else {
      dispatch({ type: 'ADD_RECORD', module: 'advance', record });
    }
    navigate(`/advance/${record.id}`);
  };

  const getUserName = (userId) => {
    const u = USERS.find((u) => u.id === userId);
    return u ? (i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`) : '-';
  };

  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-brand transition-colors';

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-6">
        {editRecord ? `${t('common.edit')}: ${editRecord.docNumber}` : t('advance.newAdvance')}
      </h1>

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
            <label className={labelClass}>{t('advance.branch')}</label>
            <select value={form.branch} onChange={(e) => handleFieldChange('branch', e.target.value)} className={inputClass}>
              {BRANCHES.map((b) => <option key={b.id} value={b.id}>{i18n.language === 'th' ? b.label.th : b.label.en}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('advance.advanceType')}</label>
            <select value={form.advanceType} onChange={(e) => handleFieldChange('advanceType', e.target.value)} className={inputClass}>
              {ADVANCE_TYPES.map((at) => <option key={at.id} value={at.id}>{t(at.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('advance.requestDate')}</label>
            <input type="date" value={form.requestDate} onChange={(e) => handleFieldChange('requestDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('advance.requiredDate')}</label>
            <input type="date" value={form.requiredDate} onChange={(e) => handleFieldChange('requiredDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('advance.advanceReceiver')}</label>
            <select value={form.advanceReceiverId} onChange={(e) => handleFieldChange('advanceReceiverId', e.target.value)} className={inputClass}>
              {employees.map((u) => <option key={u.id} value={u.id}>{getUserName(u.id)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('advance.advanceOwner')}</label>
            <select value={form.advanceOwnerId} onChange={(e) => handleFieldChange('advanceOwnerId', e.target.value)} className={inputClass}>
              {employees.map((u) => <option key={u.id} value={u.id}>{getUserName(u.id)}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className={labelClass}>{t('advance.purpose')}</label>
            <textarea value={form.purpose} onChange={(e) => handleFieldChange('purpose', e.target.value)} rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('advance.attachFile')}</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.attachFile}
                onChange={(e) => handleFieldChange('attachFile', e.target.value)}
                className={inputClass}
                placeholder="filename.pdf"
              />
              <button className="p-2 text-brand border border-brand rounded-lg hover:bg-brand/5">
                <Upload size={16} />
              </button>
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelClass}>{t('advance.note')}</label>
            <textarea value={form.note} onChange={(e) => handleFieldChange('note', e.target.value)} rows={2} className={inputClass} placeholder={t('advance.note')} />
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">#</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2 min-w-[200px]">{t('advance.description')}</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('common.amount')}</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('advance.vat')} %</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('advance.wht')} %</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('advance.netAmount')}</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="py-2 px-2 text-sm text-text-secondary">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <input type="text" value={item.description} onChange={(e) => handleLineChange(idx, 'description', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" value={item.amount} onChange={(e) => handleLineChange(idx, 'amount', e.target.value)} className="w-24 px-2 py-1 text-sm border border-border rounded text-right" />
                  </td>
                  <td className="py-2 px-2">
                    <select value={item.vatRate} onChange={(e) => handleLineChange(idx, 'vatRate', e.target.value)} className="w-20 px-2 py-1 text-sm border border-border rounded text-right">
                      {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <select value={item.whtRate} onChange={(e) => handleLineChange(idx, 'whtRate', e.target.value)} className="w-20 px-2 py-1 text-sm border border-border rounded text-right">
                      {WHT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-2 text-sm text-right font-mono">{calcNet(item).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 px-2">
                    <button onClick={() => removeLine(idx)} className="p-1 text-negative hover:bg-negative/10 rounded" disabled={lineItems.length <= 1}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="text-right text-sm font-semibold text-text-primary py-3 px-2">{t('common.total')}</td>
                <td className="text-right text-sm font-bold font-mono text-text-primary py-3 px-2">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">{t('advance.paymentMethod')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t('advance.paymentMethod')}</label>
            <select value={form.paymentMethod} onChange={(e) => handleFieldChange('paymentMethod', e.target.value)} className={inputClass}>
              {PAYMENT_METHODS.map((pm) => <option key={pm.id} value={pm.id}>{i18n.language === 'th' ? pm.label.th : pm.label.en}</option>)}
            </select>
          </div>
          {form.paymentMethod !== 'cash' && !isCheque && (
            <>
              <div>
                <label className={labelClass}>{t('advance.bank')}</label>
                <select value={form.bankId} onChange={(e) => handleFieldChange('bankId', e.target.value)} className={inputClass}>
                  {BANKS.map((b) => <option key={b.id} value={b.id}>{i18n.language === 'th' ? b.name.th : b.name.en}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('advance.accountNumber')}</label>
                <input type="text" value={form.accountNumber} onChange={(e) => handleFieldChange('accountNumber', e.target.value)} className={inputClass} placeholder="xxx-x-xxxxx-x" />
              </div>
            </>
          )}
          {isCheque && (
            <>
              <div>
                <label className={labelClass}>{t('advance.chequeReceiveDate')}</label>
                <input type="date" value={form.chequeReceiveDate} onChange={(e) => handleFieldChange('chequeReceiveDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('advance.chequeDate')}</label>
                <input type="date" value={form.chequeDate} onChange={(e) => handleFieldChange('chequeDate', e.target.value)} className={inputClass} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* WHT Certificate */}
      <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-4">{t('advance.whtCertificate')}</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="whtCertificate"
              value="immediately"
              checked={form.whtCertificate === 'immediately'}
              onChange={(e) => handleFieldChange('whtCertificate', e.target.value)}
              className="accent-brand"
            />
            {t('advance.issueImmediately')}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="whtCertificate"
              value="later"
              checked={form.whtCertificate === 'later'}
              onChange={(e) => handleFieldChange('whtCertificate', e.target.value)}
              className="accent-brand"
            />
            {t('advance.issueLater')}
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/advance')} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
          {t('common.cancel')}
        </button>
        <button onClick={() => handleSubmit(true)} className="px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
          {t('common.save')}
        </button>
        <button onClick={() => handleSubmit(false)} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
          {t('common.submit')}
        </button>
      </div>
    </div>
  );
}
