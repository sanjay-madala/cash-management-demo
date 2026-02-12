import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import DataTable from '../common/DataTable.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import SearchFilter from '../common/SearchFilter.jsx';
import { USERS } from '../../data/users.js';
import { formatDate } from '../../utils/formatters.js';
import { filterBySearch, filterByStatus } from '../../utils/helpers.js';

const ALL_STATUSES = ['draft', 'pendingApproval', 'approved', 'rejected', 'returned', 'disbursed', 'cleared'];

export default function ExpenseList() {
  const { t, i18n } = useTranslation();
  const { state } = useData();
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let items = state.expenses;
    items = filterByStatus(items, statusFilter);
    items = filterBySearch(items, search, ['docNumber', 'travelPurpose', 'requesterName']);
    return items;
  }, [state.expenses, search, statusFilter]);

  const columns = [
    { key: 'docNumber', label: t('advance.docNumber'), render: (row) => <span className="font-medium text-brand">{row.docNumber}</span> },
    { key: 'requesterName', label: t('advance.requester') },
    { key: 'travelPurpose', label: t('expense.travelPurpose'), render: (row) => <span className="truncate max-w-[200px] block">{row.travelPurpose}</span> },
    { key: 'travelType', label: t('expense.travelType'), render: (row) => t(`expense.${row.travelType}`, { defaultValue: row.travelType }) },
    { key: 'totalAmount', label: t('common.amount'), render: (row) => <AmountDisplay amount={row.totalAmount} />, cellClassName: 'text-right' },
    { key: 'createdDate', label: t('common.date'), render: (row) => formatDate(row.createdDate, i18n.language) },
    { key: 'status', label: t('common.status'), render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">{t('expense.title')}</h1>
        {currentRole === 'employee' && (
          <button onClick={() => navigate('/expense/new')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
            <Plus size={16} /> {t('expense.newExpense')}
          </button>
        )}
      </div>

      <SearchFilter searchTerm={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusChange={setStatusFilter} statuses={ALL_STATUSES} />
      <DataTable columns={columns} data={filtered} onRowClick={(row) => navigate(`/expense/${row.id}`)} />
    </div>
  );
}
