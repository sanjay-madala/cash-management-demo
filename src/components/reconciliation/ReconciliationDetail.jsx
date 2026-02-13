import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSAP } from '../../context/SAPContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import ApprovalTimeline from '../common/ApprovalTimeline.jsx';
import Modal from '../common/Modal.jsx';
import { EXPENSE_TYPES } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function ReconciliationDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecordById, dispatch } = useData();
  const { currentUser, currentRole } = useAuth();
  const { postToSAP, getSAPDocument } = useSAP();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState('');

  const record = getRecordById('reconciliation', id);
  const sapDoc = getSAPDocument(id);

  if (!record) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Record not found</p>
      </div>
    );
  }

  const canApprove = currentRole === 'manager' && record.status === 'pendingApproval';
  const canPostSAP = currentRole === 'accounting' && record.status === 'approved' && !sapDoc;
  const canEdit =
    currentRole === 'employee' &&
    record.requesterId === currentUser?.id &&
    (record.status === 'draft' || record.status === 'returned' || record.status === 'rejected');

  const handleApprove = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'reconciliation', id, approval: { userId: currentUser.id, action: 'approved', date: now, comment: 'Approved' } });
    dispatch({ type: 'UPDATE_STATUS', module: 'reconciliation', id, status: 'approved' });
  };

  const handleReject = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'reconciliation', id, approval: { userId: currentUser.id, action: 'rejected', date: now, comment: rejectComment } });
    dispatch({ type: 'UPDATE_STATUS', module: 'reconciliation', id, status: 'rejected' });
    setRejectModalOpen(false);
    setRejectComment('');
  };

  const handlePostSAP = async () => {
    setPosting(true);
    setPostSuccess('');
    const result = await postToSAP('reconciliation', id, record);
    dispatch({ type: 'UPDATE_RECORD', module: 'reconciliation', id, updates: { sapDocNumber: result.documentNumber, status: 'cleared' } });
    // Also clear the linked advance
    if (record.advanceId) {
      dispatch({ type: 'UPDATE_STATUS', module: 'advance', id: record.advanceId, status: 'cleared' });
    }
    setPosting(false);
    setPostSuccess(`Document ${result.documentNumber} posted successfully. Advance ${record.advanceDocNumber} cleared.`);
  };

  const getExpenseLabel = (typeId) => {
    const et = EXPENSE_TYPES.find((e) => e.id === typeId);
    return et ? (i18n.language === 'th' ? et.label.th : et.label.en) : typeId;
  };

  const isSurplus = record.netSettlement < 0;
  const isDeficit = record.netSettlement > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/reconciliation')} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{record.docNumber}</h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {t('reconciliation.advanceRef')}: {record.advanceDocNumber}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/reconciliation/new?edit=${record.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors"
            >
              <Pencil size={14} /> {t('common.edit')}
            </button>
          )}
          {canApprove && (
            <>
              <button onClick={handleApprove} className="px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors">
                {t('common.approve')}
              </button>
              <button onClick={() => setRejectModalOpen(true)} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90 transition-colors">
                {t('common.reject')}
              </button>
            </>
          )}
          {canPostSAP && (
            <button onClick={handlePostSAP} disabled={posting} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50">
              <FileText size={14} />
              {posting ? t('common.postingSAP') : t('reconciliation.clearAdvance')}
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {postSuccess && (
        <div className="mb-4 p-3 bg-positive/10 border border-positive/20 rounded-lg text-sm text-positive font-medium">
          {postSuccess}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Settlement Summary Card */}
          <div className={`rounded-lg border p-5 ${isSurplus ? 'bg-positive/5 border-positive/20' : isDeficit ? 'bg-negative/5 border-negative/20' : 'bg-brand/5 border-brand/20'}`}>
            <h2 className="text-sm font-semibold text-text-primary mb-3">{t('reconciliation.settlementSummary')}</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.advanceAmount')}</div>
                <div className="text-lg font-bold font-mono"><AmountDisplay amount={record.advanceAmount} /></div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.totalExpenses')}</div>
                <div className="text-lg font-bold font-mono"><AmountDisplay amount={record.totalExpenses} /></div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.settlement')}</div>
                <div className={`text-lg font-bold font-mono ${isSurplus ? 'text-positive' : isDeficit ? 'text-negative' : 'text-brand'}`}>
                  {record.netSettlement < 0 ? '-' : record.netSettlement > 0 ? '+' : ''}{Math.abs(record.netSettlement).toLocaleString()} THB
                </div>
              </div>
            </div>
            {isSurplus && (
              <div className="mt-3 p-2 bg-positive/10 rounded text-xs text-positive font-medium text-center">
                {t('reconciliation.amountToReturn')}: {Math.abs(record.netSettlement).toLocaleString()} THB
                {record.returnSlip && <span className="ml-2">| Slip: {record.returnSlip}</span>}
              </div>
            )}
            {isDeficit && (
              <div className="mt-3 p-2 bg-negative/10 rounded text-xs text-negative font-medium text-center">
                {t('reconciliation.reimbursementAmount')}: {record.netSettlement.toLocaleString()} THB
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div><span className="text-text-secondary">{t('advance.requester')}:</span> <span className="font-medium ml-1">{record.requesterName}</span></div>
              <div><span className="text-text-secondary">{t('reconciliation.advanceRef')}:</span> <span className="font-medium ml-1 font-mono">{record.advanceDocNumber}</span></div>
              <div><span className="text-text-secondary">{t('advance.purpose')}:</span> <span className="font-medium ml-1">{record.purpose}</span></div>
              <div><span className="text-text-secondary">{t('common.date')}:</span> <span className="font-medium ml-1">{formatDate(record.createdDate, i18n.language)}</span></div>
            </div>
          </div>

          {/* Expense Line Items */}
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reconciliation.expenseItems')}</h2>
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
                {record.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-2.5 text-sm">{idx + 1}</td>
                    <td className="py-2.5 text-sm">{getExpenseLabel(item.expenseType)}</td>
                    <td className="py-2.5 text-sm">{item.description}</td>
                    <td className="py-2.5 text-sm text-right font-mono">{item.amount?.toLocaleString()}</td>
                    <td className="py-2.5 text-sm text-center">{item.receipt ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right text-sm font-semibold py-3">{t('common.total')}</td>
                  <td className="text-right text-sm font-bold font-mono py-3"><AmountDisplay amount={record.totalExpenses} /></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SAP Document */}
          {(sapDoc || record.sapDocNumber) && (
            <div className="bg-bg-secondary rounded-lg border border-brand/20 p-5">
              <h2 className="text-sm font-semibold text-brand mb-3 flex items-center gap-2">
                <FileText size={16} /> SAP Document (Clearing)
              </h2>
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                <div><span className="text-text-secondary">Document No:</span> <span className="font-mono font-bold ml-1">{sapDoc?.documentNumber || record.sapDocNumber}</span></div>
                <div><span className="text-text-secondary">Doc Type:</span> <span className="font-medium ml-1">AB (Clearing)</span></div>
                {sapDoc && (
                  <>
                    <div><span className="text-text-secondary">Company Code:</span> <span className="font-medium ml-1">{sapDoc.companyCode}</span></div>
                    <div><span className="text-text-secondary">Fiscal Year:</span> <span className="font-medium ml-1">{sapDoc.fiscalYear}</span></div>
                    <div><span className="text-text-secondary">Posting Date:</span> <span className="font-medium ml-1">{sapDoc.postingDate}</span></div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Approval Timeline */}
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
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-brand"
            placeholder={t('approval.addComment')}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-bg-primary transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={handleReject} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90 transition-colors" disabled={!rejectComment.trim()}>
              {t('common.reject')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
