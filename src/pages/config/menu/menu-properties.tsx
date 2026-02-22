import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isLeafNode } from "@/lib/utils/tree";
import { CaretLeftIcon } from "@phosphor-icons/react";
import type { MenuTreeNode } from "../context";

export function MenuProperties({
  selectedNode,
  onClose,
  onUpdateProperty,
}: {
  selectedNode: MenuTreeNode;
  onClose: () => void;
  onUpdateProperty: (
    property: keyof Omit<MenuTreeNode, "id" | "children">,
    value: any,
  ) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <CaretLeftIcon className="opacity-50" />
        </Button>
        <div className="text-sm font-medium text-muted-foreground">
          Properties
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={selectedNode.label}
          onChange={(e) => onUpdateProperty("label", e.target.value)}
        />
      </div>

      {isLeafNode(selectedNode) && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={selectedNode.type || "instantaneous"}
            onValueChange={(value) =>
              onUpdateProperty("type", value as "instantaneous" | "duration")
            }
          >
            <SelectTrigger id="type">
              <SelectValue>
                {selectedNode.type === "duration"
                  ? "Duration"
                  : "Instantaneous"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="instantaneous">Instantaneous</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
