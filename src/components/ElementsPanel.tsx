import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { formElements, removeFormElementInstance } from "./FormElements";
import { PaletteComponent } from "./PaletteComponent";
import { HTMLAttributes } from "react";

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

  return (
    <div
      ref={elementsPanel.setNodeRef}
      className={`p-3 border-2 border-gray-400 rounded-md ${
        elementsPanel.isOver ? "border-gray-800" : "border-gray-400"
      } ${className}`}
      {...props}
    >
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
    </div>
  );
}
