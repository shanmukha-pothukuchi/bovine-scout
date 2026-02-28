import { useMemo, useRef, useState, type ChangeEvent } from "react";
import getCaretCoordinates from "textarea-caret";
import Parser from "../../../lib/bovine-basic/parser";

interface AutoCompleteSuggestion {
  word: string;
  type: "keyword" | "function" | "builtin";
}

interface TextHighlight {
  text: string;
  type: "none" | "keyword" | "function" | "string" | "number" | "operator" | "comment";
}

const KEYWORDS = new Set([
  "if",
  "then",
  "else",
  "while",
  "for",
  "in",
  "match",
  "unit",
  "true",
  "false",
]);

const getTextHighlights = (text: string): TextHighlight[] => {
  const result: TextHighlight[] = [];
  let i = 0;

  const push = (text: string, type: TextHighlight["type"]) => {
    if (text.length > 0) result.push({ text, type });
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

    // Identifiers, keywords, and function calls
    if (/[a-zA-Z_]/.test(char)) {
      let j = i;
      while (j < text.length && /[a-zA-Z0-9_]/.test(text[j])) j++;
      const word = text.slice(i, j);

      // Look ahead past whitespace to check for `(`
      let k = j;
      while (k < text.length && (text[k] === " " || text[k] === "\t")) k++;

      if (text[k] === "(") {
        push(word, "function");
      } else if (KEYWORDS.has(word)) {
        push(word, "keyword");
      } else {
        push(word, "none");
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

    // Comparison/equality operators
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

    push(char, "none");
    i++;
  }

  return result;
};

const autoCompleteSuggestions: AutoCompleteSuggestion[] = [
  // Keywords
  { word: "if", type: "keyword" },
  { word: "then", type: "keyword" },
  { word: "else", type: "keyword" },
  { word: "while", type: "keyword" },
  { word: "for", type: "keyword" },
  { word: "in", type: "keyword" },
  { word: "match", type: "keyword" },
  { word: "unit", type: "keyword" },
  { word: "true", type: "keyword" },
  { word: "false", type: "keyword" },
  // stat library
  { word: "stat.mean", type: "builtin" },
  { word: "stat.median", type: "builtin" },
  { word: "stat.mode", type: "builtin" },
  { word: "stat.range", type: "builtin" },
  { word: "stat", type: "builtin" },
];

const parser = new Parser();

const getAutoCompleteSuggestions = (word: string) => {
  if (word.length === 0) return [];
  return autoCompleteSuggestions.filter((s) => s.word.startsWith(word));
};

export function Cell({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [replaceRange, setReplaceRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [autoCompleteMatches, setAutoCompleteMatches] = useState<
    AutoCompleteSuggestion[]
  >([]);
  const [autoCompleteBoxPos, setAutoCompleteBoxPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState(-1);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const inputLayerRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLPreElement>(null);

  const textHighlights = useMemo(() => getTextHighlights(value), [value]);

  const checkSyntax = (src: string) => {
    if (src.trim() === "") {
      setSyntaxError(null);
      return;
    }
    try {
      parser.produceAST(src);
      setSyntaxError(null);
    } catch (e) {
      setSyntaxError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    checkSyntax(newValue);

    const cursor = e.target.selectionStart;

    let start = cursor;
    while (start > 0 && /[\w.]/.test(newValue[start - 1])) {
      start--;
    }
    const end = cursor;

    setReplaceRange({ start, end });

    const coords = getCaretCoordinates(e.target, e.target.selectionEnd);
    setAutoCompleteBoxPos({
      left: coords.left,
      top: coords.top + coords.height,
    });

    const word = newValue.slice(start, end);
    setAutoCompleteMatches(getAutoCompleteSuggestions(word));
    setSelectedMatch(0);
  };

  const insertText = (replacement: string) => {
    if (!replaceRange) return;

    const { start, end } = replaceRange;
    onChange(value.substring(0, start) + replacement + value.substring(end));

    requestAnimationFrame(() => {
      inputLayerRef.current?.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
      inputLayerRef.current?.focus();
    });

    setReplaceRange(null);
    setAutoCompleteMatches([]);
    inputLayerRef.current?.focus();
  };

  const insertAtCursor = (insert: string) => {
    const el = inputLayerRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    onChange(value.slice(0, start) + insert + value.slice(end));

    requestAnimationFrame(() => {
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  };

  const [active, setActive] = useState(true);

  return (
    <div className="first:border-t border-b border-border flex font-mono text-base flex-col">
      <div className="flex flex-1">
        <div
          className="w-12 bg-muted relative"
          onClick={() => setActive(!active)}
        >
          <div
            className={`aspect-square w-9 m-auto mt-2.5 rounded-full relative cursor-pointer bg-accent 
                    ${active ? "" : "before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:aspect-square before:w-6.5 before:m-auto before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-secondary"}`}
          ></div>
        </div>
        <div className="relative grid w-full">
          <pre
            className="bg-transparent col-start-1 row-start-1 w-full m-0 p-2.5 box-border leading-normal whitespace-pre-wrap wrap-break-word overflow-hidden border-none outline-none resize-none font-mono z-10 text-foreground pointer-events-none"
            ref={highlightLayerRef}
          >
            {textHighlights.map((highlight, i) => {
              switch (highlight.type) {
                case "string":
                  return (
                    <span key={i} className="text-[#ce9178]">
                      {highlight.text}
                    </span>
                  );
                case "keyword":
                  return (
                    <span key={i} className="text-[#569cd6]">
                      {highlight.text}
                    </span>
                  );
                case "function":
                  return (
                    <span key={i} className="text-[#d9d9a7]">
                      {highlight.text}
                    </span>
                  );
                case "number":
                  return (
                    <span key={i} className="text-[#b5cda8]">
                      {highlight.text}
                    </span>
                  );
                case "operator":
                  return (
                    <span key={i} className="text-[#d4d4d4] opacity-70">
                      {highlight.text}
                    </span>
                  );
                case "comment":
                  return (
                    <span key={i} className="text-[#6a9955]">
                      {highlight.text}
                    </span>
                  );
                default:
                  return <span key={i}>{highlight.text}</span>;
              }
            })}
            {value.endsWith("\n") && <br />}
          </pre>
          <textarea
            className="bg-transparent col-start-1 row-start-1 w-full m-0 p-2.5 box-border leading-normal whitespace-pre-wrap wrap-break-word overflow-hidden border-none outline-none resize-none font-mono z-20 text-transparent caret-white"
            ref={inputLayerRef}
            spellCheck="false"
            value={value}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              const hasMatches = autoCompleteMatches.length > 0;
              switch (e.key) {
                case "ArrowDown":
                  if (hasMatches) {
                    e.preventDefault();
                    setSelectedMatch(
                      (prev) => (prev + 1) % autoCompleteMatches.length,
                    );
                  }
                  break;
                case "ArrowUp":
                  if (hasMatches) {
                    e.preventDefault();
                    setSelectedMatch(
                      (prev) =>
                        (prev - 1 + autoCompleteMatches.length) %
                        autoCompleteMatches.length,
                    );
                  }
                  break;
                case "Enter":
                  if (hasMatches) {
                    e.preventDefault();
                    insertText(autoCompleteMatches[selectedMatch].word);
                  }
                  break;
                case "Tab":
                  e.preventDefault();
                  if (hasMatches) {
                    insertText(autoCompleteMatches[selectedMatch].word);
                  } else {
                    insertAtCursor("\t");
                  }
                  break;
                case "Escape":
                  e.preventDefault();
                  setAutoCompleteMatches([]);
                  break;
              }
            }}
            onClick={() => setAutoCompleteMatches([])}
          />
          {autoCompleteBoxPos && autoCompleteMatches.length > 0 && (
            <div
              className="z-50 absolute bg-popover border border-border w-48 p-2 rounded-lg flex flex-col gap-1"
              style={{
                top: autoCompleteBoxPos.top,
                left: autoCompleteBoxPos.left,
              }}
            >
              {autoCompleteMatches.map((match, i) => (
                <div
                  key={i}
                  className={`px-2.5 py-1 rounded-md cursor-pointer text-popover-foreground flex justify-between text-base hover:bg-accent hover:text-accent-foreground ${i === selectedMatch && "bg-accent text-accent-foreground"}`}
                  onClick={() => {
                    inputLayerRef.current?.focus();
                    insertText(match.word);
                  }}
                >
                  <span>{match.word}</span>
                  <span className="opacity-50 my-auto text-sm">{match.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {syntaxError && (
        <div className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive border-t border-destructive/20 font-mono leading-snug">
          {syntaxError}
        </div>
      )}
    </div>
  );
}
