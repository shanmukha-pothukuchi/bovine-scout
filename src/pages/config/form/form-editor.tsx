import { Button } from "@/components/ui/button";
import { useFormContext } from "@/lib/form-builder";
import { useDroppable } from "@dnd-kit/core";
import {
  CursorClickIcon,
  GearIcon,
  PaletteIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { entityCategories } from "./constants";
import { EntitySwatch } from "./entity";
import { Row } from "./row";
import type { FormStructure } from "./types";

type SidebarPanel = "form-properties" | "entity-properties" | "entity-palette";

const SIDEBAR_PANELS: {
  id: SidebarPanel;
  label: string;
  Icon: React.ElementType;
}[] = [
  { id: "entity-palette", label: "Entity Palette", Icon: PaletteIcon },
  { id: "entity-properties", label: "Entity Properties", Icon: CursorClickIcon },
  { id: "form-properties", label: "Form Properties", Icon: GearIcon },
];

function FormPropertiesPanel() {
  return (
    <div className="text-xs text-muted-foreground">
      No form-level properties available yet.
    </div>
  );
}

function EntityPropertiesPanel({
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

function EntityPalettePanel({ isDragDisabled }: { isDragDisabled: boolean }) {
  return (
    <>
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
    </>
  );
}

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
  const [activePanel, setActivePanel] = useState<SidebarPanel>("entity-palette");
  const [panelBeforeSelection, setPanelBeforeSelection] = useState<SidebarPanel>("entity-palette");

  const handleSetSelected = (id: string | null) => {
    if (id !== null && selected === null) {
      setPanelBeforeSelection(activePanel);
      setActivePanel("entity-properties");
    } else if (id === null && selected !== null) {
      setActivePanel(panelBeforeSelection);
    }
    setSelected(id);
  };

  const isDragDisabled = useMemo(() => isPreview, [isPreview]);

  const { setNodeRef } = useDroppable({
    id: "form",
    disabled: isDragDisabled,
  });

  return (
    <div className="h-full flex flex-1 min-w-0">
      <div
        className="flex flex-col flex-1"
        ref={setNodeRef}
        onClick={() => !isPreview && handleSetSelected(null)}
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
              setSelected={isPreview ? () => {} : handleSetSelected}
              inputDisabled={!isPreview}
              dragDisabled={isDragDisabled}
            />
          ))}
        </div>
      </div>
      <div className="h-full bg-sidebar border-l border-border flex">
        <div className="flex flex-col overflow-hidden">
          <div className="px-2 py-2 border-b border-border shrink-0">
            <span className="text-sm font-medium text-muted-foreground">
              {SIDEBAR_PANELS.find((p) => p.id === activePanel)?.label}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-4 w-64">
            {activePanel === "form-properties" && <FormPropertiesPanel />}
            {activePanel === "entity-properties" && (
              <EntityPropertiesPanel form={form} selected={selected} />
            )}
            {activePanel === "entity-palette" && (
              <EntityPalettePanel isDragDisabled={isDragDisabled} />
            )}
          </div>
        </div>
        <div className="h-full border-l flex flex-col items-center gap-0.5 py-2 px-1">
          {SIDEBAR_PANELS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon-sm"
              title={label}
              onClick={() => setActivePanel(id)}
              className={
                activePanel === id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              <Icon weight={activePanel === id ? "fill" : "regular"} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
