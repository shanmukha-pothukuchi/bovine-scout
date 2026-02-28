export type HighlightType =
  | "keyword"
  | "function"
  | "builtin"
  | "string"
  | "number"
  | "operator"
  | "comment"
  | "identifier"
  | "punctuation";

export interface TextHighlight {
  text: string;
  type: HighlightType;
}

// All language keywords (mirrors lexer KEYWORDS)
export const KEYWORDS = new Set([
  "if",
  "then",
  "else",
  "while",
  "for",
  "in",
  "match",
  "not",
  "unit",
  "true",
  "false",
]);

import { STDLIB } from "./stdlib";

export const BUILTIN_NAMES: ReadonlySet<string> = new Set(Object.keys(STDLIB));

export function getTextHighlights(
  text: string,
  builtins: ReadonlySet<string> = BUILTIN_NAMES,
): TextHighlight[] {
  const result: TextHighlight[] = [];
  let i = 0;

  const push = (chunk: string, type: HighlightType) => {
    if (chunk.length > 0) result.push({ text: chunk, type });
  };

  while (i < text.length) {
    const char = text[i];

    // Line comments
    if (char === "/" && text[i + 1] === "/") {
      let j = i;
      while (j < text.length && text[j] !== "\n") j++;
      push(text.slice(i, j), "comment");
      i = j;
      continue;
    }

    // Strings
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let j = i + 1;
      while (j < text.length && text[j] !== quote) {
        if (text[j] === "\\" && j + 1 < text.length) j += 2;
        else j++;
      }
      j++;
      push(text.slice(i, j), "string");
      i = j;
      continue;
    }

    // Numbers
    if (/\d/.test(char) || (char === "." && /\d/.test(text[i + 1] ?? ""))) {
      let j = i;
      while (j < text.length && /[\d.]/.test(text[j])) j++;
      push(text.slice(i, j), "number");
      i = j;
      continue;
    }

    // Identifiers, keywords, builtins, and function calls
    if (/[a-zA-Z_]/.test(char)) {
      let j = i;
      while (j < text.length && /[a-zA-Z0-9_]/.test(text[j])) j++;
      const word = text.slice(i, j);

      if (KEYWORDS.has(word)) {
        push(word, "keyword");
      } else if (builtins.has(word)) {
        push(word, "builtin");
      } else {
        // Look ahead past whitespace to check for `(`
        let k = j;
        while (k < text.length && (text[k] === " " || text[k] === "\t")) k++;
        push(word, text[k] === "(" ? "function" : "identifier");
      }

      i = j;
      continue;
    }

    // Arrow operator
    if (char === "-" && text[i + 1] === ">") {
      push("->", "operator");
      i += 2;
      continue;
    }

    // Two-character comparison/equality operators
    if (
      (char === "=" && text[i + 1] === "=") ||
      (char === "!" && text[i + 1] === "=") ||
      (char === "<" && text[i + 1] === "=") ||
      (char === ">" && text[i + 1] === "=")
    ) {
      push(text.slice(i, i + 2), "operator");
      i += 2;
      continue;
    }

    if ("+-*/%<>=!".includes(char)) {
      push(char, "operator");
      i++;
      continue;
    }

    push(char, "punctuation");
    i++;
  }

  return result;
}
