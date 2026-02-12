import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Check } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { COMPANIES, TRAVEL_TYPES, EXPENSE_TYPES, COST_CENTERS } from '../../data/constants.js';
import { generateId } from '../../utils/formatters.js';

const STEPS = ['step1Title', 'step2Title', 'step3Title'];

export default function ExpenseForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { dispatch, state } = useData();
  const { currentUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);

  const [step1, setStep1] = useState({
    company: currentUser?.company || 'comp-1',
    costCenter: 'CC1001',
    travelType: 'companyVehicle',
    travelDate: '',
    travelPurpose: '',
    companions: '',
    remarks: '',
  });

  const [travelExpenses, setTravelExpenses] = useState([
    { id: 1, expenseType: 'fuel', description: '', amount: 0, receipt: true },
  ]);

  const [otherExpenses, setOtherExpenses] = useState([
    { id: 1, expenseType: 'meals', description: '', amount: 0, receipt: true },
  ]);

  const handleStep1Change = (field, value) => setStep1((prev) => ({ ...prev, [field]: value }));

  const handleTravelExpChange = (index, field, value) => {
    setTravelExpenses((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'amount' ? (Number(value) || 0) : field === 'receipt' ? value : value } : item
    ));
  };

  const addTravelExpense = () => {
    setTravelExpenses((prev) => [...prev, { id: prev.length + 1, expenseType: 'fuel', description: '', amount: 0, receipt: true }]);
  };

  const removeTravelExpense = (index) => {
    if (travelExpenses.length > 1) setTravelExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOtherExpChange = (index, field, value) => {
    setOtherExpenses((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'amount' ? (Number(value) || 0) : field === 'receipt' ? value : value } : item
    ));
  };

  const addOtherExpense = () => {
    setOtherExpenses((prev) => [...prev, { id: prev.length + 1, expenseType: 'meals', description: '', amount: 0, receipt: true }]);
  };

  const removeOtherExpense = (index) => {
    if (otherExpenses.length > 1) setOtherExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  const allLineItems = [...travelExpenses, ...otherExpenses];
  const totalAmount = allLineItems.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = (asDraft) => {
    const docNum = `EXP-${String(state.expenses.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();
    const newRecord = {
      id: generateId(),
      docNumber: docNum,
      requesterId: currentUser?.id || 'user-03',
      requesterName: currentUser ? `${currentUser.firstNameEn} ${currentUser.lastNameEn}` : 'Unknown',
      department: currentUser?.department || 'dept-1',
      company: step1.company,
      travelType: step1.travelType,
      travelDate: step1.travelDate,
      travelPurpose: step1.travelPurpose,
      companions: step1.companions,
      createdDate: now.split('T')[0],
      status: asDraft ? 'draft' : 'pendingApproval',
      advanceId: null,
      advanceAmount: 0,
      lineItems: allLineItems,
      totalAmount,
      netSettlement: totalAmount,
      remarks: step1.remarks,
      approvals: asDraft ? [] : [{ userId: currentUser?.id || 'user-03', action: 'submitted', date: now, comment: '' }],
    };

    dispatch({ type: 'ADD_RECORD', module: 'expense', record: newRecord });
    navigate(`/expense/${newRecord.id}`);
  };

  const labelClass = 'block text-xs font-semibold text-text-secondary mb-1';
  const inputClass = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-secondary focus:outline-none focus:border-brand transition-colors';

  return (
    <div>
      <h1 className="text-xl font-bold text-text-primary mb-6">{t('expense.newExpense')}</h1>

      {/* Step Indicator */}
      <div className="flex items-center mb-6">
        {STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <button
              onClick={() => setCurrentStep(idx)}
              className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
                idx === currentStep ? 'bg-brand text-white' : idx < currentStep ? 'bg-positive text-white' : 'bg-bg-primary text-text-secondary border border-border'
              }`}
            >
              {idx < currentStep ? <Check size={14} /> : idx + 1}
            </button>
            <span className={`ml-2 text-sm ${idx === currentStep ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
              {t(`expense.${step}`)}
            </span>
            {idx < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-border mx-4" />}
          </div>
        ))}
      </div>

      {/* Step 1: Travel Approval */}
      {currentStep === 0 && (
        <div className="bg-bg-secondary rounded-lg border border-border p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('expense.step1Title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('advance.company')}</label>
              <select value={step1.company} onChange={(e) => handleStep1Change('company', e.target.value)} className={inputClass}>
                {COMPANIES.map((c) => <option key={c.id} value={c.id}>{i18n.language === 'th' ? c.name.th : c.name.en}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('pettyCash.costCenter')}</label>
              <select value={step1.costCenter} onChange={(e) => handleStep1Change('costCenter', e.target.value)} className={inputClass}>
                {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code} - {cc.description}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('expense.travelType')}</label>
              <div className="space-y-1.5 mt-1">
                {TRAVEL_TYPES.map((tt) => (
                  <label key={tt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="travelType"
                      value={tt.id}
                      checked={step1.travelType === tt.id}
                      onChange={() => handleStep1Change('travelType', tt.id)}
                      className="text-brand"
                    />
                    {i18n.language === 'th' ? tt.label.th : tt.label.en}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('expense.travelDate')}</label>
              <input type="date" value={step1.travelDate} onChange={(e) => handleStep1Change('travelDate', e.target.value)} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('expense.travelPurpose')}</label>
              <textarea value={step1.travelPurpose} onChange={(e) => handleStep1Change('travelPurpose', e.target.value)} rows={2} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('expense.companions')}</label>
              <input type="text" value={step1.companions} onChange={(e) => handleStep1Change('companions', e.target.value)} className={inputClass} placeholder="Name 1, Name 2" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('expense.remarks')}</label>
              <textarea value={step1.remarks} onChange={(e) => handleStep1Change('remarks', e.target.value)} rows={2} className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Travel Expenses */}
      {currentStep === 1 && (
        <div className="bg-bg-secondary rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('expense.step2Title')}</h2>
            <button onClick={addTravelExpense} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
              <Plus size={14} /> Add
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">#</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">{t('expense.expenseType')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2 min-w-[180px]">{t('advance.description')}</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('common.amount')}</th>
                <th className="text-center text-xs font-semibold text-text-secondary py-2 px-2">Receipt</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {travelExpenses.map((item, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="py-2 px-2 text-sm">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <select value={item.expenseType} onChange={(e) => handleTravelExpChange(idx, 'expenseType', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded">
                      {EXPENSE_TYPES.filter((et) => ['toll', 'fuel', 'transportMileage', 'parking'].includes(et.id)).map((et) => (
                        <option key={et.id} value={et.id}>{i18n.language === 'th' ? et.label.th : et.label.en}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={item.description} onChange={(e) => handleTravelExpChange(idx, 'description', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" value={item.amount} onChange={(e) => handleTravelExpChange(idx, 'amount', e.target.value)} className="w-24 px-2 py-1 text-sm border border-border rounded text-right" />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input type="checkbox" checked={item.receipt} onChange={(e) => handleTravelExpChange(idx, 'receipt', e.target.checked)} />
                  </td>
                  <td className="py-2 px-2">
                    <button onClick={() => removeTravelExpense(idx)} className="p-1 text-negative hover:bg-negative/10 rounded" disabled={travelExpenses.length <= 1}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-right text-sm font-mono font-medium">
            Subtotal: {travelExpenses.reduce((s, i) => s + i.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      )}

      {/* Step 3: Other Expenses */}
      {currentStep === 2 && (
        <div className="bg-bg-secondary rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('expense.step3Title')}</h2>
            <button onClick={addOtherExpense} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
              <Plus size={14} /> Add
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">#</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2">{t('expense.expenseType')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2 px-2 min-w-[180px]">{t('advance.description')}</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2 px-2">{t('common.amount')}</th>
                <th className="text-center text-xs font-semibold text-text-secondary py-2 px-2">Receipt</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {otherExpenses.map((item, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="py-2 px-2 text-sm">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <select value={item.expenseType} onChange={(e) => handleOtherExpChange(idx, 'expenseType', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded">
                      {EXPENSE_TYPES.filter((et) => ['meals', 'accommodation', 'certification', 'communication'].includes(et.id)).map((et) => (
                        <option key={et.id} value={et.id}>{i18n.language === 'th' ? et.label.th : et.label.en}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <input type="text" value={item.description} onChange={(e) => handleOtherExpChange(idx, 'description', e.target.value)} className="w-full px-2 py-1 text-sm border border-border rounded" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" value={item.amount} onChange={(e) => handleOtherExpChange(idx, 'amount', e.target.value)} className="w-24 px-2 py-1 text-sm border border-border rounded text-right" />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input type="checkbox" checked={item.receipt} onChange={(e) => handleOtherExpChange(idx, 'receipt', e.target.checked)} />
                  </td>
                  <td className="py-2 px-2">
                    <button onClick={() => removeOtherExpense(idx)} className="p-1 text-negative hover:bg-negative/10 rounded" disabled={otherExpenses.length <= 1}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-right text-sm font-mono font-medium">
            Subtotal: {otherExpenses.reduce((s, i) => s + i.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>

          {/* Total Preview */}
          <div className="mt-6 p-4 bg-bg-primary rounded-lg">
            <div className="text-right text-base font-bold font-mono">
              {t('common.total')}: {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB
            </div>
          </div>
        </div>
      )}

      {/* Navigation & Actions */}
      <div className="flex justify-between mt-6">
        <div>
          {currentStep > 0 && (
            <button onClick={() => setCurrentStep((s) => s - 1)} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
              {t('expense.previous')}
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/expense')} className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:bg-bg-primary transition-colors">
            {t('common.cancel')}
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button onClick={() => setCurrentStep((s) => s + 1)} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('expense.next')}
            </button>
          ) : (
            <>
              <button onClick={() => handleSubmit(true)} className="px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
                {t('common.save')}
              </button>
              <button onClick={() => handleSubmit(false)} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
                {t('common.submit')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
