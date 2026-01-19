import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEntity, createEntityComponent } from "@/lib/form-builder";
import { labelAttr } from "@/components/form_builder/attributes/label";
import { placeholderAttr } from "@/components/form_builder/attributes/placeholder";
import { requiredAttr } from "@/components/form_builder/attributes/required";
import * as z from "zod";

export const textEntity = createEntity({
    name: "text",
    attributes: {
        label: labelAttr,
        placeholder: placeholderAttr,
        required: requiredAttr,
    },
    defaultValue: "",
    validate: (value, { required }) => {
        console.log(required);
        const base = z.string();
        const schema = required ? base.nonempty() : base;
        return schema.parse(value);
    },
});

export const TextEntityComponent = createEntityComponent(
    textEntity,
    ({ attributes, value, setValue, validateValue, error }) => {
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
    }
);
