import { useCallback, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import type { DashboardStats, EmailLogEntry } from '@oytiot/shared';

const ROUTE_COLORS: Record<string, { color: string; label: string }> = {
  order_found_by_name: { color: '#16a34a', label: 'Order by Name' },
  order_found_by_zip: { color: '#15803d', label: 'Order by ZIP' },
  auto_reply_non_wismo: { color: '#9333ea', label: 'Auto Reply' },
  ask_order_number: { color: '#ca8a04', label: 'Asked for Order #' },
  order_by_email_fallback: { color: '#2563eb', label: 'Email Fallback' },
  email_zip_mismatch: { color: '#ea580c', label: 'ZIP Mismatch' },
  human_alert_order_not_found: { color: '#dc2626', label: 'Human Alert' },
  blacklisted: { color: '#9ca3af', label: 'Blacklisted' },
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<{ name: string; value: number; color: string }[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load route distribution from recent emails
  useEffect(() => {
    api.getEmails({ limit: 200, offset: 0 }).then((res) => {
      const counts: Record<string, number> = {};
      res.emails.forEach((e: EmailLogEntry) => {
        const route = e.route_taken ?? 'unknown';
        // Strip "open_session:" prefix for grouping
        const key = route.replace('open_session:', '');
        counts[key] = (counts[key] || 0) + 1;
      });
      const data = Object.entries(counts)
        .map(([name, value]) => ({
          name: ROUTE_COLORS[name]?.label ?? name.replace(/_/g, ' '),
          value,
          color: ROUTE_COLORS[name]?.color ?? '#6b7280',
        }))
        .sort((a, b) => b.value - a.value);
      setRouteData(data);
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, 30_000);

  if (error && !stats) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Auto-refreshes every 30 seconds" />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
        <MetricCard
          label="Active Sessions"
          value={stats?.active_sessions ?? '-'}
          color="blue"
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Emails Today"
          value={stats?.emails_today ?? '-'}
          color="green"
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <MetricCard
          label="Errors Today"
          value={stats?.errors_today ?? '-'}
          color={stats && stats.errors_today > 0 ? 'red' : 'gray'}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
        <MetricCard
          label="Last History ID"
          value={stats?.last_history_id ?? '-'}
          sub="Gmail Pub/Sub checkpoint"
          color="gray"
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Route Distribution Chart */}
      {routeData.length > 0 && (
        <Card className="animate-slide-up">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Email Route Distribution</h2>
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="w-full xl:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={routeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {routeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #ffffff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '13px',
                      color: 'var(--tooltip-text, #111827)',
                    }}
                    formatter={(value: number) => [`${value} emails`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 justify-center">
              {routeData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600">{entry.name}</span>
                  <span className="font-medium text-gray-900 ml-auto">{entry.value}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">Based on last 200 emails</p>
            </div>
          </div>
        </Card>
      )}

      {routeData.length === 0 && !loading && (
        <Card>
          <Skeleton className="h-64 w-full rounded-lg" />
        </Card>
      )}
    </div>
  );
}
