import { numberEntity } from "@/components/form-builder/entities/number";
import { sliderEntity } from "@/components/form-builder/entities/slider";
import { textEntity } from "@/components/form-builder/entities/text";

export const entityCategories = [
  {
    name: "Input",
    entities: [textEntity, numberEntity],
  },
  {
    name: "Control",
    entities: [sliderEntity],
  },
];

export const availableEntities = entityCategories
  .map((category) => category.entities)
  .flat();
