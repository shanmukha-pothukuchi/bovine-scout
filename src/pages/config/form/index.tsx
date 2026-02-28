import { Button } from "@/components/ui/button";
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
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { nanoid } from "nanoid";
import { type ComponentType, useEffect, useState } from "react";
import { useConfig, type FormEntry } from "../context";
import { availableEntities } from "./constants";
import { Entity, EntitySwatch } from "./entity";
import { FormEditor } from "./form-editor";
import type { EntityStructure, FormStructure, RowStructure } from "./types";

export type { FormStructure } from "./types";

function FormNode({
  entry,
  active,
  editMode,
  onSelect,
  onEdit,
  onDelete,
  onCommit,
}: {
  entry: FormEntry;
  active: boolean;
  editMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCommit: (value: string | null) => void;
}) {
  const [tempText, setTempText] = useState(entry.label);

  useEffect(() => {
    setTempText(entry.label);
  }, [entry, editMode]);

  return (
    <div
      className={`flex rounded-md text-sm p-1.5 cursor-pointer select-none group ${active ? "bg-muted" : "hover:bg-muted"}`}
      onClick={onSelect}
    >
      <div className="flex gap-1.5 items-center w-full">
        {editMode ? (
          <div className="w-full flex pl-1">
            <input
              className="bg-input border-b border-border w-full mr-1.5 appearance-none outline-none"
              value={tempText}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCommit(tempText);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  onCommit(null);
                }
              }}
              onChange={(e) => setTempText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              onFocus={(e) => e.target.select()}
            />
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                onCommit(null);
              }}
            >
              <XIcon className="opacity-50 w-4" />
            </span>
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                onCommit(tempText);
              }}
            >
              <CheckIcon className="opacity-50 w-4" />
            </span>
          </div>
        ) : (
          <span className="w-full pl-1">{entry.label}</span>
        )}

        {!editMode && (
          <div className="flex items-center invisible group-hover:visible">
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <TrashIcon className="opacity-50 w-4" />
            </span>
            <span
              className="flex justify-center items-center rounded min-w-5 min-h-5 max-w-5 max-h-5 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <PencilIcon className="opacity-50 w-4" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function FormSidebar() {
  const { forms, setForms, activeFormId, setActiveFormId } = useConfig();
  const [editItemId, setEditItemId] = useState<string | null>(null);

  const addForm = () => {
    const id = nanoid();
    setForms((prev) => [
      ...prev,
      { id, label: "New Form", formStructure: { id, rows: [] } },
    ]);
    setActiveFormId(id);
    setEditItemId(id);
  };

  const deleteForm = (id: string) => {
    setForms((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeFormId === id) {
        setActiveFormId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  const commitEdit = (id: string, value: string | null) => {
    if (value !== null) {
      setForms((prev) =>
        prev.map((f) => (f.id === id ? { ...f, label: value } : f)),
      );
    }
    setEditItemId(null);
  };

  return (
    <div className="w-72 h-full bg-sidebar border-r border-border p-2 overflow-y-auto shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Forms
        </span>
        <Button variant="ghost" size="icon-sm" onClick={addForm}>
          <PlusIcon />
        </Button>
      </div>
      <div className="flex flex-col gap-1">
      {forms.map((entry) => (
        <FormNode
          key={entry.id}
          entry={entry}
          active={entry.id === activeFormId}
          editMode={editItemId === entry.id}
          onSelect={() => setActiveFormId(entry.id)}
          onEdit={() => setEditItemId(entry.id)}
          onDelete={() => deleteForm(entry.id)}
          onCommit={(value) => commitEdit(entry.id, value)}
        />
      ))}
      </div>
    </div>
  );
}

function FormEditorContainer() {
  const { forms, setForms, activeFormId } = useConfig();
  const { entityRegistry, registerEntity, deregisterEntity, resetValues } =
    useFormContext();

  const activeForm = forms.find((f) => f.id === activeFormId) ?? null;
  const formStructure = activeForm?.formStructure ?? { id: "", rows: [] };

  const setFormStructure = (
    updater: FormStructure | ((prev: FormStructure) => FormStructure),
  ) => {
    if (!activeFormId) return;
    setForms((prev) =>
      prev.map((f) => {
        if (f.id !== activeFormId) return f;
        const next =
          typeof updater === "function" ? updater(f.formStructure) : updater;
        return { ...f, formStructure: next };
      }),
    );
  };

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

  if (!activeForm) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Select or create a form to get started
      </div>
    );
  }

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

export default function FormPage() {
  const { activeFormId } = useConfig();

  return (
    <div className="h-full flex">
      <FormSidebar />
      <FormProvider key={activeFormId} entities={availableEntities}>
        <FormEditorContainer />
      </FormProvider>
    </div>
  );
}
