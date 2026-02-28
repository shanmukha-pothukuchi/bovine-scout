import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormEntry } from "../context";

export function FormPropertiesPanel({
  formEntry,
  onChange,
}: {
  formEntry: FormEntry;
  onChange: (patch: Partial<Pick<FormEntry, "label">>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input
          value={formEntry.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Form name"
        />
      </div>
    </div>
  );
}
