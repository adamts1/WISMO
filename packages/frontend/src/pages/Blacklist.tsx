import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterGroup } from '../components/ui/FilterGroup';
import { Pagination } from '../components/ui/Pagination';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTableRow, SkeletonCard } from '../components/ui/Skeleton';
import { useIsMobile } from '../hooks/useMediaQuery';
import { relativeTime } from '../lib/formatters';
import type { BlacklistEntry } from '@oytiot/shared';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'email', label: 'Emails' },
  { value: 'domain', label: 'Domains' },
];

const PAGE_SIZE = 50;

export function Blacklist() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const isMobile = useIsMobile();

  const [newType, setNewType] = useState<'email' | 'domain'>('email');
  const [newValue, setNewValue] = useState('');
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.getBlacklist({
        type: filter === 'all' ? undefined : filter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setEntries(result.entries);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, page]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setAdding(true);
    try {
      await api.addBlacklistEntry({
        type: newType,
        value: newValue.trim(),
        reason: newReason.trim() || undefined,
      });
      toast.success(`${newType === 'email' ? 'Email' : 'Domain'} blocked`);
      setNewValue('');
      setNewReason('');
      load();
    } catch {
      toast.error('Failed to add (may already exist)');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await api.removeBlacklistEntry(id);
      toast.success('Entry removed');
      load();
    } catch {
      toast.error('Failed to remove entry');
    }
  };

  const handleFilterChange = (val: string) => {
    setFilter(val);
    setPage(0);
  };

  return (
    <div>
      <PageHeader title="Blacklist" subtitle={`${total} blocked entries`} />

      <Card className="mb-6">
        <form onSubmit={handleAdd}>
          <div className={isMobile ? 'space-y-3' : 'flex items-end gap-3'}>
            <div className={isMobile ? '' : 'w-40'}>
              <Select
                label="Type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'email' | 'domain')}
              >
                <option value="email">Email</option>
                <option value="domain">Domain</option>
              </Select>
            </div>
            <div className={isMobile ? '' : 'flex-1'}>
              <Input
                label="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newType === 'email' ? 'spam@example.com' : 'spam-domain.com'}
              />
            </div>
            <div className={isMobile ? '' : 'flex-1'}>
              <Input
                label="Reason (optional)"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Why block this?"
              />
            </div>
            <Button type="submit" variant="primary" loading={adding} className={isMobile ? 'w-full' : ''}>
              Block
            </Button>
          </div>
        </form>
      </Card>

      <div className="mb-4">
        <FilterGroup options={FILTER_OPTIONS} value={filter} onChange={handleFilterChange} ariaLabel="Filter by type" />
      </div>

      {isMobile ? (
        loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState title="No blocked entries" description="Add an email or domain above to get started" />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id} className="animate-fade-in">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-mono text-gray-900 truncate">{entry.value}</p>
                  <Badge variant={entry.type === 'email' ? 'blue' : 'purple'} size="sm">
                    {entry.type}
                  </Badge>
                </div>
                {entry.reason && (
                  <p className="text-xs text-gray-500 mb-2">{entry.reason}</p>
                )}
                <p className="text-xs text-gray-400 mb-3">{relativeTime(entry.created_at)}</p>
                <Button variant="danger" size="sm" className="w-full" onClick={() => handleRemove(entry.id)}>
                  Remove
                </Button>
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
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Value</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Reason</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Added</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12">
                      <EmptyState title="No blocked entries" description="Add an email or domain above to get started" />
                    </td>
                  </tr>
                ) : entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-fade-in"
                  >
                    <td className="px-4 py-3">
                      <Badge variant={entry.type === 'email' ? 'blue' : 'purple'} size="sm">
                        {entry.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{entry.value}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{entry.reason ?? '--'}</td>
                    <td className="px-4 py-3 text-gray-500">{relativeTime(entry.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" size="sm" onClick={() => handleRemove(entry.id)}>
                        Remove
                      </Button>
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
