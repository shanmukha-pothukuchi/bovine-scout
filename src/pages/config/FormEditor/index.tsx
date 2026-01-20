import { numberEntity, NumberEntityComponent } from "@/components/form_builder/entities/number";
import { textEntity, TextEntityComponent } from "@/components/form_builder/entities/text";
import { FormProvider, useFormContext } from "@/lib/form-builder";
import { useDraggable } from "@dnd-kit/core";
import { IconNumber, IconTextCaption } from "@tabler/icons-react";


const ENTITY_CATEGORIES = [
    {
        name: "Inputs",
        entities: [
            {
                id: "text",
                name: "Text",
                icon: IconTextCaption,
                entity: textEntity,
                component: TextEntityComponent
            },
            {
                id: "number",
                name: "Number",
                icon: IconNumber,
                entity: numberEntity,
                component: NumberEntityComponent
            },
        ]
    }
]

function FormEditor() {
    const { state, getEntityState } = useFormContext();

    return (
        <div className="h-full flex">
            <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-r border-border">
                <pre>{JSON.stringify(state, null, 1)}</pre>
                {/* <pre>{JSON.stringify(getEntityState("ok", "ok"), null, 1)}</pre> */}
            </div>
            <div className="flex-1">
                {/* <TextEntityComponent rowId="ok" entityId="ok" /> */}
            </div>
            <div className="w-72 h-full bg-sidebar p-2 overflow-y-auto border-l border-border">
                {ENTITY_CATEGORIES.map((category, i) => (
                    <div className="flex flex-col gap-2" key={i}>
                        <span className="text-sm">{category.name}</span>
                        <div className="grid grid-cols-3 gap-2">
                            {category.entities.map((entity, j) => (
                                <EntitySwatch key={j} id={entity.id} icon={<entity.icon />} name={entity.name} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EntitySwatch({ id, icon, name }: { id: string, icon: React.ReactNode, name: string }) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id,
    });

    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className="bg-input/30 hover:bg-input/50 cursor-pointer border border-border rounded-md aspect-square flex flex-col items-center justify-center gap-1.5">
            {icon}
            <span className="text-sm">{name}</span>
        </div>
    )
}

export default function FormEditorContainer() {
    return (
        <FormProvider>
            <FormEditor />
        </FormProvider>
    )
}