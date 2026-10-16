import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Trash2, CheckSquare } from 'lucide-react';
import { Task, TaskPriority, TaskEffort, TaskStatus } from '../types';
import { resolveDateToIso, formatHumanDate } from '../utils/dateUtils';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [requester, setRequester] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [effort, setEffort] = useState<TaskEffort>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Open');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate);
      setRequester(task.requester);
      setPriority(task.priority);
      setEffort(task.effort);
      setStatus(task.status);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedIso = resolveDateToIso(dueDate);
    onSave({
      ...task,
      title: title.trim() || 'Untitled Action Item',
      description: description.trim(),
      dueDate: dueDate.trim() || formatHumanDate(resolvedIso),
      dueDateIso: resolvedIso,
      requester: requester.trim() || 'Team',
      priority,
      effort,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl bg-dark-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-dark-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <CheckSquare className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h3 id="edit-task-title" className="text-sm font-semibold text-white">
                Edit Task
              </h3>
              <p className="text-[11px] text-slate-400">Update commitment details</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <User className="w-3 h-3 text-slate-400" />
                Requester
              </label>
              <input
                type="text"
                value={requester}
                onChange={e => setRequester(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                placeholder="e.g. Friday, Tomorrow, Today"
                className="w-full px-3 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Effort</label>
              <select
                value={effort}
                onChange={e => setEffort(e.target.value as TaskEffort)}
                className="w-full px-2.5 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-2 text-xs bg-dark-950 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {task.sourceText && (
            <div className="pt-2">
              <label className="text-[11px] font-mono text-slate-500 block mb-1">
                Original verbal source:
              </label>
              <p className="text-xs text-slate-400 italic bg-dark-950/70 p-2.5 rounded-lg border border-slate-800">
                "{task.sourceText}"
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-lg shadow-brand-500/20 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
