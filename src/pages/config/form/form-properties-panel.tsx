import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLeafNode } from "@/lib/utils";
import { useMemo } from "react";
import { type FormEntry, useConfig } from "../context";
import type { MenuTreeNode } from "../context";

function collectLeafNodes(nodes: MenuTreeNode[]): MenuTreeNode[] {
  const leaves: MenuTreeNode[] = [];
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (isLeafNode(node)) {
      leaves.push(node);
    } else if (node.children) {
      stack.push(...node.children);
    }
  }
  return leaves;
}

export function FormPropertiesPanel({
  formEntry,
  onChange,
}: {
  formEntry: FormEntry;
  onChange: (patch: Partial<Pick<FormEntry, "label" | "menuItemIds">>) => void;
}) {
  const { menuTrees, forms } = useConfig();

  const allLeafNodes = useMemo(() => {
    const leaves: { value: string; label: string }[] = [];
    for (const [period, tree] of Object.entries(menuTrees)) {
      for (const node of collectLeafNodes(tree)) {
        leaves.push({ value: node.id, label: `${node.label} (${period})` });
      }
    }
    return leaves;
  }, [menuTrees]);

  const claimedByOthers = useMemo(() => {
    const claimed = new Set<string>();
    for (const f of forms) {
      if (f.id === formEntry.id) continue;
      for (const id of f.menuItemIds) {
        claimed.add(id);
      }
    }
    return claimed;
  }, [forms, formEntry.id]);

  const availableOptions = useMemo(
    () => allLeafNodes.filter((o) => !claimedByOthers.has(o.value)),
    [allLeafNodes, claimedByOthers],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Label</Label>
        <Input
          value={formEntry.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Form name"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Link Menu Items</Label>
        <MultiSelect
          values={formEntry.menuItemIds}
          onValuesChange={(values) => onChange({ menuItemIds: values })}
        >
          <MultiSelectTrigger className="w-full">
            <MultiSelectValue placeholder="Assign menu items…" overflowBehavior="wrap" />
          </MultiSelectTrigger>
          <MultiSelectContent search={{ placeholder: "Search…", emptyMessage: "No items found" }}>
            {availableOptions.map((o) => (
              <MultiSelectItem key={o.value} value={o.value}>
                {o.label}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </div>
  );
}
