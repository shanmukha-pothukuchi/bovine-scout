import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { makeAttribute } from "@/lib/website-builder";

export const backgroundColorAttr = makeAttribute({
  name: "backgroundColor",
  defaultValue: "red",
  validate: (value: string) => value,
  component: ({ value, setValue }) => {
    return (
      <div className="w-full space-y-2">
        <Label>Background color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border-none bg-transparent p-0"
          />
          <Input
            type="text"
            className="flex-1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="#ffffff"
          />
        </div>
      </div>
    );
  },
});
