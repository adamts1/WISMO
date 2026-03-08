import { Badge, type BadgeVariant } from './ui/Badge';

const STATUS_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  waiting_for_order_number: { variant: 'yellow', label: 'Waiting for Order #' },
  searching: { variant: 'blue', label: 'Searching' },
  close: { variant: 'gray', label: 'Closed' },
};

export function StatusBadge({ status }: { status: string }) {
  const { variant, label } = STATUS_MAP[status] ?? { variant: 'gray' as BadgeVariant, label: status.replace(/_/g, ' ') };
  return <Badge variant={variant}>{label}</Badge>;
}
