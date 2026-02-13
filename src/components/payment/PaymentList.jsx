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
import { COMPANIES } from '../../data/constants.js';
import { formatDate } from '../../utils/formatters.js';
import { filterBySearch, filterByStatus } from '../../utils/helpers.js';

const ALL_STATUSES = ['draft', 'pendingApproval', 'approved', 'disbursed', 'posted'];

export default function PaymentList() {
  const { t, i18n } = useTranslation();
  const { state } = useData();
  const { currentRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let items = state.payments;
    // Role-based filtering
    if (currentRole === 'employee') {
      items = items.filter((r) => r.requesterId === currentUser?.id);
    } else if (currentRole === 'manager') {
      items = items.filter((r) => ['pendingApproval', 'approved', 'disbursed', 'posted'].includes(r.status));
    } else if (currentRole === 'accounting') {
      items = items.filter((r) => ['approved', 'disbursed', 'posted'].includes(r.status));
    }
    items = filterByStatus(items, statusFilter);
    items = filterBySearch(items, search, ['docNumber', 'payee', 'paymentDetails']);
    return items;
  }, [state.payments, search, statusFilter, currentRole, currentUser]);

  const getUser = (id) => USERS.find((u) => u.id === id);

  const columns = [
    { key: 'docNumber', label: t('advance.docNumber'), render: (row) => <span className="font-medium text-brand">{row.docNumber}</span> },
    { key: 'payee', label: t('payment.payee'), render: (row) => <span className="truncate max-w-[180px] block">{row.payee}</span> },
    {
      key: 'requester', label: t('advance.requester'),
      render: (row) => {
        const u = getUser(row.requesterId);
        return u ? (i18n.language === 'th' ? `${u.firstName} ${u.lastName}` : `${u.firstNameEn} ${u.lastNameEn}`) : '-';
      },
    },
    { key: 'paymentMethod', label: t('payment.paymentMethod'), render: (row) => <span className="capitalize">{t(`payment.${row.paymentMethod}`, { defaultValue: row.paymentMethod })}</span> },
    { key: 'totalNet', label: t('payment.netPayment'), render: (row) => <AmountDisplay amount={row.totalNet} />, cellClassName: 'text-right' },
    { key: 'paymentDate', label: t('payment.paymentDate'), render: (row) => formatDate(row.paymentDate, i18n.language) },
    { key: 'status', label: t('common.status'), render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-text-primary">{t('payment.title')}</h1>
        {currentRole === 'employee' && (
          <button onClick={() => navigate('/payment/new')} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
            <Plus size={16} /> {t('payment.newPayment')}
          </button>
        )}
      </div>

      <SearchFilter searchTerm={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusChange={setStatusFilter} statuses={ALL_STATUSES} />
      <DataTable columns={columns} data={filtered} onRowClick={(row) => navigate(`/payment/${row.id}`)} />
    </div>
  );
}
