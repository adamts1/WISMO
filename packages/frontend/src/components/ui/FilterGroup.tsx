import { cn } from '../../lib/cn';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function FilterGroup({ options, value, onChange, ariaLabel = 'Filters' }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
            'min-h-[36px] md:min-h-0',
            value === opt.value
              ? 'bg-brand-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
