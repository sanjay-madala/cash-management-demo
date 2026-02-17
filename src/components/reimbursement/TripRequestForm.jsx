import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES, DEPARTMENTS, COST_CENTERS, TRAVEL_TYPES } from '../../data/constants.js';

export default function TripRequestForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { dispatch } = useData();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    employeeId: currentUser?.id || '',
    department: currentUser?.department || '',
    companyId: currentUser?.company || '',
    destination: '',
    province: '',
    country: 'Thailand',
    costCenter: '',
    transportationType: '',
    departureFrom: '',
    departureTo: '',
    departureDate: '',
    returnDate: '',
    objective: '',
    fellowTravelers: [],
    remark: '',
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const getName = (user) => {
    if (!user) return '-';
    return i18n.language === 'th' ? `${user.firstName} ${user.lastName}` : `${user.firstNameEn} ${user.lastNameEn}`;
  };

  const toggleTraveler = (userId) => {
    setForm((prev) => ({
      ...prev,
      fellowTravelers: prev.fellowTravelers.includes(userId)
        ? prev.fellowTravelers.filter((id) => id !== userId)
        : [...prev.fellowTravelers, userId],
    }));
  };

  const canSubmit = form.employeeId && form.destination && form.departureDate && form.returnDate && form.transportationType && form.objective;

  const handleSubmit = (asDraft) => {
    const id = `reimb-${Date.now()}`;
    const docNumber = `REIMB-2026-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const record = {
      id,
      docNumber,
      employeeId: form.employeeId,
      companyId: form.companyId,
      department: form.department,
      destination: form.destination,
      province: form.province,
      country: form.country,
      costCenter: form.costCenter,
      transportationType: form.transportationType,
      departureFrom: form.departureFrom,
      departureTo: form.departureTo,
      departureDate: form.departureDate,
      returnDate: form.returnDate,
      objective: form.objective,
      fellowTravelers: form.fellowTravelers,
      remark: form.remark,
      transportation: null,
      perdiem: null,
      accommodation: null,
      tripExpenses: [],
      entertainmentExpenses: [],
      totalAmount: 0,
      approvals: asDraft ? [] : [{ userId: currentUser.id, action: 'submitted', date: now, comment: 'Trip request submitted' }],
      status: asDraft ? 'draft' : 'pendingApproval',
      generatedPaymentId: null,
    };

    dispatch({ type: 'ADD_RECORD', module: 'reimbursement', record });
    addToast(asDraft ? t('toast.draftSaved', `Draft ${docNumber} saved`) : t('toast.tripSubmitted', `Trip request ${docNumber} submitted`), 'success');
    navigate(`/reimbursement/${id}`);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/reimbursement')} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">{t('reimbursement.newTrip', 'New Trip Request')}</h1>
      </div>

      <div className="space-y-4">
        {/* Employee & Company */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.employeeInfo', 'Employee Information')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.employee', 'Employee')}</label>
              <select value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} className={inputCls}>
                <option value="">--</option>
                {USERS.map((u) => <option key={u.id} value={u.id}>{getName(u)} ({u.position})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('advance.department', 'Department')}</label>
              <select value={form.department} onChange={(e) => set('department', e.target.value)} className={inputCls}>
                <option value="">--</option>
                {DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{i18n.language === 'th' ? d.name.th : d.name.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('advance.company', 'Company')}</label>
              <select value={form.companyId} onChange={(e) => set('companyId', e.target.value)} className={inputCls}>
                <option value="">--</option>
                {COMPANIES.map((c) => <option key={c.id} value={c.id}>{i18n.language === 'th' ? c.name.th : c.name.en} ({c.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.tripDetails', 'Trip Details')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.destination', 'Destination')} *</label>
              <input type="text" value={form.destination} onChange={(e) => set('destination', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.costCenter', 'Cost Center / WBS')}</label>
              <select value={form.costCenter} onChange={(e) => set('costCenter', e.target.value)} className={inputCls}>
                <option value="">--</option>
                {COST_CENTERS.map((cc) => <option key={cc.code} value={cc.code}>{cc.code} - {cc.description}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.province', 'Province')}</label>
              <input type="text" value={form.province} onChange={(e) => set('province', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.country', 'Country')}</label>
              <input type="text" value={form.country} onChange={(e) => set('country', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.transportationType', 'Transportation Type')} *</label>
              <select value={form.transportationType} onChange={(e) => set('transportationType', e.target.value)} className={inputCls}>
                <option value="">--</option>
                {TRAVEL_TYPES.map((tt) => <option key={tt.id} value={tt.id}>{i18n.language === 'th' ? tt.label.th : tt.label.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.departureFrom', 'Departure From')}</label>
              <input type="text" value={form.departureFrom} onChange={(e) => set('departureFrom', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.departureTo', 'Departure To')}</label>
              <input type="text" value={form.departureTo} onChange={(e) => set('departureTo', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.departureDate', 'Departure Date')} *</label>
              <input type="date" value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.returnDate', 'Return Date')} *</label>
              <input type="date" value={form.returnDate} onChange={(e) => set('returnDate', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.objective', 'Objective')} *</label>
            <textarea value={form.objective} onChange={(e) => set('objective', e.target.value)} rows={2} className={inputCls} />
          </div>
        </div>

        {/* Fellow Travelers */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.fellowTravelers', 'Fellow Travelers')}</h2>
          <div className="flex flex-wrap gap-2">
            {USERS.filter((u) => u.id !== form.employeeId).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleTraveler(u.id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  form.fellowTravelers.includes(u.id)
                    ? 'bg-brand text-white border-brand'
                    : 'bg-bg-primary text-text-secondary border-border hover:border-brand'
                }`}
              >
                {getName(u)}
              </button>
            ))}
          </div>
        </div>

        {/* Remark */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.remark', 'Remark')}</label>
          <textarea value={form.remark} onChange={(e) => set('remark', e.target.value)} rows={2} className={inputCls} />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/reimbursement')} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-primary transition-colors">
            {t('common.cancel')}
          </button>
          <button onClick={() => handleSubmit(true)} className="px-4 py-2 text-sm border border-brand text-brand rounded-lg hover:bg-brand/5 transition-colors">
            {t('payment.saveDraft', 'Save Draft')}
          </button>
          <button onClick={() => handleSubmit(false)} disabled={!canSubmit} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50">
            {t('common.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
