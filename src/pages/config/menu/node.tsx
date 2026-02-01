import { useDraggable } from "@dnd-kit/core";
import {
  IconCheck,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { MenuTreeNode } from "../context";
import { cn } from "@/lib/utils";

interface NodeProps {
  item: MenuTreeNode;
  indent?: number;
  editMode: boolean;
  hideActions?: boolean;
  onEdit: () => void;
  onAdd: () => void;
  onDelete: () => void;
  selected: boolean;
  onSelect: () => void;
  onCommit: (value: string | null) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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
  isExpanded,
  onToggleExpand,
}: NodeProps) {
  const [tempText, setTempText] = useState(item.label);

  useEffect(() => {
    setTempText(item.label);
  }, [item, editMode]);

  const {
    setNodeRef: setDraggableRef,
    listeners,
    attributes,
  } = useDraggable({
    id: item.id,
    data: { item },
  });

  return (
    <div
      className={`flex rounded-md text-sm p-1.5 cursor-pointer select-none group ${selected ? "bg-muted" : "hover:bg-muted"}`}
      onClick={() => onSelect()}
      ref={setDraggableRef}
      {...listeners}
      {...attributes}
    >
      <span style={{ width: indent * 10 }} />
      <div className="flex gap-1.5 items-center w-full">
        <span
          className={cn(
            "flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5",
            {
              "hover:bg-accent": item.children && item.children.length > 0,
            },
          )}
          onClick={(e) => {
            if (item.children && item.children.length > 0) {
              e.stopPropagation();
              onToggleExpand?.();
            }
          }}
        >
          {item.children && item.children.length > 0 && (
            <IconChevronRight
              className={`opacity-50 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            />
          )}
        </span>

        {editMode ? (
          <div className="w-full flex">
            <input
              className="bg-input border-b border-border w-full mr-1.5 appearance-none outline-none"
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
            />
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={() => onCommit(null)}
            >
              <IconX className="opacity-50 w-4" />
            </span>
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={() => onCommit(tempText)}
            >
              <IconCheck className="opacity-50 w-4" />
            </span>
          </div>
        ) : (
          <span className="w-full">{item.label}</span>
        )}

        {!hideActions && (
          <div
            className={`flex items-center invisible group-hover:visible ${editMode ? "hidden" : ""}`}
          >
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={onDelete}
            >
              <IconTrash className="opacity-50 w-4" />
            </span>
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={onEdit}
            >
              <IconPencil className="opacity-50 w-4" />
            </span>
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={onAdd}
            >
              <IconPlus className="opacity-50 w-4" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
