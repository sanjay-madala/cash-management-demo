// ReconciliationForm is no longer used — reconciliation is now handled directly
// by accounting through the ReconciliationDetail view.
// This file is kept as a placeholder; the route has been removed from App.jsx.

import { Navigate } from 'react-router-dom';

export default function ReconciliationForm() {
  return <Navigate to="/reconciliation" replace />;
}
