import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeAttribute } from "@/lib/form-builder";
import { z } from "zod";

export const labelAttr = makeAttribute({
    name: "label",
    defaultValue: "",
    validate: (value: string) => {
        const schema = z.string().min(4).max(24);
        return schema.parse(value);
    },
    component: ({ value, setValue, validateValue, error }) => {
        return (
            <div className="w-full max-w-sm space-y-2">
                <Label htmlFor="label">
                    Label
                </Label>
                <Input
                    id="label"
                    type="text"
                    placeholder="Label"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() => validateValue()}
                />
                {error &&
                    <div className="text-destructive text-sm">
                        <span>{error}</span>
                    </div>
                }
            </div>
        )
    }
});