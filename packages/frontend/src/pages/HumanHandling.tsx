import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterGroup } from '../components/ui/FilterGroup';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonTableRow } from '../components/ui/Skeleton';
import { useIsMobile } from '../hooks/useMediaQuery';
import { relativeTime } from '../lib/formatters';
import type { HumanHandlingEntry } from '@oytiot/shared';

const SOURCE_BADGE = {
  wismo: { variant: 'orange' as const, label: 'WISMO' },
  open_session: { variant: 'purple' as const, label: 'Open Session' },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'wismo', label: 'WISMO' },
  { value: 'open_session', label: 'Open Session' },
];

const PAGE_SIZE = 50;

export function HumanHandling() {
  const [entries, setEntries] = useState<HumanHandlingEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.getHumanHandling({
        source: source === 'all' ? undefined : source,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setEntries(result.entries);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [source, page]);

  const handleFilterChange = (val: string) => {
    setSource(val);
    setPage(0);
  };

  const getSourceBadge = (src: string) => {
    const badge = SOURCE_BADGE[src as keyof typeof SOURCE_BADGE];
    if (!badge) return <Badge variant="gray">{src}</Badge>;
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <div>
      <PageHeader title="Escalations" subtitle={`${total} total`} />

      <div className="mb-4">
        <FilterGroup options={FILTER_OPTIONS} value={source} onChange={handleFilterChange} ariaLabel="Filter by source" />
      </div>

      {isMobile ? (
        loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState title="No escalations" description="No human handling events match the current filter" />
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <Card key={e.id} className="animate-fade-in">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-mono text-gray-900 truncate">{e.sender_email ?? 'Unknown'}</p>
                  {getSourceBadge(e.source)}
                </div>
                {e.subject && (
                  <p className="text-sm text-gray-700 truncate mb-1">{e.subject}</p>
                )}
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{e.reason}</p>
                <p className="text-xs text-gray-400">{relativeTime(e.created_at)}</p>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card padding="sm" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Sender</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12">
                      <EmptyState title="No escalations" description="No human handling events match the current filter" />
                    </td>
                  </tr>
                ) : entries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-fade-in"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{e.sender_email ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{e.subject ?? '—'}</td>
                    <td className="px-4 py-3">{getSourceBadge(e.source)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[300px] truncate">{e.reason}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{relativeTime(e.created_at)}</td>
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
