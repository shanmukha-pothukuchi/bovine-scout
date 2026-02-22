import { textEntity } from "@/components/website-builder";

export const componentCategories = [
  {
    name: "Content",
    entities: [textEntity],
  },
];

export const availableEntities = componentCategories
  .map((category) => category.entities)
  .flat();
