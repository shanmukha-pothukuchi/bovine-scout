import { Button } from "@/components/ui/button";
import { useFormContext } from "@/lib/form-builder";
import { useDroppable } from "@dnd-kit/core";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { EntitySwatch } from "./entity";
import { Row } from "./row";
import { entityCategories } from "./constants";
import type { FormStructure } from "./types";

export function FormEditor({
  form,
  isPreview,
  onPreviewToggle,
  selected,
  setSelected,
}: {
  form: FormStructure;
  isPreview: boolean;
  onPreviewToggle: () => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
}) {
  const { state, getEntityState, attributeRegistry } = useFormContext();

  const isDragDisabled = useMemo(() => isPreview, [isPreview]);

  const { setNodeRef } = useDroppable({
    id: "form",
    disabled: isDragDisabled,
  });

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
