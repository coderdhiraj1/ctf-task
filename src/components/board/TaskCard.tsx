import React from 'react';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge, EffortBadge, DueDateBadge } from '../common/Badge';
import { User, Edit3, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { getDueStatus } from '../../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isHighlighted?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isHighlighted = false,
}) => {
  const { isOverdue, isDueToday } = getDueStatus(task.dueDateIso, task.status);

  // Status toggle handler
  const handleCycleStatus = () => {
    if (task.status === 'Open') onStatusChange(task.id, 'In Progress');
    else if (task.status === 'In Progress') onStatusChange(task.id, 'Completed');
    else onStatusChange(task.id, 'Open');
  };

  // Determine border styling based on status & overdue
  let borderClass = 'border-slate-800/90 hover:border-slate-700';
  if (isHighlighted) {
    borderClass = 'border-brand-500 shadow-lg shadow-brand-500/25 ring-1 ring-brand-500 animate-highlight';
  } else if (task.status === 'Completed') {
    borderClass = 'border-emerald-900/40 bg-dark-900/40 opacity-80';
  } else if (isOverdue) {
    borderClass = 'border-rose-900/60 bg-dark-900 hover:border-rose-700/80';
  } else if (isDueToday) {
    borderClass = 'border-amber-900/60 bg-dark-900 hover:border-amber-700/80';
  } else {
    borderClass = 'bg-dark-900 hover:border-slate-700';
  }

  return (
    <div
      id={`task-card-${task.id}`}
      className={`group relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${borderClass}`}
    >
      <div>
        {/* Top bar: Status Checkbox & Priority & Effort & Actions */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick status circle button */}
            <button
              type="button"
              onClick={handleCycleStatus}
              title={`Status: ${task.status}. Click to cycle.`}
              className="text-slate-400 hover:text-brand-400 transition-colors shrink-0"
            >
              {task.status === 'Completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : task.status === 'In Progress' ? (
                <Clock className="w-4 h-4 text-blue-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-500 hover:text-brand-400" />
              )}
            </button>

            <PriorityBadge priority={task.priority} />
            <EffortBadge effort={task.effort} />
          </div>

          {/* Action buttons (Edit & Delete) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(task)}
              title="Edit task"
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              title="Delete task"
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          className={`text-xs sm:text-sm font-semibold leading-snug mb-1.5 transition-colors ${
            task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-100'
          }`}
        >
          {task.title}
        </h3>

        {/* Short Description */}
        {task.description && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Info: Requester, Due Date, Status select */}
      <div className="pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] gap-2 mt-auto">
        <div className="flex items-center gap-3">
          {/* Requester */}
          <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
            <User className="w-3 h-3 text-slate-500" />
            <span className="truncate max-w-[110px]" title={`Requested by: ${task.requester}`}>
              {task.requester}
            </span>
          </span>

          {/* Due Date Badge */}
          <DueDateBadge
            dueDate={task.dueDate}
            dueDateIso={task.dueDateIso}
            status={task.status}
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value as TaskStatus)}
          className={`text-[11px] font-medium font-mono px-2 py-0.5 rounded border bg-dark-950 focus:outline-none transition-colors ${
            task.status === 'Completed'
              ? 'text-emerald-300 border-emerald-800/80'
              : task.status === 'In Progress'
              ? 'text-blue-300 border-blue-800/80'
              : 'text-slate-300 border-slate-700'
          }`}
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
    </div>
  );
};
