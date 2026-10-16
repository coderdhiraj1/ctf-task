import React from 'react';
import { ChatMessage as ChatMessageType, Task } from '../../types';
import { Sparkles, Cpu, CheckSquare, Calendar, User, AlertCircle, ArrowUpRight } from 'lucide-react';
import { PriorityBadge, EffortBadge } from '../common/Badge';

interface ChatMessageProps {
  message: ChatMessageType;
  createdTasks?: Task[];
  onFocusTask?: (taskId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  createdTasks = [],
  onFocusTask,
}) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-full flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end my-3">
        <div className="max-w-[85%] sm:max-w-[78%]">
          <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-md shadow-brand-500/10">
            <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex justify-end mt-1 px-1">
            <span className="text-[10px] text-slate-500 font-mono">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start my-3">
      <div className="max-w-[92%] sm:max-w-[85%] space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-slate-200">CommitDesk Assistant</span>
          {message.parsedMethod && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                message.parsedMethod === 'gemini'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {message.parsedMethod === 'gemini' ? (
                <>
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                  Gemini AI
                </>
              ) : (
                <>
                  <Cpu className="w-2.5 h-2.5 text-slate-400" />
                  Deterministic Engine
                </>
              )}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-mono ml-auto">
            {formatTime(message.timestamp)}
          </span>
        </div>

        <div className="bg-dark-900 border border-slate-800 rounded-2xl rounded-tl-sm p-3.5 shadow-sm space-y-3">
          <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Render preview of tasks created by this message */}
          {createdTasks.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
                  Created {createdTasks.length} {createdTasks.length === 1 ? 'task' : 'tasks'} on the board:
                </span>
              </div>

              <div className="space-y-2">
                {createdTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onFocusTask?.(task.id)}
                    className="group flex flex-col p-2.5 rounded-xl bg-dark-950/80 hover:bg-slate-800/50 border border-slate-800 hover:border-brand-500/40 cursor-pointer transition-all"
                    title="Click to view and highlight task on board"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-slate-200 group-hover:text-brand-300 transition-colors">
                        {task.title}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors shrink-0" />
                    </div>

                    <div className="flex items-center flex-wrap gap-2 mt-2 pt-1 border-t border-slate-800/60 text-[11px]">
                      <PriorityBadge priority={task.priority} size="sm" />
                      <EffortBadge effort={task.effort} />
                      <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                        <User className="w-3 h-3 text-slate-500" />
                        {task.requester}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message.isError && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Could not extract actionable tasks from this message.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
