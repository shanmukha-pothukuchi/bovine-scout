import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type SelectedToolCursorProps = {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  icon?: ComponentType<{ size?: number | string }>;
};

export function SelectedToolCursor({
  visible,
  x,
  y,
  label,
  icon: Icon,
}: SelectedToolCursorProps) {
  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-foreground shadow-sm transition-opacity inline-flex items-center gap-1.5",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{
        left: x + 10,
        top: y + 10,
      }}
    >
      {Icon && <Icon size={14} />}
      {label}
    </div>
  );
}
