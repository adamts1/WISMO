import { cn } from '../../lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-skeleton rounded bg-gray-200', className)} aria-busy="true" />;
}

export function SkeletonMetricCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" aria-busy="true">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-2 w-28" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-gray-100" aria-busy="true">
      <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
      <td className="py-3 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-8" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
      <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
      <td className="py-3 px-4"><Skeleton className="h-7 w-14 rounded-lg" /></td>
    </tr>
  );
}

export function SkeletonEmailCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm" aria-busy="true">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm" aria-busy="true">
      <Skeleton className="h-4 w-40 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
