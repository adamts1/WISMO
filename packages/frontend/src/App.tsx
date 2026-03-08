import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import { EmailLog } from './pages/EmailLog';
import { OrderLookup } from './pages/OrderLookup';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/emails" element={<EmailLog />} />
          <Route path="/orders" element={<OrderLookup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
