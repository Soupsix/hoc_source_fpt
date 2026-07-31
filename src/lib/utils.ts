export function formatOptionText(opt: unknown): string {
  if (typeof opt === "string") return opt;
  if (typeof opt === "number") return String(opt);
  if (typeof opt === "object" && opt !== null) {
    const o = opt as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (typeof o.label === "string") return o.label;
    if (typeof o.value === "string") return o.value;
    if (typeof o.content === "string") return o.content;
    return JSON.stringify(opt);
  }
  return String(opt ?? "");
}

export function parseOptionsArray(optionsInput: unknown): string[] {
  if (!optionsInput) return [];
  if (Array.isArray(optionsInput)) {
    return optionsInput.map((item) => formatOptionText(item)).filter(Boolean);
  }
  if (typeof optionsInput === "string") {
    try {
      const parsed = JSON.parse(optionsInput);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => formatOptionText(item)).filter(Boolean);
      }
    } catch {
      return [optionsInput];
    }
  }
  return [];
}

export function cleanStr(str: string): string {
  if (!str) return "";
  return str
    .replace(/\u00a0/g, " ")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Extracts candidate option index (0-based) from an answer string if it specifies a letter/number prefix.
 */
export function extractOptionIndex(raw: string, totalOptions: number): number | null {
  const s = cleanStr(raw);
  if (!s || totalOptions <= 0) return null;

  // 1. Single letter: "a", "b", "c", "d" ...
  if (/^[a-z]$/i.test(s)) {
    const idx = s.toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < totalOptions) return idx;
  }

  // 2. Letter with symbol/word: "a.", "a)", "(a)", "[a]", "a:", "a -", "dap an a", "đáp án a", "option a", "câu a"
  const letterMatch = s.match(/^(?:[\(\[]?\s*([a-z])\s*[\.\:\)\-\]]?|(?:dap an|dáp án|đáp án|option|cau|câu)\s*[\:\-]?\s*([a-z]))$/i);
  if (letterMatch) {
    const letter = (letterMatch[1] || letterMatch[2]).toUpperCase();
    const idx = letter.charCodeAt(0) - 65;
    if (idx >= 0 && idx < totalOptions) return idx;
  }

  // 3. Numeric string: "1", "2", "3", "4"
  if (/^\d+$/.test(s)) {
    const num = parseInt(s, 10);
    if (num >= 1 && num <= totalOptions) return num - 1;
  }

  return null;
}

/**
 * Strips prefix like "A. ", "B) ", "C: ", "(D) " from option or answer text.
 */
export function stripOptionPrefix(str: string): string {
  const s = cleanStr(str);
  if (!s) return "";
  const match = s.match(/^(?:[\(\[][a-z][\)\]]?|[a-z]\s*[\.\:\)\-\]]+|(?:dap an|dáp án|đáp án|option|câu)\s*[a-z0-9]?\s*[\:\-]?)\s+(.*)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return s;
}

/**
 * Normalises an answer string/letter to the display text of one of the options.
 */
export function resolveAnswer(raw: string, options: string[]): string {
  const formattedRaw = formatOptionText(raw);
  const cleanedRaw = cleanStr(formattedRaw);
  if (!cleanedRaw) return "";

  if (options.length > 0) {
    // 1. Check if raw is a letter/index specifier like "C", "C.", "C)", "Đáp án C", "3"
    const optIdx = extractOptionIndex(cleanedRaw, options.length);
    if (optIdx !== null && options[optIdx] !== undefined) {
      return formatOptionText(options[optIdx]);
    }

    // 2. Exact match against formatted option texts
    const exactMatch = options.find((o) => cleanStr(formatOptionText(o)) === cleanedRaw);
    if (exactMatch) return formatOptionText(exactMatch);

    // 3. Match after stripping prefix from both raw answer and option text
    const strippedRaw = stripOptionPrefix(cleanedRaw);
    const prefixMatch = options.find((o) => {
      const optText = formatOptionText(o);
      const cleanedOpt = cleanStr(optText);
      const strippedOpt = stripOptionPrefix(cleanedOpt);
      return (
        strippedOpt === strippedRaw ||
        cleanedOpt === strippedRaw ||
        strippedOpt === cleanedRaw
      );
    });
    if (prefixMatch) return formatOptionText(prefixMatch);
  }

  return formattedRaw;
}

/**
 * Extracts 0-based option indices for all correct options in a question.
 */
