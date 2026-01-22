import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeAttribute } from "@/lib/form-builder";
import { z } from "zod";

export const minAttr = makeAttribute({
  name: "min",
  defaultValue: 0,
  validate: (value: number) => {
    const schema = z.number();
    return schema.parse(value);
  },
  component: ({ value, setValue, validateValue, error }) => {
    return (
      <div className="w-full max-w-sm space-y-2">
        <Label htmlFor="min">Min</Label>
        <Input
          id="min"
          type="number"
          placeholder="Min value"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          onBlur={validateValue}
        />
        {error && (
          <div className="text-destructive text-sm">
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  },
});
