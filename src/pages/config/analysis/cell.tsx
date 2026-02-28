import { useMemo, useRef, useState, type ChangeEvent } from "react";
import getCaretCoordinates from "textarea-caret";
import {
  getTextHighlights,
  KEYWORDS,
  BUILTIN_NAMES,
  type TextHighlight,
} from "../../../lib/bovine-basic/highlight";
import { STDLIB_MEMBER_NAMES } from "../../../lib/bovine-basic/stdlib";
import Parser from "../../../lib/bovine-basic/parser";

interface AutoCompleteSuggestion {
  word: string;
  type: "keyword" | "function" | "builtin";
}

const autoCompleteSuggestions: AutoCompleteSuggestion[] = [
  ...[...KEYWORDS].map((word) => ({ word, type: "keyword" as const })),
  ...[...BUILTIN_NAMES].map((word) => ({ word, type: "builtin" as const })),
  ...STDLIB_MEMBER_NAMES.map((word) => ({ word, type: "builtin" as const })),
];

const parser = new Parser();

const getAutoCompleteSuggestions = (word: string): AutoCompleteSuggestion[] => {
  if (word.length === 0) return [];
  return autoCompleteSuggestions.filter((s) => s.word.startsWith(word));
};

export interface CellResult {
  output: string | null;
  error: string | null;
}

export function Cell({
  value,
  onChange,
  result,
}: {
  value: string;
  onChange: (value: string) => void;
  result?: CellResult;
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

  const textHighlights = useMemo<TextHighlight[]>(
    () => getTextHighlights(value),
    [value],
  );

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
          className="w-12 bg-muted relative flex flex-col items-center justify-center"
        >
          <div
            className={`aspect-square w-9 rounded-full relative cursor-pointer bg-accent 
                    ${active ? "" : "before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:aspect-square before:w-6.5 before:m-auto before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-secondary"}`}
            onClick={() => setActive(!active)}
          />
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
                    <span key={i} className="text-[#dcdcaa]">
                      {highlight.text}
                    </span>
                  );
                case "builtin":
                  return (
                    <span key={i} className="text-[#4ec9b0]">
                      {highlight.text}
                    </span>
                  );
                case "number":
                  return (
                    <span key={i} className="text-[#b5cea8]">
                      {highlight.text}
                    </span>
                  );
                case "operator":
                  return (
                    <span key={i} className="text-[#d4d4d4]">
                      {highlight.text}
                    </span>
                  );
                case "comment":
                  return (
                    <span key={i} className="text-[#6a9955]">
                      {highlight.text}
                    </span>
                  );
                case "identifier":
                  return (
                    <span key={i} className="text-[#9cdcfe]">
                      {highlight.text}
                    </span>
                  );
                case "punctuation":
                default:
                  return (
                    <span key={i} className="text-[#d4d4d4]">
                      {highlight.text}
                    </span>
                  );
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
      {!syntaxError && result?.error && (
        <div className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive border-t border-destructive/20 font-mono leading-snug">
          {result.error}
        </div>
      )}
      {!syntaxError && !result?.error && result?.output != null && (
        <div className="px-3 py-1.5 text-sm text-muted-foreground border-t border-border font-mono leading-snug whitespace-pre-wrap">
          {result.output}
        </div>
      )}
    </div>
  );
}
