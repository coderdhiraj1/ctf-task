import React from 'react';
import { Task } from '../../types';
import { getDueStatus } from '../../utils/dateUtils';
import { Circle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TaskSummaryProps {
  tasks: Task[];
  activeStatusFilter: string;
  onSelectFilter: (status: 'All' | 'Open' | 'In Progress' | 'Completed') => void;
}

export const TaskSummary: React.FC<TaskSummaryProps> = ({
  tasks,
  activeStatusFilter,
  onSelectFilter,
}) => {
  let openCount = 0;
  let inProgressCount = 0;
  let completedCount = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;

  for (const t of tasks) {
    if (t.status === 'Open') openCount++;
    if (t.status === 'In Progress') inProgressCount++;
    if (t.status === 'Completed') completedCount++;

    const due = getDueStatus(t.dueDateIso, t.status);
    if (due.isDueToday) dueTodayCount++;
    if (due.isOverdue) overdueCount++;
  }

  const activeTotal = openCount + inProgressCount;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-slate-800 bg-dark-900/60 shrink-0">
      {/* Open */}
      <button
        type="button"
        onClick={() => onSelectFilter(activeStatusFilter === 'Open' ? 'All' : 'Open')}
        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
          activeStatusFilter === 'Open'
            ? 'bg-slate-800/90 border-brand-500/50 shadow-sm shadow-brand-500/10'
            : 'bg-dark-950/60 border-slate-800 hover:border-slate-700/80'
        }`}
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 block">Open Tasks</span>
          <span className="text-lg font-bold text-slate-100 font-mono">{activeTotal}</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
          <Circle className="w-4 h-4 text-slate-400" />
        </div>
      </button>

      {/* Due Today */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
          dueTodayCount > 0
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-dark-950/60 border-slate-800 text-slate-400'
        }`}
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 block">Due Today</span>
          <span className={`text-lg font-bold font-mono ${dueTodayCount > 0 ? 'text-amber-300' : 'text-slate-100'}`}>
            {dueTodayCount}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* Overdue */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
          overdueCount > 0
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            : 'bg-dark-950/60 border-slate-800 text-slate-400'
        }`}
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 block">Overdue</span>
          <span className={`text-lg font-bold font-mono ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {overdueCount}
          </span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center">
          <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
        </div>
      </div>

      {/* Completed */}
      <button
        type="button"
        onClick={() => onSelectFilter(activeStatusFilter === 'Completed' ? 'All' : 'Completed')}
        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
          activeStatusFilter === 'Completed'
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
            : 'bg-dark-950/60 border-slate-800 hover:border-slate-700/80'
        }`}
      >
        <div className="space-y-0.5">
          <span className="text-[11px] font-medium text-slate-400 block">Completed</span>
          <span className="text-lg font-bold text-slate-100 font-mono">{completedCount}</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      </button>
    </div>
  );
};
