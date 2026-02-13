import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSAP } from '../../context/SAPContext.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import AmountDisplay from '../common/AmountDisplay.jsx';
import { USERS } from '../../data/users.js';
import { COMPANIES, EXPENSE_TYPES } from '../../data/constants.js';
import { formatDate, generateId } from '../../utils/formatters.js';

export default function ReconciliationDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, getRecordById, dispatch } = useData();
  const { currentRole } = useAuth();
  const { postToSAP } = useSAP();

  const [additionalExpenses, setAdditionalExpenses] = useState([]);
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState('');

  // Load advance record by ID
  const advance = getRecordById('advance', id);

  if (!advance) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Advance record not found</p>
      </div>
    );
  }

  // Find all linked expenses
  const linkedExpenses = state.expenses.filter((e) => e.advanceId === id);

  // Resolve requester info
  const requester = USERS.find((u) => u.id === advance.requesterId);
  const company = COMPANIES.find((c) => c.id === advance.companyId);

  const getName = (user) => {
    if (!user) return '-';
    return i18n.language === 'th'
      ? `${user.firstName} ${user.lastName}`
      : `${user.firstNameEn} ${user.lastNameEn}`;
  };

  const companyName = company
    ? i18n.language === 'th' ? company.name.th : company.name.en
    : '-';

  const getAdvanceTypeLabel = (type) => {
    return t(`advance.${type}`, { defaultValue: type });
  };

  const getExpenseLabel = (typeId) => {
    const et = EXPENSE_TYPES.find((e) => e.id === typeId);
    return et ? (i18n.language === 'th' ? et.label.th : et.label.en) : typeId;
  };

  // Calculate totals
  const linkedExpenseTotal = linkedExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const additionalExpenseTotal = additionalExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenses = linkedExpenseTotal + additionalExpenseTotal;
  const netSettlement = advance.totalAmount - totalExpenses;

  const isSurplus = netSettlement > 0;
  const isDeficit = netSettlement < 0;
  const isExact = netSettlement === 0;

  // Additional expenses management
  const handleAddExpense = () => {
    setAdditionalExpenses((prev) => [
      ...prev,
      { id: generateId(), expenseType: '', description: '', amount: 0, receipt: false },
    ]);
  };

  const handleUpdateAdditionalExpense = (expId, field, value) => {
    setAdditionalExpenses((prev) =>
      prev.map((e) => (e.id === expId ? { ...e, [field]: value } : e))
    );
  };

  const handleDeleteAdditionalExpense = (expId) => {
    setAdditionalExpenses((prev) => prev.filter((e) => e.id !== expId));
  };

  // Clear Advance action
  const canClearAdvance = currentRole === 'accounting' && advance.status === 'disbursed';

  const handleClearAdvance = async () => {
    setPosting(true);
    setPostSuccess('');

    const reconciliationRecord = {
      id: generateId(),
      advanceId: id,
      advanceDocNumber: advance.docNumber,
      advanceAmount: advance.totalAmount,
      linkedExpenses: linkedExpenses.map((e) => e.id),
      additionalExpenses,
      totalExpenses,
      netSettlement,
      clearedDate: new Date().toISOString(),
    };

    const result = await postToSAP('reconciliation', id, reconciliationRecord);

    dispatch({ type: 'UPDATE_STATUS', module: 'advance', id, status: 'cleared' });

    dispatch({
      type: 'ADD_RECORD',
      module: 'reconciliation',
      record: reconciliationRecord,
    });

    setPosting(false);
    setPostSuccess(
      `Document ${result.documentNumber} posted successfully. Advance ${advance.docNumber} has been cleared.`
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/reconciliation')}
          className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors"
        >
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
            <button
              onClick={handleClearAdvance}
              disabled={posting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              <FileText size={14} />
              {posting ? t('common.postingSAP') : t('reconciliation.clearAdvance')}
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {postSuccess && (
        <div className="mb-4 p-3 bg-positive/10 border border-positive/20 rounded-lg text-sm text-positive font-medium">
          {postSuccess}
        </div>
      )}

      <div className="space-y-4">
        {/* Advance Summary Card */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            {t('reconciliation.advanceAmount', { defaultValue: 'Advance Summary' })}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm">
            <div>
              <span className="text-text-secondary">{t('advance.requester')}:</span>{' '}
              <span className="font-medium ml-1">{getName(requester)}</span>
            </div>
            <div>
              <span className="text-text-secondary">{t('advance.company')}:</span>{' '}
              <span className="font-medium ml-1">{companyName}</span>
            </div>
            <div>
              <span className="text-text-secondary">{t('advance.advanceType')}:</span>{' '}
              <span className="font-medium ml-1 capitalize">{getAdvanceTypeLabel(advance.advanceType)}</span>
            </div>
            <div>
              <span className="text-text-secondary">{t('advance.requestDate')}:</span>{' '}
              <span className="font-medium ml-1">{formatDate(advance.documentDate, i18n.language)}</span>
            </div>
            <div>
              <span className="text-text-secondary">{t('advance.requiredDate')}:</span>{' '}
              <span className="font-medium ml-1">{formatDate(advance.requiredDate, i18n.language)}</span>
            </div>
            <div>
              <span className="text-text-secondary">{t('common.amount')}:</span>{' '}
              <span className="font-bold ml-1 text-lg font-mono">
                <AmountDisplay amount={advance.totalAmount} />
              </span>
            </div>
          </div>
        </div>

        {/* Employee Expenses (from state.expenses) */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">
            {t('reconciliation.expenseItems', { defaultValue: 'Employee Expenses' })}
          </h2>
          {linkedExpenses.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">
                    {t('expense.docNumber', { defaultValue: 'Expense Doc#' })}
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">
                    {t('common.date')}
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">
                    {t('expense.travelPurpose', { defaultValue: 'Travel Purpose' })}
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">
                    {t('common.amount')}
                  </th>
                  <th className="text-center text-xs font-semibold text-text-secondary py-2">
                    {t('common.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {linkedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-border cursor-pointer hover:bg-bg-primary transition-colors"
                    onClick={() => navigate(`/expense/${expense.id}`)}
                  >
                    <td className="py-2.5 text-sm font-mono text-brand">{expense.docNumber}</td>
                    <td className="py-2.5 text-sm">{formatDate(expense.travelDate || expense.createdDate, i18n.language)}</td>
                    <td className="py-2.5 text-sm">{expense.travelPurpose}</td>
                    <td className="py-2.5 text-sm text-right font-mono">
                      <AmountDisplay amount={expense.totalAmount} />
                    </td>
                    <td className="py-2.5 text-center">
                      <StatusBadge status={expense.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right text-sm font-semibold py-3">{t('common.total')}</td>
                  <td className="text-right text-sm font-bold font-mono py-3">
                    <AmountDisplay amount={linkedExpenseTotal} />
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-text-secondary italic">No expenses recorded yet</p>
          )}
        </div>

        {/* Additional Expenses (Accounting) */}
        <div className="bg-bg-secondary rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Additional Expenses (Accounting)
            </h2>
            {currentRole === 'accounting' && advance.status === 'disbursed' && (
              <button
                onClick={handleAddExpense}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand border border-brand rounded-lg hover:bg-brand/5 transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          {additionalExpenses.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">
                    {t('expense.expenseType')}
                  </th>
                  <th className="text-left text-xs font-semibold text-text-secondary py-2">
                    {t('advance.description')}
                  </th>
                  <th className="text-right text-xs font-semibold text-text-secondary py-2">
                    {t('common.amount')}
                  </th>
                  <th className="text-center text-xs font-semibold text-text-secondary py-2">
                    Receipt
                  </th>
                  <th className="text-center text-xs font-semibold text-text-secondary py-2"></th>
                </tr>
              </thead>
              <tbody>
                {additionalExpenses.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-2">
                      <select
                        value={item.expenseType}
                        onChange={(e) => handleUpdateAdditionalExpense(item.id, 'expenseType', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-primary"
                      >
                        <option value="">-- Select --</option>
                        {EXPENSE_TYPES.map((et) => (
                          <option key={et.id} value={et.id}>
                            {i18n.language === 'th' ? et.label.th : et.label.en}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateAdditionalExpense(item.id, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-primary"
                        placeholder="Description"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        value={item.amount || ''}
                        onChange={(e) => handleUpdateAdditionalExpense(item.id, 'amount', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:border-brand bg-bg-primary text-right font-mono"
                        placeholder="0"
                        min="0"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.receipt}
                        onChange={(e) => handleUpdateAdditionalExpense(item.id, 'receipt', e.target.checked)}
                        className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <button
                        onClick={() => handleDeleteAdditionalExpense(item.id)}
                        className="p-1 text-negative hover:bg-negative/10 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="text-right text-sm font-semibold py-3">{t('common.total')}</td>
                  <td className="text-right text-sm font-bold font-mono py-3">
                    <AmountDisplay amount={additionalExpenseTotal} />
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-text-secondary italic">No additional expenses added</p>
          )}
        </div>

        {/* Settlement Summary Card */}
        <div
          className={`rounded-lg border p-5 ${
            isSurplus
              ? 'bg-positive/5 border-positive/20'
              : isDeficit
                ? 'bg-negative/5 border-negative/20'
                : 'bg-brand/5 border-brand/20'
          }`}
        >
          <h2 className="text-sm font-semibold text-text-primary mb-3">
            {t('reconciliation.settlementSummary', { defaultValue: 'Settlement Summary' })}
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-text-secondary mb-1">
                {t('reconciliation.advanceAmount', { defaultValue: 'Advance Amount' })}
              </div>
              <div className="text-lg font-bold font-mono">
                <AmountDisplay amount={advance.totalAmount} />
              </div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">
                {t('reconciliation.totalExpenses', { defaultValue: 'Total Expenses' })}
              </div>
              <div className="text-lg font-bold font-mono">
                <AmountDisplay amount={totalExpenses} />
              </div>
            </div>
            <div>
              <div className="text-xs text-text-secondary mb-1">
                {t('reconciliation.settlement', { defaultValue: 'Net Settlement' })}
              </div>
              <div
                className={`text-lg font-bold font-mono ${
                  isSurplus ? 'text-positive' : isDeficit ? 'text-negative' : 'text-brand'
                }`}
              >
                {isSurplus ? '+' : isDeficit ? '-' : ''}
                {Math.abs(netSettlement).toLocaleString()} THB
              </div>
            </div>
          </div>
          {isSurplus && (
            <div className="mt-3 p-2 bg-positive/10 rounded text-xs text-positive font-medium text-center">
              {t('reconciliation.amountToReturn', { defaultValue: 'Employee to return' })}:{' '}
              {netSettlement.toLocaleString()} THB
            </div>
          )}
          {isDeficit && (
            <div className="mt-3 p-2 bg-negative/10 rounded text-xs text-negative font-medium text-center">
              {t('reconciliation.reimbursementAmount', { defaultValue: 'Reimbursement to employee' })}:{' '}
              {Math.abs(netSettlement).toLocaleString()} THB
            </div>
          )}
          {isExact && (
            <div className="mt-3 p-2 bg-brand/10 rounded text-xs text-brand font-medium text-center">
              Advance fully utilized - no settlement required
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
