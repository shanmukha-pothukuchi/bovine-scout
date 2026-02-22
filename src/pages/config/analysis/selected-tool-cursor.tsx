import { cn } from "@/lib/utils";

type SelectedToolCursorProps = {
  visible: boolean;
  x: number;
  y: number;
  label: string;
};

export function SelectedToolCursor({
  visible,
  x,
  y,
  label,
}: SelectedToolCursorProps) {
  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-foreground shadow-sm transition-opacity",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{
        left: x + 10,
        top: y + 10,
      }}
    >
      {label}
    </div>
  );
}
