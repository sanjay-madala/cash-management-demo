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

export default function ClearAdvanceDetail() {
  const { t } = useTranslation();
  const { id, clearId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useData();
  const { currentUser, currentRole } = useAuth();
  const { addToast } = useToast();

  const clearRecord = state.clearAdvances?.find((c) => c.id === clearId);

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
