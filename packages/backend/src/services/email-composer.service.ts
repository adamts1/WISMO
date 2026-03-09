import { resolveTrackingUrl, type ShopifyOrder } from '@oytiot/shared';

const SIGNATURE = '\n\nBest regards,\nOytiot Team';

export function composeOrderDetailsEmail(orders: ShopifyOrder[]): {
  to: string;
  subject: string;
  body: string;
} {
  if (orders.length === 0) {
    throw new Error('No orders to compose email for');
  }

  const customerName = orders[0].shipping_address?.name ?? 'there';
  const customerEmail = orders[0].email;

  let body = `Hi ${customerName},\n\nHere is an update regarding your recent orders:\n\n`;
  body += '------------------------------------------\n';

  for (const order of orders) {
    body += `ORDER ${order.order_name}\n`;
    body += `Status: ${order.order_fulfillment_status}\n`;

    if (order.line_items.length > 0) {
      body += 'Items:\n';
      body += order.line_items
        .map((li) => `  - ${li.title} (x${li.quantity})`)
        .join('\n');
      body += '\n';
    }

    if (order.tracking.length > 0) {
      const total = order.tracking.length;
      const trackingLines = order.tracking
        .map((t, i) => {
          if (!t.tracking_number) {
            return `• Shipment ${i + 1}: Shipped — tracking not yet available`;
          }
          const url = resolveTrackingUrl(t.carrier, t.tracking_number, t.tracking_url);
          return `• Carrier: ${t.carrier ?? 'Unknown'} | Tracking: ${url ?? 'N/A'}`;
        })
        .join('\n');
      const shipmentHeader = total > 1 ? `Tracking Info (${total} shipments):\n` : 'Tracking Info:\n';
      body += `${shipmentHeader}${trackingLines}\n`;
    } else if (order.order_fulfillment_status === 'FULFILLED') {
      body += 'Tracking Info: Updated in your account.\n';
    } else {
      body += 'Tracking Info: Not available yet.\n';
    }

    if (order.pending_items.length > 0) {
      const pendingLines = order.pending_items
        .map((p) => `  - ${p.title} (qty ${p.remaining_qty})`)
        .join('\n');
      body += `Still in Production:\n${pendingLines}\n`;
    }

    body += '------------------------------------------\n';
  }

  body += `\nIf you have any questions, feel free to reply to this email.${SIGNATURE}`;

  return {
    to: customerEmail,
    subject: `Update regarding your orders: ${orders.map((o) => o.order_name).join(', ')}`,
    body,
  };
}

export function composeAskForOrderNumberEmail(): string {
  return (
    `Hi there,\n\n` +
    `I'm ready to check on your delivery, I just need one small thing: your order number.\n` +
    `Simply reply to this email with the number, and I'll get back to you with the status in seconds.` +
    `\n\nThanks! Oytiot Team`
  );
}

export function composeAskForOrderNumberHtml(): string {
  return `<p>Hello,</p>
  <p>Thank you for your message 😊<br>
  To help us locate your order quickly, please reply with your <strong>order number</strong>.</p>
  <p>You can find it in your confirmation email, as shown below:</p>
  <p><img src="https://electro-slil.netlify.app/assets/order-name-pic-BUBsscTi.jpeg" width="300" style="border-radius:8px;" /></p>
  <p>Once we receive your order number, we'll be happy to assist you right away.</p>
  <p>Best regards,<br>Oytiot Team</p>`;
}

export function composeNoEmailZipMatchEmail(): string {
  return (
    `Hi,\n\nThanks for your message.\n` +
    `The email address you used does not match the ZIP code you provided in our system.\n` +
    `Please reply to this email with your order number, and we'll continue checking your order details right away.` +
    `\n\nThank you,\nOytiot Team`
  );
}

export function composeHumanAlertEmail(params: {
  sender: string;
  subject: string;
  receivedAt: string;
  reason: string;
}): string {
  return (
    `Human intervention required\n\n` +
    `Sender: ${params.sender}\n` +
    `Subject: ${params.subject}\n` +
    `Received at: ${params.receivedAt}\n\n` +
    `Reason: ${params.reason}`
  );
}

export function appendSignature(text: string): string {
  return `${text}${SIGNATURE}`;
}
