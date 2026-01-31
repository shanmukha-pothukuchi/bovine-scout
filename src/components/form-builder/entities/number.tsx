import { labelAttr } from "@/components/form-builder/attributes/label";
import { placeholderAttr } from "@/components/form-builder/attributes/placeholder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeEntity } from "@/lib/form-builder";
import { IconNumber } from "@tabler/icons-react";
import { z } from "zod";

export const numberEntity = makeEntity({
  name: "Number",
  icon: <IconNumber />,
  attributes: {
    label: labelAttr,
    placeholder: placeholderAttr,
  },
  defaultValue: 0,
  validate: (value: number) => {
    const schema = z.number();
    return schema.parse(value);
  },
  component: ({
    attributes,
    value,
    setValue,
    validateValue,
    error,
    disabled,
  }) => {
    const { label, placeholder } = attributes;

    return (
      <div className="w-full space-y-2">
        <Label>{label}</Label>

        <Input
          type="number"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
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
