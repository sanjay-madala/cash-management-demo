import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Check } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EXPENSE_TYPES } from '../../data/constants.js';
import { USERS } from '../../data/users.js';
import { generateId } from '../../utils/formatters.js';
import AmountDisplay from '../common/AmountDisplay.jsx';

export default function ReconciliationForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch, state, getRecordById } = useData();
  const { currentUser } = useAuth();

  const editId = searchParams.get('edit');
  const editRecord = editId ? getRecordById('reconciliation', editId) : null;

  // Get disbursed advances for the current user that are not yet cleared
  const eligibleAdvances = useMemo(() => {
    const clearedAdvanceIds = new Set(
      state.reconciliations
        .filter((r) => r.status !== 'draft' && (!editRecord || r.id !== editRecord.id))
        .map((r) => r.advanceId)
    );
    return state.advances.filter(
      (a) => a.status === 'disbursed' && !clearedAdvanceIds.has(a.id)
    );
  }, [state.advances, state.reconciliations, editRecord]);

  const [step, setStep] = useState(1);
  const [selectedAdvanceId, setSelectedAdvanceId] = useState(editRecord?.advanceId || '');
  const [lineItems, setLineItems] = useState(
    editRecord?.lineItems || [{ id: 1, expenseType: 'fuel', description: '', amount: 0, receipt: false }]
  );

  const selectedAdvance = state.advances.find((a) => a.id === selectedAdvanceId);
  const advanceAmount = selectedAdvance?.totalAmount || editRecord?.advanceAmount || 0;

  const getUserName = (userId) => {
    const u = USERS.find((u) => u.id === userId);
    return u ? (i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`) : '-';
  };

  const handleLineChange = (index, field, value) => {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === 'amount' ? (Number(value) || 0) : field === 'receipt' ? !item.receipt : value }
          : item
      )
    );
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, { id: prev.length + 1, expenseType: 'fuel', description: '', amount: 0, receipt: false }]);
  };

  const removeLine = (index) => {
    if (lineItems.length > 1) setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalExpenses = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const netSettlement = totalExpenses - advanceAmount;
  const settlementType = netSettlement < 0 ? 'surplus' : netSettlement > 0 ? 'deficit' : 'exact';

  const handleSubmit = (asDraft) => {
    const now = new Date().toISOString();
    const record = {
      id: editRecord?.id || generateId(),
      docNumber: editRecord?.docNumber || `REC-2026-${String(state.reconciliations.length + 1).padStart(4, '0')}`,
      requesterId: currentUser?.id || 'user-03',
      requesterName: currentUser ? `${currentUser.firstNameEn} ${currentUser.lastNameEn}` : 'Unknown',
      advanceId: selectedAdvanceId,
      advanceDocNumber: selectedAdvance?.docNumber || editRecord?.advanceDocNumber || '',
      advanceAmount,
      companyId: selectedAdvance?.companyId || editRecord?.companyId || 'comp-1',
      department: currentUser?.department || 'dept-1',
      purpose: selectedAdvance?.purpose || editRecord?.purpose || '',
      createdDate: editRecord?.createdDate || now.split('T')[0],
      lineItems,
      totalExpenses,
      netSettlement,
      settlementType,
      returnSlip: null,
      status: asDraft ? 'draft' : 'pendingApproval',
      approvals: asDraft
        ? (editRecord?.approvals || [])
        : [...(editRecord?.approvals || []), { userId: currentUser?.id || 'user-03', action: 'submitted', date: now, comment: '' }],
      sapDocNumber: editRecord?.sapDocNumber || null,
    };

    if (editRecord) {
      dispatch({ type: 'UPDATE_RECORD', module: 'reconciliation', id: editRecord.id, updates: record });
    } else {
      dispatch({ type: 'ADD_RECORD', module: 'reconciliation', record });
    }
    navigate(`/reconciliation/${record.id}`);
  };

  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-brand transition-colors';

  const stepIndicator = (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              step > s ? 'bg-positive text-white' : step === s ? 'bg-brand text-white' : 'bg-bg-secondary text-text-secondary border border-border'
            }`}
          >
            {step > s ? <Check size={16} /> : s}
          </div>
          <span className={`text-sm ${step === s ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
            {t(`reconciliation.step${s}`)}
          </span>
          {s < 3 && <div className="w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-4">
        {editRecord ? `${t('common.edit')}: ${editRecord.docNumber}` : t('reconciliation.newReconciliation')}
      </h1>

      {stepIndicator}

      {/* Step 1: Select Advance */}
      {step === 1 && (
        <div className="bg-bg-secondary rounded-lg border border-border p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reconciliation.selectAdvance')}</h2>
          <div className="mb-4">
            <label className={labelClass}>{t('reconciliation.selectAdvance')}</label>
            <select value={selectedAdvanceId} onChange={(e) => setSelectedAdvanceId(e.target.value)} className={inputClass}>
              <option value="">-- {t('reconciliation.selectAdvance')} --</option>
              {eligibleAdvances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.docNumber} — {a.purpose?.substring(0, 50)} — {a.totalAmount?.toLocaleString()} THB
                </option>
              ))}
              {editRecord && !eligibleAdvances.find((a) => a.id === editRecord.advanceId) && (
                <option value={editRecord.advanceId}>
                  {editRecord.advanceDocNumber} — {editRecord.purpose?.substring(0, 50)} — {editRecord.advanceAmount?.toLocaleString()} THB
                </option>
              )}
            </select>
          </div>

          {selectedAdvance && (
            <div className="bg-bg-primary rounded-lg p-4 border border-border">
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                <div><span className="text-text-secondary">{t('advance.docNumber')}:</span> <span className="font-medium ml-1">{selectedAdvance.docNumber}</span></div>
                <div><span className="text-text-secondary">{t('advance.requester')}:</span> <span className="font-medium ml-1">{getUserName(selectedAdvance.requesterId)}</span></div>
                <div><span className="text-text-secondary">{t('advance.purpose')}:</span> <span className="font-medium ml-1">{selectedAdvance.purpose}</span></div>
                <div><span className="text-text-secondary">{t('reconciliation.advanceAmount')}:</span> <span className="font-bold ml-1 font-mono"><AmountDisplay amount={selectedAdvance.totalAmount} /></span></div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button onClick={() => navigate('/reconciliation')} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors mr-3">
              {t('common.cancel')}
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedAdvanceId}
              className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              {t('expense.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Record Expenses */}
      {step === 2 && (
        <div className="bg-bg-secondary rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('reconciliation.expenseItems')}</h2>
            <button onClick={addLine} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
              <Plus size={14} /> Add Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">#</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">{t('expense.expenseType')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2 min-w-[200px]">{t('advance.description')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('common.amount')}</th>
                  <th className="text-center text-xs font-semibold text-text-secondary py-2 px-2">Receipt</th>
                  <th className="py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-2 px-2 text-sm text-text-secondary">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <select value={item.expenseType} onChange={(e) => handleLineChange(idx, 'expenseType', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded">
                        {EXPENSE_TYPES.map((et) => (
                          <option key={et.id} value={et.id}>{i18n.language === 'th' ? et.label.th : et.label.en}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input type="text" value={item.description} onChange={(e) => handleLineChange(idx, 'description', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" value={item.amount} onChange={(e) => handleLineChange(idx, 'amount', e.target.value)} className="w-24 px-2 py-1 text-sm border border-border rounded text-right" />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input type="checkbox" checked={item.receipt} onChange={() => handleLineChange(idx, 'receipt', null)} className="w-4 h-4 accent-brand" />
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
                  <td colSpan={3} className="text-right text-sm font-semibold text-text-primary py-3 px-2">{t('common.total')}</td>
                  <td className="text-right text-sm font-bold font-mono text-text-primary py-3 px-2">{totalExpenses.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Settlement Preview */}
          <div className="mt-4 p-4 bg-bg-primary rounded-lg border border-border">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-text-secondary mb-1">{t('reconciliation.advanceAmount')}</div>
                <div className="font-bold font-mono text-lg"><AmountDisplay amount={advanceAmount} /></div>
              </div>
              <div className="text-center">
                <div className="text-text-secondary mb-1">{t('reconciliation.totalExpenses')}</div>
                <div className="font-bold font-mono text-lg"><AmountDisplay amount={totalExpenses} /></div>
              </div>
              <div className="text-center">
                <div className="text-text-secondary mb-1">{t('reconciliation.settlement')}</div>
                <div className={`font-bold font-mono text-lg ${settlementType === 'surplus' ? 'text-positive' : settlementType === 'deficit' ? 'text-negative' : 'text-brand'}`}>
                  {settlementType === 'surplus' && `${t('reconciliation.surplus')}: `}
                  {settlementType === 'deficit' && `${t('reconciliation.deficit')}: `}
                  {settlementType === 'exact' && `${t('reconciliation.exactMatch')}: `}
                  {Math.abs(netSettlement).toLocaleString()} THB
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
              {t('expense.previous')}
            </button>
            <button onClick={() => setStep(3)} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('expense.next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Settlement Summary */}
          <div className={`rounded-lg border p-5 ${settlementType === 'surplus' ? 'bg-positive/5 border-positive/20' : settlementType === 'deficit' ? 'bg-negative/5 border-negative/20' : 'bg-brand/5 border-brand/20'}`}>
            <h2 className="text-sm font-semibold text-text-primary mb-3">{t('reconciliation.settlementSummary')}</h2>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-text-secondary">{t('reconciliation.advanceRef')}:</span>
              <span className="font-medium">{selectedAdvance?.docNumber || editRecord?.advanceDocNumber}</span>
              <span className="text-text-secondary">{t('reconciliation.advanceAmount')}:</span>
              <span className="text-right font-mono font-medium"><AmountDisplay amount={advanceAmount} /></span>
              <span className="text-text-secondary">{t('reconciliation.totalExpenses')}:</span>
              <span className="text-right font-mono font-medium"><AmountDisplay amount={totalExpenses} /></span>
              <span className="text-text-secondary font-semibold border-t border-border pt-2">{t('reconciliation.settlement')}:</span>
              <span className={`text-right font-mono font-bold border-t border-border pt-2 ${settlementType === 'surplus' ? 'text-positive' : settlementType === 'deficit' ? 'text-negative' : 'text-brand'}`}>
                {netSettlement < 0 ? '-' : netSettlement > 0 ? '+' : ''}{Math.abs(netSettlement).toLocaleString()} THB
              </span>
            </div>
            {settlementType === 'surplus' && (
              <div className="mt-3 p-2 bg-positive/10 rounded text-xs text-positive font-medium">
                {t('reconciliation.amountToReturn')}: {Math.abs(netSettlement).toLocaleString()} THB
              </div>
            )}
            {settlementType === 'deficit' && (
              <div className="mt-3 p-2 bg-negative/10 rounded text-xs text-negative font-medium">
                {t('reconciliation.reimbursementAmount')}: {netSettlement.toLocaleString()} THB
              </div>
            )}
          </div>

          {/* Expense Line Items Summary */}
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">{t('reconciliation.expenseItems')}</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">#</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('expense.expenseType')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.description')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('common.amount')}</th>
                  <th className="text-center text-xs font-semibold text-text-secondary py-2">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => {
                  const et = EXPENSE_TYPES.find((e) => e.id === item.expenseType);
                  return (
                    <tr key={idx} className="border-b border-border">
                      <td className="py-2 text-sm">{idx + 1}</td>
                      <td className="py-2 text-sm">{et ? (i18n.language === 'th' ? et.label.th : et.label.en) : item.expenseType}</td>
                      <td className="py-2 text-sm">{item.description}</td>
                      <td className="py-2 text-sm text-right font-mono">{item.amount.toLocaleString()}</td>
                      <td className="py-2 text-sm text-center">{item.receipt ? 'Yes' : 'No'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
              {t('expense.previous')}
            </button>
            <div className="flex gap-3">
              <button onClick={() => navigate('/reconciliation')} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
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
        </div>
      )}
    </div>
  );
}
