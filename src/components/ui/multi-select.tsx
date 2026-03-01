import React from "react";
import { XIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: MultiSelectOption[];
  onChange?: (value: MultiSelectOption[]) => void;
  placeholder?: string;
  className?: string;
}

function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selected = value ?? [];

  const handleUnselect = React.useCallback(
    (option: MultiSelectOption) => {
      onChange?.(selected.filter((s) => s.value !== option.value));
    },
    [selected, onChange],
  );

  const handleSelect = React.useCallback(
    (option: MultiSelectOption) => {
      setInputValue("");
      onChange?.([...selected, option]);
    },
    [selected, onChange],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) return;
      if ((e.key === "Delete" || e.key === "Backspace") && input.value === "") {
        onChange?.(selected.slice(0, -1));
      }
      if (e.key === "Escape") {
        input.blur();
      }
    },
    [selected, onChange],
  );

  const selectables = options.filter(
    (option) => !selected.some((s) => s.value === option.value),
  );

  const filtered = inputValue
    ? selectables.filter((o) =>
        o.label.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : selectables;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={cn("relative", className)}
    >
      <div
        className={cn(
          "border-input dark:bg-input/30 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] flex flex-wrap gap-1 rounded-lg border bg-transparent px-2.5 py-1.5 text-sm transition-colors min-h-8",
        )}
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {selected.map((option) => (
          <span
            key={option.value}
            className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
          >
            {option.label}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground rounded-full outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleUnselect(option);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUnselect(option);
              }}
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setInputValue("");
          }}
          placeholder={selected.length === 0 ? placeholder : undefined}
          className="min-w-20 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="bg-popover text-popover-foreground ring-foreground/10 absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg shadow-md ring-1">
          <div className="p-1">
            {filtered.map((option) => (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleSelect(option)}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md px-2.5 py-1.5 text-sm select-none"
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { MultiSelect };
