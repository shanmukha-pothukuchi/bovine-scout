import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeEntity } from "@/lib/form-builder";
import { labelAttr } from "@/components/form-builder/attributes/label";
import { placeholderAttr } from "@/components/form-builder/attributes/placeholder";
import { requiredAttr } from "@/components/form-builder/attributes/required";
import { z } from "zod";
import { IconTextCaption } from "@tabler/icons-react";

export const textEntity = makeEntity({
  name: "Text",
  icon: <IconTextCaption />,
  attributes: {
    label: labelAttr,
    placeholder: placeholderAttr,
    required: requiredAttr,
  },
  defaultValue: "",
  validate: (value, { required }) => {
    const base = z.string();
    const schema = required ? base.nonempty() : base;
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
    const { label, placeholder, required } = attributes;

    return (
      <div className="w-full space-y-2">
        <Label>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>

        <Input
          type="text"
          value={value}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
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
