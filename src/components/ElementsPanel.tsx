import { useDndContext, useDndMonitor, useDroppable } from "@dnd-kit/core";
import { Trash2Icon } from "lucide-react";
import { HTMLAttributes } from "react";
import { formElements, removeFormElementInstance } from "./FormElements";
import { PaletteComponent } from "./PaletteComponent";

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
      className={`p-3 h-full border border-gray-400 rounded-md ${
        elementsPanel.isOver ? "border-gray-800" : "border-gray-400"
      } ${
        active?.data.current?.isBuilderComponent &&
        `bg-red-200 ${
          elementsPanel.isOver ? "border-red-400" : "border-red-300"
        }`
      } ${className}`}
      {...props}
    >
      {active?.data.current?.isBuilderComponent ? (
        <p
          className={`flex flex-grow h-full items-center justify-center ${
            elementsPanel.isOver ? "text-red-400" : "text-red-300"
          } text-center`}
        >
          <Trash2Icon className="size-14" />
        </p>
      ) : (
        <div className="grid gap-3">
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
