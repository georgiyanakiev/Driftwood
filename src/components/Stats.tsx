import { CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import type { Post } from '@/lib/types';

interface StatsProps {
  posts: Post[];
}

export function Stats({ posts }: StatsProps) {
  const published = posts.filter((p) => p.status === 'published').length;
  const held = posts.filter((p) => p.status === 'held').length;
  const total = posts.length;

  const items = [
    { icon: FileText, label: 'Total', value: total, color: 'text-stone-600' },
    { icon: CheckCircle2, label: 'Published', value: published, color: 'text-emerald-600' },
    { icon: AlertTriangle, label: 'Held', value: held, color: 'text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-xl border border-stone-200 p-4 text-center"
        >
          <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1.5`} />
          <p className="text-2xl font-semibold text-stone-800">{item.value}</p>
          <p className="text-xs text-stone-400 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
