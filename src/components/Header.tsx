import React from 'react';
import { CheckSquare, Settings, Sparkles, Cpu, RotateCcw } from 'lucide-react';
import { AppSettings } from '../types';
import { getActiveApiKey } from '../services/taskService';

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onResetTasks: () => void;
  taskCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onResetTasks,
  taskCount,
}) => {
  const { source, key } = getActiveApiKey(settings);
  const isGeminiActive = Boolean(key);

  return (
    <header className="h-14 border-b border-slate-800 bg-dark-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/20 border border-brand-400/30">
          <CheckSquare className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white tracking-tight">CommitDesk</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">
              v1.0
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hidden md:inline">
              {taskCount} active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Verbal meeting commitments → Structured board tasks
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Engine status indicator */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Click to configure Gemini API or view parser status"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-colors border bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300"
        >
          {isGeminiActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Sparkles className="w-3 h-3 text-brand-400 hidden xs:inline" />
              <span className="text-emerald-300 font-medium">
                Gemini AI {source === 'env' ? '(.env)' : '(Custom)'}
              </span>
            </>
          ) : (
            <>
              <Cpu className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400">Offline Parser</span>
            </>
          )}
        </button>

        {/* Reset tasks button */}
        <button
          type="button"
          onClick={onResetTasks}
          title="Reset board to initial realistic sample tasks"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors hidden sm:flex items-center gap-1 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px] text-slate-400">Reset Demo</span>
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors"
          aria-label="Settings"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
