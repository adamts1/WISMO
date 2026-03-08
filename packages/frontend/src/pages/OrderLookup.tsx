import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useIsMobile } from '../hooks/useMediaQuery';
import type { ShopifyOrder } from '@oytiot/shared';

const FULFILLMENT_BADGE = {
  FULFILLED: { variant: 'green' as const, label: 'Fulfilled' },
  UNFULFILLED: { variant: 'yellow' as const, label: 'Unfulfilled' },
  PARTIALLY_FULFILLED: { variant: 'orange' as const, label: 'Partial' },
} as const;

export function OrderLookup() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'name' | 'email'>('name');
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const isMobile = useIsMobile();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const result = await api.lookupOrder(query.trim(), type);
      setOrders(result.orders);
    } catch {
      toast.error('Failed to look up order');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getFulfillmentBadge = (status: string) => {
    const entry = FULFILLMENT_BADGE[status as keyof typeof FULFILLMENT_BADGE];
    if (entry) return <Badge variant={entry.variant}>{entry.label}</Badge>;
    return <Badge variant="gray">{status.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div>
      <PageHeader title="Order Lookup" subtitle="Search by order number or email" />

      <Card className="mb-6">
        <form onSubmit={handleSearch} role="search" aria-label="Order search">
          <div className={isMobile ? 'space-y-3' : 'flex items-end gap-3'}>
            <div className={isMobile ? '' : 'w-48'}>
              <Select
                label="Search by"
                value={type}
                onChange={(e) => setType(e.target.value as 'name' | 'email')}
              >
                <option value="name">Order # (e.g. #1234)</option>
                <option value="email">Customer Email</option>
              </Select>
            </div>
            <div className={isMobile ? '' : 'flex-1'}>
              <Input
                label="Query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={type === 'name' ? '#1234' : 'customer@example.com'}
              />
            </div>
            <Button type="submit" loading={loading} className={isMobile ? 'w-full' : ''}>
              Search
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !searched ? (
        <EmptyState
          title="Search for orders"
          description="Enter an order number or customer email to get started"
          icon={
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      ) : orders && orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description={`No results for "${query}"`}
        />
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card key={order.order_id} className="animate-fade-in">
              {/* Header: Order name + fulfillment badge */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900">{order.order_name}</h3>
                  <p className="text-sm text-gray-500 font-mono truncate">{order.email}</p>
                </div>
                {getFulfillmentBadge(order.order_fulfillment_status)}
              </div>

              {/* Shipping address */}
              {order.shipping_address && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                  <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">
                    {order.shipping_address.name} &middot; {order.shipping_address.address1}, {order.shipping_address.city} {order.shipping_address.zip}
                  </span>
                </div>
              )}

              {/* Tracking section */}
              {order.tracking.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tracking</p>
                  <div className="space-y-2">
                    {order.tracking.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="blue" size="sm">{t.carrier ?? 'Unknown'}</Badge>
                        {t.tracking_url ? (
                          <a
                            href={t.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-brand-600 hover:underline truncate"
                          >
                            {t.tracking_number}
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-gray-600 truncate">
                            {t.tracking_number ?? 'No number'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending items section */}
              {order.pending_items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Still in Production</p>
                  <div className="space-y-2">
                    {order.pending_items.map((p, i) => {
                      const total = p.total_qty ?? p.remaining_qty;
                      const fulfilled = total - p.remaining_qty;
                      const pct = total > 0 ? (fulfilled / total) * 100 : 0;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 truncate">{p.title}</span>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">
                              {fulfilled}/{total} fulfilled
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
