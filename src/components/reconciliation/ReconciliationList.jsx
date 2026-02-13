import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import DataTable from '../common/DataTable.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import SearchFilter from '../common/SearchFilter.jsx';
import { filterBySearch, filterByStatus } from '../../utils/helpers.js';

const ALL_STATUSES = ['draft', 'pendingApproval', 'approved', 'cleared'];

export default function ReconciliationList() {
  const { t } = useTranslation();
  const { state } = useData();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let items = state.reconciliations;
    items = filterByStatus(items, statusFilter);
    items = filterBySearch(items, search, ['docNumber', 'advanceDocNumber', 'purpose', 'requesterName']);
    return items;
  }, [state.reconciliations, search, statusFilter]);

  const getDaysUncleared = (createdDate) => {
    const created = new Date(createdDate);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  };

  const columns = [
    {
      key: 'docNumber',
      label: t('advance.docNumber'),
      render: (row) => <span className="font-medium text-brand">{row.docNumber}</span>,
    },
    {
      key: 'advanceRef',
      label: t('reconciliation.advanceRef'),
      render: (row) => <span className="font-mono text-sm">{row.advanceDocNumber}</span>,
    },
    {
      key: 'requester',
      label: t('advance.requester'),
      render: (row) => row.requesterName,
    },
    {
      key: 'advanceAmount',
      label: t('reconciliation.advanceAmount'),
      render: (row) => <AmountDisplay amount={row.advanceAmount} />,
      cellClassName: 'text-right',
    },
    {
      key: 'totalExpenses',
      label: t('reconciliation.totalExpenses'),
      render: (row) => <AmountDisplay amount={row.totalExpenses} />,
      cellClassName: 'text-right',
    },
    {
      key: 'settlement',
      label: t('reconciliation.settlement'),
      render: (row) => {
        const isDeficit = row.netSettlement > 0;
        const isSurplus = row.netSettlement < 0;
        return (
          <span className={`font-mono font-semibold ${isSurplus ? 'text-positive' : isDeficit ? 'text-negative' : 'text-text-primary'}`}>
            {isSurplus ? '-' : isDeficit ? '+' : ''}{Math.abs(row.netSettlement).toLocaleString()} THB
          </span>
        );
      },
      cellClassName: 'text-right',
    },
    {
      key: 'overdue',
      label: '',
      render: (row) => {
        if (row.status === 'cleared' || row.status === 'draft') return null;
        const days = getDaysUncleared(row.createdDate);
        if (days > 14) {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-critical font-medium">
              <AlertTriangle size={12} /> {days}d
            </span>
          );
        }
        return null;
      },
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">{t('reconciliation.title')}</h1>
        {currentRole === 'employee' && (
          <button
            onClick={() => navigate('/reconciliation/new')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
          >
            <Plus size={16} /> {t('reconciliation.newReconciliation')}
          </button>
        )}
      </div>

      <SearchFilter
        searchTerm={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statuses={ALL_STATUSES}
      />
      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => navigate(`/reconciliation/${row.id}`)}
      />
    </div>
  );
}
