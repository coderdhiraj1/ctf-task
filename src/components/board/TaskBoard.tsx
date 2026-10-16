import React, { useState, useMemo } from 'react';
import { Task, TaskFilterOptions, TaskStatus } from '../../types';
import { TaskSummary } from './TaskSummary';
import { TaskFilters } from './TaskFilters';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../common/EmptyState';
import { LayoutGrid, Layers } from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onResetInitialTasks: () => void;
  highlightedTaskIds: string[];
}

const PRIORITY_ORDER: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onResetInitialTasks,
  highlightedTaskIds,
}) => {
  const [filters, setFilters] = useState<TaskFilterOptions>({
    status: 'All',
    priority: 'All',
    effort: 'All',
    search: '',
    sortBy: 'dueDate',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Filter and Sort Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        // Status filter
        if (filters.status !== 'All' && t.status !== filters.status) return false;
        // Priority filter
        if (filters.priority !== 'All' && t.priority !== filters.priority) return false;
        // Effort filter
        if (filters.effort !== 'All' && t.effort !== filters.effort) return false;
        // Search filter
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchReq = t.requester.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchReq) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'dueDate') {
          // Completed tasks go to bottom if not filtering for completed
          if (a.status === 'Completed' && b.status !== 'Completed') return 1;
          if (a.status !== 'Completed' && b.status === 'Completed') return -1;
          // Sort by dueDateIso
          return a.dueDateIso.localeCompare(b.dueDateIso);
        }
        if (filters.sortBy === 'priority') {
          const pA = PRIORITY_ORDER[a.priority] || 0;
          const pB = PRIORITY_ORDER[b.priority] || 0;
          return pB - pA;
        }
        if (filters.sortBy === 'createdAt') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filters.sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, filters]);

  return (
    <div className="flex flex-col h-full bg-dark-950 overflow-hidden">
      {/* Board Header Bar */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-dark-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-white tracking-wide uppercase">Live Task Board</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {tasks.length} total
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Real-time structured action items extracted from commitments</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'compact' : 'grid')}
            title={`Switch to ${viewMode === 'grid' ? 'compact single-column' : 'grid'} layout`}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary strip at top */}
      <TaskSummary
        tasks={tasks}
        activeStatusFilter={filters.status}
        onSelectFilter={status => setFilters(prev => ({ ...prev, status }))}
      />

      {/* Filter and search bar */}
      <TaskFilters
        filters={filters}
        onChangeFilters={setFilters}
        totalTasksCount={tasks.length}
        filteredTasksCount={filteredTasks.length}
      />

      {/* Task Cards Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {tasks.length === 0 ? (
          <EmptyState type="empty-board" onResetInitialTasks={onResetInitialTasks} />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            type="filtered"
            onResetFilters={() =>
              setFilters({
                status: 'All',
                priority: 'All',
                effort: 'All',
                search: '',
                sortBy: 'dueDate',
              })
            }
          />
        ) : (
          <div
            className={`grid gap-3.5 ${
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-1 xl:grid-cols-2'
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}
          >
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                isHighlighted={highlightedTaskIds.includes(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
