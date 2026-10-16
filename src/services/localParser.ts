import { TaskPriority, TaskEffort, TaskStatus, ParseResult } from '../types';

interface ExtractedTaskCandidate {
  title: string;
  description: string;
  dueDate: string;
  requester: string;
  priority: TaskPriority;
  effort: TaskEffort;
  status: TaskStatus;
}

export function parseLocally(input: string): ParseResult {
  if (!input || !input.trim()) {
    return { tasks: [], method: 'local' };
  }

  const rawLines = input
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let rawSegments: string[] = [];

  for (const line of rawLines) {
    // Strip bullet markers (-, *, •, 1., 2), etc.)
    const cleanedLine = line.replace(/^[-*•\d+.)\]\s]+/, '').trim();
    if (!cleanedLine) continue;

    // Check for compound sentences with " and [Actor] (will|needs|asked)..."
    const compoundMatch = cleanedLine.split(/\s+and\s+(?=[A-Z][a-z]+(?:\s+[a-z]+)?\s+(?:will|needs|must|should|asked|is\s+going))/i);
    if (compoundMatch.length > 1) {
      rawSegments.push(...compoundMatch);
    } else {
      rawSegments.push(cleanedLine);
    }
  }

  // If input was a single block with semicolons separating actions
  if (rawSegments.length === 1 && rawSegments[0].includes(';')) {
    rawSegments = rawSegments[0].split(';').map(s => s.trim()).filter(Boolean);
  }

  const tasks: ExtractedTaskCandidate[] = [];

  for (const segment of rawSegments) {
    if (!segment || segment.length < 5) continue;

    const task = parseSingleSegment(segment);
    if (task && task.title) {
      tasks.push(task);
    }
  }

  // Fallback: If no tasks extracted, create one task using the full text
  if (tasks.length === 0 && input.trim().length > 0) {
    tasks.push(parseSingleSegment(input.trim()));
  }

  return {
    tasks,
    method: 'local',
  };
}

function parseSingleSegment(text: string): ExtractedTaskCandidate {
  let workingText = text;

  // 1. Extract Requester
  let requester = 'Team';
  
  // Format: "Sarah: ..." or "Sarah Chen: ..."
  const colonRequester = workingText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*:\s*/);
  if (colonRequester) {
    requester = colonRequester[1].trim();
    workingText = workingText.slice(colonRequester[0].length).trim();
  } else {
    // Format: "Sarah asked me to...", "Sarah told me to...", "Sarah requested...", "Sarah will..."
    const verbRequester = workingText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:asked(?:\s+me)?\s+to|told(?:\s+me)?\s+to|requested(?:\s+that\s+we)?|needs(?:\s+to)?|wants(?:\s+us\s+to)?|will|suggested(?:\s+we)?)\b/i);
    if (verbRequester) {
      requester = verbRequester[1].trim();
      // Keep workingText for now, will clean during title extraction
    } else if (/\bI\s+(?:will|need\s+to|must|should|promised\s+to)\b/i.test(workingText)) {
      requester = 'Self';
    }
  }

  // 2. Extract Priority
  let priority: TaskPriority = 'Medium';
  if (/\b(critical|urgent|p0|blocker|asap|highest\s+priority)\b/i.test(workingText)) {
    priority = 'Critical';
  } else if (/\b(high\s+priority|p1|important|high)\b/i.test(workingText)) {
    priority = 'High';
  } else if (/\b(low\s+priority|p3|minor|low|nice\s+to\s+have)\b/i.test(workingText)) {
    priority = 'Low';
  } else if (/\b(medium\s+priority|p2|normal|medium)\b/i.test(workingText)) {
    priority = 'Medium';
  }

  // 3. Extract Effort
  let effort: TaskEffort = 'Medium';
  if (/\b(large\s+effort|large|major|heavy|complex|big|8\s*pts?|13\s*pts?)\b/i.test(workingText)) {
    effort = 'Large';
  } else if (/\b(small\s+effort|small|quick|trivial|easy|1\s*pt|2\s*pts?)\b/i.test(workingText)) {
    effort = 'Small';
  } else if (/\b(medium\s+effort|medium|moderate|modest|3\s*pts?|5\s*pts?)\b/i.test(workingText)) {
    effort = 'Medium';
  }

  // 4. Extract Due Date
  let dueDate = 'Tomorrow'; // default reasonable commitment
  const dueMatch = workingText.match(/\b(?:by|due|before|on|for)\s+(today|tomorrow|eod|tonight|next\s+week|this\s+friday|next\s+friday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\w+\s+\d{1,2}(?:st|nd|rd|th)?|\d{4}-\d{2}-\d{2})\b/i);
  
  if (dueMatch) {
    dueDate = capitalizeWords(dueMatch[1].trim());
  } else {
    // Check for standalone occurrences of relative date words
    const standaloneDue = workingText.match(/\b(tomorrow|today|eod|by\s+eod|next\s+monday|next\s+friday|next\s+tuesday|next\s+wednesday|next\s+thursday)\b/i);
    if (standaloneDue) {
      dueDate = capitalizeWords(standaloneDue[1].trim());
    }
  }

  // Normalize "eod" -> "Today"
  if (dueDate.toLowerCase().includes('eod') || dueDate.toLowerCase().includes('tonight')) {
    dueDate = 'Today';
  }

  // 5. Build Title and Description
  let cleanTitle = workingText;

  // Remove requester prefix if embedded
  cleanTitle = cleanTitle.replace(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:asked(?:\s+me)?\s+to|told(?:\s+me)?\s+to|requested(?:\s+that\s+we)?|needs\s+to|wants\s+us\s+to|will|suggested(?:\s+we)?)\s+/i, '');
  cleanTitle = cleanTitle.replace(/^I\s+(?:will|need\s+to|must|should|promised\s+to)\s+/i, '');

  // Remove priority and effort phrases
  cleanTitle = cleanTitle.replace(/\((?:priority:\s*)?(?:critical|high|medium|low)(?:\s+priority)?(?:,\s*(?:effort:\s*)?(?:small|medium|large)(?:\s+effort)?)?\)/gi, '');
  cleanTitle = cleanTitle.replace(/\b(?:critical|high|medium|low)\s+priority\b/gi, '');
  cleanTitle = cleanTitle.replace(/\b(?:small|medium|large)\s+effort\b/gi, '');
  cleanTitle = cleanTitle.replace(/\bpriority:\s*(?:critical|high|medium|low)\b/gi, '');
  cleanTitle = cleanTitle.replace(/\beffort:\s*(?:small|medium|large)\b/gi, '');

  // Remove trailing due phrases e.g. "by Friday", "by tomorrow"
  cleanTitle = cleanTitle.replace(/\b(?:by|due|before|on|for)\s+(?:today|tomorrow|eod|tonight|next\s+week|this\s+friday|next\s+friday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\w+\s+\d{1,2}(?:st|nd|rd|th)?)\b/gi, '');
  cleanTitle = cleanTitle.replace(/\b(?:tomorrow|today)\b/gi, '');

  // Clean punctuation and excess whitespace
  cleanTitle = cleanTitle.replace(/^[,\-–—:\s.]+/, '').replace(/[,\-–—:\s.]+$/, '').trim();

  // If cleanTitle became empty or too short, fallback to first 8 words
  if (!cleanTitle || cleanTitle.length < 4) {
    cleanTitle = workingText.split(' ').slice(0, 8).join(' ');
  }

  // Capitalize first letter of title
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    title: cleanTitle,
    description: `Action item assigned by ${requester}: "${text.trim()}".`,
    dueDate,
    requester,
    priority,
    effort,
    status: 'Open',
  };
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}
