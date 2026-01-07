import { useDraggable } from "@dnd-kit/core";
import { IconCheck, IconChevronRight, IconPencil, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { MenuItem } from "../../../components/RadialMenu";
import styles from "./index.module.css";

interface NodeProps {
    item: MenuItem;
    indent?: number;
    editMode: boolean;
    hideActions?: boolean;
    onEdit: () => void;
    onAdd: () => void;
    onDelete: () => void;
    selected: boolean;
    onSelect: () => void;
    onCommit: (value: string | null) => void;
}

export function Node({
    item,
    indent = 0,
    editMode,
    onEdit,
    hideActions = false,
    onAdd,
    onDelete,
    selected,
    onSelect,
    onCommit,
}: NodeProps) {
    const [tempText, setTempText] = useState(item.label);

    useEffect(() => {
        setTempText(item.label);
    }, [item, editMode]);

    const { setNodeRef: setDraggableRef, listeners, attributes } = useDraggable({
        id: item.id,
        data: { item },
    });

    return (
        <div
            className={`${styles.node} ${selected && styles.selected} ${editMode && styles.edit_mode}`}
            onClick={() => onSelect()}
            ref={setDraggableRef}
            {...listeners}
            {...attributes}
        >
            <span style={{ width: indent * 10 }} />
            <div>
                <span className={styles.icon_container}>
                    <IconChevronRight className={styles.icon} />
                </span>

                {editMode ? (
                    <div className={styles.input_container}>
                        <input
                            className={styles.text_input}
                            value={tempText}
                            onChange={e => setTempText(e.target.value)}
                        />
                        <span
                            className={styles.icon_container}
                            onClick={() => onCommit(null)}
                        >
                            <IconX className={styles.icon} />
                        </span>
                        <span
                            className={styles.icon_container}
                            onClick={() => onCommit(tempText)}
                        >
                            <IconCheck className={styles.icon} />
                        </span>
                    </div>
                ) : (
                    <span className={styles.text}>{item.label}</span>
                )}

                {!hideActions && <div className={styles.actions}>
                    <span className={styles.icon_container} onClick={onDelete}>
                        <IconTrash className={styles.icon} />
                    </span>
                    <span className={styles.icon_container} onClick={onEdit}>
                        <IconPencil className={styles.icon} />
                    </span>
                    <span className={styles.icon_container} onClick={onAdd}>
                        <IconPlus className={styles.icon} />
                    </span>
                </div>}
            </div>
        </div>
    );
}