import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { COMPANIES, COST_CENTERS } from '../../data/constants.js';
import { generateId } from '../../utils/formatters.js';

export default function PettyCashForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch, state, getRecordById } = useData();
  const { currentUser } = useAuth();

  const editId = searchParams.get('edit');
  const editRecord = editId ? getRecordById('petty-cash', editId) : null;

  const [form, setForm] = useState({
    company: currentUser?.company || 'comp-1',
    vendorName: '',
    vendorId: '',
    documentDate: new Date().toISOString().split('T')[0],
    postingDate: new Date().toISOString().split('T')[0],
    businessPlace: 'BP01',
    documentType: 'KR',
    reference: '',
    payTo: currentUser ? `${currentUser.firstNameEn} ${currentUser.lastNameEn}` : '',
  });

  const [lineItems, setLineItems] = useState([
    { id: 1, type: 'expense', glAccount: '6200010', description: '', amount: 0, taxCode: 'V7', costCenter: 'CC-1001', wbs: '', profitCenter: 'PC-1000', assignment: '', text: '' },
  ]);

  useEffect(() => {
    if (editRecord) {
      setForm({
        company: editRecord.company || currentUser?.company || 'comp-1',
        vendorName: editRecord.vendorName || '',
        vendorId: editRecord.vendorId || '',
        documentDate: editRecord.documentDate || new Date().toISOString().split('T')[0],
        postingDate: editRecord.postingDate || new Date().toISOString().split('T')[0],
        businessPlace: editRecord.businessPlace || 'BP01',
        documentType: editRecord.documentType || 'KR',
        reference: editRecord.reference || '',
        payTo: editRecord.payTo || (currentUser ? `${currentUser.firstNameEn} ${currentUser.lastNameEn}` : ''),
      });
      if (editRecord.lineItems && editRecord.lineItems.length > 0) {
        setLineItems(editRecord.lineItems);
      }
    }
  }, [editRecord]);

  const handleFieldChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleLineChange = (index, field, value) => {
    setLineItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'amount' ? (Number(value) || 0) : value } : item
    ));
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, { id: prev.length + 1, type: 'expense', glAccount: '6200010', description: '', amount: 0, taxCode: 'V7', costCenter: 'CC-1001', wbs: '', profitCenter: 'PC-1000', assignment: '', text: '' }]);
  };

  const removeLine = (index) => {
    if (lineItems.length > 1) setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = lineItems.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = (asDraft) => {
    const now = new Date().toISOString();

    if (editId) {
      dispatch({ type: 'UPDATE_RECORD', module: 'pettyCash', id: editId, updates: {
        company: form.company,
        vendorName: form.vendorName,
        vendorId: form.vendorId,
        documentDate: form.documentDate,
        postingDate: form.postingDate,
        businessPlace: form.businessPlace,
        documentType: form.documentType,
        reference: form.reference,
        payTo: form.payTo,
        lineItems,
        totalAmount,
        status: asDraft ? 'draft' : 'pendingApproval',
        approvals: asDraft ? (editRecord?.approvals || []) : [...(editRecord?.approvals || []), { userId: currentUser?.id, action: 'resubmitted', date: now, comment: '' }],
      }});
      navigate(`/petty-cash/${editId}`);
    } else {
      const docNum = `PC-${String(state.pettyCash.length + 1).padStart(4, '0')}`;
      const newRecord = {
        id: generateId(),
        docNumber: docNum,
        requesterId: currentUser?.id || 'user-03',
        requesterName: currentUser ? `${currentUser.firstNameEn} ${currentUser.lastNameEn}` : 'Unknown',
        department: currentUser?.department || 'dept-1',
        company: form.company,
        vendorName: form.vendorName,
        vendorId: form.vendorId,
        documentDate: form.documentDate,
        postingDate: form.postingDate,
        createdDate: now.split('T')[0],
        businessPlace: form.businessPlace,
        documentType: form.documentType,
        reference: form.reference,
        status: asDraft ? 'draft' : 'pendingApproval',
        payTo: form.payTo,
        lineItems,
        totalAmount,
        approvals: asDraft ? [] : [{ userId: currentUser?.id || 'user-03', action: 'submitted', date: now, comment: '' }],
      };

      dispatch({ type: 'ADD_RECORD', module: 'pettyCash', record: newRecord });
      navigate(`/petty-cash/${newRecord.id}`);
    }
  };

  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-brand transition-colors';

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-6">{editId ? t('pettyCash.editVoucher', 'Edit Voucher') : t('pettyCash.newVoucher')}</h1>

      <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t('pettyCash.companyCode')}</label>
            <select value={form.company} onChange={(e) => handleFieldChange('company', e.target.value)} className={inputClass}>
              {COMPANIES.map((c) => <option key={c.id} value={c.id}>{i18n.language === 'th' ? c.name.th : c.name.en} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('pettyCash.vendor')}</label>
            <input type="text" value={form.vendorName} onChange={(e) => handleFieldChange('vendorName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('pettyCash.documentDate')}</label>
            <input type="date" value={form.documentDate} onChange={(e) => handleFieldChange('documentDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('pettyCash.postingDate')}</label>
            <input type="date" value={form.postingDate} onChange={(e) => handleFieldChange('postingDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('pettyCash.businessPlace')}</label>
            <input type="text" value={form.businessPlace} onChange={(e) => handleFieldChange('businessPlace', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('pettyCash.reference')}</label>
            <input type="text" value={form.reference} onChange={(e) => handleFieldChange('reference', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t('pettyCash.payTo')}</label>
            <input type="text" value={form.payTo} onChange={(e) => handleFieldChange('payTo', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">{t('pettyCash.lineItems')}</h2>
          <button onClick={addLine} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
            <Plus size={14} /> Add Line
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">{t('pettyCash.seq')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2 min-w-[200px]">{t('advance.description')}</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('common.amount')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">{t('pettyCash.costCenter')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">{t('pettyCash.text')}</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="py-2 px-2 text-sm">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <input type="text" value={item.description} onChange={(e) => handleLineChange(idx, 'description', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" value={item.amount} onChange={(e) => handleLineChange(idx, 'amount', e.target.value)} className="w-24 px-2 py-1 text-sm border border-border rounded text-right" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={item.costCenter} onChange={(e) => handleLineChange(idx, 'costCenter', e.target.value)} className="w-28 px-2 py-1 text-sm border border-border rounded" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={item.text} onChange={(e) => handleLineChange(idx, 'text', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded" />
                  </td>
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
                <td colSpan={2} className="text-right text-sm font-semibold py-3 px-2">{t('common.total')}</td>
                <td className="text-right text-sm font-bold font-mono py-3 px-2">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/petty-cash')} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
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
