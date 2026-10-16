import { Task } from '../types';
import { getDueStatus } from '../utils/dateUtils';

const PRIORITY_ORDER: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export type IntentType =
  | 'QUERY_DUE_TODAY'
  | 'QUERY_OVERDUE'
  | 'QUERY_LOW_HANGING_FRUIT'
  | 'COMPLETE_TASK'
  | 'GREETING_OR_CONVERSATION'
  | 'CREATE_TASK';

export interface DetectedIntent {
  type: IntentType;
  targetText?: string;
  rawText: string;
}

/**
 * Deterministic intent detection for chat messages.
 */
export function detectLocalIntent(input: string): DetectedIntent {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Completion Commands
  // "I finished the vendor email", "The vendor email is done", "I completed the vendor email", "Mark the vendor email as completed"
  const finishPatterns = [
    /^(?:I\s+(?:have\s+)?)?(?:finished|completed|done\s+with|wrapped\s+up)\s+(?:the\s+)?(.+?)[.!]?$/i,
    /^(?:the\s+)?(.+?)\s+is\s+(?:done|finished|completed)[.!]?$/i,
    /^(?:mark|set)\s+(?:the\s+)?(.+?)\s+as\s+(?:done|finished|completed)[.!]?$/i,
    /^(?:check\s+off|close)\s+(?:the\s+)?(.+?)[.!]?$/i,
  ];

  for (const regex of finishPatterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const target = match[1].trim();
      // Ensure target isn't just an empty or very short noise string
      if (target.length >= 2) {
        return {
          type: 'COMPLETE_TASK',
          targetText: target,
          rawText: text,
        };
      }
    }
  }

  // 2. Query: Low-hanging fruit / limited time
  // "I have one hour, give me the low-hanging fruit", "low hanging fruit", "quick wins"
  if (
    /low[- ]hanging\s+fruit/i.test(lower) ||
    /quick\s+wins?/i.test(lower) ||
    /(?:one|1)\s+hour/i.test(lower) ||
    /(?:30|15|45)\s+minutes?/i.test(lower) ||
    /limited\s+time/i.test(lower) ||
    /(?:what\s+(?:can|should)\s+I\s+(?:do|knock\s+out|finish)\s+(?:in\s+an\s+hour|quickly))/i.test(lower)
  ) {
    return {
      type: 'QUERY_LOW_HANGING_FRUIT',
      rawText: text,
    };
  }

  // 3. Query: Overdue tasks
  // "What is overdue?", "What's overdue?", "Show overdue tasks"
  if (
    /^(?:what(?:'s|\s+is|\s+are)?\s+(?:the\s+)?overdue(?:\s+tasks?)?|show\s+(?:me\s+)?overdue|any\s+overdue(?:\s+tasks?)?)\??$/i.test(
      lower
    )
  ) {
    return {
      type: 'QUERY_OVERDUE',
      rawText: text,
    };
  }

  // 4. Query: Due Today / What do I need to deliver today
  // "What do I need to deliver today?", "What should I finish today?", "What's due today?"
  if (
    /what(?:'s|\s+is|\s+do\s+I|\s+should\s+I|\s+have\s+to)?\s+(?:need\s+to\s+)?(?:deliver|finish|do|complete|work\s+on|focus\s+on)?\s*today\??/i.test(
      lower
    ) ||
    /what(?:'s|\s+is)\s+due\s+today\??/i.test(lower) ||
    /what\s+(?:do\s+I\s+need\s+to|should\s+I)\s+deliver\s+today\??/i.test(lower) ||
    /what\s+is\s+due\??/i.test(lower) ||
    /today(?:'s)?\s+(?:deliverables|tasks|agenda|commitments)\??/i.test(lower)
  ) {
    return {
      type: 'QUERY_DUE_TODAY',
      rawText: text,
    };
  }

  // 5. Conversational Greetings or Help
  if (
    /^(?:hi|hello|hey|greetings|howdy|sup)[\s!.]*$/i.test(lower) ||
    /^(?:who\s+are\s+you|what\s+can\s+you\s+do|help|what\s+is\s+commitdesk)\??$/i.test(lower)
  ) {
    return {
      type: 'GREETING_OR_CONVERSATION',
      rawText: text,
    };
  }

  // 6. Default to Task Creation
  return {
    type: 'CREATE_TASK',
    rawText: text,
  };
}

/**
 * Handles query: "What do I need to deliver today?"
 * Returns tasks due today and overdue tasks, sorted by priority.
 */
export function executeDueTodayQuery(tasks: Task[]): string {
  // Only inspect open/in-progress tasks
  const activeTasks = tasks.filter(t => t.status !== 'Completed');

  const dueTodayTasks = activeTasks
    .filter(t => getDueStatus(t.dueDateIso, t.status).isDueToday)
    .sort((a, b) => (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0));

  const overdueTasks = activeTasks
    .filter(t => getDueStatus(t.dueDateIso, t.status).isOverdue)
    .sort((a, b) => (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0));

  if (dueTodayTasks.length === 0 && overdueTasks.length === 0) {
    return "You have no tasks due today and no overdue tasks. You're all caught up!";
  }

  const sections: string[] = [];

  if (dueTodayTasks.length > 0) {
    const header = `You have ${dueTodayTasks.length} ${
      dueTodayTasks.length === 1 ? 'thing' : 'things'
    } to focus on today:`;
    const items = dueTodayTasks
      .map((t, idx) => `${idx + 1}. ${t.title} — ${t.priority}`)
      .join('\n');
    sections.push(`${header}\n${items}`);
  } else {
    sections.push('You have no tasks due today.');
  }

  if (overdueTasks.length > 0) {
    const overdueHeader = `You also have ${overdueTasks.length} overdue ${
      overdueTasks.length === 1 ? 'task' : 'tasks'
    }:`;
    const overdueItems = overdueTasks
      .map(t => `• ${t.title} — ${t.priority}`)
      .join('\n');
    sections.push(`${overdueHeader}\n${overdueItems}`);
  }

  return sections.join('\n\n');
}

/**
 * Handles query: "What is overdue?" / "What's overdue?"
 */
export function executeOverdueQuery(tasks: Task[]): string {
  const activeTasks = tasks.filter(t => t.status !== 'Completed');

  const overdueTasks = activeTasks
    .filter(t => getDueStatus(t.dueDateIso, t.status).isOverdue)
    .sort((a, b) => (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0));

  if (overdueTasks.length === 0) {
    return "You have no overdue tasks! All active work is on schedule.";
  }

  const header = `You have ${overdueTasks.length} overdue ${
    overdueTasks.length === 1 ? 'task' : 'tasks'
  }:`;
  const items = overdueTasks
    .map((t, idx) => `${idx + 1}. ${t.title} — ${t.priority} priority (Due: ${t.dueDate})`)
    .join('\n');

  return `${header}\n${items}`;
}

/**
 * Handles query: "I have one hour, give me the low-hanging fruit"
 * Returns ONLY tasks whose effort is Small, preferring open tasks, sorted by priority.
 */
export function executeLowHangingFruitQuery(tasks: Task[]): string {
  // CR-021: Return ONLY tasks whose effort is Small. Do not return Medium or Large tasks.
  const openSmallTasks = tasks
    .filter(t => t.status !== 'Completed' && t.effort === 'Small')
    .sort((a, b) => {
      const pDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return a.dueDateIso.localeCompare(b.dueDateIso);
    });

  if (openSmallTasks.length === 0) {
    return "There are currently no open Small-effort tasks on your board.";
  }

  const header = "Here are the best low-hanging-fruit tasks:";
  const items = openSmallTasks
    .map(t => `• ${t.title} — Small — ${t.priority} priority`)
    .join('\n');

  return `${header}\n${items}`;
}

export interface MatchResult {
  match?: Task;
  multipleCandidates?: Task[];
  notFound?: boolean;
}

/**
 * Matches a user's natural language completion target against existing tasks.
 * e.g. "vendor email" matches "Send vendor follow-up email".
 */
export function matchTaskForCompletion(target: string, tasks: Task[]): MatchResult {
  if (!target || !target.trim()) {
    return { notFound: true };
  }

  const cleanTarget = target
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .trim();

  // Filter stop words
  const stopWords = new Set(['the', 'a', 'an', 'my', 'our', 'task', 'item', 'ticket', 'work']);
  const targetTokens = cleanTarget
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  if (targetTokens.length === 0) {
    return { notFound: true };
  }

  interface ScoredTask {
    task: Task;
    score: number;
  }

  const scored: ScoredTask[] = [];

  for (const t of tasks) {
    const titleLower = t.title.toLowerCase();
    const descLower = t.description.toLowerCase();

    let score = 0;

    // Direct substring in title
    if (titleLower.includes(cleanTarget)) {
      score += 5.0;
    }

    // Token matching in title & description
    let matchedTitleTokens = 0;
    let matchedDescTokens = 0;

    for (const token of targetTokens) {
      if (titleLower.includes(token)) {
        matchedTitleTokens++;
      } else if (descLower.includes(token)) {
        matchedDescTokens++;
      }
    }

    const titleTokenRatio = matchedTitleTokens / targetTokens.length;
    score += titleTokenRatio * 4.0;

    if (matchedDescTokens > 0) {
      score += (matchedDescTokens / targetTokens.length) * 1.5;
    }

    // Prefer open / in-progress tasks
    if (t.status !== 'Completed') {
      score += 1.0;
    }

    if (score >= 2.0 || (targetTokens.length === 1 && matchedTitleTokens === 1)) {
      scored.push({ task: t, score });
    }
  }

  // Sort candidates by score descending
  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { notFound: true };
  }

  const top = scored[0];

  // If there are multiple close matches (e.g. second place score is close to top)
  const closeCandidates = scored.filter(s => s.score >= top.score * 0.85);

  if (closeCandidates.length > 1 && top.score < 5.0) {
    // If multiple distinct tasks match closely, ask for clarification
    return {
      multipleCandidates: closeCandidates.slice(0, 3).map(c => c.task),
    };
  }

  return {
    match: top.task,
  };
}
