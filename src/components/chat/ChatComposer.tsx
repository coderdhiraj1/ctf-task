import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, CornerDownLeft } from 'lucide-react';

interface ChatComposerProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  isGeminiActive: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
  isGeminiActive,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 bg-dark-900 border-t border-slate-800 shrink-0">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl bg-dark-950 border border-slate-700/80 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              isGeminiActive
                ? 'Type or paste verbal commitments, notes, or bullet points... (Gemini AI parsing)'
                : 'Type or paste verbal commitments, notes, or bullet points... (Local parsing)'
            }
            className="w-full px-4 pt-3 pb-12 text-xs sm:text-[13px] bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          <div className="absolute left-3.5 bottom-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono select-none">
            <span className="hidden sm:inline">Press</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] inline-flex items-center gap-0.5">
              <span>Enter</span>
              <CornerDownLeft className="w-2.5 h-2.5" />
            </span>
            <span className="hidden sm:inline">to create tasks,</span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">Shift+Enter for newline</span>
          </div>

          <div className="absolute right-2.5 bottom-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-brand-600 hover:bg-brand-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-brand-500/20"
              aria-label="Send notes to convert to tasks"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-brand-200" />
                  <span>Convert</span>
                  <Send className="w-3 h-3 ml-0.5 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
