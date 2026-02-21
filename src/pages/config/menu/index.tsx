import RadialMenu, { type RadialMenuNode } from "@/components/radial-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  findNode,
  findParent,
  findPath,
  hasDescendant,
  indexOfChild,
  insert,
  remove,
  update,
} from "@/lib/utils/tree";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { PlusIcon } from "@phosphor-icons/react";
import { nanoid } from "nanoid";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { MenuTreeNode } from "../context";
import { useConfig } from "../context";
import { MenuProperties } from "./menu-properties";
import { Node } from "./node";
import { TreeNode } from "./tree-node";

const filterMenuForRender = (nodes: MenuTreeNode[]): RadialMenuNode[] =>
  nodes.map(({ type, includeForm, ...node }) => ({
    ...node,
    children: node.children ? filterMenuForRender(node.children) : undefined,
  }));

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
  const [activeDragItem, setActiveDragItem] = useState<MenuTreeNode | null>(
    null,
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const selectItem = (id: MenuTreeNode["id"] | null) => {
    setSelectedItem(id);
    if (id) {
      const path = findPath(menuTree, id);
      if (path && path.length > 1) {
        setExpandedNodes((prev) => {
          const next = new Set(prev);
          for (const ancestor of path.slice(0, -1)) next.add(ancestor);
          return next;
        });
      }
    }
  };

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
    setMenuTree((nodes) => update(nodes, id, { label: value }));
  };

  const updateNodeProperty = (
    id: MenuTreeNode["id"],
    property: keyof Omit<MenuTreeNode, "id" | "children">,
    value: any,
  ) => {
    setMenuTree((nodes) => update(nodes, id, { [property]: value }));
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveDragItem(findNode(menuTree, active.id as string));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragItem(null);
    if (!over) return;

    const activeId = active.id as string;
    const [targetId, zone] = (over.id as string).split("::");

    if (!zone || activeId === targetId) return;

    setMenuTree((prev) => {
      const activeNode = findNode(prev, activeId);
      if (!activeNode) return prev;

      if (hasDescendant(activeNode, targetId)) return prev;

      const cleanedTree = remove(prev, activeId);

      let parentId: string | null = null;
      let index = 0;

      if (zone === "inside") {
        parentId = targetId;
        index = findNode(cleanedTree, targetId)?.children?.length ?? 0;
        setExpandedNodes((prev) => new Set(prev).add(targetId));
      } else {
        const parent = findParent(cleanedTree, targetId);
        parentId = parent ? parent.id : null;

        const targetIndex = indexOfChild(targetId, parent, cleanedTree);

        if (targetIndex === -1) return prev;

        index = zone === "before" ? targetIndex : targetIndex + 1;
      }

      return insert(cleanedTree, parentId, index, activeNode);
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
                  {
                    id: nanoid(),
                    label: "New Item",
                    type: "instantaneous",
                    includeForm: false,
                  },
                ]);
              }}
            >
              <PlusIcon className="opacity-50" />
            </Button>
          </div>

          <TreeNode
            tree={menuTree}
            editItem={editItem}
            setEditItem={setEditItem}
            selectedItem={selectedItem!}
            setSelectedItem={setSelectedItem}
            setText={setMenuTreeProperty}
            addChild={(id) => {
              setMenuTree((prev) =>
                insert(prev, id, findNode(prev, id)?.children?.length ?? 0, {
                  id: nanoid(),
                  label: "New Item",
                  type: "instantaneous",
                  includeForm: false,
                }),
              );
              setExpandedNodes((prev) => new Set(prev).add(id));
            }}
            removeChild={(id) => setMenuTree((prev) => remove(prev, id))}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpand}
          />
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {activeDragItem && (
              <div className="opacity-40 pointer-events-none">
                <Node
                  item={activeDragItem}
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

      <div className="flex-1 flex items-center justify-center">
        <RadialMenu
          menu={filterMenuForRender(menuTree)}
          onSelect={(id) => selectItem(id)}
          onNavigation={(path) => selectItem(path.at(-1) ?? null)}
          value={selectedItem!}
        />
      </div>

      <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-l border-border">
        {selectedItem &&
          (() => {
            const selectedNode = findNode(menuTree, selectedItem);
            if (!selectedNode) return null;

            return (
              <MenuProperties
                selectedNode={selectedNode}
                onClose={() => setSelectedItem(null)}
                onUpdateProperty={(property, value) =>
                  updateNodeProperty(selectedItem, property, value)
                }
              />
            );
          })()}
      </div>
    </div>
  );
}
