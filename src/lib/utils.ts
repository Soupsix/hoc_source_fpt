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
