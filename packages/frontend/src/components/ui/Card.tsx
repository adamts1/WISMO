import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

const PADDING = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

interface Props {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export function Card({ children, className, padding = 'md', hover }: Props) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl shadow-sm',
        PADDING[padding],
        hover && 'hover:shadow-md hover:border-gray-300 transition-shadow cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
