import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, Receipt, Coins, Clock, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import StatsCard from '../common/StatsCard.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { USERS } from '../../data/users.js';

const PIE_COLORS = ['#6A6D70', '#E9730C', '#2B7D2B', '#BB0000', '#E9730C', '#0A6ED1', '#2B7D2B', '#6A6D70', '#0A6ED1'];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { state } = useData();
  const { currentRole } = useAuth();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const sumAmounts = (items) => items.reduce((s, i) => s + (i.totalAmount || i.totalNet || 0), 0);
    const pending = (items) => items.filter((i) => i.status === 'pendingApproval').length;

    return {
      totalAdvances: sumAmounts(state.advances),
      totalPayments: sumAmounts(state.payments),
      totalExpenses: sumAmounts(state.expenses),
      totalPettyCash: sumAmounts(state.pettyCash),
      pendingCount: pending(state.advances) + pending(state.payments) + pending(state.expenses) + pending(state.pettyCash),
      advanceCount: state.advances.length,
      paymentCount: state.payments.length,
      expenseCount: state.expenses.length,
      pettyCashCount: state.pettyCash.length,
    };
  }, [state]);

  const statusData = useMemo(() => {
    const all = [...state.advances, ...state.payments, ...state.expenses, ...state.pettyCash];
    const counts = {};
    all.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: t(`statuses.${name}`), value }));
  }, [state, t]);

  const monthlyData = useMemo(() => {
    return [
      { month: 'Dec', advances: 56566, payments: 593850, expenses: 0, pettyCash: 0 },
      { month: 'Jan', advances: 1238300, payments: 4535200, expenses: 12035, pettyCash: 7050 },
    ];
  }, []);

  const recentActivity = useMemo(() => {
    const activities = [];
    const addActivity = (items, module) => {
      items.forEach((item) => {
        (item.approvals || []).forEach((a) => {
          activities.push({
            ...a,
            module,
            docNumber: item.docNumber,
            id: item.id,
          });
        });
      });
    };
    addActivity(state.advances, 'advance');
    addActivity(state.payments, 'payment');
    addActivity(state.expenses, 'expense');
    addActivity(state.pettyCash, 'petty-cash');
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
  }, [state]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">{t('dashboard.title')}</h1>
        {currentRole === 'employee' && (
          <div className="flex gap-2">
            <button onClick={() => navigate('/advance/new')} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">
              <Plus size={14} /> {t('advance.newAdvance')}
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard title={t('dashboard.totalAdvances')} value={formatCurrency(stats.totalAdvances, i18n.language)} subtitle={`${stats.advanceCount} records`} icon={Banknote} color="brand" />
        <StatsCard title={t('dashboard.totalPayments')} value={formatCurrency(stats.totalPayments, i18n.language)} subtitle={`${stats.paymentCount} records`} icon={CreditCard} color="positive" />
        <StatsCard title={t('dashboard.totalExpenses')} value={formatCurrency(stats.totalExpenses, i18n.language)} subtitle={`${stats.expenseCount} records`} icon={Receipt} color="critical" />
        <StatsCard title={t('dashboard.pettyCashBalance')} value={formatCurrency(stats.totalPettyCash, i18n.language)} subtitle={`${stats.pettyCashCount} records`} icon={Coins} color="neutral" />
        <StatsCard title={t('dashboard.pendingApprovals')} value={stats.pendingCount} subtitle={currentRole === 'manager' ? 'Awaiting your action' : ''} icon={Clock} color={stats.pendingCount > 0 ? 'critical' : 'neutral'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">{t('dashboard.monthlyOverview')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => formatCurrency(value, i18n.language)} />
              <Bar dataKey="advances" fill="#0A6ED1" name={t('dashboard.totalAdvances')} radius={[2, 2, 0, 0]} />
              <Bar dataKey="payments" fill="#2B7D2B" name={t('dashboard.totalPayments')} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">{t('dashboard.statusDistribution')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-bg-secondary rounded-lg border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">{t('dashboard.recentActivity')}</h3>
        <div className="space-y-3">
          {recentActivity.map((act, idx) => {
            const user = USERS.find((u) => u.id === act.userId);
            const userName = i18n.language === 'th' && user
              ? `${user.firstName} ${user.lastName}`
              : user
                ? `${user.firstNameEn} ${user.lastNameEn}`
                : 'Unknown';
            return (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand text-xs font-bold shrink-0">
                  {user?.avatar || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    <span className="font-medium">{userName}</span>
                    {' '}{act.action}{' '}
                    <span className="font-medium">{act.docNumber}</span>
                  </p>
                  {act.comment && <p className="text-xs text-text-secondary truncate">{act.comment}</p>}
                </div>
                <span className="text-xs text-text-secondary shrink-0">
                  {formatDate(act.date, i18n.language)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
