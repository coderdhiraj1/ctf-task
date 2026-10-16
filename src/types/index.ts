export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskEffort = 'Small' | 'Medium' | 'Large';
export type TaskStatus = 'Open' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;        // Human readable e.g. "Today", "Tomorrow", "Oct 20", "Next Friday"
  dueDateIso: string;     // ISO YYYY-MM-DD for accurate comparison & overdue detection
  requester: string;      // e.g. "Sarah Chen", "Self"
  priority: TaskPriority;
  effort: TaskEffort;
  status: TaskStatus;
  createdAt: string;      // ISO string
  sourceText?: string;    // Original text snippet that triggered this task
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  createdTaskIds?: string[]; // IDs of tasks created by this message
  parsedMethod?: 'gemini' | 'local';
  isError?: boolean;
}

export interface ParseResult {
  tasks: Array<{
    title: string;
    description: string;
    dueDate: string;
    requester: string;
    priority: TaskPriority;
    effort: TaskEffort;
    status: TaskStatus;
  }>;
  method: 'gemini' | 'local';
  rawOutput?: string;
}

export interface TaskFilterOptions {
  status: 'All' | TaskStatus;
  priority: 'All' | TaskPriority;
  effort: 'All' | TaskEffort;
  search: string;
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  saveKeyLocally: boolean;
}
