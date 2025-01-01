import { DragOverlay, useDraggable } from "@dnd-kit/core";
import { forwardRef } from "react";
import { IconType } from "react-icons";
import { ElementType } from "./FormElements";

export function PaletteComponent({
  type,
  name,
  icon: Icon,
}: {
  type: ElementType;
  name: string;
  icon: IconType;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: type,
    data: { isPaletteComponent: true },
  });

  return (
    <>
      <PaletteComponentDragOverlay
        name={name}
        icon={Icon}
        {...attributes}
        {...listeners}
        ref={setNodeRef}
      />
      {isDragging && (
        <DragOverlay>
          <PaletteComponentDragOverlay
            name={name}
            icon={Icon}
            className="pointer-events-none opacity-50"
          />
        </DragOverlay>
      )}
    </>
  );
}

export const PaletteComponentDragOverlay = forwardRef<
  HTMLDivElement,
  {
    name: string;
    icon: IconType;
  } & React.HTMLAttributes<HTMLDivElement>
>(({ name, icon: Icon, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white flex items-center justify-center gap-2 ring-1 ring-gray-800 p-4 cursor-grab rounded-sm ${className} h-fit`}
      {...props}
    >
      <div className="w-4 h-4">
        <Icon size="100%" />
      </div>
      <span className="text-xs text-center">{name}</span>
    </div>
  );
});
