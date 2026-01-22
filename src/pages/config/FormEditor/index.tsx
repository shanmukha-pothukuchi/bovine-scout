import { numberEntity } from "@/components/form_builder/entities/number";
import { sliderEntity } from "@/components/form_builder/entities/slider";
import { textEntity } from "@/components/form_builder/entities/text";

import {
    type AttributeRegistryEntry,
    FormProvider,
    useFormContext
} from "@/lib/form-builder";
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    PointerSensor,
    pointerWithin,
    useDroppable,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { type ReactNode, useState } from "react";
import { Entity, type EntityStructure, EntitySwatch } from "./Entity";
import { Row, type RowStructure } from "./Row";

interface FormStructure { id: string; rows: RowStructure[]; }

const availableEntities = [
    textEntity,
    numberEntity,
    sliderEntity,
];

function FormEditor({ form }: { form: FormStructure }) {
    const { state, entityRegistry } = useFormContext();

    const { setNodeRef } = useDroppable({
        id: "form",
    });

    const [selected, setSelected] = useState<string | null>(null);

    return (
        <div className="h-full flex">
            <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-r border-border">
                <pre>{JSON.stringify(state, null, 1)}</pre>
                <hr />
                <pre>{JSON.stringify(form, null, 2)}</pre>
            </div>
            <div className="flex flex-col flex-1 gap-2 p-2" ref={setNodeRef} onClick={() => setSelected(null)}>
                {form.rows.map((row) => (
                    <Row key={row.id} row={row} selected={selected} setSelected={setSelected} />
                ))}
            </div>
            <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-l border-border">
                {selected ? (
                    <div className="flex flex-col gap-4">
                        {(() => {
                            const entityStruct = form.rows
                                .flatMap((row) => row.entities)
                                .find((entity) => entity.id === selected);

                            if (!entityStruct) return null;

                            const entityEntry = entityRegistry.current[entityStruct.name];
                            if (!entityEntry) return null;

                            return (Object.values<AttributeRegistryEntry<any, any>>(entityEntry.definition.attributes)).map((attrEntry) => {
                                const Component = attrEntry.wrapper;
                                const attrName = attrEntry.definition.name;

                                return <Component key={attrName} entityId={selected} />;
                            });
                        })()}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-2">
                            {availableEntities.map((entry) => (
                                <EntitySwatch
                                    key={entry.definition.name}
                                    name={entry.definition.name}
                                    icon={entry.definition.icon}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function FormEditorContainer() {
    const [formStructure, setFormStructure] = useState<FormStructure>({
        id: "form",
        rows: [],
    });
    const { deregisterEntity } = useFormContext();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const [activeEntitySwatch, setActiveEntitySwatch] = useState<{ name: string; icon: ReactNode } | null>(null);
    const [activeEntity, setActiveEntity] = useState<{ entityId: string; name: string; rowId: string } | null>(null);

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveEntitySwatch(null);
        setActiveEntity(null);

        if (active.id.toString().startsWith("swatch")) {
            const { name, icon } = active.data.current as { name: string; icon: ReactNode };
            setActiveEntitySwatch({ name, icon });
        } else if (active.id.toString().startsWith("entity")) {
            const { entityId, name, rowId } = active.data.current as { entityId: string; name: string; rowId: string };
            setActiveEntity({ entityId, name, rowId });
        }
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        const createNewEntity = (name: string): EntityStructure => ({
            id: nanoid(),
            name,
        });

        const createNewRow = (entities: EntityStructure[] = []): RowStructure => ({
            id: nanoid(),
            entities,
        });

        const removeEntity = (rows: RowStructure[], entityId: string): { rows: RowStructure[]; entity: EntityStructure | null } => {
            let removedEntity: EntityStructure | null = null;
            const newRows = rows.map(row => {
                const entityIndex = row.entities.findIndex(e => e.id === entityId);
                if (entityIndex !== -1) {
                    removedEntity = row.entities[entityIndex];
                    return {
                        ...row,
                        entities: row.entities.filter(e => e.id !== entityId)
                    };
                }
                return row;
            });

            return { rows: newRows, entity: removedEntity };
        };

        const activeId = active.id.toString();
        const overId = over?.id.toString() ?? "";

        let newRows = [...formStructure.rows];
        let entityToInsert: EntityStructure | null = null;

        if (activeId.startsWith("swatch") && activeEntitySwatch) {
            entityToInsert = createNewEntity(activeEntitySwatch.name);
        } else if (activeId.startsWith("entity")) {
            const { entityId } = active.data.current as { entityId: string };
            const removed = removeEntity(newRows, entityId);
            newRows = removed.rows;
            entityToInsert = removed.entity;
        }

        if (!entityToInsert) return;

        if (overId.startsWith("top")) {
            const targetRowId = over?.data.current?.rowId;
            const rowIndex = newRows.findIndex(r => r.id === targetRowId);
            if (rowIndex !== -1) {
                newRows.splice(rowIndex, 0, createNewRow([entityToInsert]));
            }
        } else if (overId.startsWith("bottom")) {
            const targetRowId = over?.data.current?.rowId;
            const rowIndex = newRows.findIndex(r => r.id === targetRowId);
            if (rowIndex !== -1) {
                newRows.splice(rowIndex + 1, 0, createNewRow([entityToInsert]));
            }
        } else if (overId.startsWith("left")) {
            const targetRowId = over?.data.current?.rowId;
            const targetEntityId = over?.data.current?.entityId;

            if (activeId.startsWith("entity") && targetEntityId === active.data.current?.entityId) {
                return;
            }

            const rowIndex = newRows.findIndex(r => r.id === targetRowId);
            if (rowIndex !== -1) {
                const row = newRows[rowIndex];
                const entityIndex = row.entities.findIndex(e => e.id === targetEntityId);
                if (entityIndex !== -1) {
                    const newEntities = [...row.entities];
                    newEntities.splice(entityIndex, 0, entityToInsert);
                    newRows[rowIndex] = { ...row, entities: newEntities };
                }
            }
        } else if (overId.startsWith("right")) {
            const targetRowId = over?.data.current?.rowId;
            const targetEntityId = over?.data.current?.entityId;

            if (activeId.startsWith("entity") && targetEntityId === active.data.current?.entityId) {
                return;
            }

            const rowIndex = newRows.findIndex(r => r.id === targetRowId);
            if (rowIndex !== -1) {
                const row = newRows[rowIndex];
                const entityIndex = row.entities.findIndex(e => e.id === targetEntityId);
                if (entityIndex !== -1) {
                    const newEntities = [...row.entities];
                    newEntities.splice(entityIndex + 1, 0, entityToInsert);
                    newRows[rowIndex] = { ...row, entities: newEntities };
                }
            }
        } else if (overId.startsWith("row")) {
            const targetRowId = over?.data.current?.rowId;
            const rowIndex = newRows.findIndex(r => r.id === targetRowId);
            if (rowIndex !== -1) {
                const row = newRows[rowIndex];
                newRows[rowIndex] = { ...row, entities: [...row.entities, entityToInsert] };
            }
        } else if (overId === "form") {
            newRows.push(createNewRow([entityToInsert]));
        } else {
            deregisterEntity(entityToInsert.id);
        }

        newRows = newRows.filter(r => r.entities.length > 0);

        setFormStructure({
            ...formStructure,
            rows: newRows,
        });

        setActiveEntity(null);
        setActiveEntitySwatch(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <FormEditor form={formStructure} />
            {activeEntitySwatch && (
                <DragOverlay>
                    <EntitySwatch name={activeEntitySwatch.name} icon={activeEntitySwatch.icon} />
                </DragOverlay>
            )}
            {activeEntity && (
                <DragOverlay>
                    <Entity
                        rowId={activeEntity.rowId}
                        entity={{ id: activeEntity.entityId, name: activeEntity.name }}
                        selected={false}
                        setSelected={() => { }}
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