import { Task, AppSettings } from '../types';
import { parseWithGemini, classifyIntentWithGemini } from './geminiService';
import { parseLocally } from './localParser';
import { resolveDateToIso, formatHumanDate } from '../utils/dateUtils';
import {
  detectLocalIntent,
  executeDueTodayQuery,
  executeOverdueQuery,
  executeLowHangingFruitQuery,
  matchTaskForCompletion,
} from './queryService';

export interface TaskCreationResult {
  tasks: Task[];
  method: 'gemini' | 'local';
  warningMessage?: string;
}

export type ChatActionResult =
  | {
      type: 'create_tasks';
      tasks: Task[];
      method: 'gemini' | 'local';
      assistantMessage: string;
      warningMessage?: string;
    }
  | {
      type: 'query_response';
      assistantMessage: string;
    }
  | {
      type: 'complete_task';
      completedTask: Task;
      assistantMessage: string;
    }
  | {
      type: 'clarification';
      assistantMessage: string;
    }
  | {
      type: 'no_match';
      assistantMessage: string;
    }
  | {
      type: 'conversation';
      assistantMessage: string;
    };

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

  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.GEMINI_API_KEY) ||
    ((globalThis as any).process?.env?.GEMINI_API_KEY as string | undefined);

  if (envKey && envKey.trim() && !envKey.includes('your_gemini_api_key')) {
    return { key: envKey.trim(), source: 'env' };
  }

  return { key: '', source: 'none' };
}

/**
 * Main coordinator handling all chat actions:
 * 1. Task Queries ("What do I need to deliver today?", "What's overdue?", "Give me low-hanging fruit")
 * 2. Task Completion ("I finished the vendor email")
 * 3. Task Creation (Verbal commitments, meeting notes, action items)
 * 4. General conversation
 */
export async function handleUserChatAction(
  input: string,
  currentTasks: Task[],
  settings: AppSettings
): Promise<ChatActionResult> {
  const { key: apiKey } = getActiveApiKey(settings);

  // Step 1: Detect intent via deterministic local engine
  const localIntent = detectLocalIntent(input);

  // If local intent matched a query, completion, or conversation, execute deterministically
  if (localIntent.type === 'QUERY_DUE_TODAY') {
    const response = executeDueTodayQuery(currentTasks);
    return {
      type: 'query_response',
      assistantMessage: response,
    };
  }

  if (localIntent.type === 'QUERY_OVERDUE') {
    const response = executeOverdueQuery(currentTasks);
    return {
      type: 'query_response',
      assistantMessage: response,
    };
  }

  if (localIntent.type === 'QUERY_LOW_HANGING_FRUIT') {
    const response = executeLowHangingFruitQuery(currentTasks);
    return {
      type: 'query_response',
      assistantMessage: response,
    };
  }

  if (localIntent.type === 'COMPLETE_TASK' && localIntent.targetText) {
    const matchResult = matchTaskForCompletion(localIntent.targetText, currentTasks);

    if (matchResult.match) {
      return {
        type: 'complete_task',
        completedTask: matchResult.match,
        assistantMessage: `Done — I marked '${matchResult.match.title}' as completed.`,
      };
    }

    if (matchResult.multipleCandidates && matchResult.multipleCandidates.length > 0) {
      const candidatesList = matchResult.multipleCandidates
        .map((t, idx) => `${idx + 1}. ${t.title}`)
        .join('\n');
      return {
        type: 'clarification',
        assistantMessage: `I found multiple possible matches for "${localIntent.targetText}":\n${candidatesList}\n\nWhich one did you finish?`,
      };
    }

    return {
      type: 'no_match',
      assistantMessage: `No matching task found for "${localIntent.targetText}". Check the task board on the right to verify the task title.`,
    };
  }

  if (localIntent.type === 'GREETING_OR_CONVERSATION') {
    return {
      type: 'conversation',
      assistantMessage:
        "Hello! I'm CommitDesk. You can paste meeting notes or verbal commitments to create tasks, ask 'What do I need to deliver today?', request 'low-hanging fruit' for quick wins, or tell me 'I finished [task]' to check items off.",
    };
  }

  // Step 2: If local intent defaulted to CREATE_TASK but Gemini is active,
  // we can check if Gemini identifies it as a query or completion in edge cases
  if (apiKey) {
    try {
      const geminiIntent = await classifyIntentWithGemini(
        input,
        currentTasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          effort: t.effort,
          dueDate: t.dueDate,
        })),
        apiKey,
        settings.geminiModel
      );

      if (geminiIntent) {
        if (geminiIntent.intent === 'query_today') {
          return {
            type: 'query_response',
            assistantMessage: executeDueTodayQuery(currentTasks),
          };
        }
        if (geminiIntent.intent === 'query_overdue') {
          return {
            type: 'query_response',
            assistantMessage: executeOverdueQuery(currentTasks),
          };
        }
        if (geminiIntent.intent === 'query_low_hanging_fruit') {
          return {
            type: 'query_response',
            assistantMessage: executeLowHangingFruitQuery(currentTasks),
          };
        }
        if (geminiIntent.intent === 'complete_task' && geminiIntent.targetTaskTitle) {
          const matchResult = matchTaskForCompletion(geminiIntent.targetTaskTitle, currentTasks);
          if (matchResult.match) {
            return {
              type: 'complete_task',
              completedTask: matchResult.match,
              assistantMessage: `Done — I marked '${matchResult.match.title}' as completed.`,
            };
          }
        }
        if (geminiIntent.intent === 'conversation' && geminiIntent.conversationReply) {
          return {
            type: 'conversation',
            assistantMessage: geminiIntent.conversationReply,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini intent classification skipped, using task creation:', err);
    }
  }

  // Step 3: Default to Task Creation
  const creationResult = await processCommitments(input, settings);

  if (creationResult.tasks.length === 0) {
    return {
      type: 'conversation',
      assistantMessage:
        "I couldn't identify any clear actionable commitments or assignments in that text. Try including who asked, what needs to be done, or a deadline (e.g., 'Dave asked me to fix the webhook by tomorrow').",
    };
  }

  let replyContent = `I extracted ${creationResult.tasks.length} actionable ${
    creationResult.tasks.length === 1 ? 'commitment' : 'commitments'
  } and added ${creationResult.tasks.length === 1 ? 'it' : 'them'} to your live board.`;

  if (creationResult.warningMessage) {
    replyContent += `\n\nNote: ${creationResult.warningMessage}`;
  }

  return {
    type: 'create_tasks',
    tasks: creationResult.tasks,
    method: creationResult.method,
    assistantMessage: replyContent,
    warningMessage: creationResult.warningMessage,
  };
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
