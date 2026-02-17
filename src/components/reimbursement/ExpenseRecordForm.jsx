import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import AttachmentList from '../common/AttachmentList.jsx';

export default function ExpenseRecordForm() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecordById, dispatch } = useData();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const record = getRecordById('reimbursement', id);

  const [transportation, setTransportation] = useState(record?.transportation || {
    miles: 0, vehicleType: record?.transportationType || '', fuelRate: 6.5, fuelAmount: 0, tollAmount: 0, grabAmount: 0,
  });

  const [perdiem, setPerdiem] = useState(record?.perdiem || { days: 1, ratePerDay: 800, total: 800 });

  const [accommodation, setAccommodation] = useState(record?.accommodation || { nights: 0, pricePerNight: 0, total: 0, attachments: [] });

  const [tripExpenses, setTripExpenses] = useState(record?.tripExpenses?.length > 0 ? record.tripExpenses : []);

  const [entertainmentExpenses, setEntertainmentExpenses] = useState(record?.entertainmentExpenses?.length > 0 ? record.entertainmentExpenses : []);

  if (!record) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-secondary">Record not found</p></div>;
  }

  const updateTransport = (field, value) => {
    setTransportation((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'miles' || field === 'fuelRate') {
        next.fuelAmount = Math.round((next.miles || 0) * (next.fuelRate || 0));
      }
      return next;
    });
  };

  const updatePerdiem = (field, value) => {
    setPerdiem((prev) => {
      const next = { ...prev, [field]: value };
      next.total = (next.days || 0) * (next.ratePerDay || 0);
      return next;
    });
  };

  const updateAccommodation = (field, value) => {
    setAccommodation((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'nights' || field === 'pricePerNight') {
        next.total = (next.nights || 0) * (next.pricePerNight || 0);
      }
      return next;
    });
  };

  const addTripExpense = () => setTripExpenses((prev) => [...prev, { description: '', amount: 0, attachments: [] }]);
  const removeTripExpense = (idx) => setTripExpenses((prev) => prev.filter((_, i) => i !== idx));
  const updateTripExpense = (idx, field, value) => setTripExpenses((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const addEntExpense = () => setEntertainmentExpenses((prev) => [...prev, { description: '', amount: 0, attendees: 0, attachments: [] }]);
  const removeEntExpense = (idx) => setEntertainmentExpenses((prev) => prev.filter((_, i) => i !== idx));
  const updateEntExpense = (idx, field, value) => setEntertainmentExpenses((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const totalAmount =
    (transportation.fuelAmount || 0) + (transportation.tollAmount || 0) + (transportation.grabAmount || 0) +
    (perdiem.total || 0) +
    (accommodation.total || 0) +
    tripExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) +
    entertainmentExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleSubmit = () => {
    const now = new Date().toISOString();
    dispatch({
      type: 'UPDATE_RECORD', module: 'reimbursement', id,
      updates: {
        transportation,
        perdiem,
        accommodation: accommodation.nights > 0 ? accommodation : null,
        tripExpenses,
        entertainmentExpenses,
        totalAmount,
        status: 'expenseSubmitted',
        approvals: [
          ...(record.approvals || []),
          { userId: currentUser.id, action: 'expenseSubmitted', date: now, comment: 'Expenses recorded and submitted' },
        ],
      },
    });
    addToast(t('toast.expensesSubmitted', `Expenses submitted for ${record.docNumber}`), 'success');
    navigate(`/reimbursement/${id}`);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/reimbursement/${id}`)} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t('reimbursement.recordExpenses', 'Record Expenses')}</h1>
          <p className="text-sm text-text-secondary">{record.docNumber} — {record.destination}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Transportation */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.transportationInfo', 'Transportation')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.miles', 'Distance (km)')}</label>
              <input type="number" value={transportation.miles} onChange={(e) => updateTransport('miles', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.fuelRate', 'Fuel Rate (THB/km)')}</label>
              <input type="number" step="0.5" value={transportation.fuelRate} onChange={(e) => updateTransport('fuelRate', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.fuelAmount', 'Fuel Amount')}</label>
              <input type="number" value={transportation.fuelAmount} readOnly className={`${inputCls} bg-bg-secondary`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.tollAmount', 'Toll Amount')}</label>
              <input type="number" value={transportation.tollAmount} onChange={(e) => updateTransport('tollAmount', Number(e.target.value))} className={inputCls} />
            </div>
            {(record.transportationType === 'grabBusiness') && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.grabAmount', 'Grab Amount')}</label>
                <input type="number" value={transportation.grabAmount} onChange={(e) => updateTransport('grabAmount', Number(e.target.value))} className={inputCls} />
              </div>
            )}
          </div>
        </div>

        {/* Per Diem */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.perdiem', 'Per Diem')}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.days', 'Days')}</label>
              <input type="number" value={perdiem.days} onChange={(e) => updatePerdiem('days', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.ratePerDay', 'Rate / Day (THB)')}</label>
              <input type="number" value={perdiem.ratePerDay} onChange={(e) => updatePerdiem('ratePerDay', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('common.total')}</label>
              <input type="number" value={perdiem.total} readOnly className={`${inputCls} bg-bg-secondary`} />
            </div>
          </div>
        </div>

        {/* Accommodation */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.accommodation', 'Accommodation')}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.nights', 'Nights')}</label>
              <input type="number" value={accommodation.nights} onChange={(e) => updateAccommodation('nights', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.pricePerNight', 'Price / Night (THB)')}</label>
              <input type="number" value={accommodation.pricePerNight} onChange={(e) => updateAccommodation('pricePerNight', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('common.total')}</label>
              <input type="number" value={accommodation.total} readOnly className={`${inputCls} bg-bg-secondary`} />
            </div>
          </div>
          <div className="mt-3">
            <AttachmentList
              files={accommodation.attachments || []}
              onAdd={(f) => setAccommodation((prev) => ({ ...prev, attachments: [...(prev.attachments || []), f] }))}
              onRemove={(idx) => setAccommodation((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
              label={t('reimbursement.hotelReceipts', 'Hotel Receipts')}
            />
          </div>
        </div>

        {/* Trip Expenses */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('reimbursement.tripExpenses', 'Trip Expenses')}</h2>
            <button onClick={addTripExpense} className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover">
              <Plus size={14} /> {t('common.new', 'Add')}
            </button>
          </div>
          {tripExpenses.map((exp, idx) => (
            <div key={idx} className="flex gap-3 items-start mb-3 pb-3 border-b border-border last:border-0">
              <div className="flex-1">
                <input type="text" value={exp.description} onChange={(e) => updateTripExpense(idx, 'description', e.target.value)} placeholder={t('advance.description', 'Description')} className={inputCls} />
              </div>
              <div className="w-32">
                <input type="number" value={exp.amount} onChange={(e) => updateTripExpense(idx, 'amount', Number(e.target.value))} placeholder={t('common.amount')} className={inputCls} />
              </div>
              <button onClick={() => removeTripExpense(idx)} className="p-2 text-negative hover:bg-negative/10 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {tripExpenses.length === 0 && <p className="text-xs text-text-secondary">{t('common.noData')}</p>}
        </div>

        {/* Entertainment Expenses */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('reimbursement.entertainmentExpenses', 'Entertainment Expenses')}</h2>
            <button onClick={addEntExpense} className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover">
              <Plus size={14} /> {t('common.new', 'Add')}
            </button>
          </div>
          {entertainmentExpenses.map((exp, idx) => (
            <div key={idx} className="flex gap-3 items-start mb-3 pb-3 border-b border-border last:border-0">
              <div className="flex-1">
                <input type="text" value={exp.description} onChange={(e) => updateEntExpense(idx, 'description', e.target.value)} placeholder={t('advance.description', 'Description')} className={inputCls} />
              </div>
              <div className="w-24">
                <input type="number" value={exp.attendees} onChange={(e) => updateEntExpense(idx, 'attendees', Number(e.target.value))} placeholder="Attendees" className={inputCls} />
              </div>
              <div className="w-32">
                <input type="number" value={exp.amount} onChange={(e) => updateEntExpense(idx, 'amount', Number(e.target.value))} placeholder={t('common.amount')} className={inputCls} />
              </div>
              <button onClick={() => removeEntExpense(idx)} className="p-2 text-negative hover:bg-negative/10 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {entertainmentExpenses.length === 0 && <p className="text-xs text-text-secondary">{t('common.noData')}</p>}
        </div>

        {/* Total */}
        <div className="bg-bg-secondary rounded-lg border border-brand/20 p-5 text-right">
          <span className="text-sm font-semibold">{t('common.total')}: </span>
          <span className="text-lg font-bold font-mono">{totalAmount.toLocaleString()} THB</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={() => navigate(`/reimbursement/${id}`)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-primary transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
            {t('reimbursement.submitExpenses', 'Submit Expenses')}
          </button>
        </div>
      </div>
    </div>
  );
}
