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
import { COMPANIES } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function PettyCashDetail() {
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

  const record = getRecordById('petty-cash', id);
  const sapDoc = getSAPDocument(id);

  if (!record) {
    return <div className="flex items-center justify-center h-64"><p className="text-text-secondary">Record not found</p></div>;
  }

  const company = COMPANIES.find((c) => c.id === record.company);
  const canApprove = currentRole === 'manager' && record.status === 'pendingApproval';
  const canPostSAP = currentRole === 'accounting' && record.status === 'approved' && !sapDoc;
  const canEdit =
    currentRole === 'employee' &&
    record.requesterId === currentUser?.id &&
    (record.status === 'draft' || record.status === 'returned' || record.status === 'rejected');

  const handleApprove = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'pettyCash', id, approval: { userId: currentUser.id, action: 'approved', date: now, comment: 'Approved' } });
    dispatch({ type: 'UPDATE_STATUS', module: 'pettyCash', id, status: 'approved' });
  };

  const handleReject = () => {
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_APPROVAL', module: 'pettyCash', id, approval: { userId: currentUser.id, action: 'rejected', date: now, comment: rejectComment } });
    dispatch({ type: 'UPDATE_STATUS', module: 'pettyCash', id, status: 'rejected' });
    setRejectModalOpen(false);
    setRejectComment('');
  };

  const handlePostSAP = async () => {
    setPosting(true);
    setPostSuccess('');
    const result = await postToSAP('pettyCash', id, record);
    setPosting(false);
    setPostSuccess(`Document ${result.documentNumber} posted successfully in Company Code ${result.companyCode}, Fiscal Year ${result.fiscalYear}`);
  };

  const companyName = company ? (i18n.language === 'th' ? company.name.th : company.name.en) : '-';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/petty-cash')} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{record.docNumber}</h1>
            <StatusBadge status={record.status} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{record.vendorName} - {record.payTo}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => navigate(`/petty-cash/new?edit=${record.id}`)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors"
            >
              <Pencil size={14} /> {t('common.edit')}
            </button>
          )}
          {canApprove && (
            <>
              <button onClick={handleApprove} className="px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90 transition-colors">{t('common.approve')}</button>
              <button onClick={() => setRejectModalOpen(true)} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90 transition-colors">{t('common.reject')}</button>
            </>
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
              <div><span className="text-text-secondary">{t('advance.requester')}:</span> <span className="font-medium ml-1">{record.requesterName}</span></div>
              <div><span className="text-text-secondary">{t('pettyCash.companyCode')}:</span> <span className="font-medium ml-1">{companyName}</span></div>
              <div><span className="text-text-secondary">{t('pettyCash.vendor')}:</span> <span className="font-medium ml-1">{record.vendorName}</span></div>
              <div><span className="text-text-secondary">{t('pettyCash.payTo')}:</span> <span className="font-medium ml-1">{record.payTo}</span></div>
              <div><span className="text-text-secondary">{t('pettyCash.documentDate')}:</span> <span className="font-medium ml-1">{formatDate(record.documentDate, i18n.language)}</span></div>
              <div><span className="text-text-secondary">{t('pettyCash.postingDate')}:</span> <span className="font-medium ml-1">{formatDate(record.postingDate, i18n.language)}</span></div>
              <div><span className="text-text-secondary">{t('pettyCash.businessPlace')}:</span> <span className="font-medium ml-1">{record.businessPlace}</span></div>
              <div><span className="text-text-secondary">{t('pettyCash.reference')}:</span> <span className="font-medium ml-1 font-mono">{record.reference}</span></div>
            </div>
          </div>

          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('pettyCash.lineItems')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('pettyCash.seq')}</th>
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.description')}</th>
                    <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('common.amount')}</th>
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('pettyCash.costCenter')}</th>
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('pettyCash.profitCenter')}</th>
                    <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('pettyCash.text')}</th>
                  </tr>
                </thead>
                <tbody>
                  {record.lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-border">
                      <td className="py-2.5 text-sm">{idx + 1}</td>
                      <td className="py-2.5 text-sm">{item.description}</td>
                      <td className="py-2.5 text-sm text-right font-mono">{item.amount?.toLocaleString()}</td>
                      <td className="py-2.5 text-sm font-mono">{item.costCenter}</td>
                      <td className="py-2.5 text-sm font-mono">{item.profitCenter}</td>
                      <td className="py-2.5 text-sm">{item.text}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="text-right text-sm font-semibold py-3">{t('common.total')}</td>
                    <td className="text-right text-sm font-bold font-mono py-3"><AmountDisplay amount={record.totalAmount} /></td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {(sapDoc) && (
            <div className="bg-bg-secondary rounded-lg border border-brand/20 p-5">
              <h2 className="text-sm font-semibold text-brand mb-3 flex items-center gap-2"><FileText size={16} /> SAP Document</h2>
              <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
                <div><span className="text-text-secondary">Document No:</span> <span className="font-mono font-bold ml-1">{sapDoc.documentNumber}</span></div>
                <div><span className="text-text-secondary">Company Code:</span> <span className="font-medium ml-1">{sapDoc.companyCode}</span></div>
                <div><span className="text-text-secondary">Fiscal Year:</span> <span className="font-medium ml-1">{sapDoc.fiscalYear}</span></div>
                <div><span className="text-text-secondary">Posting Date:</span> <span className="font-medium ml-1">{sapDoc.postingDate}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('approval.timeline')}</h2>
            <ApprovalTimeline approvals={record.approvals} />
          </div>
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
