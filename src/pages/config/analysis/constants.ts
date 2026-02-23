import { textEntity } from "@/components/website-builder/entities/text";

export const componentCategories = [
  {
    name: "Content",
    entities: [textEntity],
  },
];

export const availableEntities = componentCategories
  .map((category) => category.entities)
  .flat();

export const DATA_ATTR_GRID_REGION = "data-grid-region";
export const DATA_ATTR_RESIZE_HANDLE = "data-resize-handle";
export const DATA_ATTR_DELETE_HANDLE = "data-delete-handle";
