import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';

const VARIANTS: Record<BadgeVariant, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-gray-100 text-gray-600',
};

interface Props {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'gray', size = 'sm', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
