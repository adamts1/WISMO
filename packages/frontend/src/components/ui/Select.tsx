import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, id, children, ...rest }: Props) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          'min-h-[44px] md:min-h-0',
          'text-gray-900',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}
