import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAttribute, createAttributeComponent } from "@/lib/form-builder";
import * as z from "zod";

export const placeholderAttr = createAttribute({
    name: "placeholder",
    defaultValue: "",
    validate: (value: string) => {
        const schema = z.string().min(0).max(48);
        return schema.parse(value);
    }
});

export const PlaceholderAttrComponent = createAttributeComponent(
    placeholderAttr,
    ({ value, setValue, validateValue, error }) => {
        return (
            <div className="w-full max-w-sm space-y-2">
                <Label htmlFor="placeholder">
                    Placeholder
                </Label>
                <Input
                    id="placeholder"
                    type="text"
                    placeholder="Placeholder text"
                    value={value}
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