export function getCorrectOptionIndices(answerRaw: string, options: string[]): Set<number> {
  const indices = new Set<number>();
  if (!answerRaw) return indices;

  const formattedOptions = options.map((o) => formatOptionText(o));
  const rawFormatted = formatOptionText(answerRaw);
  const cleanedRaw = cleanStr(rawFormatted);

  if (formattedOptions.length > 0) {
    formattedOptions.forEach((optStr, idx) => {
      const cleanedOpt = cleanStr(optStr);
      const strippedOpt = cleanStr(stripOptionPrefix(optStr));
      const letter = String.fromCharCode(65 + idx).toLowerCase();

      // Check 1: Does answerRaw contain exact letter/prefix boundary for this option? e.g. "A, C", "A; C", "A. ..., C. ..."
      const letterRegex = new RegExp(`(?:^|[,;\\s\\(\\)\\[\\]])\\s*${letter}\\s*(?:[\\.:\\)\\-\\s,;]|$)`, "i");

      // Check 2: Does cleanedRaw contain the stripped option text (e.g. "xây dựng cơ sở vật chất")?
      const textMatches = strippedOpt.length >= 3 && cleanedRaw.includes(strippedOpt);

      // Check 3: Does cleanedRaw exactly match cleanedOpt?
      const exactMatches = cleanedRaw === cleanedOpt;

      if (letterRegex.test(rawFormatted) || textMatches || exactMatches) {
        indices.add(idx);
      }
    });
  }

  // Fallback if options array is empty or no index matched
  if (indices.size === 0) {
    const parts = rawFormatted.split(/(?:^|[,;])\s*(?=[A-Za-z][\.\:\)\-\s])/).filter(Boolean);
    parts.forEach((p) => {
      const resolved = resolveAnswer(p.trim(), formattedOptions);
      const optIdx = formattedOptions.findIndex(
        (o) => cleanStr(stripOptionPrefix(o)) === cleanStr(stripOptionPrefix(resolved))
      );
      if (optIdx !== -1) indices.add(optIdx);
    });
  }

  return indices;
}

/**
 * Helper to check if a specific option string is one of the correct answers for a question.
 */
export function isOptionCorrect(
  q: { type?: string; answer: string },
  optionStr: string,
  options: string[]
): boolean {
  const formattedOptions = options.map((o) => formatOptionText(o));
  if (q.type === "MULTIPLE_CHOICE") {
    const correctIndices = getCorrectOptionIndices(q.answer, formattedOptions);
    const optIdx = formattedOptions.findIndex(
      (o) => cleanStr(stripOptionPrefix(o)) === cleanStr(stripOptionPrefix(formatOptionText(optionStr)))
    );
    if (optIdx !== -1) {
      return correctIndices.has(optIdx);
    }
  }

  return isCorrectAnswer({ type: "SINGLE_CHOICE", answer: q.answer }, optionStr, options);
}

/**
 * Checks if user answer matches question correct answer cleanly and robustly.
 */
export function isCorrectAnswer(
  q: { type?: string; answer: string },
  userAns: string | string[] | undefined,
  options: string[]
): boolean {
  if (userAns === undefined || userAns === null) return false;

  const formattedOptions = options.map((o) => formatOptionText(o));

  if (q.type === "MULTIPLE_CHOICE") {
    const correctIndices = getCorrectOptionIndices(q.answer, formattedOptions);

    const userAnswersArray = (Array.isArray(userAns) ? userAns : [userAns]).filter(Boolean);
    const userIndices = new Set<number>();

    userAnswersArray.forEach((u) => {
      const userStr = formatOptionText(u);
      const resolved = resolveAnswer(userStr, formattedOptions);
      const idx = formattedOptions.findIndex(
        (o) => cleanStr(stripOptionPrefix(o)) === cleanStr(stripOptionPrefix(resolved))
      );
      if (idx !== -1) {
        userIndices.add(idx);
      } else {
        const letterIdx = extractOptionIndex(userStr, formattedOptions.length);
        if (letterIdx !== null) userIndices.add(letterIdx);
      }
    });

    if (correctIndices.size === 0 || userIndices.size === 0) return false;
    if (correctIndices.size !== userIndices.size) return false;

    for (const idx of correctIndices) {
      if (!userIndices.has(idx)) return false;
    }
    return true;
  }

  // SINGLE_CHOICE or FLASHCARD
  const userStr = Array.isArray(userAns) ? userAns[0] || "" : userAns;
  const rawCorrect = formatOptionText(q.answer);

  const resolvedCorrect = resolveAnswer(rawCorrect, formattedOptions);
  const resolvedUser = resolveAnswer(userStr, formattedOptions);

  const cleanedCorrect = cleanStr(stripOptionPrefix(resolvedCorrect));
  const cleanedUser = cleanStr(stripOptionPrefix(resolvedUser));

  if (cleanedCorrect === cleanedUser) return true;

  return (
    cleanStr(resolvedCorrect) === cleanStr(resolvedUser) ||
    cleanStr(rawCorrect) === cleanStr(userStr)
  );
}

/**
 * Parses raw unformatted text containing question and inline/multiline options (A., B., C., D.)
 * Example input:
 * "Which API platform is used for capturing user's location data? A. LocationPicker B. Geolocation C. Location D. Picker"
 */
export function parseQuickQuestion(rawText: string): { question: string; options: string[] } {
  const text = rawText.trim();
  if (!text) return { question: "", options: [] };

  const optionRegex = /(?:^|[\r\n\s]+)(?:[\(\[]?\s*([A-Z])\s*[\.\:\)\-\]]?|(?:dap an|dáp án|đáp án|option|câu)\s*([A-Z]))\s+/gi;

  const matches: { letter: string; index: number; length: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = optionRegex.exec(text)) !== null) {
    const letter = (match[1] || match[2]).toUpperCase();
    matches.push({
      letter,
      index: match.index,
      length: match[0].length,
    });
  }

  if (matches.length === 0) {
    return { question: text, options: [] };
  }

  const question = text.slice(0, matches[0].index).trim();
  const options: string[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].length;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    const optVal = text.slice(start, end).trim();
    if (optVal) {
      options.push(optVal);
    }
  }

  return { question, options };
}

export function formatDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDateShort(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}
