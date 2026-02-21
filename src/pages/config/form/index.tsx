import { FormProvider, useFormContext } from "@/lib/form-builder";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { type ComponentType, useState } from "react";
import { useConfig } from "../context";
import { availableEntities } from "./constants";
import { Entity, EntitySwatch } from "./entity";
import { FormEditor } from "./form-editor";
import type { EntityStructure, RowStructure } from "./types";

export type { FormStructure } from "./types";

function FormEditorContainer() {
  const { formStructure, setFormStructure } = useConfig();
  const { entityRegistry, registerEntity, deregisterEntity, resetValues } =
    useFormContext();

  const [isPreview, setIsPreview] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handlePreviewToggle = () => {
    if (isPreview) resetValues();
    setIsPreview(!isPreview);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [activeEntitySwatch, setActiveEntitySwatch] = useState<{
    name: string;
    icon: ComponentType<{ size?: number | string }>;
  } | null>(null);
  const [activeEntity, setActiveEntity] = useState<{
    entityId: string;
    name: string;
    rowId: string;
  } | null>(null);

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (isPreview) return;

    setActiveEntitySwatch(null);
    setActiveEntity(null);

    if (active.id.toString().startsWith("swatch")) {
      const { name, icon } = active.data.current as {
        name: string;
        icon: ComponentType<{ size?: number | string }>;
      };
      setActiveEntitySwatch({ name, icon });
    } else if (active.id.toString().startsWith("entity")) {
      const { entityId, name, rowId } = active.data.current as {
        entityId: string;
        name: string;
        rowId: string;
      };
      setActiveEntity({ entityId, name, rowId });
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const createNewEntity = (): EntityStructure => ({
      id: nanoid(),
    });

    const createNewRow = (entities: EntityStructure[] = []): RowStructure => ({
      id: nanoid(),
      entities,
    });

    const removeEntity = (
      rows: RowStructure[],
      entityId: string,
    ): { rows: RowStructure[]; entity: EntityStructure | null } => {
      let removedEntity: EntityStructure | null = null;
      const newRows = rows.map((row) => {
        const entityIndex = row.entities.findIndex((e) => e.id === entityId);
        if (entityIndex !== -1) {
          removedEntity = row.entities[entityIndex];
          return {
            ...row,
            entities: row.entities.filter((e) => e.id !== entityId),
          };
        }
        return row;
      });

      return { rows: newRows, entity: removedEntity };
    };

    const activeId = active.id.toString();
    const overId = over?.id.toString() ?? "";
    const isSwatchDrag = activeId.startsWith("swatch");
    const isEntityDrag = activeId.startsWith("entity");

    const isValidDropTarget =
      overId === "form" ||
      overId.startsWith("top") ||
      overId.startsWith("bottom") ||
      overId.startsWith("left") ||
      overId.startsWith("right") ||
      overId.startsWith("row");

    const cleanup = () => {
      setActiveEntity(null);
      setActiveEntitySwatch(null);
    };

    if (!overId || !isValidDropTarget) {
      if (isEntityDrag && activeEntity) {
        const { entityId } = active.data.current as { entityId: string };
        const { rows: newRows } = removeEntity(
          [...formStructure.rows],
          entityId,
        );
        setFormStructure({
          ...formStructure,
          rows: newRows.filter((r) => r.entities.length > 0),
        });
        deregisterEntity(entityId);
        setSelected(null);
      }

      return cleanup();
    }

    if (
      isEntityDrag &&
      (overId.startsWith("left") || overId.startsWith("right")) &&
      over?.data.current?.entityId === active.data.current?.entityId
    ) {
      return cleanup();
    }

    let newRows = [...formStructure.rows];
    let entityToInsert: EntityStructure | null = null;

    if (isSwatchDrag && activeEntitySwatch) {
      entityToInsert = createNewEntity();
      registerEntity(
        entityToInsert.id,
        entityRegistry.current[activeEntitySwatch.name].definition,
      );
    } else if (isEntityDrag) {
      const { entityId } = active.data.current as { entityId: string };
      const removed = removeEntity(newRows, entityId);
      newRows = removed.rows;
      entityToInsert = removed.entity;
    }

    if (!entityToInsert) return;

    const targetRowId = over?.data.current?.rowId;
    const targetEntityId = over?.data.current?.entityId;
    const rowIndex = targetRowId
      ? newRows.findIndex((r) => r.id === targetRowId)
      : -1;

    if (overId.startsWith("top") || overId.startsWith("bottom")) {
      if (rowIndex !== -1) {
        const insertAt = overId.startsWith("top") ? rowIndex : rowIndex + 1;
        newRows.splice(insertAt, 0, createNewRow([entityToInsert]));
      }
    } else if (overId.startsWith("left") || overId.startsWith("right")) {
      if (rowIndex !== -1) {
        const row = newRows[rowIndex];
        const entityIndex = row.entities.findIndex(
          (e) => e.id === targetEntityId,
        );
        if (entityIndex !== -1) {
          const newEntities = [...row.entities];
          const insertAt = overId.startsWith("left")
            ? entityIndex
            : entityIndex + 1;
          newEntities.splice(insertAt, 0, entityToInsert);
          newRows[rowIndex] = { ...row, entities: newEntities };
        }
      }
    } else if (overId.startsWith("row")) {
      if (rowIndex !== -1) {
        const row = newRows[rowIndex];
        newRows[rowIndex] = {
          ...row,
          entities: [...row.entities, entityToInsert],
        };
      }
    } else if (overId === "form") {
      newRows.push(createNewRow([entityToInsert]));
    }

    setFormStructure({
      ...formStructure,
      rows: newRows.filter((r) => r.entities.length > 0),
    });

    cleanup();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <FormEditor
        form={formStructure}
        isPreview={isPreview}
        onPreviewToggle={handlePreviewToggle}
        selected={selected}
        setSelected={setSelected}
      />
      {activeEntitySwatch && !isPreview && (
        <DragOverlay>
          <EntitySwatch
            name={activeEntitySwatch.name}
            icon={activeEntitySwatch.icon}
          />
        </DragOverlay>
      )}
      {activeEntity && !isPreview && (
        <DragOverlay>
          <Entity
            rowId={activeEntity.rowId}
            entity={{ id: activeEntity.entityId }}
            selected={false}
            setSelected={() => {}}
          />
        </DragOverlay>
      )}
    </DndContext>
  );
}

export default () => (
  <FormProvider entities={availableEntities}>
    <FormEditorContainer />
  </FormProvider>
);
