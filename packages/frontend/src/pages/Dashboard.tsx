import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import type { DashboardStats } from '@oytiot/shared';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.getDashboard();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active Sessions"
          value={stats.active_sessions}
          color="blue"
        />
        <MetricCard
          label="Emails Today"
          value={stats.emails_today}
          color="green"
        />
        <MetricCard
          label="Errors Today"
          value={stats.errors_today}
          color={stats.errors_today > 0 ? 'red' : 'gray'}
        />
        <MetricCard
          label="Last History ID"
          value={stats.last_history_id}
          sub="Gmail Pub/Sub checkpoint"
          color="gray"
        />
      </div>
      <p className="text-xs text-gray-400">Auto-refreshes every 30 seconds</p>
    </div>
  );
}
