import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { makeAttribute } from "@/lib/website-builder";

export const paddingAttr = makeAttribute({
  name: "padding",
  defaultValue: 0,
  validate: (value: number) => Math.max(0, Math.min(value, 200)),
  component: ({ value, setValue }) => {
    return (
      <div className="w-full space-y-2">
        <Label>Padding (px)</Label>
        <div className="flex items-center gap-3">
          <Slider
            className="flex-1"
            value={[value]}
            min={0}
            max={200}
            step={1}
            onValueChange={(v) => setValue(Array.isArray(v) ? v[0] : v)}
          />
          <Input
            type="number"
            className="w-16 text-center"
            value={value}
            min={0}
            max={200}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
      </div>
    );
  },
});
