import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import ApprovalTimeline from '../common/ApprovalTimeline.jsx';
import AttachmentList from '../common/AttachmentList.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function ClearAdvanceDetail() {
  const { t, i18n } = useTranslation();
  const { id, clearId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, getRecordById } = useData();
  const { currentUser, currentRole } = useAuth();
  const { addToast } = useToast();

  const clearRecord = state.clearAdvances?.find((c) => c.id === clearId);
  const advance = getRecordById('advance', id);

  const getName = (userId) => {
    const user = USERS.find((u) => u.id === userId);
    if (!user) return '-';
    return i18n.language === 'th' ? `${user.firstName} ${user.lastName}` : `${user.firstNameEn} ${user.lastNameEn}`;
  };

  if (!clearRecord) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Clear advance record not found</p>
      </div>
    );
  }

  const canApprove = currentRole === 'manager' && clearRecord.status === 'submitted';
  const canValidate = currentRole === 'accounting' && clearRecord.status === 'approved';
  const canClear = currentRole === 'accounting' && clearRecord.status === 'validated';

  const handleAction = (action, newStatus) => {
    const now = new Date().toISOString();
    dispatch({
      type: 'UPDATE_RECORD',
      module: 'clearAdvances',
      id: clearId,
      updates: {
        status: newStatus,
        approvals: [...(clearRecord.approvals || []), { userId: currentUser.id, action, date: now, comment: action }],
      },
    });
    if (newStatus === 'cleared') {
      dispatch({ type: 'UPDATE_STATUS', module: 'advance', id, status: 'cleared' });
    }
    addToast(t(`toast.clearAdvance${action.charAt(0).toUpperCase() + action.slice(1)}`, `Clear advance ${action}`), 'success');
  };

  const handleReject = () => {
    const now = new Date().toISOString();
    dispatch({
      type: 'UPDATE_RECORD',
      module: 'clearAdvances',
      id: clearId,
      updates: {
        status: 'rejected',
        approvals: [...(clearRecord.approvals || []), { userId: currentUser.id, action: 'rejected', date: now, comment: 'Rejected' }],
      },
    });
    addToast(t('toast.clearAdvanceRejected', 'Clear advance rejected'), 'error');
  };

  const isSurplus = clearRecord.settlementType === 'surplus';
  const isDeficit = clearRecord.settlementType === 'deficit';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/advance/${id}`)} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{t('clearAdvance.title', 'Clear Advance')} - {clearRecord.advanceDocNumber}</h1>
            <StatusBadge status={clearRecord.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {canApprove && (
            <>
              <button onClick={() => handleAction('approved', 'approved')} className="px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90">{t('common.approve')}</button>
              <button onClick={handleReject} className="px-4 py-2 text-sm font-medium bg-negative text-white rounded-lg hover:bg-negative/90">{t('common.reject')}</button>
            </>
          )}
          {canValidate && (
            <button onClick={() => handleAction('validated', 'validated')} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover">
              {t('clearAdvance.validate', 'Validate')}
            </button>
          )}
          {canClear && (
            <button onClick={() => handleAction('cleared', 'cleared')} className="px-4 py-2 text-sm font-medium bg-positive text-white rounded-lg hover:bg-positive/90">
              {t('reconciliation.clearAdvance')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Advance Request Information */}
          {advance && (
            <div className="bg-bg-secondary rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">{t('clearAdvance.advanceInfo', 'Advance Request Information')}</h2>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div><span className="text-text-secondary">{t('advance.docNumber')}:</span> <span className="font-medium ml-1 text-brand">{advance.docNumber}</span></div>
                <div><span className="text-text-secondary">{t('advance.requester')}:</span> <span className="font-medium ml-1">{getName(advance.requesterId)}</span></div>
                <div><span className="text-text-secondary">{t('advance.company')}:</span> <span className="font-medium ml-1">{(() => { const c = COMPANIES.find((co) => co.id === advance.companyId); return c ? (i18n.language === 'th' ? c.name.th : c.name.en) : '-'; })()}</span></div>
                <div><span className="text-text-secondary">{t('advance.advanceType')}:</span> <span className="font-medium ml-1 capitalize">{advance.advanceType}</span></div>
                <div><span className="text-text-secondary">{t('advance.requestDate')}:</span> <span className="font-medium ml-1">{formatDate(advance.documentDate, i18n.language)}</span></div>
                <div><span className="text-text-secondary">{t('advance.requiredDate')}:</span> <span className="font-medium ml-1">{formatDate(advance.requiredDate, i18n.language)}</span></div>
                <div><span className="text-text-secondary">{t('advance.advanceReceiver')}:</span> <span className="font-medium ml-1">{getName(advance.cashReceiverId)}</span></div>
                <div><span className="text-text-secondary">{t('advance.paymentMethod')}:</span> <span className="font-medium ml-1 capitalize">{advance.paymentMethod}</span></div>
                <div className="col-span-2"><span className="text-text-secondary">{t('advance.purpose')}:</span> <span className="font-medium ml-1">{advance.purpose}</span></div>
                <div><span className="text-text-secondary">{t('common.amount')}:</span> <span className="font-bold ml-1 text-lg font-mono"><AmountDisplay amount={advance.totalAmount} /></span></div>
              </div>
            </div>
          )}

          {/* Expenses */}
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reconciliation.expenseItems')}</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">#</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.materialCode', 'Mat.')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.description')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('common.amount')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">VAT</th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">WHT</th>
                </tr>
              </thead>
              <tbody>
                {clearRecord.expenses?.map((exp, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-2.5 text-sm">{idx + 1}</td>
                    <td className="py-2.5 text-sm font-mono text-text-secondary">{exp.materialCode || '-'}</td>
                    <td className="py-2.5 text-sm">{exp.description}</td>
                    <td className="py-2.5 text-sm text-right font-mono">{exp.amount?.toLocaleString()}</td>
                    <td className="py-2.5 text-sm text-right">{exp.vatRate}%</td>
                    <td className="py-2.5 text-sm text-right">{exp.whtRate}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right text-sm font-semibold py-3">{t('common.total')}</td>
                  <td colSpan={3} className="text-right text-sm font-bold font-mono py-3">
                    <AmountDisplay amount={clearRecord.totalExpenses} />
                  </td>
                </tr>
              </tfoot>
            </table>
            {clearRecord.expenses?.some((e) => e.attachments?.length > 0) && (
              <div className="mt-3 space-y-2">
                {clearRecord.expenses.filter((e) => e.attachments?.length > 0).map((e, i) => (
                  <AttachmentList key={i} files={e.attachments} readOnly label={`${e.description}`} />
                ))}
              </div>
            )}
          </div>

          {/* Settlement */}
          <div className={`rounded-lg border p-5 ${isSurplus ? 'bg-positive/5 border-positive/20' : isDeficit ? 'bg-negative/5 border-negative/20' : 'bg-brand/5 border-brand/20'}`}>
            <h2 className="text-sm font-semibold text-text-primary mb-3">{t('reconciliation.settlementSummary')}</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.advanceAmount')}</div>
                <div className="text-lg font-bold font-mono"><AmountDisplay amount={clearRecord.advanceAmount} /></div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.totalExpenses')}</div>
                <div className="text-lg font-bold font-mono"><AmountDisplay amount={clearRecord.totalExpenses} /></div>
              </div>
              <div>
                <div className="text-xs text-text-secondary mb-1">{t('reconciliation.settlement')}</div>
                <div className={`text-lg font-bold font-mono ${isSurplus ? 'text-positive' : isDeficit ? 'text-negative' : 'text-brand'}`}>
                  {isSurplus ? '+' : isDeficit ? '-' : ''}{clearRecord.settlement?.toLocaleString()} THB
                </div>
              </div>
            </div>
            {/* Bank slip info for surplus */}
            {isSurplus && (clearRecord.transferRef || (clearRecord.bankSlip && Array.isArray(clearRecord.bankSlip) && clearRecord.bankSlip.length > 0)) && (
              <div className="mt-4 pt-3 border-t border-border">
                <h3 className="text-xs font-semibold text-text-secondary mb-2">{t('clearAdvance.bankTransferInfo', 'Bank Transfer Information')}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  {clearRecord.transferRef && <div><span className="text-text-secondary">{t('clearAdvance.transferRef', 'Ref')}:</span> <span className="font-medium ml-1 font-mono">{clearRecord.transferRef}</span></div>}
                  {clearRecord.transferDate && <div><span className="text-text-secondary">{t('clearAdvance.transferDate', 'Date')}:</span> <span className="font-medium ml-1">{formatDate(clearRecord.transferDate, i18n.language)}</span></div>}
                </div>
                {Array.isArray(clearRecord.bankSlip) && clearRecord.bankSlip.length > 0 && (
                  <AttachmentList files={clearRecord.bankSlip} readOnly label={t('clearAdvance.bankSlip', 'Bank Slip')} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Approval Timeline */}
        <div className="space-y-4">
          <div className="bg-bg-secondary rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('approval.timeline')}</h2>
            <ApprovalTimeline approvals={clearRecord.approvals} />
          </div>
        </div>
      </div>
    </div>
  );
}
