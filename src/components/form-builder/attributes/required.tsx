import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { makeAttribute } from "@/lib/form-builder";

export const requiredAttr = makeAttribute({
  name: "required",
  defaultValue: false,
  validate: (value: boolean) => value,
  component: ({ value, setValue }) => {
    return (
      <div className="w-full flex flex-col gap-2">
        <Label htmlFor="required">Required</Label>
        <Switch id="required" checked={value} onCheckedChange={setValue} />
      </div>
    );
  },
});
