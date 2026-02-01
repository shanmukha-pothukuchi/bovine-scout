import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { useState } from "react";
import { createPortal } from "react-dom";
import RadialMenu, { type MenuTreeNode } from "@/components/radial-menu";

import { Node } from "./node";
import { TreeNode } from "./tree-node";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useConfig } from "../context";

export default function MenuEditor() {
  const { menuTrees, setMenuTrees, gamePeriods } = useConfig();
  const [gamePeriod, setGamePeriod] = useState<string>(gamePeriods[0]);

  const menuTree = menuTrees[gamePeriod] || [];

  const setMenuTree: React.Dispatch<React.SetStateAction<MenuTreeNode[]>> = (
    action,
  ) => {
    setMenuTrees((prev) => {
      const currentTree = prev[gamePeriod] || [];
      const newTree =
        typeof action === "function" ? action(currentTree) : action;
      return { ...prev, [gamePeriod]: newTree };
    });
  };

  const [editItem, setEditItem] = useState<MenuTreeNode["id"] | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuTreeNode["id"] | null>(
    null,
  );
  const [activeItem, setActiveItem] = useState<MenuTreeNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const setMenuTreeProperty = (id: MenuTreeNode["id"], value: string) => {
    const update = (nodes: MenuTreeNode[]): MenuTreeNode[] =>
      nodes.map((node) => {
        if (node.id === id) return { ...node, label: value };
        if (node.children) return { ...node, children: update(node.children) };
        return node;
      });

    setMenuTree(update);
  };

  const getItemById = (
    id: UniqueIdentifier,
    items: MenuTreeNode[],
  ): MenuTreeNode | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = getItemById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const getParentByChildId = (
    childId: string,
    items: MenuTreeNode[],
  ): MenuTreeNode | null => {
    for (const item of items) {
      if (item.children?.some((c) => c.id === childId)) return item;
      if (item.children) {
        const found = getParentByChildId(childId, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const removeNode = (id: string, nodes: MenuTreeNode[]): MenuTreeNode[] =>
    nodes
      .filter((n) => n.id !== id)
      .map((n) =>
        n.children ? { ...n, children: removeNode(id, n.children) } : n,
      );

  const insertNode = (
    tree: MenuTreeNode[],
    parentId: string | null,
    index: number,
    node: MenuTreeNode,
  ): MenuTreeNode[] => {
    if (parentId === null) {
      const copy = [...tree];
      copy.splice(index, 0, node);
      return copy;
    }

    return tree.map((n) => {
      if (n.id === parentId) {
        const children = [...(n.children ?? [])];
        children.splice(index, 0, node);
        return { ...n, children };
      }

      return n.children
        ? { ...n, children: insertNode(n.children, parentId, index, node) }
        : n;
    });
  };

  const isDescendant = (parent: MenuTreeNode, childId: string): boolean =>
    parent.children?.some(
      (c) => c.id === childId || isDescendant(c, childId),
    ) ?? false;

  const getIndexUnderParent = (
    targetId: string,
    parent: MenuTreeNode | null,
    tree: MenuTreeNode[],
  ): number => {
    const siblings = parent ? (parent.children ?? []) : tree;
    return siblings.findIndex((n) => n.id === targetId);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveItem(getItemById(active.id, menuTree));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItem(null);
    if (!over) return;

    const activeId = active.id as string;
    const [targetId, zone] = (over.id as string).split("::");

    if (!zone || activeId === targetId) return;

    setMenuTree((prev) => {
      const activeNode = getItemById(activeId, prev);
      if (!activeNode) return prev;

      if (isDescendant(activeNode, targetId)) return prev;

      const cleanedTree = removeNode(activeId, prev);

      let parentId: string | null = null;
      let index = 0;

      if (zone === "inside") {
        parentId = targetId;
        index = getItemById(targetId, cleanedTree)?.children?.length ?? 0;
        setExpandedNodes((prev) => new Set(prev).add(targetId));
      } else {
        const parent = getParentByChildId(targetId, cleanedTree);
        parentId = parent ? parent.id : null;

        const targetIndex = getIndexUnderParent(targetId, parent, cleanedTree);

        if (targetIndex === -1) return prev;

        index = zone === "before" ? targetIndex : targetIndex + 1;
      }

      return insertNode(cleanedTree, parentId, index, activeNode);
    });
  };

  return (
    <div className="h-full flex">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-72 h-full bg-sidebar border-r border-border p-2 overflow-y-auto">
          <div className="mb-2 flex items-center justify-between">
            <Select
              value={gamePeriod}
              onValueChange={(val) => val && setGamePeriod(val)}
            >
              <SelectTrigger>
                <SelectValue>{gamePeriod}</SelectValue>
              </SelectTrigger>

              <SelectContent align="start">
                {gamePeriods.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setMenuTree((prev) => [
                  ...prev,
                  { id: nanoid(), label: "New Item" },
                ]);
              }}
            >
              <IconPlus className="opacity-50" />
            </Button>
          </div>

          <TreeNode
            tree={menuTree}
            editItem={editItem}
            setEditItem={setEditItem}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            setText={setMenuTreeProperty}
            addChild={(id) => {
              setMenuTree((prev) =>
                insertNode(
                  prev,
                  id,
                  getItemById(id, prev)?.children?.length ?? 0,
                  { id: nanoid(), label: "New Item" },
                ),
              );
              setExpandedNodes((prev) => new Set(prev).add(id));
            }}
            removeChild={(id) => setMenuTree((prev) => removeNode(id, prev))}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpand}
          />
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeItem && (
              <div className="opacity-40 pointer-events-none">
                <Node
                  item={activeItem}
                  indent={0}
                  editMode={false}
                  hideActions
                  selected
                  onEdit={() => {}}
                  onAdd={() => {}}
                  onDelete={() => {}}
                  onSelect={() => {}}
                  onCommit={() => {}}
                />
              </div>
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      <div className="w-full flex items-center justify-center">
        <RadialMenu menu={menuTree} />
      </div>
    </div>
  );
}
