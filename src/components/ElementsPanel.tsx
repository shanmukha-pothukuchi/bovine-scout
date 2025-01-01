import { useDndContext, useDndMonitor, useDroppable } from "@dnd-kit/core";
import { formElements, removeFormElementInstance } from "./FormElements";
import { PaletteComponent } from "./PaletteComponent";
import { HTMLAttributes } from "react";
import { FaTrash } from "react-icons/fa";

export function ElementsPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const elementsPanelId = "elements-panel";
  const elementsPanel = useDroppable({
    id: elementsPanelId,
  });

  useDndMonitor({
    onDragEnd: (event) => {
      if (
        event.over?.id === elementsPanelId &&
        event.active.data.current?.isBuilderComponent
      ) {
        removeFormElementInstance(event.active.id as string);
      }
    },
  });

  const { active } = useDndContext();

  return (
    <div
      ref={elementsPanel.setNodeRef}
      className={`p-3 h-full border-2 border-gray-400 rounded-md ${
        elementsPanel.isOver ? "border-gray-800" : "border-gray-400"
      } ${
        active?.data.current?.isBuilderComponent && "bg-red-200 border-red-400"
      } ${className}`}
      {...props}
    >
      {active?.data.current?.isBuilderComponent ? (
        <p className="flex flex-grow h-full items-center justify-center text-red-400 text-center text-7xl">
          <FaTrash />
        </p>
      ) : (
        <div className="grid gap-2.5">
          {Object.values(formElements).map(
            ({ type, paletteComponent: { name, icon } }) => {
              return (
                <PaletteComponent
                  key={type}
                  type={type}
                  name={name}
                  icon={icon}
                />
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
