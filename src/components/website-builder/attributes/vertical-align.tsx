import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { makeAttribute } from "@/lib/website-builder";
import {
  ArrowLineUpIcon,
  ArrowsVerticalIcon,
  ArrowLineDownIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type VerticalAlign = "top" | "middle" | "bottom";

const verticalAlignOptions: {
  value: VerticalAlign;
  icon: React.ComponentType<{ size?: number | string }>;
  label: string;
}[] = [
  { value: "top", icon: ArrowLineUpIcon, label: "Top" },
  { value: "middle", icon: ArrowsVerticalIcon, label: "Middle" },
  { value: "bottom", icon: ArrowLineDownIcon, label: "Bottom" },
];

export const verticalAlignAttr = makeAttribute({
  name: "verticalAlign",
  defaultValue: "middle" as VerticalAlign,
  validate: (value: VerticalAlign) => value,
  component: ({ value, setValue }) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Vertical align</Label>
        <div className="flex gap-1">
          {verticalAlignOptions.map(({ value: align, icon: Icon, label }) => (
            <Button
              key={align}
              variant={value === align ? "default" : "outline"}
              size="icon"
              className={cn("size-8")}
              onClick={() => setValue(align)}
              title={label}
            >
              <Icon size={16} />
            </Button>
          ))}
        </div>
      </div>
    );
  },
});
