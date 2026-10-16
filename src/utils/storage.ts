import { Task, ChatMessage, AppSettings } from '../types';

const STORAGE_KEYS = {
  TASKS: 'commitdesk_tasks_v1',
  MESSAGES: 'commitdesk_messages_v1',
  SETTINGS: 'commitdesk_settings_v1',
};

export const defaultSettings: AppSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  saveKeyLocally: false,
};

export function loadTasksFromStorage(): Task[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // Basic sanity check on task structure
    return parsed.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string');
  } catch (err) {
    console.warn('Failed to parse tasks from localStorage, resetting to default:', err);
    return null;
  }
}

export function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

export function loadMessagesFromStorage(): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(m => m && typeof m.id === 'string' && typeof m.content === 'string');
  } catch (err) {
    console.warn('Failed to parse messages from localStorage:', err);
    return null;
  }
}

export function saveMessagesToStorage(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save messages to localStorage:', err);
  }
}

export function loadSettingsFromStorage(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return {
      geminiApiKey: typeof parsed.geminiApiKey === 'string' ? parsed.geminiApiKey : '',
      geminiModel: typeof parsed.geminiModel === 'string' ? parsed.geminiModel : defaultSettings.geminiModel,
      saveKeyLocally: Boolean(parsed.saveKeyLocally),
    };
  } catch (err) {
    console.warn('Failed to load settings from storage:', err);
    return { ...defaultSettings };
  }
}

export function saveSettingsToStorage(settings: AppSettings): void {
  try {
    if (settings.saveKeyLocally) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } else {
      // Save other settings, but NOT the API key
      const safeSettings = { ...settings, geminiApiKey: '' };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(safeSettings));
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

export function clearStoredTasksAndMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}
