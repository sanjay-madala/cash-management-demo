import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSAP } from '../../context/SAPContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import ApprovalTimeline from '../common/ApprovalTimeline.jsx';
import Modal from '../common/Modal.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES, BANKS } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function PaymentDetail() {
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

  const record = getRecordById('payment', id);
  const sapDoc = getSAPDocument(id);

  if (!record) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-secondary">Record not found</p></div>;
  }

  const requester = USERS.find((u) => u.id === record.requesterId);
  const company = COMPANIES.find((c) => c.id === record.companyId);
  const bank = BANKS.find((b) => b.id === record.payeeBankId);

  const canApprove = currentRole === 'manager' && record.status === 'pendingApproval';
  const canDisburse = currentRole === 'accounting' && record.status === 'approved';
  const canPostSAP = currentRole === 'accounting' && (record.status === 'approved' || record.status === 'disbursed') && !sapDoc;

  const handleApprove = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'payment', id, approval: { userId: currentUser.id, action: 'approved', date: now, comment: 'Approved' } });
    dispatch({ type: 'UPDATE_STATUS', module: 'payment', id, status: 'approved' });
  };

  const handleReject = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'payment', id, approval: { userId: currentUser.id, action: 'rejected', date: now, comment: rejectComment } });
    dispatch({ type: 'UPDATE_STATUS', module: 'payment', id, status: 'rejected' });
    setRejectModalOpen(false);
    setRejectComment('');
  };

  const handleDisburse = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'payment', id, approval: { userId: currentUser.id, action: 'disbursed', date: now, comment: 'Disbursed' } });
    dispatch({ type: 'UPDATE_STATUS', module: 'payment', id, status: 'disbursed' });
  };

  const handlePostSAP = async () => {
    setPosting(true);
    setPostSuccess('');
    const result = await postToSAP('payment', id, { ...record, netPayment: record.totalNet });
    dispatch({ type: 'UPDATE_RECORD', module: 'payment', id, updates: { sapDocNumber: result.documentNumber } });
    setPosting(false);
    setPostSuccess(`Document ${result.documentNumber} posted successfully in Company Code ${result.companyCode}, Fiscal Year ${result.fiscalYear}`);
  };

  const requesterName = requester ? (i18n.language === 'th' ? `${requester.firstName} ${requester.lastName}` : `${requester.firstNameEn} ${requester.lastNameEn}`) : '-';
  const companyName = company ? (i18n.language === 'th' ? company.name.th : company.name.en) : '-';
  const bankName = bank ? (i18n.language === 'th' ? bank.name.th : bank.name.en) : '-';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/payment')} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{record.docNumber}</h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{record.paymentDetails}</p>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <>
              <button onClick={handleApprove} className="px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors">{t('common.approve')}</button>
              <button onClick={() => setRejectModalOpen(true)} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90 transition-colors">{t('common.reject')}</button>
            </>
          )}
          {canDisburse && (
            <button onClick={handleDisburse} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">Disburse</button>
          )}
          {canPostSAP && (
            <button onClick={handlePostSAP} disabled={posting} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50">
              <FileText size={14} />
              {posting ? t('common.postingSAP') : t('common.postToSAP')}
            </button>
          )}
        </div>
      </div>

      {postSuccess && (
        <div className="mb-4 p-3 bg-positive/10 border border-positive/20 rounded-lg text-sm text-positive font-medium">{postSuccess}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div><span className="text-text-secondary">{t('advance.requester')}:</span> <span className="font-medium ml-1">{requesterName}</span></div>
              <div><span className="text-text-secondary">{t('advance.company')}:</span> <span className="font-medium ml-1">{companyName}</span></div>
              <div><span className="text-text-secondary">{t('payment.payee')}:</span> <span className="font-medium ml-1">{record.payee}</span></div>
              <div><span className="text-text-secondary">{t('payment.paymentMethod')}:</span> <span className="font-medium ml-1 capitalize">{record.paymentMethod}</span></div>
              <div><span className="text-text-secondary">{t('payment.paymentDate')}:</span> <span className="font-medium ml-1">{formatDate(record.paymentDate, i18n.language)}</span></div>
              {bank && <div><span className="text-text-secondary">{t('payment.payeeBank')}:</span> <span className="font-medium ml-1">{bankName}</span></div>}
              {record.payeeBankAccount && <div><span className="text-text-secondary">{t('payment.bankAccount')}:</span> <span className="font-medium ml-1 font-mono">{record.payeeBankAccount}</span></div>}
            </div>
          </div>

          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('advance.lineItems')}</h2>
            {record.lineItems.map((item, idx) => (
              <div key={idx} className="border-b border-border py-3 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-text-secondary">{item.wbsCostCenter}</p>
                  </div>
                  <span className="text-sm font-mono">{item.amount?.toLocaleString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.additions?.map((add, addIdx) => (
                    <span key={addIdx} className="text-xs px-2 py-0.5 bg-bg-primary rounded">
                      {add.type.toUpperCase()} {add.rate}% = {add.amount?.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="pt-3 text-right">
              <span className="text-sm font-semibold">{t('payment.netPayment')}: </span>
              <AmountDisplay amount={record.totalNet} className="font-bold" />
            </div>
          </div>

          {(sapDoc || record.sapDocNumber) && (
            <div className="bg-bg-secondary rounded-lg border border-brand/20 p-5">
              <h2 className="text-sm font-semibold text-brand mb-3 flex items-center gap-2"><FileText size={16} /> SAP Document</h2>
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
        </div>

        <div className="space-y-4">
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('approval.timeline')}</h2>
            <ApprovalTimeline approvals={record.approvals} />
          </div>
          {record.concurrers?.length > 0 && (
            <div className="bg-bg-secondary rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-3">{t('payment.concurrers')}</h2>
              <div className="space-y-2">
                {record.concurrers.map((uid) => {
                  const u = USERS.find((usr) => usr.id === uid);
                  return u ? (
                    <div key={uid} className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-bold">{u.avatar}</div>
                      <span className="text-sm">{i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
