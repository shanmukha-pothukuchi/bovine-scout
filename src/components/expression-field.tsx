import { useMemo, useState } from "react";
import { Editor } from "@/components/bovine-editor";
import Environment from "@/lib/bovine-basic/environment";
import { evaluate } from "@/lib/bovine-basic/interpreter";
import Parser from "@/lib/bovine-basic/parser";
import { runtimeValToString } from "@/lib/bovine-basic/values";
import type { Expr } from "@/lib/bovine-basic/ast";

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

export interface ExpressionFieldProps {
  value: string;
  onChange: (value: string) => void;
  environment?: Environment | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ExpressionField({
  value,
  onChange,
  environment = null,
  placeholder,
  disabled,
  className,
}: ExpressionFieldProps) {
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    setSyntaxError(checkSyntax(newValue));
  };

  const evalResult = useMemo<{ output: string | null; error: string | null }>(() => {
    const src = value.trim();
    if (!src || syntaxError) return { output: null, error: null };
    try {
      const ast = parser.produceAST(src);
      const env = new Environment(environment ?? undefined);
      const val = evaluate(ast as unknown as Expr, env);
      const output = runtimeValToString(val);
      return { output: output === "unit" ? null : output, error: null };
    } catch (e) {
      return { output: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [value, syntaxError, environment]);

  return (
    <div className={`font-mono text-base rounded-md border border-border bg-background overflow-hidden ${className ?? ""}`}>
      <Editor
        value={value}
        onChange={handleChange}
        environment={environment}
        placeholder={placeholder}
        disabled={disabled}
      />
      {syntaxError && (
        <div className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive border-t border-destructive/20 font-mono leading-snug">
          {syntaxError}
        </div>
      )}
      {!syntaxError && evalResult.error && (
        <div className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive border-t border-destructive/20 font-mono leading-snug">
          {evalResult.error}
        </div>
      )}
      {!syntaxError && !evalResult.error && evalResult.output != null && (
        <div className="px-3 py-1.5 text-sm text-muted-foreground border-t border-border font-mono leading-snug whitespace-pre-wrap">
          {evalResult.output}
        </div>
      )}
    </div>
  );
}
