import { Button } from './Button';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  const hasNext = end < total;
  const hasPrev = page > 0;

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between pt-4" aria-label="Pagination">
      <p className="text-sm text-gray-500">
        {start}–{end} of {total}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
          Prev
        </Button>
        <Button variant="secondary" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
