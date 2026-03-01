import type Environment from "@/lib/bovine-basic/environment";
import {
  BUILTIN_NAMES,
  getTextHighlights,
  KEYWORDS,
  type TextHighlight,
} from "@/lib/bovine-basic/highlight";
import { STDLIB_MEMBER_NAMES } from "@/lib/bovine-basic/stdlib";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import getCaretCoordinates from "textarea-caret";
import { AutoComplete, type AutoCompleteSuggestion } from "./autocomplete";

const HIGHLIGHT_CLASS: Record<string, string> = {
  string: "text-[#ce9178]",
  keyword: "text-[#569cd6]",
  function: "text-[#dcdcaa]",
  builtin: "text-[#4ec9b0]",
  number: "text-[#b5cea8]",
  operator: "text-[#d4d4d4]",
  comment: "text-[#6a9955]",
  identifier: "text-[#9cdcfe]",
  punctuation: "text-[#d4d4d4]",
};

const staticSuggestions: AutoCompleteSuggestion[] = [
  ...[...KEYWORDS].map((word) => ({ word, type: "keyword" as const })),
  ...[...BUILTIN_NAMES].map((word) => ({ word, type: "builtin" as const })),
  ...STDLIB_MEMBER_NAMES.map((word) => ({ word, type: "builtin" as const })),
];

function buildSuggestions(env: Environment | null): AutoCompleteSuggestion[] {
  if (!env) return staticSuggestions;
  const staticWords = new Set(staticSuggestions.map((s) => s.word));
  const envSuggestions: AutoCompleteSuggestion[] = env
    .getVariableNames()
    .filter((name) => !staticWords.has(name))
    .map((word) => ({ word, type: "variable" as const }));
  return [...staticSuggestions, ...envSuggestions];
}

function filterSuggestions(
  word: string,
  suggestions: AutoCompleteSuggestion[],
): AutoCompleteSuggestion[] {
  if (word.length === 0) return [];
  return suggestions.filter((s) => s.word.startsWith(word));
}

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  environment?: Environment | null;
  placeholder?: string;
  disabled?: boolean;
  /** Extra classes applied to the pre+textarea grid wrapper */
  className?: string;
}

export interface EditorHandle {
  focus: () => void;
  isAtStart: () => boolean;
  isAtEnd: () => boolean;
}

export const Editor = forwardRef<EditorHandle, EditorProps>(function Editor({
  value,
  onChange,
  onKeyDown,
  environment = null,
  placeholder,
  disabled,
  className,
}, ref) {
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

  const inputLayerRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputLayerRef.current?.focus(),
    isAtStart: () => {
      const el = inputLayerRef.current;
      return !!el && el.selectionStart === 0 && el.selectionEnd === 0;
    },
    isAtEnd: () => {
      const el = inputLayerRef.current;
      return !!el && el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
    },
  }));

  const allSuggestions = useMemo(
    () => buildSuggestions(environment),
    [environment],
  );

  const textHighlights = useMemo<TextHighlight[]>(
    () => getTextHighlights(value),
    [value],
  );

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursor = e.target.selectionStart;
    let start = cursor;
    while (start > 0 && /[\w.]/.test(newValue[start - 1])) start--;
    const end = cursor;

    setReplaceRange({ start, end });

    const rect = e.target.getBoundingClientRect();
    const coords = getCaretCoordinates(e.target, e.target.selectionEnd);
    setAutoCompleteBoxPos({
      left: rect.left + coords.left,
      top: rect.top + coords.top + coords.height,
    });

    const word = newValue.slice(start, end);
    setAutoCompleteMatches(filterSuggestions(word, allSuggestions));
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

  return (
    <>
      <div className={`relative grid w-full ${className ?? ""}`}>
        <pre className="bg-transparent col-start-1 row-start-1 w-full m-0 p-2.5 box-border leading-normal whitespace-pre-wrap wrap-break-word overflow-hidden border-none outline-none resize-none font-mono z-10 text-foreground pointer-events-none">
          {textHighlights.map((highlight, i) => (
            <span
              key={i}
              className={HIGHLIGHT_CLASS[highlight.type] ?? "text-[#d4d4d4]"}
            >
              {highlight.text}
            </span>
          ))}
          {value === "" && placeholder && (
            <span className="text-muted-foreground/50">{placeholder}</span>
          )}
          {value.endsWith("\n") && <br />}
        </pre>
        <textarea
          className="bg-transparent col-start-1 row-start-1 w-full m-0 p-2.5 box-border leading-normal whitespace-pre-wrap wrap-break-word overflow-hidden border-none outline-none resize-none font-mono z-20 text-transparent caret-white"
          ref={inputLayerRef}
          spellCheck="false"
          value={value}
          disabled={disabled}
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
            onKeyDown?.(e);
          }}
          onClick={() => setAutoCompleteMatches([])}
        />
      </div>

      {autoCompleteBoxPos && autoCompleteMatches.length > 0 && (
        <AutoComplete
          matches={autoCompleteMatches}
          selectedIndex={selectedMatch}
          position={autoCompleteBoxPos}
          onSelect={insertText}
        />
      )}
    </>
  );
});
