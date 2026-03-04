interface Props {
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  waiting_for_order_number: 'bg-yellow-100 text-yellow-800',
  searching: 'bg-blue-100 text-blue-800',
  close: 'bg-gray-100 text-gray-600',
};

export function StatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
