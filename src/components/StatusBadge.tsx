import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: 'generating' | 'published' | 'held';
}

const config = {
  generating: {
    icon: Loader2,
    label: 'Generating',
    classes: 'bg-blue-50 text-blue-700 border-blue-200',
    iconClass: 'animate-spin',
  },
  published: {
    icon: CheckCircle2,
    label: 'Published',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconClass: '',
  },
  held: {
    icon: AlertTriangle,
    label: 'Held',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    iconClass: '',
  },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status];
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${c.classes}`}>
      <Icon className={`w-3.5 h-3.5 ${c.iconClass}`} />
      {c.label}
    </span>
  );
}
