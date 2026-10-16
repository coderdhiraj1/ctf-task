import React, { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, Task, AppSettings } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';
import { QuickPrompts } from './QuickPrompts';
import { MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { getActiveApiKey } from '../../services/taskService';

interface ChatPanelProps {
  messages: ChatMessageType[];
  tasks: Task[];
  onSendMessage: (text: string) => void;
  onClearMessages: () => void;
  isLoading: boolean;
  settings: AppSettings;
  onFocusTask?: (taskId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  tasks,
  onSendMessage,
  onClearMessages,
  isLoading,
  settings,
  onFocusTask,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { key: activeKey } = getActiveApiKey(settings);
  const isGeminiActive = Boolean(activeKey);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Map task IDs for fast lookup
  const taskMap = React.useMemo(() => {
    const map = new Map<string, Task>();
    for (const t of tasks) {
      map.set(t.id, t);
    }
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-slate-800">
      {/* Chat Panel Sub-Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-dark-850 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-wide uppercase">Meeting Input</h2>
            <p className="text-[11px] text-slate-400">Paste rough notes or verbal commitments</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={onClearMessages}
              title="Clear chat history"
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => {
          const createdTasks = (msg.createdTaskIds || [])
            .map(id => taskMap.get(id))
            .filter((t): t is Task => Boolean(t));

          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              createdTasks={createdTasks}
              onFocusTask={onFocusTask}
            />
          );
        })}

        {isLoading && (
          <div className="flex justify-start my-3">
            <div className="bg-dark-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
              <div className="w-5 h-5 rounded-md bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 animate-spin">
                <Sparkles className="w-3 h-3" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-300 font-medium">Extracting commitments...</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {isGeminiActive ? 'Analyzing text via Gemini structured schema' : 'Parsing sentences with local deterministic engine'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick sample prompt chips */}
      <QuickPrompts onSelectPrompt={onSendMessage} disabled={isLoading} />

      {/* Chat input composer */}
      <ChatComposer
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        isGeminiActive={isGeminiActive}
      />
    </div>
  );
};
