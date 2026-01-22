import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useFormContext } from "@/lib/form-builder";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface EntityStructure { id: string; }

export function Entity({ rowId, entity, selected, setSelected }: { rowId: string; entity: EntityStructure; selected: boolean; setSelected: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: "entity" + entity.id,
        data: {
            rowId,
            entityId: entity.id
        },
    });

    const { setNodeRef: setRightNodeRef } = useDroppable({
        id: "right" + entity.id,
        data: {
            entityId: entity.id,
            rowId,
        },
    });

    const { setNodeRef: setLeftNodeRef } = useDroppable({
        id: "left" + entity.id,
        data: {
            entityId: entity.id,
            rowId,
        },
    });

    const { setNodeRef: setTopNodeRef } = useDroppable({
        id: "top" + entity.id,
        data: {
            rowId,
        },
    });

    const { setNodeRef: setBottomNodeRef } = useDroppable({
        id: "bottom" + entity.id,
        data: {
            rowId,
        },
    });

    const { entityRegistry, getEntityState } = useFormContext();

    const entityState = getEntityState(entity.id);
    if (!entityState) return null;

    const Component = entityRegistry.current[entityState.name]?.wrapper;

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
                "relative border-border border w-full border-r-0 last:border-r first:rounded-l-md last:rounded-r-md p-2",
                selected && "outline outline-blue-500 bg-blue-500/15",
                isDragging && "opacity-50"
            )}
            onClick={(e) => {
                e.stopPropagation();
                setSelected();
            }}
        >
            <div ref={setTopNodeRef} className="z-10 absolute top-0 left-0 h-1/4 w-full"></div>
            <div ref={setBottomNodeRef} className="z-10 absolute bottom-0 left-0 h-1/4 w-full"></div>
            <div ref={setLeftNodeRef} className="z-10 absolute left-0 top-0 w-1/5 h-full"></div>
            <div ref={setRightNodeRef} className="z-10 absolute right-0 top-0 w-1/5 h-full"></div>
            {Component ? <Component entityId={entity.id} /> : <div>Unknown Entity</div>}
        </div>
    );
}

export function EntitySwatch({ name, icon }: { name: string; icon: ReactNode }) {
    const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
        id: "swatch" + name,
        data: {
            name,
            icon,
        },
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
                "bg-input/30 hover:bg-input/50 cursor-pointer border border-border rounded-md aspect-square flex flex-col items-center justify-center gap-1.5",
                isDragging && "opacity-50"
            )}
        >
            {icon}
            <span className="text-sm">{name}</span>
        </div>
    );
}