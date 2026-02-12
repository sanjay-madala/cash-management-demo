import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { SAPProvider } from './context/SAPContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import './i18n';

import Dashboard from './components/dashboard/Dashboard.jsx';
import AdvanceList from './components/advance/AdvanceList.jsx';
import AdvanceForm from './components/advance/AdvanceForm.jsx';
import AdvanceDetail from './components/advance/AdvanceDetail.jsx';
import PaymentList from './components/payment/PaymentList.jsx';
import PaymentForm from './components/payment/PaymentForm.jsx';
import PaymentDetail from './components/payment/PaymentDetail.jsx';
import ExpenseList from './components/expense/ExpenseList.jsx';
import ExpenseForm from './components/expense/ExpenseForm.jsx';
import ExpenseDetail from './components/expense/ExpenseDetail.jsx';
import PettyCashList from './components/petty-cash/PettyCashList.jsx';
import PettyCashForm from './components/petty-cash/PettyCashForm.jsx';
import PettyCashDetail from './components/petty-cash/PettyCashDetail.jsx';
import SAPDocumentLog from './components/sap/SAPDocumentLog.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <SAPProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="advance" element={<AdvanceList />} />
                <Route path="advance/new" element={<AdvanceForm />} />
                <Route path="advance/:id" element={<AdvanceDetail />} />
                <Route path="payment" element={<PaymentList />} />
                <Route path="payment/new" element={<PaymentForm />} />
                <Route path="payment/:id" element={<PaymentDetail />} />
                <Route path="expense" element={<ExpenseList />} />
                <Route path="expense/new" element={<ExpenseForm />} />
                <Route path="expense/:id" element={<ExpenseDetail />} />
                <Route path="petty-cash" element={<PettyCashList />} />
                <Route path="petty-cash/new" element={<PettyCashForm />} />
                <Route path="petty-cash/:id" element={<PettyCashDetail />} />
                <Route path="sap-documents" element={<SAPDocumentLog />} />
              </Route>
            </Routes>
          </SAPProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
