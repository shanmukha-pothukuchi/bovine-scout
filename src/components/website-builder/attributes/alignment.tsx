import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { makeAttribute } from "@/lib/website-builder";
import {
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
} from "@phosphor-icons/react";

export type Alignment = "left" | "center" | "right" | "justify";

const alignmentOptions: {
  value: Alignment;
  icon: React.ComponentType<{ size?: number | string }>;
}[] = [
  { value: "left", icon: TextAlignLeftIcon },
  { value: "center", icon: TextAlignCenterIcon },
  { value: "right", icon: TextAlignRightIcon },
  { value: "justify", icon: TextAlignJustifyIcon },
];

export const alignmentAttr = makeAttribute({
  name: "alignment",
  defaultValue: "center" as Alignment,
  validate: (value: Alignment) => value,
  component: ({ value, setValue }) => {
    return (
      <div className="w-full space-y-2">
        <Label>Alignment</Label>
        <div className="flex gap-1">
          {alignmentOptions.map(({ value: align, icon: Icon }) => (
            <Button
              key={align}
              variant={value === align ? "default" : "outline"}
              size="icon"
              className={cn("size-8")}
              onClick={() => setValue(align)}
            >
              <Icon size={16} />
            </Button>
          ))}
        </div>
      </div>
    );
  },
});
