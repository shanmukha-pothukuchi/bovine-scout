import { useMemo, useRef, useState, type ChangeEvent } from "react";
import getCaretCoordinates from "textarea-caret";
import styles from "./index.module.css";

interface AutoCompleteSuggestion {
    word: string;
    type: "keyword" | "function"
};

interface TextHighlight {
    text: string;
    type: "none" | "keyword" | "function" | "string" | "number";
}

const KEYWORDS = new Set([
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
]);

const getTextHighlights = (text: string): TextHighlight[] => {
    const result: TextHighlight[] = [];

    let i = 0;

    const push = (text: string, type: TextHighlight["type"]) => {
        if (text.length > 0) {
            result.push({ text, type });
        }
    };

    while (i < text.length) {
        const char = text[i];

        if (char === '"' || char === "'" || char === "`") {
            const quote = char;
            let j = i + 1;

            while (j < text.length && text[j] !== quote) {
                if (text[j] === "\\" && j + 1 < text.length) {
                    j += 2;
                } else {
                    j++;
                }
            }

            j++;
            push(text.slice(i, j), "string");
            i = j;
            continue;
        }

        if (/\d/.test(char)) {
            let j = i;
            while (j < text.length && /[\d.]/.test(text[j])) j++;
            push(text.slice(i, j), "number");
            i = j;
            continue;
        }

        if (/[a-zA-Z_]/.test(char)) {
            let j = i;
            while (j < text.length && /[a-zA-Z0-9_]/.test(text[j])) j++;

            const word = text.slice(i, j);

            if (text[j] === "(") {
                push(word, "function");
            } else if (KEYWORDS.has(word)) {
                push(word, "keyword");
            } else {
                push(word, "none");
            }

            i = j;
            continue;
        }

        push(char, "none");
        i++;
    }

    return result;
}

const autoCompleteSuggestions: AutoCompleteSuggestion[] = [
    { word: 'const', type: 'keyword' },
    { word: 'let', type: 'keyword' },
    { word: 'var', type: 'keyword' },
    { word: 'function', type: 'keyword' },
    { word: 'return', type: 'keyword' },
    { word: 'log', type: 'function' },
];

const getAutoCompleteSuggestions = (word: string) => {
    if (word.length == 0) return [];
    return autoCompleteSuggestions.filter((s) => s.word.startsWith(word));
}

export function Cell() {
    const [value, setValue] = useState("");
    const [replaceRange, setReplaceRange] = useState<{ start: number; end: number } | null>(null);
    const [autoCompleteMatches, setAutoCompleteMatches] = useState<AutoCompleteSuggestion[]>([]);
    const [autoCompleteBoxPos, setAutoCompleteBoxPos] = useState<{ top: number; left: number } | null>();
    const [selectedMatch, setSelectedMatch] = useState(-1);

    const inputLayerRef = useRef<HTMLTextAreaElement>(null);
    const highlightLayerRef = useRef<HTMLPreElement>(null);

    const textHighlights = useMemo(() => getTextHighlights(value), [value]);

    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);

        const cursor = e.target.selectionStart;

        let start = cursor;
        while (start > 0 && /\w/.test(value[start - 1])) {
            start--;
        }
        const end = cursor;

        setReplaceRange({ start, end });

        const coords = getCaretCoordinates(e.target, e.target.selectionEnd);
        setAutoCompleteBoxPos({ left: coords.left, top: coords.top + coords.height });

        const word = e.target.value.slice(start, end);
        setAutoCompleteMatches(getAutoCompleteSuggestions(word));
        setSelectedMatch(0);
    }

    const insertText = (replacement: string) => {
        if (!replaceRange) return;

        const { start, end } = replaceRange;

        setValue((prev) => prev.substring(0, start) + replacement + prev.substring(end));

        requestAnimationFrame(() => {
            inputLayerRef.current?.setSelectionRange(
                start + replacement.length,
                start + replacement.length
            );
            inputLayerRef.current?.focus();
        });

        setReplaceRange(null);

        setAutoCompleteMatches([]);
        inputLayerRef.current?.focus();
    }

    const insertAtCursor = (insert: string) => {
        const el = inputLayerRef.current;
        if (!el) return;

        const start = el.selectionStart;
        const end = el.selectionEnd;

        setValue(prev =>
            prev.slice(0, start) + insert + prev.slice(end)
        );

        requestAnimationFrame(() => {
            const pos = start + insert.length;
            el.setSelectionRange(pos, pos);
            el.focus();
        });
    };

    const [active, setActive] = useState(true);

    return (
        <div className={styles.cell}>
            <div className={styles.handle} onClick={() => setActive(!active)}>
                <div className={`${styles.toggle} ${active && styles.active}`}></div>
            </div>
            <div className={styles.editor}>
                <pre className={`${styles.editor_layer} ${styles.highlight_layer}`} ref={highlightLayerRef}>
                    {textHighlights.map((highlight, i) => {
                        switch (highlight.type) {
                            case "string": return <span key={i} className={styles.hl_string}>{highlight.text}</span>;
                            case "keyword": return <span key={i} className={styles.hl_keyword}>{highlight.text}</span>;
                            case "function": return <span key={i} className={styles.hl_function}>{highlight.text}</span>;
                            case "number": return <span key={i} className={styles.hl_number}>{highlight.text}</span>;
                            default: return <span key={i}>{highlight.text}</span>;
                        }
                    })}
                    {value.endsWith("\n") && <br />}
                </pre>
                <textarea
                    className={`${styles.editor_layer} ${styles.input_layer}`}
                    ref={inputLayerRef}
                    spellCheck="false"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        const hasMatches = autoCompleteMatches.length > 0;
                        switch (e.key) {
                            case 'ArrowDown':
                                if (hasMatches) {
                                    e.preventDefault();
                                    setSelectedMatch((prev) => (prev + 1) % autoCompleteMatches.length);
                                }
                                break;
                            case 'ArrowUp':
                                if (hasMatches) {
                                    e.preventDefault();
                                    setSelectedMatch((prev) =>
                                        (prev - 1 + autoCompleteMatches.length) % autoCompleteMatches.length);
                                }
                                break;
                            case 'Enter':
                                if (hasMatches) { e.preventDefault(); insertText(autoCompleteMatches[selectedMatch].word); }
                                break;
                            case 'Tab':
                                e.preventDefault();
                                if (hasMatches) { insertText(autoCompleteMatches[selectedMatch].word); }
                                else { insertAtCursor("\t"); }
                                break;
                            case 'Escape':
                                e.preventDefault(); setAutoCompleteMatches([]);
                                break;
                        }
                    }}
                    onClick={() => setAutoCompleteMatches([])}
                />
                {autoCompleteBoxPos && autoCompleteMatches.length > 0 &&
                    <div
                        className={styles.autocomplete_container}
                        style={{ top: autoCompleteBoxPos.top, left: autoCompleteBoxPos.left }}>
                        {autoCompleteMatches.map((match, i) => (
                            <div
                                key={i}
                                className={`${styles.autocomplete_suggestion} ${i == selectedMatch && styles.selected}`}
                                onClick={() => {
                                    inputLayerRef.current?.focus();
                                    insertText(match.word);
                                }}>
                                <span>{match.word}</span>
                                <span className={styles.suggestion_type}>{match.type}</span>
                            </div>
                        ))}
                    </div>
                }
            </div>
        </div>
    );
}