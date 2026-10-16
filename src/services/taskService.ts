import { Task, AppSettings } from '../types';
import { parseWithGemini } from './geminiService';
import { parseLocally } from './localParser';
import { resolveDateToIso, formatHumanDate } from '../utils/dateUtils';

export interface TaskCreationResult {
  tasks: Task[];
  method: 'gemini' | 'local';
  warningMessage?: string;
}

/**
 * Resolves the active API key:
 * Priority:
 * 1. User configured key in Settings (stored in app state/localStorage)
 * 2. Environment variable (VITE_GEMINI_API_KEY or GEMINI_API_KEY)
 */
export function getActiveApiKey(settings: AppSettings): { key: string; source: 'user' | 'env' | 'none' } {
  if (settings.geminiApiKey && settings.geminiApiKey.trim()) {
    return { key: settings.geminiApiKey.trim(), source: 'user' };
  }

  // Check Vite environment variables
  const envKey =
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    (import.meta.env.GEMINI_API_KEY as string | undefined);

  if (envKey && envKey.trim() && !envKey.includes('your_gemini_api_key')) {
    return { key: envKey.trim(), source: 'env' };
  }

  return { key: '', source: 'none' };
}

export async function processCommitments(
  input: string,
  settings: AppSettings
): Promise<TaskCreationResult> {
  const { key: apiKey } = getActiveApiKey(settings);

  let rawTasks: Array<{
    title: string;
    description: string;
    dueDate: string;
    requester: string;
    priority: any;
    effort: any;
    status: any;
  }> = [];

  let method: 'gemini' | 'local' = 'local';
  let warningMessage: string | undefined;

  if (apiKey) {
    try {
      const geminiResult = await parseWithGemini(input, apiKey, settings.geminiModel);
      rawTasks = geminiResult.tasks;
      method = 'gemini';
    } catch (err: any) {
      console.warn('Gemini parsing failed or returned error, falling back to local parser:', err);
      warningMessage = `Gemini API returned: ${err?.message || 'Network error'}. Used offline local parsing fallback.`;
      const fallbackResult = parseLocally(input);
      rawTasks = fallbackResult.tasks;
      method = 'local';
    }
  } else {
    // No API key configured
    const localResult = parseLocally(input);
    rawTasks = localResult.tasks;
    method = 'local';
  }

  // Transform raw extracted tasks into complete Task domain objects
  const timestamp = Date.now();
  const createdTasks: Task[] = rawTasks.map((raw, idx) => {
    const dueDateIso = resolveDateToIso(raw.dueDate);
    const humanDueDate = raw.dueDate || formatHumanDate(dueDateIso);

    return {
      id: `task-${timestamp}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      title: raw.title,
      description: raw.description,
      dueDate: humanDueDate,
      dueDateIso,
      requester: raw.requester || 'Team',
      priority: raw.priority || 'Medium',
      effort: raw.effort || 'Medium',
      status: 'Open',
      createdAt: new Date().toISOString(),
      sourceText: input,
    };
  });

  return {
    tasks: createdTasks,
    method,
    warningMessage,
  };
}
