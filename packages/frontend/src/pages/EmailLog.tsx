import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { EmailLogEntry } from '@oytiot/shared';

const ROUTE_COLORS: Record<string, string> = {
  blacklisted: 'text-gray-400',
  auto_reply_non_wismo: 'text-purple-600',
  ask_order_number: 'text-yellow-600',
  order_found_by_name: 'text-green-600',
  order_found_by_zip: 'text-green-600',
  email_zip_mismatch: 'text-orange-600',
  order_by_email_fallback: 'text-blue-600',
  human_alert_order_not_found: 'text-red-600',
};

export function EmailLog() {
  const [emails, setEmails] = useState<EmailLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const PAGE_SIZE = 50;

  useEffect(() => {
    api.getEmails({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }).then((r) => {
      setEmails(r.emails);
      setTotal(r.total);
    });
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Log</h1>

      <div className="space-y-2">
        {emails.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No emails logged yet</p>
        ) : emails.map((e) => (
          <div
            key={e.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
          >
            <button
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === e.id ? null : e.id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {e.subject ?? '(no subject)'}
                  </p>
                  <p className="text-xs text-gray-400">{e.sender_email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {e.error && (
                    <span className="text-xs text-red-500 font-medium">Error</span>
                  )}
                  {e.route_taken && (
                    <span className={`text-xs font-medium ${ROUTE_COLORS[e.route_taken] ?? 'text-gray-500'}`}>
                      {e.route_taken.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(e.processed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </button>

            {expanded === e.id && (
              <div className="border-t border-gray-100 px-4 py-3 text-xs space-y-2 bg-gray-50">
                <div>
                  <span className="font-medium text-gray-500">Thread ID: </span>
                  <span className="font-mono text-gray-700">{e.thread_id}</span>
                </div>
                {e.ai_classification && (
                  <div>
                    <span className="font-medium text-gray-500">AI Classification:</span>
                    <pre className="mt-1 bg-white border border-gray-200 rounded p-2 overflow-x-auto text-gray-700">
                      {JSON.stringify(e.ai_classification, null, 2)}
                    </pre>
                  </div>
                )}
                {e.error && (
                  <div>
                    <span className="font-medium text-red-500">Error:</span>
                    <p className="mt-1 text-red-600">{e.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>{total} total emails</span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Prev
          </button>
          <button
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
