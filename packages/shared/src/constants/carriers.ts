export const CARRIER_TEMPLATES: Record<string, string> = {
  ontrac: 'https://www.ontrac.com/tracking/?number=',
  dhl: 'https://webtrack.dhlglobalmail.com/?trackingnumber=',
  ups: 'https://www.ups.com/track?tracknum=',
  fedex: 'https://www.fedex.com/apps/fedextrack/?tracknumbers=',
  usps: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  evri: 'https://www.evri.com/track/parcel/',
  mailingtechnology: 'https://mailingtechnology.com/tracking/?tn=',
  spring: 'https://www.spring-gds.com/tracking?barcode=',
};

export function resolveTrackingUrl(
  carrier: string | null,
  trackingNumber: string | null,
  fallbackUrl: string | null,
): string | null {
  if (!trackingNumber) return fallbackUrl;
  const key = (carrier ?? '').toLowerCase();

  if (key.includes('mailingtechnology') || key.includes('mailing technology')) {
    return CARRIER_TEMPLATES['mailingtechnology'] + trackingNumber;
  }
  if (key.includes('ontrac')) return CARRIER_TEMPLATES['ontrac'] + trackingNumber;
  if (key.includes('evri'))
    return `https://www.evri.com/track/parcel/${trackingNumber}/details`;
  if (key.includes('dhl'))
    return `https://webtrack.dhlglobalmail.com/?trackingnumber=${trackingNumber}`;
  if (key.includes('ups')) return CARRIER_TEMPLATES['ups'] + trackingNumber;
  if (key.includes('fedex')) return CARRIER_TEMPLATES['fedex'] + trackingNumber;
  if (key.includes('usps')) return CARRIER_TEMPLATES['usps'] + trackingNumber;
  if (key.includes('spring'))
    return `https://www.spring-gds.com/tracking?barcode=${trackingNumber}`;

  // No carrier match — prefer any URL (Shopify-provided like myorders.co) over bare number
  if (fallbackUrl) return fallbackUrl;

  // Build mailingtechnology URL for tracking numbers that look like international postal (2 letters + digits + 2 letters)
  if (/^[A-Z]{2}\d{9,}[A-Z]{2}$/i.test(trackingNumber)) {
    return CARRIER_TEMPLATES['mailingtechnology'] + trackingNumber;
  }

  return trackingNumber;
}
