import { GridLayer } from "./grid-layer";
import { GridRegion } from "./grid-region";

export function PageBuilderCanvas() {
  const columnCount = 12;
  const rowCount = 5;

  return (
    <div className="relative overflow-y-auto h-full">
      <GridLayer columnCount={columnCount} rowCount={rowCount} showBoxes />
      <GridLayer
        columnCount={columnCount}
        rowCount={rowCount}
        className="absolute inset-0"
      >
        <GridRegion top={2} left={4} height={3} width={3}>
          <div className="w-full h-full bg-accent/50 rounded-md grid place-items-center">
            hello world
          </div>
        </GridRegion>
      </GridLayer>
    </div>
  );
}
