import { useDroppable } from "@dnd-kit/core";
import type { MenuItem } from "../../../components/RadialMenu";

import { Node } from "./Node";

interface TreeNodeProps {
    tree: MenuItem[];
    isTopLevel?: boolean;
    indent?: number;
    editItem: MenuItem["id"] | null;
    setEditItem: (id: MenuItem["id"] | null) => void;
    selectedItem: MenuItem["id"] | null;
    setSelectedItem: (id: MenuItem["id"] | null) => void;
    setText: (id: MenuItem["id"], value: string) => void;
    addChild: (id: MenuItem['id']) => void;
    removeChild: (id: MenuItem['id']) => void;
}

function TreeItem({ isTopLevel, tree, item, index, ...props }: { item: MenuItem; index: number; } & TreeNodeProps) {
    const { setNodeRef: setInsideRef, isOver: isOverInside } = useDroppable({ id: `${item.id}::inside` });
    const { setNodeRef: setBeforeRef, isOver: isOverBefore } = useDroppable({ id: `${item.id}::before` });
    const { setNodeRef: setAfterRef, isOver: isOverAfter } = useDroppable({ id: `${item.id}::after` });

    return (
        <div className={`flex flex-col gap-1 relative rounded transition-colors duration-200 ${isOverInside ? "bg-muted outline outline-1 outline-ring" : ''}`}>
            {index === 0 && <div
                ref={setBeforeRef}
                className={`h-1 absolute w-full rounded-sm transition-all duration-100 top-0 -translate-y-full ${isOverBefore ? "bg-primary" : ''}`}
            />}

            <div ref={setInsideRef}>
                <Node
                    item={item}
                    indent={props.indent}
                    editMode={props.editItem === item.id}
                    onEdit={() => props.setEditItem(item.id)}
                    onAdd={() => props.addChild(item.id)}
                    onDelete={() => props.removeChild(item.id)}
                    selected={props.selectedItem === item.id}
                    onSelect={() => props.setSelectedItem(item.id)}
                    onCommit={value => {
                        if (value !== null) props.setText(item.id, value);
                        props.setEditItem(null);
                    }}
                />
            </div>

            {item.children && item.children.length > 0 && (
                <TreeNode
                    tree={item.children}
                    isTopLevel={false}
                    indent={(props.indent || 0) + 1}
                    editItem={props.editItem}
                    setEditItem={props.setEditItem}
                    selectedItem={props.selectedItem}
                    setSelectedItem={props.setSelectedItem}
                    setText={props.setText}
                    addChild={props.addChild}
                    removeChild={props.removeChild}
                />
            )}

            {(index < tree.length - 1 || isTopLevel) && <div
                ref={setAfterRef}
                className={`h-1 absolute w-full rounded-sm transition-all duration-100 bottom-0 translate-y-full ${isOverAfter ? "bg-primary" : ''}`}
            />}
        </div>
    );
}

export function TreeNode({ tree, isTopLevel = true, ...props }: TreeNodeProps) {
    return (

        <div className="flex flex-col gap-1">
            {tree.map((item, i) => (
                <TreeItem
                    key={item.id}
                    item={item}
                    index={i}
                    tree={tree}
                    isTopLevel={isTopLevel}
                    {...props}
                />
            ))}
        </div>
    );

}