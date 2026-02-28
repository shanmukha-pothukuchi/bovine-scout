import { entityCategories } from "./constants";
import { EntitySwatch } from "./entity";

export function EntityPalettePanel({
  isDragDisabled,
}: {
  isDragDisabled: boolean;
}) {
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
