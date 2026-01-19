import { numberEntity, NumberEntityComponent } from "@/components/form_builder/entities/number";
import { textEntity, TextEntityComponent } from "@/components/form_builder/entities/text";
import { FormProvider, useFormContext } from "@/lib/form-builder";
import { IconNumber, IconTextCaption } from "@tabler/icons-react";
import styles from "./index.module.css";

const ENTITY_CATEGORIES = [
    {
        name: "Inputs",
        entities: [
            {
                name: "Text",
                icon: IconTextCaption,
                entity: textEntity,
                component: TextEntityComponent
            },
            {
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
        <div className={styles.container}>
            <div className={styles.left_sidebar}>
                <pre>{JSON.stringify(state, null, 1)}</pre>
                {/* <pre>{JSON.stringify(getEntityState("ok", "ok"), null, 1)}</pre> */}
            </div>
            <div className={styles.main}>
                {/* <TextEntityComponent rowId="ok" entityId="ok" /> */}
            </div>
            <div className={styles.right_sidebar}>
                {ENTITY_CATEGORIES.map((category) => (
                    <div className={styles.entity_category}>
                        <span className={styles.text}>{category.name}</span>
                        <div className={styles.pallette}>
                            {category.entities.map((entity) => (
                                <div className={styles.swatch}>
                                    <entity.icon />
                                    <span className={styles.name}>{entity.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function FormEditorContainer() {
    return (
        <FormProvider>
            <FormEditor />
        </FormProvider>
    )
}