import { labelAttr } from "@/components/form-builder/attributes/label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { makeAttribute, makeEntity } from "@/lib/form-builder";
import { SlidersHorizontalIcon } from "@phosphor-icons/react";
import { z } from "zod";

export const sliderEntity = makeEntity({
  name: "Slider",
  icon: SlidersHorizontalIcon,
  attributes: {
    label: labelAttr,
    min: makeAttribute({
      name: "min",
      defaultValue: 0,
      validate: (value: number) => {
        const schema = z.number();
        return schema.parse(value);
      },
      component: ({ value, setValue, validateValue, error }) => {
        return (
          <div className="w-full max-w-sm flex flex-col gap-1.5">
            <Label htmlFor="min" className="text-xs text-muted-foreground">Min</Label>
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
    }),
    max: makeAttribute({
      name: "max",
      defaultValue: 10,
      validate: (value: number) => {
        const schema = z.number();
        return schema.parse(value);
      },
      component: ({ value, setValue, validateValue, error }) => {
        return (
          <div className="w-full max-w-sm flex flex-col gap-1.5">
            <Label htmlFor="max" className="text-xs text-muted-foreground">Max</Label>
            <Input
              id="max"
              type="number"
              placeholder="Max value"
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
    }),
    defaultValue: makeAttribute({
      name: "defaultValue",
      defaultValue: 0,
      validate: (value: number) => {
        const schema = z.number();
        return schema.parse(value);
      },
      component: ({ value, setValue }) => {
        return (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Default Value</Label>
            <Input
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value))}
              type="number"
            />
          </div>
        );
      },
    }),
  },
  defaultValue: { type: "attribute", value: "defaultValue" },
  validate: (value: number) => {
    const schema = z.number();
    return schema.parse(value);
  },
  component: ({ attributes, value, setValue, disabled }) => {
    const { label, min, max } = attributes;

    return (
      <div className="w-full space-y-2">
        {label && <Label>{label}</Label>}

        <Slider
          value={[value ?? 0]}
          onValueChange={(val) => setValue(val as number)}
          min={min}
          max={max}
          disabled={disabled}
        />
      </div>
    );
  },
});
