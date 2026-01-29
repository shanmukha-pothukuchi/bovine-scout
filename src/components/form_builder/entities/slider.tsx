import { labelAttr } from "@/components/form_builder/attributes/label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { makeAttribute, makeEntity } from "@/lib/form-builder";
import { IconAdjustmentsAlt } from "@tabler/icons-react";
import { useEffect } from "react";
import { z } from "zod";

export const sliderEntity = makeEntity({
  name: "Slider",
  icon: <IconAdjustmentsAlt />,
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
          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="max">Max</Label>
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
          <div className="flex flex-col gap-2">
            <Label>Default Value</Label>
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
  defaultValue: 0,
  validate: (value: number) => {
    const schema = z.number();
    return schema.parse(value);
  },
  component: ({ attributes, value, setValue }) => {
    const { label, min, max, defaultValue } = attributes;

    useEffect(() => {
      setValue(defaultValue);
    }, [defaultValue]);

    return (
      <div className="w-full space-y-2">
        <Label>{label}</Label>

        <Slider
          value={[value]}
          onValueChange={(value) => setValue((value as number[])[0])}
          min={min}
          max={max}
        />
      </div>
    );
  },
});
