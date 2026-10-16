import { Search, X } from 'lucide-react';
import { TaskFilterOptions, TaskStatus, TaskPriority, TaskEffort } from '../../types';

interface TaskFiltersProps {
  filters: TaskFilterOptions;
  onChangeFilters: (newFilters: TaskFilterOptions) => void;
  totalTasksCount: number;
  filteredTasksCount: number;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onChangeFilters,
  totalTasksCount,
  filteredTasksCount,
}) => {
  const statusTabs: Array<{ id: 'All' | TaskStatus; label: string }> = [
    { id: 'All', label: 'All Tasks' },
    { id: 'Open', label: 'Open' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Completed', label: 'Completed' },
  ];

  const hasActiveFilters =
    filters.status !== 'All' ||
    filters.priority !== 'All' ||
    filters.effort !== 'All' ||
    Boolean(filters.search);

  return (
    <div className="p-4 border-b border-slate-800 bg-dark-900/40 space-y-3 shrink-0">
      {/* Search and Sort row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onChangeFilters({ ...filters, search: e.target.value })}
            placeholder="Filter tasks by title, description, or requester..."
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-dark-950 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChangeFilters({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Priority & Effort & Sort */}
        <div className="flex items-center gap-2">
          {/* Priority */}
          <select
            value={filters.priority}
            onChange={e => onChangeFilters({ ...filters, priority: e.target.value as 'All' | TaskPriority })}
            className="px-2.5 py-1.5 text-xs bg-dark-950 border border-slate-700/80 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500"
            title="Filter by Priority"
          >
            <option value="All">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Effort */}
          <select
            value={filters.effort}
            onChange={e => onChangeFilters({ ...filters, effort: e.target.value as 'All' | TaskEffort })}
            className="px-2.5 py-1.5 text-xs bg-dark-950 border border-slate-700/80 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500"
            title="Filter by Effort"
          >
            <option value="All">All Effort</option>
            <option value="Small">Small Effort</option>
            <option value="Medium">Medium Effort</option>
            <option value="Large">Large Effort</option>
          </select>

          {/* Sort By */}
          <div className="relative flex items-center">
            <select
              value={filters.sortBy}
              onChange={e => onChangeFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-2.5 py-1.5 text-xs bg-dark-950 border border-slate-700/80 rounded-lg text-slate-300 focus:outline-none focus:border-brand-500 font-mono"
              title="Sort Tasks"
            >
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="createdAt">Sort: Recent</option>
              <option value="title">Sort: Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {statusTabs.map(tab => {
            const isActive = filters.status === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeFilters({ ...filters, status: tab.id })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono shrink-0">
          <span>
            Showing {filteredTasksCount} of {totalTasksCount}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() =>
                onChangeFilters({
                  status: 'All',
                  priority: 'All',
                  effort: 'All',
                  search: '',
                  sortBy: 'dueDate',
                })
              }
              className="text-brand-400 hover:text-brand-300 underline font-sans ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
