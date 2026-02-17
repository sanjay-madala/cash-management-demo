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

const ALL_STATUSES = ['draft', 'pendingApproval', 'tripApproved', 'tripEnded', 'expenseSubmitted', 'hrReviewed', 'managerApproved', 'paymentGenerated', 'accountingVerified', 'posted'];

export default function ReimbursementList() {
  const { t, i18n } = useTranslation();
  const { state } = useData();
  const { currentRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let items = state.reimbursements || [];
    if (currentRole === 'employee') {
      items = items.filter((r) => r.employeeId === currentUser?.id);
    } else if (currentRole === 'manager') {
      items = items.filter((r) => r.status !== 'draft');
    }
    items = filterByStatus(items, statusFilter);
    items = filterBySearch(items, search, ['docNumber', 'destination']);
    return items;
  }, [state.reimbursements, search, statusFilter, currentRole, currentUser]);

  const getUser = (id) => USERS.find((u) => u.id === id);

  const columns = [
    { key: 'docNumber', label: t('advance.docNumber'), render: (row) => <span className="font-medium text-brand">{row.docNumber}</span> },
    {
      key: 'employee', label: t('reimbursement.employee', 'Employee'),
      render: (row) => {
        const u = getUser(row.employeeId);
        return u ? (i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`) : '-';
      },
    },
    { key: 'destination', label: t('reimbursement.destination', 'Destination'), render: (row) => <span className="truncate max-w-[180px] block">{row.destination}</span> },
    { key: 'dates', label: t('reimbursement.travelDates', 'Travel Dates'), render: (row) => `${formatDate(row.departureDate, i18n.language)} - ${formatDate(row.returnDate, i18n.language)}` },
    { key: 'total', label: t('common.total'), render: (row) => <AmountDisplay amount={row.totalAmount} />, cellClassName: 'text-right' },
    { key: 'status', label: t('common.status'), render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">{t('reimbursement.title', 'Reimbursement')}</h1>
        {currentRole === 'employee' && (
          <button onClick={() => navigate('/reimbursement/new')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
            <Plus size={16} /> {t('reimbursement.newTrip', 'New Trip Request')}
          </button>
        )}
      </div>

      <SearchFilter searchTerm={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusChange={setStatusFilter} statuses={ALL_STATUSES} />
      <DataTable columns={columns} data={filtered} onRowClick={(row) => navigate(`/reimbursement/${row.id}`)} />
    </div>
  );
}
