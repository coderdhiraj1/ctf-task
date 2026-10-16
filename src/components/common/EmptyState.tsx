import React from 'react';
import { Inbox, FilterX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  type: 'filtered' | 'empty-board';
  onResetFilters?: () => void;
  onResetInitialTasks?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onResetFilters,
  onResetInitialTasks,
}) => {
  if (type === 'filtered') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3">
          <FilterX className="w-6 h-6 text-slate-400" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">No matching tasks found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Try loosening your search term or adjusting status and priority filters.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-3 py-1.5 text-xs font-medium text-brand-300 hover:text-brand-200 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6 text-slate-400" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200">Task board is currently empty</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        Paste verbally assigned meeting commitments or notes in the chat panel on the left to instantly extract and generate new tasks.
      </p>
      {onResetInitialTasks && (
        <button
          type="button"
          onClick={onResetInitialTasks}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload Sample Tasks</span>
        </button>
      )}
    </div>
  );
};
