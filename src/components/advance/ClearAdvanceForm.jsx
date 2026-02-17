import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { MATERIAL_CODES } from '../../data/materialCodes.js';
import AmountDisplay from '../common/AmountDisplay.jsx';
import AttachmentList from '../common/AttachmentList.jsx';
import { generateId } from '../../utils/formatters.js';

const VAT_OPTIONS = [0, 7];
const WHT_OPTIONS = [0, 1, 2, 3, 5];

export default function ClearAdvanceForm() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecordById, dispatch } = useData();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const advance = getRecordById('advance', id);
  const [step, setStep] = useState(1);

  const [expenses, setExpenses] = useState([
    { id: generateId(), materialCode: '', description: '', amount: 0, vatRate: 7, whtRate: 0, attachments: [] },
  ]);

  if (!advance || advance.status !== 'disbursed') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">{t('common.noData')}</p>
      </div>
    );
  }

  const calcExpNet = (e) => e.amount + e.amount * (e.vatRate / 100) - e.amount * (e.whtRate / 100);
  const totalExpenses = expenses.reduce((sum, e) => sum + calcExpNet(e), 0);
  const settlement = advance.totalAmount - totalExpenses;
  const isSurplus = settlement > 0;
  const isDeficit = settlement < 0;

  const handleExpenseChange = (expId, field, value) => {
    setExpenses((prev) => prev.map((e) => {
      if (e.id !== expId) return e;
      if (field === 'materialCode') {
        const mat = MATERIAL_CODES.find((m) => m.code === value);
        if (mat) {
          return { ...e, materialCode: value, description: i18n.language === 'th' ? mat.description.th : mat.description.en, vatRate: mat.vatRate, whtRate: mat.whtRate };
        }
        return { ...e, materialCode: value };
      }
      return { ...e, [field]: field === 'description' ? value : Number(value) || 0 };
    }));
  };

  const addExpense = () => {
    setExpenses((prev) => [...prev, { id: generateId(), materialCode: '', description: '', amount: 0, vatRate: 7, whtRate: 0, attachments: [] }]);
  };

  const removeExpense = (expId) => {
    if (expenses.length > 1) setExpenses((prev) => prev.filter((e) => e.id !== expId));
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const clearRecord = {
      id: generateId(),
      advanceId: id,
      advanceDocNumber: advance.docNumber,
      requesterId: currentUser?.id,
      companyId: advance.companyId,
      status: 'submitted',
      expenses: expenses.map((e) => ({
        materialCode: e.materialCode,
        description: e.description,
        amount: e.amount,
        vatRate: e.vatRate,
        whtRate: e.whtRate,
        netAmount: calcExpNet(e),
        attachments: e.attachments,
      })),
      totalExpenses,
      advanceAmount: advance.totalAmount,
      settlement: Math.abs(settlement),
      settlementType: isSurplus ? 'surplus' : isDeficit ? 'deficit' : 'exact',
      bankSlip: '',
      approvals: [
        { userId: currentUser?.id, action: 'submitted', date: now, comment: 'Submitted clear advance' },
      ],
      createdDate: now,
    };

    dispatch({ type: 'ADD_RECORD', module: 'clearAdvances', record: clearRecord });
    addToast(t('toast.clearAdvanceSubmitted', 'Clear advance submitted successfully'), 'success');
    navigate(`/advance/${id}/clear/${clearRecord.id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/advance/${id}`)} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">
          {t('clearAdvance.title', 'Clear Advance')} - {advance.docNumber}
        </h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <button key={s} onClick={() => setStep(s)} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${step === s ? 'bg-brand text-white' : step > s ? 'bg-positive/10 text-positive' : 'bg-bg-primary text-text-secondary'}`}>
            {s}. {s === 1 ? t('clearAdvance.stepSummary', 'Summary') : s === 2 ? t('clearAdvance.stepExpenses', 'Expenses') : t('clearAdvance.stepReview', 'Review')}
          </button>
        ))}
      </div>

      {/* Step 1: Advance Summary */}
      {step === 1 && (
        <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-4">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reconciliation.advanceAmount')}</h2>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div><span className="text-text-secondary">Doc#:</span> <span className="font-medium ml-1">{advance.docNumber}</span></div>
            <div><span className="text-text-secondary">{t('advance.advanceType')}:</span> <span className="font-medium ml-1 capitalize">{advance.advanceType}</span></div>
            <div><span className="text-text-secondary">{t('common.amount')}:</span> <span className="font-bold ml-1 text-lg font-mono"><AmountDisplay amount={advance.totalAmount} /></span></div>
            <div><span className="text-text-secondary">{t('advance.purpose')}:</span> <span className="font-medium ml-1">{advance.purpose}</span></div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('expense.next', 'Next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Record Expenses */}
      {step === 2 && (
        <div className="bg-bg-secondary rounded-lg border border-border p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('reconciliation.expenseItems')}</h2>
            <button onClick={addExpense} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
              <Plus size={14} /> Add Expense
            </button>
          </div>
          <div className="space-y-4">
            {expenses.map((exp) => (
              <div key={exp.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-text-secondary">Expense</span>
                  <button onClick={() => removeExpense(exp.id)} className="p-1 text-negative hover:bg-negative/10 rounded" disabled={expenses.length <= 1}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{t('advance.materialCode', 'Material Code')}</label>
                    <select value={exp.materialCode} onChange={(e) => handleExpenseChange(exp.id, 'materialCode', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded-lg">
                      <option value="">--</option>
                      {MATERIAL_CODES.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{t('advance.description')}</label>
                    <input type="text" value={exp.description} onChange={(e) => handleExpenseChange(exp.id, 'description', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{t('common.amount')}</label>
                    <input type="number" value={exp.amount} onChange={(e) => handleExpenseChange(exp.id, 'amount', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded-lg text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">VAT %</label>
                    <select value={exp.vatRate} onChange={(e) => handleExpenseChange(exp.id, 'vatRate', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded-lg">
                      {VAT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">WHT %</label>
                    <select value={exp.whtRate} onChange={(e) => handleExpenseChange(exp.id, 'whtRate', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded-lg">
                      {WHT_OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <AttachmentList
                    files={exp.attachments}
                    onAdd={(name) => setExpenses((prev) => prev.map((e) => e.id === exp.id ? { ...e, attachments: [...e.attachments, name] } : e))}
                    onRemove={(idx) => setExpenses((prev) => prev.map((e) => e.id === exp.id ? { ...e, attachments: e.attachments.filter((_, i) => i !== idx) } : e))}
                    label=""
                  />
                  <span className="text-sm font-mono font-medium">Net: {calcExpNet(exp).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-text-primary border border-border rounded-lg hover:bg-bg-primary">
              {t('expense.previous', 'Previous')}
            </button>
            <button onClick={() => setStep(3)} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('expense.next', 'Next')}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Settlement */}
      {step === 3 && (
        <div className="space-y-4">
          <div className={`rounded-lg border p-5 ${isSurplus ? 'bg-positive/5 border-positive/20' : isDeficit ? 'bg-negative/5 border-negative/20' : 'bg-brand/5 border-brand/20'}`}>
            <h2 className="text-sm font-semibold text-text-primary mb-3">{t('reconciliation.settlementSummary')}</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.advanceAmount')}</div>
                <div className="text-lg font-bold font-mono"><AmountDisplay amount={advance.totalAmount} /></div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.totalExpenses')}</div>
                <div className="text-lg font-bold font-mono"><AmountDisplay amount={totalExpenses} /></div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.settlement')}</div>
                <div className={`text-lg font-bold font-mono ${isSurplus ? 'text-positive' : isDeficit ? 'text-negative' : 'text-brand'}`}>
                  {isSurplus ? '+' : isDeficit ? '-' : ''}{Math.abs(settlement).toLocaleString()} THB
                </div>
              </div>
            </div>
            {isSurplus && (
              <div className="mt-3 p-2 bg-positive/10 rounded text-xs text-positive font-medium text-center">
                {t('reconciliation.amountToReturn')}: {settlement.toLocaleString()} THB
              </div>
            )}
            {isDeficit && (
              <div className="mt-3 p-2 bg-negative/10 rounded text-xs text-negative font-medium text-center">
                {t('reconciliation.reimbursementAmount')}: {Math.abs(settlement).toLocaleString()} THB
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-text-primary border border-border rounded-lg hover:bg-bg-primary">
              {t('expense.previous', 'Previous')}
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('common.submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
