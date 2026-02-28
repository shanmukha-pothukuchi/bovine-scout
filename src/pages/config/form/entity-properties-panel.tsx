import { useFormContext } from "@/lib/form-builder";
import type { FormStructure } from "./types";

export function EntityPropertiesPanel({
  form,
  selected,
}: {
  form: FormStructure;
  selected: string | null;
}) {
  const { getEntityState, attributeRegistry } = useFormContext();

  if (!selected) {
    return (
      <div className="text-xs text-muted-foreground">
        Select a form entity to view and edit properties.
      </div>
    );
  }

  const entityStruct = form.rows
    .flatMap((row) => row.entities)
    .find((entity) => entity.id === selected);
  if (!entityStruct) return null;

  const entityEntry = getEntityState(entityStruct.id);
  if (!entityEntry) return null;

  return (
    <>
      {Object.entries(entityEntry.attributes).map(([attrName, attrState]) => {
        const Component = attributeRegistry.current[attrState.name].wrapper;
        return (
          <Component key={attrName} entityId={selected} attributeKey={attrName} />
        );
      })}
    </>
  );
}
