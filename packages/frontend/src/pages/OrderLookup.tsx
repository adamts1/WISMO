import { useState } from 'react';
import { api } from '../api/client';
import type { ShopifyOrder } from '@oytiot/shared';

export function OrderLookup() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'name' | 'email'>('name');
  const [orders, setOrders] = useState<ShopifyOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.lookupOrder(query.trim(), type);
      setOrders(result.orders);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Lookup</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'name' | 'email')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Order # (e.g. #1234)</option>
          <option value="email">Customer Email</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={type === 'name' ? '#1234' : 'customer@example.com'}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {orders !== null && orders.length === 0 && (
        <p className="text-gray-400 text-sm">No orders found for "{query}"</p>
      )}

      <div className="space-y-4">
        {orders?.map((order) => (
          <div key={order.order_id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{order.order_name}</h3>
                <p className="text-sm text-gray-500">{order.email}</p>
              </div>
              <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                order.order_fulfillment_status === 'FULFILLED'
                  ? 'bg-green-100 text-green-700'
                  : order.order_fulfillment_status === 'UNFULFILLED'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {order.order_fulfillment_status}
              </span>
            </div>

            {order.shipping_address && (
              <p className="text-sm text-gray-600 mb-3">
                {order.shipping_address.name} · {order.shipping_address.city}, {order.shipping_address.zip}
              </p>
            )}

            {order.tracking.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Tracking</p>
                <ul className="space-y-1">
                  {order.tracking.map((t, i) => (
                    <li key={i} className="text-sm">
                      <span className="text-gray-500">{t.carrier}</span>
                      {t.tracking_url ? (
                        <a
                          href={t.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline font-mono text-xs"
                        >
                          {t.tracking_number}
                        </a>
                      ) : (
                        <span className="ml-2 font-mono text-xs text-gray-600">{t.tracking_number}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {order.pending_items.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Still in Production</p>
                <ul className="text-sm space-y-0.5">
                  {order.pending_items.map((p, i) => (
                    <li key={i} className="text-gray-600">
                      {p.title} <span className="text-gray-400">(qty {p.remaining_qty})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
