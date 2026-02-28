export interface AutoCompleteSuggestion {
  word: string;
  type: "keyword" | "function" | "builtin" | "variable";
}

export interface AutoCompleteProps {
  matches: AutoCompleteSuggestion[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (word: string) => void;
}

export function AutoComplete({
  matches,
  selectedIndex,
  position,
  onSelect,
}: AutoCompleteProps) {
  if (matches.length === 0) return null;

  return (
    <div
      className="fixed z-[9999] bg-popover border border-border w-50 p-2 rounded-lg flex flex-col gap-1 shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      {matches.map((match, i) => (
        <div
          key={i}
          className={`px-2.5 py-1 rounded-md cursor-pointer text-popover-foreground flex gap-2 text-base hover:bg-accent hover:text-accent-foreground ${
            i === selectedIndex ? "bg-accent text-accent-foreground" : ""
          }`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(match.word);
          }}
        >
          <span className="flex-1 break-all">{match.word}</span>
          <span className="opacity-50 text-sm shrink-0 pt-0.5">{match.type}</span>
        </div>
      ))}
    </div>
  );
}
