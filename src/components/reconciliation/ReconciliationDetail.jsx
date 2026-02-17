import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSAP } from '../../context/SAPContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function ReconciliationDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRecordById, dispatch } = useData();
  const { currentRole } = useAuth();
  const { postToSAP } = useSAP();
  const { addToast } = useToast();

  const [posting, setPosting] = useState(false);

  const advance = getRecordById('advance', id);

  if (!advance) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Advance record not found</p>
      </div>
    );
  }

  const requester = USERS.find((u) => u.id === advance.requesterId);
  const company = COMPANIES.find((c) => c.id === advance.companyId);

  const getName = (user) => {
    if (!user) return '-';
    return i18n.language === 'th' ? `${user.firstName} ${user.lastName}` : `${user.firstNameEn} ${user.lastNameEn}`;
  };

  const companyName = company ? (i18n.language === 'th' ? company.name.th : company.name.en) : '-';

  const canClearAdvance = currentRole === 'accounting' && advance.status === 'disbursed';

  const handleClearAdvance = async () => {
    setPosting(true);
    const result = await postToSAP('reconciliation', id, { advanceId: id, advanceAmount: advance.totalAmount });
    dispatch({ type: 'UPDATE_STATUS', module: 'advance', id, status: 'cleared' });
    setPosting(false);
    addToast(t('toast.advanceCleared', `Advance ${advance.docNumber} cleared. SAP Doc: ${result.documentNumber}`), 'success');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/reconciliation')} className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text-primary">{advance.docNumber}</h1>
            <StatusBadge status={advance.status} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{advance.purpose}</p>
        </div>
        <div className="flex gap-2">
          {canClearAdvance && (
            <button onClick={handleClearAdvance} disabled={posting} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50">
              <FileText size={14} />
              {posting ? t('common.postingSAP') : t('reconciliation.clearAdvance')}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Advance Summary */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('reconciliation.advanceAmount')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm">
            <div><span className="text-text-secondary">{t('advance.requester')}:</span> <span className="font-medium ml-1">{getName(requester)}</span></div>
            <div><span className="text-text-secondary">{t('advance.company')}:</span> <span className="font-medium ml-1">{companyName}</span></div>
            <div><span className="text-text-secondary">{t('advance.advanceType')}:</span> <span className="font-medium ml-1 capitalize">{advance.advanceType}</span></div>
            <div><span className="text-text-secondary">{t('advance.requestDate')}:</span> <span className="font-medium ml-1">{formatDate(advance.documentDate, i18n.language)}</span></div>
            <div><span className="text-text-secondary">{t('advance.requiredDate')}:</span> <span className="font-medium ml-1">{formatDate(advance.requiredDate, i18n.language)}</span></div>
            <div><span className="text-text-secondary">{t('common.amount')}:</span> <span className="font-bold ml-1 text-lg font-mono"><AmountDisplay amount={advance.totalAmount} /></span></div>
          </div>
        </div>

        {/* Line Items (read-only) */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">{t('advance.lineItems')}</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-text-secondary py-2">#</th>
                <th className="text-left text-xs font-semibold text-text-secondary py-2">{t('advance.description')}</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('common.amount')}</th>
                <th className="text-right text-xs font-semibold text-text-secondary py-2">{t('advance.netAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {advance.lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="py-2.5 text-sm">{idx + 1}</td>
                  <td className="py-2.5 text-sm">{item.description}</td>
                  <td className="py-2.5 text-sm text-right font-mono">{item.amount?.toLocaleString()}</td>
                  <td className="py-2.5 text-sm text-right font-mono font-medium">{item.netAmount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right text-sm font-semibold py-3">{t('common.total')}</td>
                <td className="text-right text-sm font-bold font-mono py-3"><AmountDisplay amount={advance.totalAmount} /></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
