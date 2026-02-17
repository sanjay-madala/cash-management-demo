import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil, CheckCircle } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSAP } from '../../context/SAPContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import ApprovalTimeline from '../common/ApprovalTimeline.jsx';
import AttachmentList from '../common/AttachmentList.jsx';
import Modal from '../common/Modal.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES, BANKS } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function AdvanceDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, getRecordById, dispatch } = useData();
  const { currentUser, currentRole } = useAuth();
  const { postToSAP, getSAPDocument } = useSAP();
  const { addToast } = useToast();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [posting, setPosting] = useState(false);

  const record = getRecordById('advance', id);
  const sapDoc = getSAPDocument(id);
  const clearAdvances = (state.clearAdvances || []).filter((c) => c.advanceId === id);

  if (!record) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Record not found</p>
      </div>
    );
  }

  const requester = USERS.find((u) => u.id === record.requesterId);
  const advanceRequester = USERS.find((u) => u.id === record.advanceRequesterId);
  const cashReceiver = USERS.find((u) => u.id === record.cashReceiverId);
  const cashHolder = USERS.find((u) => u.id === record.cashHolderId);
  const company = COMPANIES.find((c) => c.id === record.companyId);
  const bank = BANKS.find((b) => b.id === record.bankId);

  const approvalCount = (record.approvals || []).filter((a) => a.action === 'approved').length;
  const requiredApprovals = record.requiredApprovals || 1;

  const canApprove = currentRole === 'manager' && record.status === 'pendingApproval';
  const canAccountingReject = currentRole === 'accounting' && (record.status === 'approved' || record.status === 'pendingApproval');
  const canDisburse = currentRole === 'accounting' && record.status === 'approved';
  const canPostSAP = currentRole === 'accounting' && (record.status === 'approved' || record.status === 'disbursed') && !sapDoc;
  const canEdit =
    currentRole === 'employee' &&
    record.requesterId === currentUser?.id &&
    (record.status === 'draft' || record.status === 'returned' || record.status === 'rejected');
  const canConfirmReceipt =
    currentRole === 'employee' &&
    record.status === 'disbursed' &&
    record.cashReceiverId === currentUser?.id &&
    !(record.approvals || []).some((a) => a.action === 'received');
  const canClearAdvance =
    currentRole === 'employee' &&
    record.status === 'disbursed';

  const handleApprove = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'advance', id, approval: { userId: currentUser.id, action: 'approved', date: now, comment: 'Approved' } });
    if (approvalCount + 1 >= requiredApprovals) {
      dispatch({ type: 'UPDATE_STATUS', module: 'advance', id, status: 'approved' });
    }
    addToast(t('toast.advanceApproved', `Advance ${record.docNumber} approved`), 'success');
  };

  const handleReject = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'advance', id, approval: { userId: currentUser.id, action: 'rejected', date: now, comment: rejectComment } });
    if (currentRole === 'accounting') {
      dispatch({ type: 'UPDATE_STATUS', module: 'advance', id, status: 'pendingApproval' });
    } else {
      dispatch({ type: 'UPDATE_STATUS', module: 'advance', id, status: 'rejected' });
    }
    addToast(t('toast.advanceRejected', `Advance ${record.docNumber} rejected`), 'error');
    setRejectModalOpen(false);
    setRejectComment('');
  };

  const handleDisburse = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'advance', id, approval: { userId: currentUser.id, action: 'disbursed', date: now, comment: 'Disbursed' } });
    dispatch({ type: 'UPDATE_STATUS', module: 'advance', id, status: 'disbursed' });
    addToast(t('toast.advanceDisbursed', `Advance ${record.docNumber} disbursed`), 'success');
  };

  const handleConfirmReceipt = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'advance', id, approval: { userId: currentUser.id, action: 'received', date: now, comment: 'Cash received' } });
    addToast(t('toast.cashReceived', 'Cash receipt confirmed'), 'success');
  };

  const handlePostSAP = async () => {
    setPosting(true);
    const result = await postToSAP('advance', id, record);
    dispatch({ type: 'UPDATE_RECORD', module: 'advance', id, updates: { sapDocNumber: result.documentNumber } });
    setPosting(false);
    addToast(`SAP Document ${result.documentNumber} posted successfully`, 'success');
  };

  const getName = (user) => {
    if (!user) return '-';
    return i18n.language === 'th' ? `${user.firstName} ${user.lastName}` : `${user.firstNameEn} ${user.lastNameEn}`;
  };

  const companyName = company ? (i18n.language === 'th' ? company.name.th : company.name.en) : '-';
  const bankName = bank ? (i18n.language === 'th' ? bank.name.th : bank.name.en) : '-';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/advance')} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{record.docNumber}</h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{record.purpose}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <button onClick={() => navigate(`/advance/new?edit=${record.id}`)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors">
              <Pencil size={14} /> {t('common.edit')}
            </button>
          )}
          {canClearAdvance && (
            <button onClick={() => navigate(`/advance/${id}/clear`)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors">
              {t('reconciliation.clearAdvance', 'Clear Advance')}
            </button>
          )}
          {canConfirmReceipt && (
            <button onClick={handleConfirmReceipt} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors">
              <CheckCircle size={14} /> {t('advance.confirmReceipt')}
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
          {canAccountingReject && !canApprove && (
            <button onClick={() => setRejectModalOpen(true)} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90 transition-colors">
              {t('common.reject')}
            </button>
          )}
          {canDisburse && (
            <button onClick={handleDisburse} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              Disburse
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
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div><span className="text-text-secondary">{t('advance.requester')}:</span> <span className="font-medium ml-1">{getName(requester)}</span></div>
              {advanceRequester && <div><span className="text-text-secondary">{t('advance.advanceRequester', 'Advance Requester')}:</span> <span className="font-medium ml-1">{getName(advanceRequester)}</span></div>}
              <div><span className="text-text-secondary">{t('advance.company')}:</span> <span className="font-medium ml-1">{companyName}</span></div>
              {record.branch && <div><span className="text-text-secondary">{t('advance.branch')}:</span> <span className="font-medium ml-1">{record.branch}</span></div>}
              <div><span className="text-text-secondary">{t('advance.advanceType')}:</span> <span className="font-medium ml-1 capitalize">{record.advanceType}</span></div>
              <div><span className="text-text-secondary">{t('advance.requestDate')}:</span> <span className="font-medium ml-1">{formatDate(record.documentDate, i18n.language)}</span></div>
              <div><span className="text-text-secondary">{t('advance.requiredDate')}:</span> <span className="font-medium ml-1">{formatDate(record.requiredDate, i18n.language)}</span></div>
              {record.estimateUseDate && <div><span className="text-text-secondary">{t('advance.estimateUseDate', 'Estimate Use Date')}:</span> <span className="font-medium ml-1">{formatDate(record.estimateUseDate, i18n.language)}</span></div>}
              <div><span className="text-text-secondary">{t('advance.advanceReceiver')}:</span> <span className="font-medium ml-1">{getName(cashReceiver)}</span></div>
              <div><span className="text-text-secondary">{t('advance.advanceOwner')}:</span> <span className="font-medium ml-1">{getName(cashHolder)}</span></div>
              <div><span className="text-text-secondary">{t('advance.paymentMethod')}:</span> <span className="font-medium ml-1 capitalize">{record.paymentMethod}</span></div>
              {bank && <div><span className="text-text-secondary">{t('advance.bank')}:</span> <span className="font-medium ml-1">{bankName}</span></div>}
              {record.accountNumber && <div><span className="text-text-secondary">{t('advance.accountNumber')}:</span> <span className="font-medium ml-1 font-mono">{record.accountNumber}</span></div>}
              {record.whtCertificate && <div><span className="text-text-secondary">{t('advance.whtCertificate')}:</span> <span className="font-medium ml-1">{record.whtCertificate === 'immediately' ? t('advance.issueImmediately') : t('advance.issueLater')}</span></div>}
              {record.note && <div className="col-span-2"><span className="text-text-secondary">{t('advance.note')}:</span> <span className="font-medium ml-1">{record.note}</span></div>}
            </div>
            {record.attachments?.length > 0 && (
              <div className="mt-3">
                <AttachmentList files={record.attachments} readOnly label={t('advance.attachFile')} />
              </div>
            )}
            {/* Legacy single attachFile */}
            {!record.attachments?.length && record.attachFile && (
              <div className="mt-2"><span className="text-xs text-text-secondary">{t('advance.attachFile')}:</span> <span className="text-xs font-medium text-brand ml-1">{record.attachFile}</span></div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('advance.lineItems')}</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">#</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.materialCode', 'Mat. Code')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.description')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('common.amount')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('advance.vat')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('advance.wht')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('advance.netAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {record.lineItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-2.5 text-sm">{idx + 1}</td>
                    <td className="py-2.5 text-sm font-mono text-text-secondary">{item.materialCode || '-'}</td>
                    <td className="py-2.5 text-sm">{item.description}</td>
                    <td className="py-2.5 text-sm text-right font-mono">{item.amount?.toLocaleString()}</td>
                    <td className="py-2.5 text-sm text-right">{item.vatRate}%</td>
                    <td className="py-2.5 text-sm text-right">{item.whtRate}%</td>
                    <td className="py-2.5 text-sm text-right font-mono font-medium">{item.netAmount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="text-right text-sm font-semibold py-3">{t('common.total')}</td>
                  <td className="text-right text-sm font-bold font-mono py-3">
                    <AmountDisplay amount={record.totalAmount} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SAP Document */}
          {(sapDoc || record.sapDocNumber) && (
            <div className="bg-bg-secondary rounded-lg border border-brand/20 p-5">
              <h2 className="text-sm font-semibold text-brand mb-3 flex items-center gap-2">
                <FileText size={16} /> SAP Document
              </h2>
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                <div><span className="text-text-secondary">Document No:</span> <span className="font-mono font-bold ml-1">{sapDoc?.documentNumber || record.sapDocNumber}</span></div>
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

          {/* Clear Advances */}
          {clearAdvances.length > 0 && (
            <div className="bg-bg-secondary rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">{t('clearAdvance.list', 'Clear Advances')}</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.docNumber')}</th>
                    <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('reconciliation.totalExpenses')}</th>
                    <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('reconciliation.settlement')}</th>
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('common.status')}</th>
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {clearAdvances.map((clr) => (
                    <tr
                      key={clr.id}
                      className="border-b border-border hover:bg-bg-primary cursor-pointer transition-colors"
                      onClick={() => navigate(`/advance/${id}/clear/${clr.id}`)}
                    >
                      <td className="py-2.5 text-sm font-medium text-brand">{clr.advanceDocNumber}</td>
                      <td className="py-2.5 text-sm text-right font-mono"><AmountDisplay amount={clr.totalExpenses} /></td>
                      <td className="py-2.5 text-sm text-right font-mono">
                        <span className={clr.settlementType === 'surplus' ? 'text-positive' : clr.settlementType === 'deficit' ? 'text-negative' : ''}>
                          {clr.settlementType === 'surplus' ? '+' : clr.settlementType === 'deficit' ? '-' : ''}{clr.settlement?.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5"><StatusBadge status={clr.status} /></td>
                      <td className="py-2.5 text-sm text-text-secondary">{formatDate(clr.createdDate, i18n.language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
