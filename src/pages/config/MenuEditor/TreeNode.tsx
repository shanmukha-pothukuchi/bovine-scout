import { useDroppable } from "@dnd-kit/core";
import type { MenuItem } from "../../../components/RadialMenu";
import styles from "./index.module.css";
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
        <div className={`${styles.tree_item_wrapper} ${isOverInside ? styles.over_inside : ''}`}>
            {index === 0 && <div
                ref={setBeforeRef}
                className={`${styles.before_drop_zone} ${isOverBefore ? styles.over : ''}`}
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
                className={`${styles.after_drop_zone} ${isOverAfter ? styles.over : ''}`}
            />}
        </div>
    );
}

export function TreeNode({ tree, isTopLevel = true, ...props }: TreeNodeProps) {
    return (
        <div className={styles.menu_tree}>
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