import { Label } from "@/components/ui/label";
import { makeAttribute, makeEntity } from "@/lib/form-builder";
import { minAttr } from "@/components/form_builder/attributes/min";
import { maxAttr } from "@/components/form_builder/attributes/max";
import * as z from "zod";
import { IconAdjustmentsAlt } from "@tabler/icons-react";
import { Slider } from "@/components/ui/slider";
import { labelAttr } from "@/components/form_builder/attributes/label";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

export const sliderEntity = makeEntity({
    name: "Slider",
    icon: <IconAdjustmentsAlt />,
    attributes: {
        label: labelAttr,
        min: minAttr,
        max: maxAttr,
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
                        <Label>
                            Default Value
                        </Label>
                        <Input value={value} onChange={(e) => setValue(parseInt(e.target.value))} type="number" />
                    </div>
                );
            }
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
                <Label>
                    {label}
                </Label>

                <Slider
                    value={[value]}
                    onValueChange={(value) => setValue((value as number[])[0])}
                    min={min}
                    max={max}
                />
            </div>
        );
    }
});
