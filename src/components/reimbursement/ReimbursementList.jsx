import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import DataTable from '../common/DataTable.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';

import { USERS } from '../../data/users.js';
import { TRAVEL_TYPES } from '../../data/constants.js';
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transportFilter, setTransportFilter] = useState('all');

  const filtered = useMemo(() => {
    let items = state.reimbursements || [];
    if (currentRole === 'employee') {
      items = items.filter((r) => r.employeeId === currentUser?.id);
    } else if (currentRole === 'manager') {
      items = items.filter((r) => r.status !== 'draft');
    } else if (currentRole === 'accounting') {
      // Accounting only sees trips with manager-approved expenses onward
      items = items.filter((r) => ['managerApproved', 'paymentGenerated', 'accountingVerified', 'posted'].includes(r.status));
    }
    items = filterByStatus(items, statusFilter);
    if (transportFilter !== 'all') {
      items = items.filter((r) => r.transportationType === transportFilter);
    }
    if (dateFrom) {
      items = items.filter((r) => r.departureDate >= dateFrom);
    }
    if (dateTo) {
      items = items.filter((r) => r.departureDate <= dateTo);
    }
    items = filterBySearch(items, search, ['docNumber', 'destination']);
    return items;
  }, [state.reimbursements, search, statusFilter, transportFilter, dateFrom, dateTo, currentRole, currentUser]);

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

      <div className="bg-bg-secondary rounded-lg border border-border p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('common.search')}</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Doc# or destination..." className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('common.status')}</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="all">{t('common.all', 'All')}</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{t(`statuses.${s}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('reimbursement.transportationType')}</label>
            <select value={transportFilter} onChange={(e) => setTransportFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="all">{t('common.all', 'All')}</option>
              {TRAVEL_TYPES.map((tt) => <option key={tt.id} value={tt.id}>{i18n.language === 'th' ? tt.label.th : tt.label.en}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('common.dateFrom', 'Date From')}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{t('common.dateTo', 'Date To')}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-brand" />
          </div>
        </div>
      </div>
      <DataTable columns={columns} data={filtered} onRowClick={(row) => navigate(`/reimbursement/${row.id}`)} />
    </div>
  );
}
