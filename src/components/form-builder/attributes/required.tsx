import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { makeAttribute } from "@/lib/form-builder";

export const requiredAttr = makeAttribute({
  name: "required",
  defaultValue: false,
  validate: (value: boolean) => value,
  component: ({ value, setValue }) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        <Label htmlFor="required" className="text-xs text-muted-foreground">Required</Label>
        <Switch id="required" checked={value} onCheckedChange={setValue} />
      </div>
    );
  },
});
