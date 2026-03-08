import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterGroup } from '../components/ui/FilterGroup';
import { Pagination } from '../components/ui/Pagination';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTableRow, SkeletonCard } from '../components/ui/Skeleton';
import { useIsMobile } from '../hooks/useMediaQuery';
import { formatWaitTime, relativeTime } from '../lib/formatters';
import type { CustomerSession } from '@oytiot/shared';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'waiting_for_order_number', label: 'Waiting for Order #' },
  { value: 'searching', label: 'Searching' },
  { value: 'close', label: 'Closed' },
];

const PAGE_SIZE = 50;

export function Sessions() {
  const [sessions, setSessions] = useState<CustomerSession[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const isMobile = useIsMobile();

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.getSessions({
        status: status === 'all' ? undefined : status,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setSessions(result.sessions);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status, page]);

  const handleClose = async (threadId: string) => {
    try {
      await api.closeSession(threadId);
      toast.success('Session closed');
      load();
    } catch {
      toast.error('Failed to close session');
    }
  };

  const handleFilterChange = (val: string) => {
    setStatus(val);
    setPage(0);
  };

  return (
    <div>
      <PageHeader title="Sessions" subtitle={`${total} total`} />

      <div className="mb-4">
        <FilterGroup options={FILTER_OPTIONS} value={status} onChange={handleFilterChange} ariaLabel="Filter by status" />
      </div>

      {/* Mobile: Card view */}
      {isMobile ? (
        loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState title="No sessions" description="No sessions match the current filter" />
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id} className="animate-fade-in">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-mono text-gray-900 truncate">{s.customer_email}</p>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>Attempts: {s.attempts}</span>
                  <span>Waiting: {formatWaitTime(s.last_interaction)}</span>
                  {s.language && s.language !== 'en' && <Badge variant="gray" size="sm">{s.language}</Badge>}
                </div>
                <p className="text-xs text-gray-400 mb-3">{relativeTime(s.last_interaction)}</p>
                {s.status !== 'close' && (
                  <Button variant="danger" size="sm" className="w-full" onClick={() => handleClose(s.thread_id)}>
                    Close Session
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Desktop: Table view */
        <Card padding="sm" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Attempts</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Wait Time</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Language</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12">
                      <EmptyState title="No sessions" description="No sessions match the current filter" />
                    </td>
                  </tr>
                ) : sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-fade-in"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{s.customer_email}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{s.attempts}</td>
                    <td className="px-4 py-3 text-gray-500">{formatWaitTime(s.last_interaction)}</td>
                    <td className="px-4 py-3">
                      {s.language && s.language !== 'en' && <Badge variant="gray" size="sm">{s.language}</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status !== 'close' && (
                        <Button variant="danger" size="sm" onClick={() => handleClose(s.thread_id)}>
                          Close
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
