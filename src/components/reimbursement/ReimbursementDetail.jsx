import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSAP } from '../../context/SAPContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import ApprovalTimeline from '../common/ApprovalTimeline.jsx';
import Modal from '../common/Modal.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES, DEPARTMENTS, TRAVEL_TYPES } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function ReimbursementDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecordById, dispatch } = useData();
  const { currentUser, currentRole } = useAuth();
  const { postToSAP } = useSAP();
  const { addToast } = useToast();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [posting, setPosting] = useState(false);

  const record = getRecordById('reimbursement', id);

  if (!record) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-secondary">Record not found</p></div>;
  }

  const employee = USERS.find((u) => u.id === record.employeeId);
  const company = COMPANIES.find((c) => c.id === record.companyId);
  const dept = DEPARTMENTS.find((d) => d.id === record.department);
  const travelType = TRAVEL_TYPES.find((tt) => tt.id === record.transportationType);

  const getName = (user) => {
    if (!user) return '-';
    return i18n.language === 'th' ? `${user.firstName} ${user.lastName}` : `${user.firstNameEn} ${user.lastNameEn}`;
  };

  const companyName = company ? (i18n.language === 'th' ? company.name.th : company.name.en) : '-';
  const deptName = dept ? (i18n.language === 'th' ? dept.name.th : dept.name.en) : '-';
  const travelTypeName = travelType ? (i18n.language === 'th' ? travelType.label.th : travelType.label.en) : '-';

  // Permission checks
  const isOwner = record.employeeId === currentUser?.id;
  const canEndTrip = isOwner && record.status === 'tripApproved';
  const canRecordExpenses = isOwner && (record.status === 'tripEnded' || record.status === 'tripApproved');
  const canApproveTrip = currentRole === 'manager' && record.status === 'pendingApproval';
  const canHRReview = currentRole === 'employee' && record.status === 'expenseSubmitted'; // simplified — HR role not separate
  const canManagerApproveExpenses = currentRole === 'manager' && record.status === 'hrReviewed';
  const canAccountingVerify = currentRole === 'accounting' && record.status === 'paymentGenerated';
  const canPostSAP = currentRole === 'accounting' && record.status === 'accountingVerified';

  const addApproval = (action, comment, newStatus) => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'reimbursement', id, approval: { userId: currentUser.id, action, date: now, comment } });
    dispatch({ type: 'UPDATE_STATUS', module: 'reimbursement', id, status: newStatus });
  };

  const handleApproveTrip = () => {
    addApproval('tripApproved', 'Trip approved', 'tripApproved');
    addToast(t('toast.tripApproved', `Trip ${record.docNumber} approved`), 'success');
  };

  const handleReject = () => {
    addApproval('rejected', rejectComment, 'rejected');
    addToast(t('toast.reimbursementRejected', `${record.docNumber} rejected`), 'error');
    setRejectModalOpen(false);
    setRejectComment('');
  };

  const handleEndTrip = () => {
    addApproval('tripEnded', 'Trip completed', 'tripEnded');
    addToast(t('toast.tripEnded', `Trip ${record.docNumber} marked as ended`), 'success');
  };

  const handleHRReview = () => {
    addApproval('hrReviewed', 'HR review completed', 'hrReviewed');
    addToast(t('toast.hrReviewed', `${record.docNumber} HR reviewed`), 'success');
  };

  const handleManagerApproveExpenses = () => {
    addApproval('managerApproved', 'Expenses approved', 'managerApproved');
    // Auto-generate payment request
    const payId = `pay-reimb-${Date.now()}`;
    const payDocNumber = `PAY-REIMB-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    dispatch({
      type: 'ADD_RECORD', module: 'payment',
      record: {
        id: payId, docNumber: payDocNumber, requesterId: record.employeeId, companyId: record.companyId,
        paymentDate: new Date().toISOString().split('T')[0], currency: 'THB', paymentMethod: 'transfer',
        documentType: 'KZ', paymentRequestType: 'reimbursement',
        payee: getName(employee), payeeBankId: null, payeeBankAccount: null,
        paymentDetails: `Reimbursement for ${record.docNumber} - ${record.destination}`,
        lineItems: [{ wbsCostCenter: record.costCenter, description: `Trip reimbursement: ${record.destination}`, amount: record.totalAmount, additions: [] }],
        totalNet: record.totalAmount, memoFiles: [], otherFiles: [],
        approvals: [{ userId: currentUser.id, action: 'approved', date: new Date().toISOString(), comment: 'Auto-generated from reimbursement approval' }],
        status: 'approved', sapDocNumber: null,
      },
    });
    dispatch({ type: 'UPDATE_RECORD', module: 'reimbursement', id, updates: { generatedPaymentId: payId, status: 'paymentGenerated' } });
    addToast(t('toast.paymentGenerated', `Payment ${payDocNumber} auto-generated`), 'success');
  };

  const handleAccountingVerify = () => {
    addApproval('accountingVerified', 'Verified by accounting', 'accountingVerified');
    addToast(t('toast.accountingVerified', `${record.docNumber} verified`), 'success');
  };

  const handlePostSAP = async () => {
    setPosting(true);
    const result = await postToSAP('reimbursement', id, { ...record });
    dispatch({ type: 'UPDATE_STATUS', module: 'reimbursement', id, status: 'posted' });
    dispatch({ type: 'ADD_APPROVAL', module: 'reimbursement', id, approval: { userId: currentUser.id, action: 'posted', date: new Date().toISOString(), comment: `SAP Doc: ${result.documentNumber}` } });
    setPosting(false);
    addToast(`SAP Document ${result.documentNumber} posted`, 'success');
  };

  const fellowNames = (record.fellowTravelers || []).map((uid) => getName(USERS.find((u) => u.id === uid))).join(', ') || '-';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/reimbursement')} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{record.docNumber}</h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{record.destination}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEndTrip && (
            <button onClick={handleEndTrip} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('reimbursement.endTrip', 'End Trip')}
            </button>
          )}
          {canRecordExpenses && (
            <button onClick={() => navigate(`/reimbursement/${id}/expenses`)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
              <Pencil size={14} /> {t('reimbursement.recordExpenses', 'Record Expenses')}
            </button>
          )}
          {canApproveTrip && (
            <>
              <button onClick={handleApproveTrip} className="px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors">{t('common.approve')}</button>
              <button onClick={() => setRejectModalOpen(true)} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90 transition-colors">{t('common.reject')}</button>
            </>
          )}
          {canHRReview && (
            <button onClick={handleHRReview} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('reimbursement.hrReview', 'HR Review')}
            </button>
          )}
          {canManagerApproveExpenses && (
            <button onClick={handleManagerApproveExpenses} className="px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors">
              {t('reimbursement.approveExpenses', 'Approve Expenses')}
            </button>
          )}
          {canAccountingVerify && (
            <button onClick={handleAccountingVerify} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              {t('reimbursement.verify', 'Verify')}
            </button>
          )}
          {canPostSAP && (
            <button onClick={handlePostSAP} disabled={posting} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50">
              <FileText size={14} />
              {posting ? t('common.postingSAP') : t('common.postToSAP')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Trip Info */}
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.tripDetails', 'Trip Details')}</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div><span className="text-text-secondary">{t('reimbursement.employee', 'Employee')}:</span> <span className="font-medium ml-1">{getName(employee)}</span></div>
              <div><span className="text-text-secondary">{t('advance.company')}:</span> <span className="font-medium ml-1">{companyName}</span></div>
              <div><span className="text-text-secondary">{t('advance.department')}:</span> <span className="font-medium ml-1">{deptName}</span></div>
              <div><span className="text-text-secondary">{t('reimbursement.destination', 'Destination')}:</span> <span className="font-medium ml-1">{record.destination}</span></div>
              <div><span className="text-text-secondary">{t('reimbursement.province', 'Province')}:</span> <span className="font-medium ml-1">{record.province || '-'}</span></div>
              <div><span className="text-text-secondary">{t('reimbursement.country', 'Country')}:</span> <span className="font-medium ml-1">{record.country}</span></div>
              <div><span className="text-text-secondary">{t('reimbursement.transportationType', 'Transportation')}:</span> <span className="font-medium ml-1">{travelTypeName}</span></div>
              <div><span className="text-text-secondary">{t('reimbursement.costCenter', 'Cost Center')}:</span> <span className="font-medium ml-1 font-mono">{record.costCenter || '-'}</span></div>
              <div><span className="text-text-secondary">{t('reimbursement.departureDate', 'Departure')}:</span> <span className="font-medium ml-1">{formatDate(record.departureDate, i18n.language)}</span></div>
              <div><span className="text-text-secondary">{t('reimbursement.returnDate', 'Return')}:</span> <span className="font-medium ml-1">{formatDate(record.returnDate, i18n.language)}</span></div>
              <div className="col-span-2"><span className="text-text-secondary">{t('reimbursement.departureFrom', 'From')}:</span> <span className="font-medium ml-1">{record.departureFrom}</span> → <span className="font-medium">{record.departureTo}</span></div>
              <div className="col-span-2"><span className="text-text-secondary">{t('reimbursement.objective', 'Objective')}:</span> <span className="font-medium ml-1">{record.objective}</span></div>
              <div className="col-span-2"><span className="text-text-secondary">{t('reimbursement.fellowTravelers', 'Fellow Travelers')}:</span> <span className="font-medium ml-1">{fellowNames}</span></div>
              {record.remark && <div className="col-span-2"><span className="text-text-secondary">{t('reimbursement.remark', 'Remark')}:</span> <span className="font-medium ml-1">{record.remark}</span></div>}
            </div>
          </div>

          {/* Expenses Summary (if recorded) */}
          {record.totalAmount > 0 && (
            <div className="bg-bg-secondary rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reimbursement.expenseSummary', 'Expense Summary')}</h2>
              <div className="space-y-3 text-sm">
                {record.transportation && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-secondary">{t('reimbursement.transportationInfo', 'Transportation')}</span>
                    <span className="font-mono">{((record.transportation.fuelAmount || 0) + (record.transportation.tollAmount || 0) + (record.transportation.grabAmount || 0)).toLocaleString()}</span>
                  </div>
                )}
                {record.perdiem && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-secondary">{t('reimbursement.perdiem', 'Per Diem')} ({record.perdiem.meals || record.perdiem.days} {record.perdiem.meals ? t('reimbursement.meals', 'meals') : t('reimbursement.days', 'days')} x {record.perdiem.pricePerMeal || record.perdiem.ratePerDay})</span>
                    <span className="font-mono">{record.perdiem.total?.toLocaleString()}</span>
                  </div>
                )}
                {record.accommodation && (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-secondary">{t('reimbursement.accommodation', 'Accommodation')} ({record.accommodation.nights} {t('reimbursement.nights', 'nights')})</span>
                    <span className="font-mono">{record.accommodation.total?.toLocaleString()}</span>
                  </div>
                )}
                {record.tripExpenses?.length > 0 && record.tripExpenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-secondary">{exp.description}</span>
                    <span className="font-mono">{exp.amount?.toLocaleString()}</span>
                  </div>
                ))}
                {record.entertainmentExpenses?.length > 0 && record.entertainmentExpenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-secondary">{exp.description} ({exp.attendees} {t('reimbursement.attendees', 'pax')})</span>
                    <span className="font-mono">{exp.amount?.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-semibold">
                  <span>{t('common.total')}</span>
                  <AmountDisplay amount={record.totalAmount} className="font-bold" />
                </div>
              </div>
            </div>
          )}

          {/* Generated Payment Link */}
          {record.generatedPaymentId && (
            <div className="bg-bg-secondary rounded-lg border border-brand/20 p-5">
              <h2 className="text-sm font-semibold text-brand mb-2">{t('reimbursement.generatedPayment', 'Generated Payment')}</h2>
              <button onClick={() => navigate(`/payment/${record.generatedPaymentId}`)} className="text-sm text-brand hover:underline">
                {t('reimbursement.viewPayment', 'View Payment Request')} →
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Approval Timeline */}
        <div className="space-y-4">
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('approval.timeline')}</h2>
            <ApprovalTimeline approvals={record.approvals} />
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title={t('common.reject')}>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">{t('approval.comment')}</label>
          <textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-brand" placeholder={t('approval.addComment')} />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-primary transition-colors">{t('common.cancel')}</button>
            <button onClick={handleReject} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90 transition-colors" disabled={!rejectComment.trim()}>{t('common.reject')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
