import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { SkeletonMetricCard } from './ui/Skeleton';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'red' | 'gray';
  loading?: boolean;
}

const ICON_BG: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  gray: 'bg-gray-100 text-gray-500',
};

const VALUE_COLOR: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
};

export function MetricCard({ label, value, sub, icon, color = 'blue', loading }: Props) {
  if (loading) return <SkeletonMetricCard />;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', ICON_BG[color])}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={cn('text-2xl font-bold mt-0.5', VALUE_COLOR[color])}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
