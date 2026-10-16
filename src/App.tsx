import React, { useState, useEffect, useCallback } from 'react';
import { Task, ChatMessage as ChatMessageType, AppSettings, TaskStatus } from './types';
import { initialTasks } from './data/initialTasks';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadMessagesFromStorage,
  saveMessagesToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
} from './utils/storage';
import { handleUserChatAction } from './services/taskService';
import { Header } from './components/Header';
import { ChatPanel } from './components/chat/ChatPanel';
import { TaskBoard } from './components/board/TaskBoard';
import { SettingsModal } from './components/SettingsModal';
import { TaskEditModal } from './components/TaskEditModal';
import { MessageSquare, LayoutGrid } from 'lucide-react';

const INITIAL_WELCOME_MESSAGE: ChatMessageType = {
  id: 'msg-welcome',
  sender: 'assistant',
  content:
    'Welcome to CommitDesk! I turn verbal meeting notes and team chatter into structured action items on your board.\n\nTry pasting a verbal commitment, like:\n• "Sarah asked me to review the checkout PR by Friday. Medium priority."\n• Or bullet points from your standup or retro notes.',
  timestamp: new Date().toISOString(),
};

export const App: React.FC = () => {
  // 1. Task State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = loadTasksFromStorage();
    return saved && saved.length > 0 ? saved : initialTasks;
  });

  // 2. Chat Messages State
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    const saved = loadMessagesFromStorage();
    return saved && saved.length > 0 ? saved : [INITIAL_WELCOME_MESSAGE];
  });

  // 3. Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    return loadSettingsFromStorage();
  });

  // 4. UI Modals and Layout State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<string[]>([]);
  const [mobileTab, setMobileTab] = useState<'chat' | 'board'>('chat');

  // Persistence effects
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveMessagesToStorage(messages);
  }, [messages]);

  // Handle new message from user
  const handleSendMessage = async (text: string) => {
    const userMessageId = `msg-user-${Date.now()}`;
    const userMsg: ChatMessageType = {
      id: userMessageId,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const actionResult = await handleUserChatAction(text, tasks, settings);

      if (actionResult.type === 'create_tasks') {
        // Prepend new tasks to board
        setTasks(prev => [...actionResult.tasks, ...prev]);

        // Highlight newly created tasks
        const newIds = actionResult.tasks.map(t => t.id);
        setHighlightedTaskIds(newIds);
        setTimeout(() => {
          setHighlightedTaskIds([]);
        }, 3200);

        const assistantMsg: ChatMessageType = {
          id: `msg-assistant-${Date.now()}`,
          sender: 'assistant',
          content: actionResult.assistantMessage,
          timestamp: new Date().toISOString(),
          createdTaskIds: newIds,
          parsedMethod: actionResult.method,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else if (actionResult.type === 'complete_task') {
        // Mark task Completed immediately on board
        const taskId = actionResult.completedTask.id;
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, status: 'Completed' } : t))
        );

        // Highlight the completed task on board
        setHighlightedTaskIds([taskId]);
        setTimeout(() => {
          setHighlightedTaskIds([]);
        }, 3200);

        const assistantMsg: ChatMessageType = {
          id: `msg-assistant-${Date.now()}`,
          sender: 'assistant',
          content: actionResult.assistantMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // query_response, clarification, no_match, or conversation
        const assistantMsg: ChatMessageType = {
          id: `msg-assistant-${Date.now()}`,
          sender: 'assistant',
          content: actionResult.assistantMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      console.error('Task action error:', err);
      const assistantMsg: ChatMessageType = {
        id: `msg-assistant-${Date.now()}`,
        sender: 'assistant',
        content: `Encountered an error: ${err?.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Status change handler
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  // Edit task save handler
  const handleSaveEditedTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);
  };

  // Delete task handler
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (editingTask?.id === taskId) {
      setEditingTask(null);
    }
  };

  // Reset to initial sample tasks
  const handleResetInitialTasks = () => {
    if (window.confirm('Reset the board to the initial 11 sample tasks? This will replace current tasks.')) {
      setTasks(initialTasks);
      saveTasksToStorage(initialTasks);
    }
  };

  // Clear chat messages
  const handleClearMessages = () => {
    if (window.confirm('Clear conversation history?')) {
      const reset = [INITIAL_WELCOME_MESSAGE];
      setMessages(reset);
      saveMessagesToStorage(reset);
    }
  };

  // Focus and highlight task from chat preview click
  const handleFocusTask = useCallback((taskId: string) => {
    setHighlightedTaskIds([taskId]);
    setMobileTab('board');

    setTimeout(() => {
      const el = document.getElementById(`task-card-${taskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    setTimeout(() => {
      setHighlightedTaskIds([]);
    }, 3200);
  }, []);

  // Save settings handler
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-dark-950 font-sans text-slate-100">
      {/* App Header */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetTasks={handleResetInitialTasks}
        taskCount={tasks.length}
      />

      {/* Mobile Tab Switcher (visible only on < lg screens) */}
      <div className="lg:hidden flex items-center border-b border-slate-800 bg-dark-900 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
            mobileTab === 'chat'
              ? 'border-brand-500 text-brand-300 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat / Input</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('board')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
            mobileTab === 'board'
              ? 'border-brand-500 text-brand-300 bg-brand-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Task Board</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {tasks.length}
          </span>
        </button>
      </div>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Chat Panel */}
        <section
          className={`h-full w-full lg:w-[42%] xl:w-[38%] shrink-0 flex flex-col ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <ChatPanel
            messages={messages}
            tasks={tasks}
            onSendMessage={handleSendMessage}
            onClearMessages={handleClearMessages}
            isLoading={isLoading}
            settings={settings}
            onFocusTask={handleFocusTask}
          />
        </section>

        {/* Right Side: Task Board */}
        <section
          className={`h-full flex-1 flex flex-col ${
            mobileTab === 'board' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <TaskBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEditTask={task => setEditingTask(task)}
            onDeleteTask={handleDeleteTask}
            onResetInitialTasks={handleResetInitialTasks}
            highlightedTaskIds={highlightedTaskIds}
          />
        </section>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveEditedTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
};
