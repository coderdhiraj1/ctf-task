import React from 'react';
import { TaskPriority, TaskEffort, TaskStatus } from '../../types';
import { AlertCircle, AlertTriangle, Clock, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { getDueStatus } from '../../utils/dateUtils';

export const PriorityBadge: React.FC<{ priority: TaskPriority; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  const styles: Record<TaskPriority, string> = {
    Critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    High: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    Low: 'bg-slate-500/15 text-slate-300 border-slate-600/40',
  };

  const icons: Record<TaskPriority, React.ReactNode> = {
    Critical: <AlertCircle className="w-3 h-3 text-rose-400" />,
    High: <AlertTriangle className="w-3 h-3 text-orange-400" />,
    Medium: <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />,
    Low: <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />,
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-tight font-medium ${pad} ${styles[priority]}`}
    >
      {icons[priority]}
      <span>{priority}</span>
    </span>
  );
};

export const EffortBadge: React.FC<{ effort: TaskEffort }> = ({ effort }) => {
  const styles: Record<TaskEffort, string> = {
    Small: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    Medium: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    Large: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  };

  const bars: Record<TaskEffort, string> = {
    Small: 'S',
    Medium: 'M',
    Large: 'L',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono border ${styles[effort]}`}
      title={`Effort size: ${effort}`}
    >
      <span className="font-bold opacity-80">{bars[effort]}</span>
      <span className="text-slate-400">effort</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus; onClick?: () => void }> = ({
  status,
  onClick,
}) => {
  const styles: Record<TaskStatus, { bg: string; icon: React.ReactNode }> = {
    Open: {
      bg: 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500',
      icon: <Circle className="w-3.5 h-3.5 text-slate-400" />,
    },
    'In Progress': {
      bg: 'bg-blue-950/80 text-blue-300 border-blue-800/80 hover:border-blue-600',
      icon: <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse-subtle" />,
    },
    Completed: {
      bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 hover:border-emerald-600',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    },
  };

  const item = styles[status] || styles.Open;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${item.bg}`}
    >
      {item.icon}
      <span>{status}</span>
    </button>
  );
};

export const DueDateBadge: React.FC<{
  dueDate: string;
  dueDateIso: string;
  status: TaskStatus;
}> = ({ dueDate, dueDateIso, status }) => {
  const { isOverdue, isDueToday } = getDueStatus(dueDateIso, status);

  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
        <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
        <span className="line-through">{dueDate}</span>
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30"
        title="Overdue task"
      >
        <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
        <span>Overdue ({dueDate})</span>
      </span>
    );
  }

  if (isDueToday) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30"
        title="Due today"
      >
        <Clock className="w-3 h-3 text-amber-400" />
        <span>Due Today</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
      <Calendar className="w-3 h-3 text-slate-500" />
      <span>{dueDate}</span>
    </span>
  );
};
