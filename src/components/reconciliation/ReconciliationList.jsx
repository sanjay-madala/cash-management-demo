import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import DataTable from '../common/DataTable.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';

function getUserName(userId, lang) {
  const user = USERS.find((u) => u.id === userId);
  if (!user) return '—';
  return lang === 'th' ? `${user.firstName} ${user.lastName}` : `${user.firstNameEn} ${user.lastNameEn}`;
}

export default function ReconciliationList() {
  const { t, i18n } = useTranslation();
  const { state } = useData();
  const { currentRole } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');

  if (currentRole !== 'accounting') {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="bg-bg-secondary rounded-lg border border-border p-8 text-center max-w-md">
          <p className="text-sm text-text-secondary">{t('reconciliation.accountingOnly')}</p>
        </div>
      </div>
    );
  }

  // Build rows from clear advances (approved+) and disbursed advances
  const rows = useMemo(() => {
    const results = [];

    // From clear advances
    (state.clearAdvances || []).forEach((clr) => {
      const advance = state.advances.find((a) => a.id === clr.advanceId);
      if (!advance) return;
      results.push({
        id: clr.id,
        type: 'clearAdvance',
        docNumber: clr.advanceDocNumber,
        requesterId: clr.requesterId,
        requesterName: getUserName(clr.requesterId, i18n.language),
        payeeName: getUserName(advance.cashReceiverId, i18n.language),
        companyId: advance.companyId,
        advanceAmount: clr.advanceAmount,
        totalExpenses: clr.totalExpenses,
        settlement: clr.settlement * (clr.settlementType === 'deficit' ? -1 : 1),
        status: clr.status,
        date: clr.createdDate,
      });
    });

    // Also show disbursed advances without clear records
    state.advances.filter((a) => a.status === 'disbursed').forEach((adv) => {
      const hasClear = (state.clearAdvances || []).some((c) => c.advanceId === adv.id);
      if (!hasClear) {
        results.push({
          id: adv.id,
          type: 'advance',
          docNumber: adv.docNumber,
          requesterId: adv.requesterId,
          requesterName: getUserName(adv.requesterId, i18n.language),
          payeeName: getUserName(adv.cashReceiverId, i18n.language),
          companyId: adv.companyId,
          advanceAmount: adv.totalAmount,
          totalExpenses: 0,
          settlement: adv.totalAmount,
          status: 'disbursed',
          date: adv.documentDate,
        });
      }
    });

    return results;
  }, [state.advances, state.clearAdvances, i18n.language]);

  const filtered = useMemo(() => {
    let items = rows;
    if (companyFilter !== 'all') {
      items = items.filter((row) => row.companyId === companyFilter);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter((row) => row.docNumber?.toLowerCase().includes(term) || row.requesterName?.toLowerCase().includes(term));
    }
    return items;
  }, [rows, companyFilter, search]);

  const columns = [
    { key: 'docNumber', label: t('advance.docNumber'), render: (row) => <span className="font-medium text-brand">{row.docNumber}</span> },
    { key: 'requester', label: t('advance.requester'), render: (row) => row.requesterName },
    { key: 'payee', label: t('payment.payee', 'Payee'), render: (row) => row.payeeName },
    { key: 'advanceAmount', label: t('reconciliation.advanceAmount'), render: (row) => <AmountDisplay amount={row.advanceAmount} />, cellClassName: 'text-right' },
    { key: 'totalExpenses', label: t('reconciliation.totalExpenses'), render: (row) => <AmountDisplay amount={row.totalExpenses} />, cellClassName: 'text-right' },
    { key: 'status', label: t('common.status'), render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">{t('reconciliation.title')}</h1>
      </div>

      <div className="bg-bg-secondary rounded-lg border border-border p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('advance.company')}</label>
            <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="all">{t('common.all', 'All')}</option>
              {COMPANIES.map((c) => <option key={c.id} value={c.id}>{i18n.language === 'th' ? c.name.th : c.name.en} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('common.search')}</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Doc# or requester..." className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => {
          if (row.type === 'clearAdvance') {
            const clr = (state.clearAdvances || []).find((c) => c.id === row.id);
            if (clr) navigate(`/advance/${clr.advanceId}/clear/${clr.id}`);
          } else {
            navigate(`/reconciliation/${row.id}`);
          }
        }}
        emptyMessage={t('reconciliation.noAdvancesToReconcile')}
      />
    </div>
  );
}
