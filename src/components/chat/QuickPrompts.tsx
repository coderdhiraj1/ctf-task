import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (text: string) => void;
  disabled?: boolean;
}

const PROMPTS = [
  {
    label: 'Query: What to deliver today',
    text: 'What do I need to deliver today?',
  },
  {
    label: 'Query: Low-hanging fruit',
    text: 'I have one hour, give me the low-hanging fruit',
  },
  {
    label: 'Complete: Vendor email done',
    text: 'I finished the vendor email',
  },
  {
    label: 'Query: Overdue tasks',
    text: "What's overdue?",
  },
  {
    label: 'Create: Verbal commitment',
    text: 'Sarah asked me to review the checkout PR by Friday. Medium priority.',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  return (
    <div className="px-4 py-2 bg-dark-900/60 border-t border-slate-800/80">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="w-3 h-3 text-brand-400" />
        <span className="text-[11px] font-medium text-slate-400">Quick sample notes to try:</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors shrink-0 max-w-[280px] truncate"
            title={p.text}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
