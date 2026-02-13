import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { ADVANCE_REQUESTS } from '../data/advanceRequests.js';
import { PAYMENT_REQUESTS } from '../data/paymentRequests.js';
import { expenses as initialExpenses } from '../data/expenses.js';
import { pettyCash as initialPettyCash } from '../data/pettyCash.js';
import { reconciliations as initialReconciliations } from '../data/reconciliations.js';

const DataContext = createContext(null);

const initialState = {
  advances: ADVANCE_REQUESTS,
  payments: PAYMENT_REQUESTS,
  expenses: initialExpenses,
  pettyCash: initialPettyCash,
  reconciliations: initialReconciliations,
};

function getModuleKey(module) {
  const map = {
    advance: 'advances',
    advances: 'advances',
    payment: 'payments',
    payments: 'payments',
    expense: 'expenses',
    expenses: 'expenses',
    pettyCash: 'pettyCash',
    'petty-cash': 'pettyCash',
    reconciliation: 'reconciliations',
    reconciliations: 'reconciliations',
  };
  return map[module] || module;
}

function dataReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_STATUS': {
      const key = getModuleKey(action.module);
      return {
        ...state,
        [key]: state[key].map((item) =>
          item.id === action.id ? { ...item, status: action.status } : item
        ),
      };
    }
    case 'ADD_APPROVAL': {
      const key = getModuleKey(action.module);
      return {
        ...state,
        [key]: state[key].map((item) =>
          item.id === action.id
            ? {
                ...item,
                approvals: [...(item.approvals || []), action.approval],
              }
            : item
        ),
      };
    }
    case 'ADD_RECORD': {
      const key = getModuleKey(action.module);
      return {
        ...state,
        [key]: [...state[key], action.record],
      };
    }
    case 'UPDATE_RECORD': {
      const key = getModuleKey(action.module);
      return {
        ...state,
        [key]: state[key].map((item) =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
      };
    }
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  const getAdvanceRequests = useCallback(
    (filters) => {
      let items = state.advances;
      if (filters?.status) {
        items = items.filter((item) => item.status === filters.status);
      }
      if (filters?.requesterId) {
        items = items.filter((item) => item.requesterId === filters.requesterId);
      }
      return items;
    },
    [state.advances]
  );

  const getPaymentRequests = useCallback(
    (filters) => {
      let items = state.payments;
      if (filters?.status) {
        items = items.filter((item) => item.status === filters.status);
      }
      if (filters?.requesterId) {
        items = items.filter((item) => item.requesterId === filters.requesterId);
      }
      return items;
    },
    [state.payments]
  );

  const getExpenses = useCallback(
    (filters) => {
      let items = state.expenses;
      if (filters?.status) {
        items = items.filter((item) => item.status === filters.status);
      }
      if (filters?.requesterId) {
        items = items.filter((item) => item.requesterId === filters.requesterId);
      }
      return items;
    },
    [state.expenses]
  );

  const getPettyCash = useCallback(
    (filters) => {
      let items = state.pettyCash;
      if (filters?.status) {
        items = items.filter((item) => item.status === filters.status);
      }
      if (filters?.requesterId) {
        items = items.filter((item) => item.requesterId === filters.requesterId);
      }
      return items;
    },
    [state.pettyCash]
  );

  const getReconciliations = useCallback(
    (filters) => {
      let items = state.reconciliations;
      if (filters?.status) {
        items = items.filter((item) => item.status === filters.status);
      }
      if (filters?.requesterId) {
        items = items.filter((item) => item.requesterId === filters.requesterId);
      }
      return items;
    },
    [state.reconciliations]
  );

  const getRecordById = useCallback(
    (module, id) => {
      const key = getModuleKey(module);
      return state[key]?.find((item) => item.id === id) || null;
    },
    [state]
  );

  const getPendingApprovals = useCallback(() => {
    const pending = (items) =>
      items.filter((item) => item.status === 'pendingApproval').length;
    return (
      pending(state.advances) +
      pending(state.payments) +
      pending(state.expenses) +
      pending(state.pettyCash) +
      pending(state.reconciliations)
    );
  }, [state]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      getAdvanceRequests,
      getPaymentRequests,
      getExpenses,
      getPettyCash,
      getReconciliations,
      getRecordById,
      getPendingApprovals,
    }),
    [state, dispatch, getAdvanceRequests, getPaymentRequests, getExpenses, getPettyCash, getReconciliations, getRecordById, getPendingApprovals]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
