import { BrowserRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Sessions } from './pages/Sessions';
import { EmailLog } from './pages/EmailLog';
import { OrderLookup } from './pages/OrderLookup';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/sessions', label: 'Sessions' },
  { to: '/emails', label: 'Email Log' },
  { to: '/orders', label: 'Order Lookup' },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="px-5 py-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Oytiot WISMO</h2>
            <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/emails" element={<EmailLog />} />
              <Route path="/orders" element={<OrderLookup />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
