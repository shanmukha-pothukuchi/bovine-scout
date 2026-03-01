import { Button } from "@/components/ui/button";
import { useDroppable } from "@dnd-kit/core";
import {
  CursorClickIcon,
  GearSixIcon,
  PaletteIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { FormEntry } from "../context";
import { EntityPalettePanel } from "./entity-palette-panel";
import { EntityPropertiesPanel } from "./entity-properties-panel";
import { FormPropertiesPanel } from "./form-properties-panel";
import { Row } from "./row";
import type { FormStructure } from "./types";

export type SidebarPanel =
  | "form-properties"
  | "entity-properties"
  | "entity-palette";

const SIDEBAR_PANELS: {
  id: SidebarPanel;
  label: string;
  Icon: React.ElementType;
}[] = [
  { id: "entity-palette", label: "Entity Palette", Icon: PaletteIcon },
  {
    id: "entity-properties",
    label: "Entity Properties",
    Icon: CursorClickIcon,
  },
  { id: "form-properties", label: "Form Properties", Icon: GearSixIcon },
];

export function FormEditor({
  form,
  formEntry,
  onFormEntryChange,
  isPreview,
  onPreviewToggle,
  selected,
  setSelected,
  activePanel,
  setActivePanel,
}: {
  form: FormStructure;
  formEntry: FormEntry;
  onFormEntryChange: (
    patch: Partial<Pick<FormEntry, "label" | "menuItemIds">>,
  ) => void;
  isPreview: boolean;
  onPreviewToggle: () => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  activePanel: SidebarPanel;
  setActivePanel: (panel: SidebarPanel) => void;
}) {
  const [panelBeforeSelection, setPanelBeforeSelection] =
    useState<SidebarPanel>("entity-palette");

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
        <div className="flex items-center justify-between border-b border-border bg-sidebar px-2 h-11.25">
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
          <div className="flex items-center px-2 border-b border-border shrink-0 h-11.25">
            <span className="text-sm font-medium text-muted-foreground">
              {SIDEBAR_PANELS.find((p) => p.id === activePanel)?.label}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-4 w-72">
            {activePanel === "form-properties" && (
              <FormPropertiesPanel
                formEntry={formEntry}
                onChange={onFormEntryChange}
              />
            )}
            {activePanel === "entity-properties" && (
              <EntityPropertiesPanel form={form} selected={selected} />
            )}
            {activePanel === "entity-palette" && (
              <EntityPalettePanel isDragDisabled={isDragDisabled} />
            )}
          </div>
        </div>
        <div className="h-full border-l flex flex-col items-center gap-1 py-2 px-1">
          {SIDEBAR_PANELS.map(({ id, label, Icon }) => (
            <span
              key={id}
              title={label}
              onClick={() => setActivePanel(id)}
              className={`flex justify-center items-center rounded-md w-8 h-8 cursor-pointer select-none transition-colors ${
                activePanel === id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="w-6 h-6" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
