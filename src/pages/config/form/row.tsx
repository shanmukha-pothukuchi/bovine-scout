import { useDroppable } from "@dnd-kit/core";
import { Entity, type EntityStructure } from "./entity";

export interface RowStructure {
  id: string;
  entities: EntityStructure[];
}

export function Row({
  row,
  selected,
  setSelected,
  inputDisabled = false,
  dragDisabled = false,
}: {
  row: RowStructure;
  selected: string | null;
  setSelected: (entityId: string | null) => void;
  inputDisabled?: boolean;
  dragDisabled?: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: "row" + row.id,
    data: {
      rowId: row.id,
    },
    disabled: dragDisabled,
  });

  return (
    <div ref={setNodeRef} className="flex">
      {row.entities.map((entity) => (
        <Entity
          key={entity.id}
          rowId={row.id}
          entity={entity}
          selected={selected === entity.id}
          setSelected={() => setSelected(entity.id)}
          inputDisabled={inputDisabled}
          dragDisabled={dragDisabled}
        />
      ))}
    </div>
  );
}
