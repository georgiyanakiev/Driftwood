import { ArrowRight, Cpu, Shield, MessageSquare, RotateCcw } from 'lucide-react';

export function PipelineDiagram() {
  const steps = [
    { icon: Cpu, label: 'LLM generates post', sublabel: 'With brand brief + topic' },
    { icon: Shield, label: 'Rule validator', sublabel: 'Deterministic hard gate' },
    { icon: MessageSquare, label: 'Voice reviewer', sublabel: 'LLM tone scoring' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-4">
        Pipeline
      </h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 rounded-xl border border-stone-100">
              <step.icon className="w-4 h-4 text-amber-800" />
              <div>
                <p className="text-xs font-medium text-stone-700">{step.label}</p>
                <p className="text-[10px] text-stone-400">{step.sublabel}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <p className="text-xs text-amber-700 font-medium">Up to 3 retries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
