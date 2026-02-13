import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import DataTable from '../common/DataTable.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import { USERS } from '../../data/users.js';
import { formatDate } from '../../utils/formatters.js';

const ADVANCE_TYPES = ['weekly', 'general', 'site', 'driver', 'specific'];

function getUserName(userId) {
  const user = USERS.find((u) => u.id === userId);
  if (!user) return '—';
  return `${user.firstNameEn} ${user.lastNameEn}`;
}

export default function ReconciliationList() {
  const { t, i18n } = useTranslation();
  const { state } = useData();
  const { currentRole } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Only accounting role can access reconciliation
  if (currentRole !== 'accounting') {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="bg-bg-secondary rounded-lg border border-border p-8 text-center max-w-md">
          <p className="text-sm text-text-secondary">
            {t('reconciliation.accountingOnly', 'Reconciliation is handled by Accounting department.')}
          </p>
        </div>
      </div>
    );
  }

  // Build rows from advances with disbursed or cleared status
  const rows = useMemo(() => {
    const eligibleAdvances = state.advances.filter(
      (adv) => adv.status === 'disbursed' || adv.status === 'cleared'
    );

    return eligibleAdvances.map((advance) => {
      const linkedExpenses = state.expenses.filter((e) => e.advanceId === advance.id);
      const totalExpenses = linkedExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
      const settlement = advance.totalAmount - totalExpenses;

      return {
        ...advance,
        employeeName: getUserName(advance.requesterId),
        totalExpenses,
        settlement,
        linkedExpenseCount: linkedExpenses.length,
      };
    });
  }, [state.advances, state.expenses]);

  // Apply filters
  const filtered = useMemo(() => {
    let items = rows;

    // Date range filter on documentDate
    if (dateFrom) {
      items = items.filter((row) => row.documentDate >= dateFrom);
    }
    if (dateTo) {
      items = items.filter((row) => row.documentDate <= dateTo);
    }

    // Advance type filter
    if (typeFilter !== 'all') {
      items = items.filter((row) => row.advanceType === typeFilter);
    }

    // Text search on docNumber and purpose
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(
        (row) =>
          (row.docNumber && row.docNumber.toLowerCase().includes(term)) ||
          (row.purpose && row.purpose.toLowerCase().includes(term))
      );
    }

    return items;
  }, [rows, dateFrom, dateTo, typeFilter, search]);

  const columns = [
    {
      key: 'docNumber',
      label: t('advance.docNumber'),
      render: (row) => (
        <span className="font-medium text-brand">{row.docNumber}</span>
      ),
    },
    {
      key: 'employee',
      label: t('advance.requester'),
      render: (row) => row.employeeName,
    },
    {
      key: 'advanceType',
      label: t('advance.advanceType'),
      render: (row) => t(`advance.${row.advanceType}`, row.advanceType),
    },
    {
      key: 'advanceAmount',
      label: t('reconciliation.advanceAmount'),
      render: (row) => <AmountDisplay amount={row.totalAmount} />,
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
        const isSurplus = row.settlement > 0;
        const isDeficit = row.settlement < 0;
        const colorClass = isSurplus
          ? 'text-positive'
          : isDeficit
            ? 'text-negative'
            : 'text-info';
        return (
          <span className={`font-mono font-semibold ${colorClass}`}>
            <AmountDisplay amount={row.settlement} />
          </span>
        );
      },
      cellClassName: 'text-right',
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
        <h1 className="text-xl font-bold text-text-primary">
          {t('reconciliation.title')}
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-bg-secondary rounded-lg border border-border p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('common.dateFrom', 'From')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('common.dateTo', 'To')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Advance Type */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('advance.advanceType')}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="all">{t('common.all', 'All')}</option>
              {ADVANCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`advance.${type}`, type)}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('common.search', 'Search')}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.searchPlaceholder', 'Doc# or purpose...')}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => navigate(`/reconciliation/${row.id}`)}
        emptyMessage={t('reconciliation.noAdvancesToReconcile', 'No advances pending reconciliation.')}
      />
    </div>
  );
}
