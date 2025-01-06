import { DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { useHover } from "@uidotdev/usehooks";
import {
  FormElementInstance,
  formElements,
  setSelectedFormElementInstance,
} from "../components/FormElements";

export function BuilderComponentWrapper({
  instance,
}: {
  instance: FormElementInstance<unknown>;
}) {
  const [hoverRef, hovering] = useHover();

  const topId = instance.id + "-top";
  const top = useDroppable({
    id: topId,
    data: {
      isBuilderDroppableZone: true,
      direction: "top",
      instanceId: instance.id,
    },
  });

  const bottomId = instance.id + "-bottom";
  const bottom = useDroppable({
    id: bottomId,
    data: {
      isBuilderDroppableZone: true,
      direction: "bottom",
      instanceId: instance.id,
    },
  });

  const leftId = instance.id + "-left";
  const left = useDroppable({
    id: leftId,
    data: {
      isBuilderDroppableZone: true,
      direction: "left",
      instanceId: instance.id,
    },
  });

  const rightId = instance.id + "-right";
  const right = useDroppable({
    id: rightId,
    data: {
      isBuilderDroppableZone: true,
      direction: "right",
      instanceId: instance.id,
    },
  });

  const draggable = useDraggable({
    id: instance.id,
    data: { isBuilderComponent: true },
  });

  const BuilderComponent = formElements[instance.type].builderComponent;
  return (
    <div
      ref={(el) => {
        draggable.setNodeRef(el);
        hoverRef(el);
      }}
      {...draggable.attributes}
      {...draggable.listeners}
      className="flex w-full items-center relative"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedFormElementInstance(instance.id);
      }}
    >
      {!draggable.isDragging && (
        <>
          <div
            className="absolute w-1/2 h-1/2 top-0 left-1/2 -translate-x-1/2 invisible"
            ref={top.setNodeRef}
          ></div>
          <div
            className="absolute w-1/2 h-1/2 bottom-0 left-1/2 -translate-x-1/2 invisible"
            ref={bottom.setNodeRef}
          ></div>
          <div
            className="absolute w-1/4 h-full left-0 invisible"
            ref={left.setNodeRef}
          ></div>
          <div
            className="absolute w-1/4 h-full right-0 invisible"
            ref={right.setNodeRef}
          ></div>
          {hovering && (
            <div className="absolute h-full w-full bg-black/5 cursor-pointer rounded-sm z-50">
              <div className="w-full absolute top-1/2 -translate-y-1/2 select-none pointer">
                <p className="text-sm text-gray-800 text-center p-2">
                  Click for properties or drag to reorder
                </p>
              </div>
            </div>
          )}
          <div className="pointer-events-none w-full h-full">
            <BuilderComponent key={instance.id} instance={instance} />
          </div>
        </>
      )}
      {top.isOver && (
        <div className="absolute top-0 w-full rounded-sm rounded-b-none h-0.5 bg-black"></div>
      )}
      {bottom.isOver && (
        <div className="absolute bottom-0 w-full rounded-sm rounded-t-none h-0.5 bg-black"></div>
      )}
      {left.isOver && (
        <div className="absolute left-0 top-0 h-full rounded-sm rounded-r-none w-0.5 bg-black"></div>
      )}
      {right.isOver && (
        <div className="absolute right-0 top-0 h-full rounded-sm rounded-l-none w-0.5 bg-black"></div>
      )}
      {draggable.isDragging && (
        <DragOverlay>
          <div className="pointer-events-none opacity-50">
            <BuilderComponent key={instance.id} instance={instance} />
          </div>
        </DragOverlay>
      )}
    </div>
  );
}
