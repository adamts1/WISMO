import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { FilterGroup } from '../components/ui/FilterGroup';
import { Pagination } from '../components/ui/Pagination';
import { Badge, type BadgeVariant } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonEmailCard } from '../components/ui/Skeleton';
import { relativeTime, fullDateTime } from '../lib/formatters';
import { cn } from '../lib/cn';
import type { EmailLogEntry } from '@oytiot/shared';

const ROUTE_BADGE: Record<string, { variant: BadgeVariant; label: string }> = {
  order_found_by_name: { variant: 'green', label: 'Order by Name' },
  order_found_by_zip: { variant: 'green', label: 'Order by ZIP' },
  auto_reply_non_wismo: { variant: 'purple', label: 'Auto Reply' },
  ask_order_number: { variant: 'yellow', label: 'Asked Order #' },
  order_by_email_fallback: { variant: 'blue', label: 'Email Fallback' },
  email_zip_mismatch: { variant: 'orange', label: 'ZIP Mismatch' },
  human_alert_order_not_found: { variant: 'red', label: 'Human Alert' },
  blacklisted: { variant: 'gray', label: 'Blacklisted' },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'order_found_by_name', label: 'Order Found' },
  { value: 'auto_reply_non_wismo', label: 'Auto Reply' },
  { value: 'ask_order_number', label: 'Asked Order #' },
  { value: 'human_alert_order_not_found', label: 'Human Alert' },
  { value: 'email_zip_mismatch', label: 'ZIP Mismatch' },
  { value: 'blacklisted', label: 'Blacklisted' },
];

const PAGE_SIZE = 50;

export function EmailLog() {
  const [emails, setEmails] = useState<EmailLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getEmails({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }).then((r) => {
      setEmails(r.emails);
      setTotal(r.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  const filtered = filter === 'all'
    ? emails
    : emails.filter((e) => {
        const route = (e.route_taken ?? '').replace('open_session:', '');
        return route === filter || route.includes(filter);
      });

  const renderAiClassification = (data: Record<string, unknown>) => {
    const fields: { key: string; label: string }[] = [
      { key: 'is_wismo', label: 'WISMO' },
      { key: 'order_name', label: 'Order #' },
      { key: 'zip_code', label: 'ZIP Code' },
      { key: 'language', label: 'Language' },
      { key: 'has_ambiguity', label: 'Ambiguous' },
    ];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {fields.map(({ key, label }) => {
          const val = data[key];
          if (val === undefined) return null;
          const display = val === null ? 'N/A' : val === true ? 'Yes' : val === false ? 'No' : String(val);
          return (
            <div key={key}>
              <span className="text-gray-500">{label}: </span>
              <span className="font-medium text-gray-900">{display}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Email Log" subtitle={`${total} total emails`} />

      <div className="mb-4">
        <FilterGroup options={FILTER_OPTIONS} value={filter} onChange={setFilter} ariaLabel="Filter by route" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonEmailCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No emails found"
          description={filter !== 'all' ? 'Try a different filter' : 'No emails have been processed yet'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const isOpen = expanded === e.id;
            const routeKey = (e.route_taken ?? '').replace('open_session:', '');
            const badge = ROUTE_BADGE[routeKey];

            return (
              <div
                key={e.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-fade-in"
              >
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : e.id)}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {e.subject ?? '(no subject)'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 font-mono truncate">
                          {e.sender_email}
                        </span>
                        {badge && <Badge variant={badge.variant} size="sm">{badge.label}</Badge>}
                        {e.error && <Badge variant="red" size="sm">Error</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {relativeTime(e.processed_at)}
                      </span>
                      <svg
                        className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3 text-xs space-y-3 bg-gray-50 animate-slide-up">
                    <div>
                      <span className="font-medium text-gray-500">Thread ID: </span>
                      <span className="font-mono text-gray-700">{e.thread_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Processed: </span>
                      <span className="text-gray-700">{fullDateTime(e.processed_at)}</span>
                    </div>
                    {e.ai_classification && (
                      <div>
                        <p className="font-medium text-gray-500 mb-1.5">AI Classification:</p>
                        {renderAiClassification(e.ai_classification)}
                      </div>
                    )}
                    {e.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <span className="font-medium text-red-600">Error: </span>
                        <span className="text-red-700">{e.error}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
