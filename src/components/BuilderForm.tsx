import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { HTMLAttributes } from "react";
import { BuilderComponentWrapper } from "../components/BuilderComponentWrapper";
import {
  addFormElementInstance,
  ElementType,
  formElementInstanceRows,
  formElements,
  getFormElementInstance,
  getFormElementInstanceIndex,
  removeFormElementInstance,
  setSelectedFormElementInstance,
} from "../components/FormElements";

export function BuilderForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const formId = "form";
  const form = useDroppable({
    id: formId,
  });

  useDndMonitor({
    onDragEnd: (event) => {
      if (
        event.over?.id === formId &&
        event.active.data.current?.isPaletteComponent
      ) {
        const instance = formElements[
          event.active.id as ElementType
        ].generateInstance(nanoid());
        addFormElementInstance(instance, formElementInstanceRows.value.length);
      } else if (event.over?.data.current?.isBuilderDroppableZone) {
        let instance;
        if (event.active.data.current?.isPaletteComponent) {
          instance = formElements[
            event.active.id as ElementType
          ].generateInstance(nanoid());
        } else if (event.active.data.current?.isBuilderComponent) {
          instance = getFormElementInstance(event.active.id as string);
        }
        if (!instance) return;
        removeFormElementInstance(instance.id as string);
        const direction = event.over?.data.current?.direction as
          | "top"
          | "bottom"
          | "left"
          | "right";
        const instanceId = event.over?.data.current?.instanceId as string;
        const [rowIndex, columnIndex] = getFormElementInstanceIndex(instanceId);
        switch (direction) {
          case "top":
            addFormElementInstance(instance, rowIndex);
            break;
          case "bottom":
            addFormElementInstance(instance, rowIndex + 1);
            break;
          case "left":
            addFormElementInstance(instance, rowIndex, columnIndex - 1);
            break;
          case "right":
            addFormElementInstance(instance, rowIndex, columnIndex + 1);
            break;
        }
      } else if (
        event.over?.id === formId &&
        event.active.data.current?.isBuilderComponent
      ) {
        const instance = getFormElementInstance(event.active.id as string);
        if (!instance) return;
        removeFormElementInstance(instance.id as string);
        addFormElementInstance(instance, formElementInstanceRows.value.length);
      }
    },
  });

  return (
    <div
      ref={form.setNodeRef}
      className={`gap-3 flex flex-col p-3 rounded-md border ${
        form.isOver ? "border-gray-800" : "border-gray-400"
      } ${className}`}
      onClick={() => setSelectedFormElementInstance()}
      {...props}
    >
      {formElementInstanceRows.value.length === 0 && !form.isOver && (
        <p className="flex flex-grow items-center justify-center text-gray-500">
          Drop here
        </p>
      )}
      {form.isOver && formElementInstanceRows.value.length === 0 && (
        <div className="w-full">
          <div className="h-20 rounded-md bg-gray-200"></div>
        </div>
      )}
      {formElementInstanceRows.value.map((instance, i) => {
        return (
          <div key={i} className="flex flex-row gap-3">
            {instance.map((subInstance) => (
              <BuilderComponentWrapper
                key={subInstance.id}
                instance={subInstance}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
