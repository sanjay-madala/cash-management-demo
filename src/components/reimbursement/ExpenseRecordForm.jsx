import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { COST_CENTERS } from '../../data/constants.js';
import { USERS } from '../../data/users.js';
import AttachmentList from '../common/AttachmentList.jsx';

const VEHICLE_TYPES = [
  { id: 'car', label: { en: 'Car', th: 'รถยนต์' } },
  { id: 'motorcycle', label: { en: 'Motorcycle', th: 'รถจักรยานยนต์' } },
];

const TRIP_EXPENSE_TYPES = [
  { id: 'toll', label: { en: 'Toll', th: 'ค่าทางด่วน' } },
  { id: 'parking', label: { en: 'Parking', th: 'ค่าที่จอดรถ' } },
  { id: 'fuel', label: { en: 'Fuel', th: 'ค่าน้ำมัน' } },
  { id: 'transport', label: { en: 'Transport', th: 'ค่าเดินทาง' } },
  { id: 'other', label: { en: 'Other', th: 'อื่นๆ' } },
];

export default function ExpenseRecordForm() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecordById, dispatch } = useData();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const record = getRecordById('reimbursement', id);

  // Determine if multi-day trip
  const isMultiDay = record ? (() => {
    const d1 = new Date(record.departureDate);
    const d2 = new Date(record.returnDate);
    return d2 > d1 && (d2 - d1) / (1000 * 60 * 60 * 24) >= 1;
  })() : false;

  const [transportation, setTransportation] = useState(record?.transportation || {
    type: record?.transportationType || '',
    startMiles: 0,
    endMiles: 0,
    startMilesAttachments: [],
    endMilesAttachments: [],
    vehicleType: 'car',
    fuelRate: 6.5,
    fuelAmount: 0,
    tollAmount: 0,
    grabAmount: 0,
    costCenter: record?.costCenter || 'CC1001',
    fellowTravelers: record?.fellowTravelers || [],
  });

  const [perdiem, setPerdiem] = useState(record?.perdiem || {
    meals: 3,
    pricePerMeal: 300,
    total: 900,
    costCenter: record?.costCenter || 'CC1001',
  });

  const [accommodation, setAccommodation] = useState(record?.accommodation || {
    employee: currentUser?.id || '',
    nights: 0,
    pricePerNight: 0,
    total: 0,
    costCenter: record?.costCenter || 'CC1001',
    reference: '',
    attachments: [],
  });

  const [tripExpenses, setTripExpenses] = useState(
    record?.tripExpenses?.length > 0
      ? record.tripExpenses
      : []
  );

  const [entertainmentExpenses, setEntertainmentExpenses] = useState(
    record?.entertainmentExpenses?.length > 0
      ? record.entertainmentExpenses
      : []
  );

  if (!record) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-secondary">Record not found</p></div>;
  }

  const updateTransport = (field, value) => {
    setTransportation((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'startMiles' || field === 'endMiles' || field === 'fuelRate') {
        const distance = Math.max(0, (next.endMiles || 0) - (next.startMiles || 0));
        next.fuelAmount = Math.round(distance * (next.fuelRate || 0));
      }
      return next;
    });
  };

  const updatePerdiem = (field, value) => {
    setPerdiem((prev) => {
      const next = { ...prev, [field]: value };
      next.total = (next.meals || 0) * (next.pricePerMeal || 0);
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

  const addTripExpense = () => setTripExpenses((prev) => [...prev, { type: 'other', costCenter: 'CC1001', description: '', amount: 0, reference: '', attachments: [] }]);
  const removeTripExpense = (idx) => setTripExpenses((prev) => prev.filter((_, i) => i !== idx));
  const updateTripExpense = (idx, field, value) => setTripExpenses((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const addEntExpense = () => setEntertainmentExpenses((prev) => [...prev, { requester: currentUser?.id || '', costCenter: 'CC1001', description: '', amount: 0, reference: '', attachments: [] }]);
  const removeEntExpense = (idx) => setEntertainmentExpenses((prev) => prev.filter((_, i) => i !== idx));
  const updateEntExpense = (idx, field, value) => setEntertainmentExpenses((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const transportDistance = Math.max(0, (transportation.endMiles || 0) - (transportation.startMiles || 0));
  const totalAmount =
    (transportation.fuelAmount || 0) + (transportation.tollAmount || 0) + (transportation.grabAmount || 0) +
    (isMultiDay ? (perdiem.total || 0) : 0) +
    (isMultiDay ? (accommodation.total || 0) : 0) +
    tripExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) +
    entertainmentExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const handleSubmit = () => {
    const now = new Date().toISOString();
    dispatch({
      type: 'UPDATE_RECORD', module: 'reimbursement', id,
      updates: {
        transportation,
        perdiem: isMultiDay ? perdiem : null,
        accommodation: isMultiDay && accommodation.nights > 0 ? accommodation : null,
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
  const labelCls = 'block text-xs font-medium text-text-secondary mb-1';

  const getUserName = (uid) => {
    const u = USERS.find((usr) => usr.id === uid);
    if (!u) return '-';
    return i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/reimbursement/${id}`)} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{t('reimbursement.recordExpenses', 'Record Expenses')}</h1>
          <p className="text-sm text-text-secondary">{record.docNumber} — {record.destination} {isMultiDay ? `(${t('reimbursement.multiDay', 'Multi-day')})` : `(${t('reimbursement.oneDay', '1-day')})`}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Transportation */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.transportationInfo', 'Transportation Information')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>{t('reimbursement.transportType', 'Type')}</label>
              <input type="text" value={transportation.type} readOnly className={`${inputCls} bg-bg-secondary`} />
            </div>
            <div>
              <label className={labelCls}>{t('reimbursement.vehicleType', 'Vehicle Type')}</label>
              <select value={transportation.vehicleType} onChange={(e) => updateTransport('vehicleType', e.target.value)} className={inputCls}>
                {VEHICLE_TYPES.map((vt) => <option key={vt.id} value={vt.id}>{i18n.language === 'th' ? vt.label.th : vt.label.en}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('reimbursement.fuelRate', 'Fuel Rate (THB/km)')}</label>
              <input type="number" step="0.5" value={transportation.fuelRate} onChange={(e) => updateTransport('fuelRate', Number(e.target.value))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelCls}>{t('reimbursement.startMiles', 'Start Miles')}</label>
              <input type="number" value={transportation.startMiles} onChange={(e) => updateTransport('startMiles', Number(e.target.value))} className={inputCls} />
              <div className="mt-1">
                <AttachmentList
                  files={transportation.startMilesAttachments || []}
                  onAdd={(f) => setTransportation((prev) => ({ ...prev, startMilesAttachments: [...(prev.startMilesAttachments || []), f] }))}
                  onRemove={(idx) => setTransportation((prev) => ({ ...prev, startMilesAttachments: prev.startMilesAttachments.filter((_, i) => i !== idx) }))}
                  label=""
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('reimbursement.endMiles', 'End Miles')}</label>
              <input type="number" value={transportation.endMiles} onChange={(e) => updateTransport('endMiles', Number(e.target.value))} className={inputCls} />
              <div className="mt-1">
                <AttachmentList
                  files={transportation.endMilesAttachments || []}
                  onAdd={(f) => setTransportation((prev) => ({ ...prev, endMilesAttachments: [...(prev.endMilesAttachments || []), f] }))}
                  onRemove={(idx) => setTransportation((prev) => ({ ...prev, endMilesAttachments: prev.endMilesAttachments.filter((_, i) => i !== idx) }))}
                  label=""
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('reimbursement.distance', 'Distance (km)')}</label>
              <input type="number" value={transportDistance} readOnly className={`${inputCls} bg-bg-secondary`} />
            </div>
            <div>
              <label className={labelCls}>{t('reimbursement.fuelAmount', 'Fuel Amount')}</label>
              <input type="number" value={transportation.fuelAmount} readOnly className={`${inputCls} bg-bg-secondary`} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>{t('reimbursement.tollAmount', 'Toll Amount')}</label>
              <input type="number" value={transportation.tollAmount} onChange={(e) => updateTransport('tollAmount', Number(e.target.value))} className={inputCls} />
            </div>
            {(record.transportationType === 'grabBusiness') && (
              <div>
                <label className={labelCls}>{t('reimbursement.grabAmount', 'Grab Amount')}</label>
                <input type="number" value={transportation.grabAmount} onChange={(e) => updateTransport('grabAmount', Number(e.target.value))} className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>{t('reimbursement.costCenter', 'Cost Center / WBS')}</label>
              <select value={transportation.costCenter} onChange={(e) => updateTransport('costCenter', e.target.value)} className={inputCls}>
                {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code} - {cc.description}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>{t('reimbursement.fellowTravelers', 'Fellow Travelers')}</label>
            <div className="flex flex-wrap gap-1.5">
              {(transportation.fellowTravelers || []).map((uid) => (
                <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 bg-brand/10 text-brand text-xs rounded-full">
                  {getUserName(uid)}
                  <button onClick={() => setTransportation((prev) => ({ ...prev, fellowTravelers: prev.fellowTravelers.filter((id) => id !== uid) }))} className="hover:text-negative">×</button>
                </span>
              ))}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !(transportation.fellowTravelers || []).includes(e.target.value)) {
                    setTransportation((prev) => ({ ...prev, fellowTravelers: [...(prev.fellowTravelers || []), e.target.value] }));
                  }
                }}
                className="px-2 py-1 text-xs border border-border rounded-lg bg-bg-primary"
              >
                <option value="">+ Add</option>
                {USERS.filter((u) => u.id !== record.employeeId && !(transportation.fellowTravelers || []).includes(u.id)).map((u) => (
                  <option key={u.id} value={u.id}>{i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`}</option>
                ))}
              </select>
            </div>
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
            <div key={idx} className="border border-border rounded-lg p-3 mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-secondary">#{idx + 1}</span>
                <button onClick={() => removeTripExpense(idx)} className="p-1 text-negative hover:bg-negative/10 rounded"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                <div>
                  <label className={labelCls}>{t('reimbursement.expenseType', 'Type')}</label>
                  <select value={exp.type || 'other'} onChange={(e) => updateTripExpense(idx, 'type', e.target.value)} className={inputCls}>
                    {TRIP_EXPENSE_TYPES.map((te) => <option key={te.id} value={te.id}>{i18n.language === 'th' ? te.label.th : te.label.en}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('reimbursement.costCenter', 'Cost Center')}</label>
                  <select value={exp.costCenter || 'CC1001'} onChange={(e) => updateTripExpense(idx, 'costCenter', e.target.value)} className={inputCls}>
                    {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('advance.description', 'Description')}</label>
                  <input type="text" value={exp.description} onChange={(e) => updateTripExpense(idx, 'description', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('common.amount')}</label>
                  <input type="number" value={exp.amount} onChange={(e) => updateTripExpense(idx, 'amount', Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('reimbursement.reference', 'Reference No. / Remark')}</label>
                  <input type="text" value={exp.reference || ''} onChange={(e) => updateTripExpense(idx, 'reference', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <AttachmentList
                    files={exp.attachments || []}
                    onAdd={(f) => updateTripExpense(idx, 'attachments', [...(exp.attachments || []), f])}
                    onRemove={(i) => updateTripExpense(idx, 'attachments', (exp.attachments || []).filter((_, j) => j !== i))}
                    label=""
                  />
                </div>
              </div>
            </div>
          ))}
          {tripExpenses.length === 0 && <p className="text-xs text-text-secondary">{t('common.noData')}</p>}
        </div>

        {/* Per Diem - only for multi-day trips */}
        {isMultiDay && (
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.perdiem', 'Per Diem')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>{t('reimbursement.meals', 'Meals')}</label>
                <input type="number" value={perdiem.meals} onChange={(e) => updatePerdiem('meals', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('reimbursement.pricePerMeal', 'Price / Meal (THB)')}</label>
                <input type="number" value={perdiem.pricePerMeal} onChange={(e) => updatePerdiem('pricePerMeal', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('common.total')}</label>
                <input type="number" value={perdiem.total} readOnly className={`${inputCls} bg-bg-secondary`} />
              </div>
              <div>
                <label className={labelCls}>{t('reimbursement.costCenter', 'Cost Center')}</label>
                <select value={perdiem.costCenter || 'CC1001'} onChange={(e) => updatePerdiem('costCenter', e.target.value)} className={inputCls}>
                  {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Accommodation - only for multi-day trips */}
        {isMultiDay && (
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.accommodation', 'Accommodation')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>{t('reimbursement.employee', 'Employee')}</label>
                <select value={accommodation.employee} onChange={(e) => updateAccommodation('employee', e.target.value)} className={inputCls}>
                  {USERS.map((u) => <option key={u.id} value={u.id}>{i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('reimbursement.nights', 'No. of Nights')}</label>
                <input type="number" value={accommodation.nights} onChange={(e) => updateAccommodation('nights', Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('reimbursement.pricePerNight', 'Price / Night (THB)')}</label>
                <input type="number" value={accommodation.pricePerNight} onChange={(e) => updateAccommodation('pricePerNight', Number(e.target.value))} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>{t('common.total')}</label>
                <input type="number" value={accommodation.total} readOnly className={`${inputCls} bg-bg-secondary`} />
              </div>
              <div>
                <label className={labelCls}>{t('reimbursement.costCenter', 'Cost Center')}</label>
                <select value={accommodation.costCenter || 'CC1001'} onChange={(e) => updateAccommodation('costCenter', e.target.value)} className={inputCls}>
                  {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('reimbursement.reference', 'Reference No. / Remark')}</label>
                <input type="text" value={accommodation.reference || ''} onChange={(e) => updateAccommodation('reference', e.target.value)} className={inputCls} />
              </div>
            </div>
            <AttachmentList
              files={accommodation.attachments || []}
              onAdd={(f) => setAccommodation((prev) => ({ ...prev, attachments: [...(prev.attachments || []), f] }))}
              onRemove={(idx) => setAccommodation((prev) => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
              label={t('reimbursement.hotelReceipts', 'E-memo / Hotel Receipts')}
            />
          </div>
        )}

        {/* Entertainment Expenses */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('reimbursement.entertainmentExpenses', 'Entertainment Expenses')}</h2>
            <button onClick={addEntExpense} className="flex items-center gap-1 text-xs text-brand hover:text-brand-hover">
              <Plus size={14} /> {t('common.new', 'Add')}
            </button>
          </div>
          {entertainmentExpenses.map((exp, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-secondary">#{idx + 1}</span>
                <button onClick={() => removeEntExpense(idx)} className="p-1 text-negative hover:bg-negative/10 rounded"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                <div>
                  <label className={labelCls}>{t('reimbursement.requester', 'Requester')}</label>
                  <select value={exp.requester || ''} onChange={(e) => updateEntExpense(idx, 'requester', e.target.value)} className={inputCls}>
                    {USERS.map((u) => <option key={u.id} value={u.id}>{i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('reimbursement.costCenter', 'Cost Center')}</label>
                  <select value={exp.costCenter || 'CC1001'} onChange={(e) => updateEntExpense(idx, 'costCenter', e.target.value)} className={inputCls}>
                    {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('advance.description', 'Description')}</label>
                  <input type="text" value={exp.description} onChange={(e) => updateEntExpense(idx, 'description', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('common.amount')}</label>
                  <input type="number" value={exp.amount} onChange={(e) => updateEntExpense(idx, 'amount', Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('reimbursement.reference', 'Reference No. / Remark')}</label>
                  <input type="text" value={exp.reference || ''} onChange={(e) => updateEntExpense(idx, 'reference', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <AttachmentList
                    files={exp.attachments || []}
                    onAdd={(f) => updateEntExpense(idx, 'attachments', [...(exp.attachments || []), f])}
                    onRemove={(i) => updateEntExpense(idx, 'attachments', (exp.attachments || []).filter((_, j) => j !== i))}
                    label={t('reimbursement.eMemoFile', 'E-memo File')}
                  />
                </div>
              </div>
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
