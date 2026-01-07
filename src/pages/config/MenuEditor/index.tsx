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
import RadialMenu, { type MenuItem } from "../../../components/RadialMenu";
import styles from "./index.module.css";
import { Node } from "./Node";
import { TreeNode } from "./TreeNode";

export default function MenuEditor() {
    const [menuTree, setMenuTree] = useState<MenuItem[]>([
        { id: "defense", label: "Defense" },
        { id: "utility", label: "Utility" },
        {
            id: "offense",
            label: "Offense",
            children: [
                {
                    id: "magic",
                    label: "Magic",
                    children: [
                        { id: "fire", label: "Fire" },
                        { id: "ice", label: "Ice" },
                        { id: "lightning", label: "Lightning" },
                    ],
                },
                { id: "melee", label: "Melee" },
                { id: "ranged", label: "Ranged" },
            ],
        },
        { id: "support", label: "Support" },
    ]);

    const [editItem, setEditItem] = useState<MenuItem["id"] | null>(null);
    const [selectedItem, setSelectedItem] = useState<MenuItem["id"] | null>(null);
    const [activeItem, setActiveItem] = useState<MenuItem | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const setMenuTreeProperty = (id: MenuItem["id"], value: string) => {
        const update = (nodes: MenuItem[]): MenuItem[] =>
            nodes.map(node => {
                if (node.id === id) return { ...node, label: value };
                if (node.children) return { ...node, children: update(node.children) };
                return node;
            });

        setMenuTree(update);
    };

    const getItemById = (id: UniqueIdentifier, items: MenuItem[]): MenuItem | null => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = getItemById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    };

    const getParentByChildId = (childId: string, items: MenuItem[]): MenuItem | null => {
        for (const item of items) {
            if (item.children?.some(c => c.id === childId)) return item;
            if (item.children) {
                const found = getParentByChildId(childId, item.children);
                if (found) return found;
            }
        }
        return null;
    };

    const removeNode = (id: string, nodes: MenuItem[]): MenuItem[] =>
        nodes
            .filter(n => n.id !== id)
            .map(n =>
                n.children ? { ...n, children: removeNode(id, n.children) } : n
            );

    const insertNode = (
        tree: MenuItem[],
        parentId: string | null,
        index: number,
        node: MenuItem
    ): MenuItem[] => {
        if (parentId === null) {
            const copy = [...tree];
            copy.splice(index, 0, node);
            return copy;
        }

        return tree.map(n => {
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

    const isDescendant = (parent: MenuItem, childId: string): boolean =>
        parent.children?.some(
            c => c.id === childId || isDescendant(c, childId)
        ) ?? false;

    const getIndexUnderParent = (
        targetId: string,
        parent: MenuItem | null,
        tree: MenuItem[]
    ): number => {
        const siblings = parent ? parent.children ?? [] : tree;
        return siblings.findIndex(n => n.id === targetId);
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

        setMenuTree(prev => {
            const activeNode = getItemById(activeId, prev);
            if (!activeNode) return prev;

            if (isDescendant(activeNode, targetId)) return prev;

            const cleanedTree = removeNode(activeId, prev);

            let parentId: string | null = null;
            let index = 0;

            if (zone === "inside") {
                parentId = targetId;
                index = getItemById(targetId, cleanedTree)?.children?.length ?? 0;
            } else {
                const parent = getParentByChildId(targetId, cleanedTree);
                parentId = parent ? parent.id : null;

                const targetIndex = getIndexUnderParent(
                    targetId,
                    parent,
                    cleanedTree
                );

                if (targetIndex === -1) return prev;

                index = zone === "before" ? targetIndex : targetIndex + 1;
            }

            return insertNode(cleanedTree, parentId, index, activeNode);
        });
    };

    return (
        <div className={styles.container}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.sidebar}>
                    <TreeNode
                        tree={menuTree}
                        editItem={editItem}
                        setEditItem={setEditItem}
                        selectedItem={selectedItem}
                        setSelectedItem={setSelectedItem}
                        setText={setMenuTreeProperty}
                        addChild={id =>
                            setMenuTree(prev =>
                                insertNode(
                                    prev,
                                    id,
                                    getItemById(id, prev)?.children?.length ?? 0,
                                    { id: nanoid(), label: "New Item" }
                                )
                            )
                        }
                        removeChild={id =>
                            setMenuTree(prev => removeNode(id, prev))
                        }
                    />
                </div>

                {createPortal(
                    <DragOverlay dropAnimation={null}>
                        {activeItem && (
                            <div className={styles.drag_overlay}>
                                <Node
                                    item={activeItem}
                                    indent={0}
                                    editMode={false}
                                    hideActions
                                    selected
                                    onEdit={() => { }}
                                    onAdd={() => { }}
                                    onDelete={() => { }}
                                    onSelect={() => { }}
                                    onCommit={() => { }}
                                />
                            </div>
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>

            <div className={styles.main}>
                <RadialMenu menu={menuTree} />
            </div>
        </div>
    );
}
