import { useState } from "react";
import { Editor } from "@/components/bovine-editor";
import Parser from "@/lib/bovine-basic/parser";

const parser = new Parser();

const checkSyntax = (src: string): string | null => {
  if (src.trim() === "") return null;
  try {
    parser.produceAST(src);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
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
  const [active, setActive] = useState(true);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setSyntaxError(checkSyntax(newValue));
  };

  return (
    <div className="first:border-t border-b border-border flex font-mono text-base flex-col">
      <div className="flex flex-1">
        <div className="w-12 bg-muted relative flex flex-col items-center justify-center">
          <div
            className={`aspect-square w-9 rounded-full relative cursor-pointer bg-accent
              ${active ? "" : "before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:aspect-square before:w-6.5 before:m-auto before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 before:bg-secondary"}`}
            onClick={() => setActive(!active)}
          />
        </div>
        <Editor value={value} onChange={handleChange} className="flex-1" />
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
