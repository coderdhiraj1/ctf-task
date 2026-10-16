import { TaskPriority, TaskEffort, TaskStatus, ParseResult } from '../types';

export interface GeminiTaskOutput {
  title: string;
  description: string;
  dueDate: string;
  requester: string;
  priority: string;
  effort: string;
  status: string;
}

export interface GeminiResponseSchema {
  tasks: GeminiTaskOutput[];
}

const SYSTEM_INSTRUCTION = `You are CommitDesk's AI commitment parser. Your job is to extract concrete work commitments from verbally assigned meeting notes, sentences, or action items into structured tasks.

CRITICAL RULES:
1. Parse every distinct actionable commitment into an individual task. If a sentence mentions two people doing two things, output two separate tasks.
2. Title: Crisp, active verb action item (e.g. "Review checkout PR", "Add retry handling to payment webhook").
3. Description: Concise context explaining why or what needs to be done.
4. Requester: The person who asked for the task or assigned it (e.g. "Sarah", "John", "David", or "Self" if the speaker committed themselves).
5. Due Date: Extract relative or absolute date phrase (e.g. "Today", "Tomorrow", "Friday", "Monday", "Next week", "Oct 25"). If unknown, infer "Tomorrow" or "Soon".
6. Priority: Must be strictly one of: "Low", "Medium", "High", "Critical".
7. Effort: Must be strictly one of: "Small", "Medium", "Large".
8. Status: Default to "Open".

You must respond ONLY with a valid JSON object matching this schema:
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "dueDate": "string",
      "requester": "string",
      "priority": "Low" | "Medium" | "High" | "Critical",
      "effort": "Small" | "Medium" | "Large",
      "status": "Open"
    }
  ]
}`;

export async function parseWithGemini(
  input: string,
  apiKey: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<ParseResult> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('No Gemini API key provided.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelName
  )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${SYSTEM_INSTRUCTION}\n\nHere is the verbal meeting notes/text to parse into structured commitments:\n"""\n${input}\n"""`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `Gemini API request failed with status ${response.status} (${response.statusText})`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Empty response received from Gemini.');
  }

  // Parse JSON and validate
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawText);
  } catch (err) {
    // Attempt cleaning markdown fences if Gemini wrapped it
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    parsedJson = JSON.parse(cleaned);
  }

  if (!parsedJson || !Array.isArray(parsedJson.tasks)) {
    throw new Error('Gemini output did not contain a valid "tasks" array.');
  }

  const validatedTasks = parsedJson.tasks.map((t: any) => ({
    title: String(t.title || 'Untitled Action Item').trim(),
    description: String(t.description || '').trim(),
    dueDate: String(t.dueDate || 'Tomorrow').trim(),
    requester: String(t.requester || 'Team').trim(),
    priority: normalizePriority(t.priority),
    effort: normalizeEffort(t.effort),
    status: (t.status === 'Completed' || t.status === 'In Progress' ? t.status : 'Open') as TaskStatus,
  }));

  return {
    tasks: validatedTasks,
    method: 'gemini',
    rawOutput: rawText,
  };
}

export async function testGeminiApiKey(
  apiKey: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API key is empty.' };
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: 'Respond with valid JSON: {"ok": true}' }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`,
      };
    }

    return { success: true, message: 'Connection successful! Gemini API is responding.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error reaching Gemini API.' };
  }
}

function normalizePriority(val: any): TaskPriority {
  const s = String(val || '').toLowerCase();
  if (s.includes('crit') || s.includes('urgent') || s.includes('p0')) return 'Critical';
  if (s.includes('high') || s.includes('p1')) return 'High';
  if (s.includes('low') || s.includes('p3')) return 'Low';
  return 'Medium';
}

function normalizeEffort(val: any): TaskEffort {
  const s = String(val || '').toLowerCase();
  if (s.includes('large') || s.includes('big') || s.includes('heavy')) return 'Large';
  if (s.includes('small') || s.includes('quick') || s.includes('trivial')) return 'Small';
  return 'Medium';
}

export interface GeminiIntentClassification {
  intent: 'query_today' | 'query_overdue' | 'query_low_hanging_fruit' | 'complete_task' | 'create_task' | 'conversation';
  targetTaskTitle?: string;
  conversationReply?: string;
}

export async function classifyIntentWithGemini(
  input: string,
  currentTasks: Array<{ id: string; title: string; status: string; priority: string; effort: string; dueDate: string }>,
  apiKey: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<GeminiIntentClassification | null> {
  if (!apiKey || !apiKey.trim()) return null;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const taskListSummary = currentTasks
      .slice(0, 20)
      .map(t => `- [${t.status}] "${t.title}" (${t.priority}, ${t.effort}, Due: ${t.dueDate})`)
      .join('\n');

    const prompt = `You are the intent classifier for CommitDesk.
Given user input and the current list of tasks on the board:
Current tasks:
${taskListSummary}

User input:
"""${input}"""

Determine the user's intent:
- "query_today": User asks what to deliver/finish/do today, what's due today, what is on their plate today.
- "query_overdue": User asks what tasks are overdue.
- "query_low_hanging_fruit": User asks for low-hanging fruit, quick wins, small tasks, or has limited time (e.g. 1 hour).
- "complete_task": User says they finished, completed, or want to mark a specific task as done (e.g. "I finished the vendor email"). Set targetTaskTitle to the task name.
- "conversation": Normal conversation, greeting, thanks, or general question not managing tasks.
- "create_task": User is assigning a new task, pasting meeting notes, verbal commitments, or asking to create/add a task.

Respond ONLY with valid JSON matching:
{
  "intent": "query_today" | "query_overdue" | "query_low_hanging_fruit" | "complete_task" | "create_task" | "conversation",
  "targetTaskTitle": "string",
  "conversationReply": "string"
}`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;
    return JSON.parse(rawText) as GeminiIntentClassification;
  } catch (err) {
    console.warn('Gemini intent classification fallback to local:', err);
    return null;
  }
}

