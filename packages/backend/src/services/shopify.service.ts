import { GraphQLClient } from 'graphql-request';
import { env } from '../config/env.js';
import { resolveTrackingUrl, type ShopifyOrder } from '@oytiot/shared';

const endpoint = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`;

const client = new GraphQLClient(endpoint, {
  headers: {
    'X-Shopify-Access-Token': env.SHOPIFY_ACCESS_TOKEN,
  },
});

// ---------- Shared GraphQL fragments ----------

const ORDER_FIELDS = /* GraphQL */ `
  id
  name
  email
  createdAt
  displayFulfillmentStatus
  displayFinancialStatus
  shippingAddress {
    name
    city
    zip
    countryCodeV2
    address1
  }
  lineItems(first: 50) {
    nodes {
      id
      title
      quantity
      sku
    }
  }
  fulfillments(first: 10) {
    status
    createdAt
    trackingInfo {
      company
      number
      url
    }
  }
  fulfillmentOrders(first: 10) {
    nodes {
      id
      status
      requestStatus
      assignedLocation { name }
      deliveryMethod { methodType }
      lineItems(first: 50) {
        nodes {
          totalQuantity
          remainingQuantity
          lineItem {
            id
            title
            sku
          }
        }
      }
    }
  }
`;

// ---------- Mappers ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrderNode(node: any): ShopifyOrder {
  const tracking = (node.fulfillments ?? []).flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (f: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f.trackingInfo ?? []).map((t: any) => ({
        carrier: t.company ?? null,
        tracking_number: t.number ?? null,
        tracking_url: resolveTrackingUrl(t.company, t.number, t.url),
        fulfillment_status: f.status ?? null,
        fulfillment_created_at: f.createdAt ?? null,
      })),
  );

  const pendingItems = (node.fulfillmentOrders?.nodes ?? []).flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fo: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fo.lineItems?.nodes ?? [])
        .filter((li: any) => (li.remainingQuantity ?? 0) > 0)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((li: any) => ({
          line_item_id: li.lineItem?.id ?? null,
          title: li.lineItem?.title ?? null,
          sku: li.lineItem?.sku ?? null,
          remaining_qty: li.remainingQuantity,
          total_qty: li.totalQuantity ?? null,
          fulfillment_order_status: fo.status,
          requestStatus: fo.requestStatus,
          assignedLocation: fo.assignedLocation?.name ?? null,
        })),
  );

  return {
    order_id: node.id,
    order_name: node.name,
    email: node.email,
    created_at: node.createdAt,
    order_fulfillment_status: node.displayFulfillmentStatus,
    tracking,
    pending_items: pendingItems,
    shipping_address: node.shippingAddress ?? null,
  };
}

// ---------- Queries ----------

export async function getOrdersByName(orderName: string): Promise<ShopifyOrder[]> {
  const query = /* GraphQL */ `
    query GetOrderByName($q: String!) {
      orders(first: 5, query: $q, sortKey: CREATED_AT, reverse: true) {
        edges { node { ${ORDER_FIELDS} } }
      }
    }
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await client.request<any>(query, { q: `name:${orderName}` });
  return (data.orders.edges ?? []).map((e: any) => mapOrderNode(e.node));
}

export async function getOrdersByEmail(email: string): Promise<ShopifyOrder[]> {
  const query = /* GraphQL */ `
    query GetOrdersByEmail($query: String!) {
      orders(first: 5, query: $query) {
        edges { node { ${ORDER_FIELDS} } }
      }
    }
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await client.request<any>(query, { query: `email:${email}` });
  return (data.orders.edges ?? []).map((e: any) => mapOrderNode(e.node));
}

export async function getOrdersByZip(zip: string): Promise<ShopifyOrder[]> {
  const query = /* GraphQL */ `
    query GetOrdersByZip($query: String!) {
      orders(first: 10, query: $query) {
        edges {
          node {
            id
            name
            email
            displayFulfillmentStatus
            createdAt
            shippingAddress {
              address1
              city
              zip
              name
            }
            fulfillments {
              status
              trackingInfo {
                company
                number
                url
              }
            }
            fulfillmentOrders(first: 10) {
              nodes {
                id
                status
                requestStatus
                lineItems(first: 50) {
                  nodes {
                    totalQuantity
                    remainingQuantity
                    lineItem { id title sku }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await client.request<any>(query, { query: `shipping_address:zip:${zip}` });
  return (data.orders.edges ?? []).map((e: any) => mapOrderNode(e.node));
}

/**
 * Retry wrapper for Shopify calls (max 2 retries on transient errors).
 */
export async function withShopifyRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < 2) await sleep(1_000 * (i + 1));
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
