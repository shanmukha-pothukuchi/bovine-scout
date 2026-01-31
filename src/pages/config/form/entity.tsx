import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useFormContext } from "@/lib/form-builder";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EntityStructure {
  id: string;
}

export function Entity({
  rowId,
  entity,
  selected,
  setSelected,
  inputDisabled = false,
  dragDisabled = false,
}: {
  rowId: string;
  entity: EntityStructure;
  selected: boolean;
  setSelected: () => void;
  inputDisabled?: boolean;
  dragDisabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "entity" + entity.id,
    data: {
      rowId,
      entityId: entity.id,
    },
    disabled: dragDisabled,
  });

  const { setNodeRef: setRightNodeRef } = useDroppable({
    id: "right" + entity.id,
    data: {
      entityId: entity.id,
      rowId,
    },
    disabled: dragDisabled,
  });

  const { setNodeRef: setLeftNodeRef } = useDroppable({
    id: "left" + entity.id,
    data: {
      entityId: entity.id,
      rowId,
    },
    disabled: dragDisabled,
  });

  const { setNodeRef: setTopNodeRef } = useDroppable({
    id: "top" + entity.id,
    data: {
      rowId,
    },
    disabled: dragDisabled,
  });

  const { setNodeRef: setBottomNodeRef } = useDroppable({
    id: "bottom" + entity.id,
    data: {
      rowId,
    },
    disabled: dragDisabled,
  });

  const { entityRegistry, getEntityState } = useFormContext();

  const entityState = getEntityState(entity.id);
  if (!entityState) return null;

  const Component = entityRegistry.current[entityState.name]?.wrapper;

  return (
    <div
      ref={setNodeRef}
      {...(!dragDisabled ? attributes : {})}
      {...(!dragDisabled ? listeners : {})}
      className={cn(
        "relative border-border border w-full border-r-0 last:border-r first:rounded-l-md last:rounded-r-md p-2",
        selected && "outline outline-blue-500 bg-blue-500/15",
        isDragging && !dragDisabled && "opacity-50",
      )}
      onClick={(e) => {
        e.stopPropagation();
        setSelected();
      }}
    >
      {!dragDisabled && (
        <>
          <div
            ref={setTopNodeRef}
            className="z-10 absolute top-0 left-0 h-1/4 w-full"
          ></div>
          <div
            ref={setBottomNodeRef}
            className="z-10 absolute bottom-0 left-0 h-1/4 w-full"
          ></div>
          <div
            ref={setLeftNodeRef}
            className="z-10 absolute left-0 top-0 w-1/5 h-full"
          ></div>
          <div
            ref={setRightNodeRef}
            className="z-10 absolute right-0 top-0 w-1/5 h-full"
          ></div>
        </>
      )}
      {Component ? (
        <Component entityId={entity.id} disabled={inputDisabled} />
      ) : (
        <div>Unknown Entity</div>
      )}
    </div>
  );
}

export function EntitySwatch({
  name,
  icon,
  disabled = false,
}: {
  name: string;
  icon: ReactNode;
  disabled?: boolean;
}) {
  const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
    id: "swatch" + name,
    data: {
      name,
      icon,
    },
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...(!disabled ? attributes : {})}
      {...(!disabled ? listeners : {})}
      className={cn(
        "bg-input/30 border border-border rounded-md aspect-square flex flex-col items-center justify-center gap-1.5",
        !disabled && "hover:bg-input/50 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        isDragging && !disabled && "opacity-50",
      )}
    >
      {icon}
      <span className="text-sm">{name}</span>
    </div>
  );
}
