import { numberEntity } from "@/components/form-builder/entities/number";
import { sliderEntity } from "@/components/form-builder/entities/slider";
import { textEntity } from "@/components/form-builder/entities/text";
import { Button } from "@/components/ui/button";
import { FormProvider, useFormContext } from "@/lib/form-builder";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { nanoid } from "nanoid";
import { type ComponentType, useMemo, useState } from "react";
import { useConfig } from "../context";
import { Entity, type EntityStructure, EntitySwatch } from "./entity";
import { Row, type RowStructure } from "./row";

export interface FormStructure {
  id: string;
  rows: RowStructure[];
}

const entityCategories = [
  {
    name: "Input",
    entities: [textEntity, numberEntity],
  },
  {
    name: "Control",
    entities: [sliderEntity],
  },
];

const availableEntities = entityCategories
  .map((category) => category.entities)
  .flat();

function FormEditor({
  form,
  isPreview,
  onPreviewToggle,
}: {
  form: FormStructure;
  isPreview: boolean;
  onPreviewToggle: () => void;
}) {
  const { state, getEntityState, attributeRegistry } = useFormContext();

  const isDragDisabled = useMemo(() => isPreview, [isPreview]);

  const { setNodeRef } = useDroppable({
    id: "form",
    disabled: isDragDisabled,
  });

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="h-full flex">
      <div className="w-72 h-full bg-sidebar overflow-y-auto border-r border-border">
        <pre>{JSON.stringify(state, null, 1)}</pre>
        <hr />
        <pre>{JSON.stringify(form, null, 2)}</pre>
      </div>
      <div
        className="flex flex-col flex-1"
        ref={setNodeRef}
        onClick={() => !isPreview && setSelected(null)}
      >
        <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-2">
          <div className="text-sm font-medium text-muted-foreground">
            Canvas
          </div>
          <Button variant="outline" size="sm" onClick={onPreviewToggle}>
            {isPreview ? "Exit Preview" : "Preview"}
          </Button>
        </div>
        <div className="flex flex-col gap-2 p-2">
          {form.rows.map((row) => (
            <Row
              key={row.id}
              row={row}
              selected={isPreview ? null : selected}
              setSelected={isPreview ? () => {} : setSelected}
              inputDisabled={!isPreview}
              dragDisabled={isDragDisabled}
            />
          ))}
        </div>
      </div>
      <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-l border-border">
        {selected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelected(null)}
              >
                <CaretLeftIcon className="opacity-50" />
              </Button>
              <div className="text-sm font-medium text-muted-foreground">
                Properties
              </div>
            </div>
            {(() => {
              const entityStruct = form.rows
                .flatMap((row) => row.entities)
                .find((entity) => entity.id === selected);

              if (!entityStruct) return null;

              const entityEntry = getEntityState(entityStruct.id);
              if (!entityEntry) return null;

              return Object.entries(entityEntry.attributes).map(
                ([attrName, attrState]) => {
                  const Component =
                    attributeRegistry.current[attrState.name].wrapper;
                  return <Component key={attrName} entityId={selected} />;
                },
              );
            })()}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {entityCategories.map((category) => (
              <div key={category.name} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {category.name}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {category.entities.map((entry) => (
                    <EntitySwatch
                      key={entry.definition.name}
                      name={entry.definition.name}
                      icon={entry.definition.icon}
                      disabled={isDragDisabled}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormEditorContainer() {
  const { formStructure, setFormStructure } = useConfig();
  const { entityRegistry, registerEntity, deregisterEntity, resetValues } =
    useFormContext();

  const [isPreview, setIsPreview] = useState(false);

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
