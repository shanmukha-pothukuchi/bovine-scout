import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { makeAttribute } from "@/lib/website-builder";

export const fontSizeAttr = makeAttribute({
  name: "fontSize",
  defaultValue: 16,
  validate: (value: number) => Math.max(8, Math.min(value, 120)),
  component: ({ value, setValue }) => {
    return (
      <div className="w-full space-y-2">
        <Label>Font size (px)</Label>
        <div className="flex items-center gap-3">
          <Slider
            className="flex-1"
            value={[value]}
            min={8}
            max={120}
            step={1}
            onValueChange={(v) => setValue(Array.isArray(v) ? v[0] : v)}
          />
          <Input
            type="number"
            className="w-16 text-center"
            value={value}
            min={8}
            max={120}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
      </div>
    );
  },
});
