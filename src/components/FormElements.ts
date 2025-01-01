import { signal } from "@preact/signals-react";
import { ComponentType } from "react";
import { IconType } from "react-icons";
import { NumberField } from "./fields/NumberField";
import { TextField } from "./fields/TextField";

export type ElementType = "TextField" | "NumberField";

export type PropertyType = "string" | "number" | "boolean" | "any";

export type FormElement<T> = {
  type: ElementType;
  properties: Record<
    keyof T,
    { name: string; type: PropertyType; description: string }
  >;
  generateInstance: (id: string) => FormElementInstance<T>;
  paletteComponent: {
    name: string;
    icon: IconType;
  };
  builderComponent: ComponentType<{
    instance: FormElementInstance<T>;
  }>;
  renderedComponent: ComponentType<{
    instance: FormElementInstance<T>;
  }>;
};

export type FormElementInstance<T> = {
  id: string;
  type: ElementType;
  properties: T;
};

export type Row<T> = T[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formElements: { [key in ElementType]: FormElement<any> } = {
  TextField,
  NumberField,
};

// signals
export const formElementInstances = signal<Row<FormElementInstance<unknown>>[]>(
  []
);
export const selectedFormElementInstance =
  signal<FormElementInstance<unknown>>();
export const showFormPreview = signal<boolean>(false);

export const addFormElementInstance = (
  instance: FormElementInstance<unknown>,
  rowIndex: number,
  colIndex?: number
) => {
  if (colIndex !== undefined) {
    (
      formElementInstances.value[rowIndex] as FormElementInstance<unknown>[]
    ).splice(colIndex, 0, instance);
  } else {
    formElementInstances.value.splice(rowIndex, 0, [instance]);
  }
  formElementInstances.value = [...formElementInstances.value];
};

export const updateFormElementInstance = (
  newInstance: FormElementInstance<unknown>
) => {
  const [rowIndex, columnIndex] = getFormElementInstanceIndex(newInstance.id);
  formElementInstances.value[rowIndex][columnIndex] = newInstance;
  formElementInstances.value = [...formElementInstances.value];
};

export const removeFormElementInstance = (id: string) => {
  if (
    formElementInstances.value
      .flat()
      .findIndex((instance) => instance.id === id) === -1
  ) {
    return;
  }
  if (selectedFormElementInstance.value?.id === id)
    setSelectedFormElementInstance();
  const [rowIndex, columnIndex] = getFormElementInstanceIndex(id);
  if (rowIndex !== -1 && columnIndex !== -1) {
    (formElementInstances.value[rowIndex] as []).splice(columnIndex, 1);
  }
  if (
    (rowIndex !== -1 && columnIndex === -1) ||
    (Array.isArray(formElementInstances.value[rowIndex]) &&
      formElementInstances.value[rowIndex].length <= 0)
  ) {
    formElementInstances.value.splice(rowIndex, 1);
  }
  formElementInstances.value = [...formElementInstances.value];
};

export const getFormElementInstanceIndex = (id: string): [number, number] => {
  let rowIndex = -1;
  let columnIndex = -1;
  formElementInstances.value.forEach((row, i) => {
    if (Array.isArray(row)) {
      const index = row.findIndex((instance) => instance.id === id);
      if (index !== -1) {
        rowIndex = i;
        columnIndex = index;
      }
    } else if ((row as FormElementInstance<unknown>).id === id) {
      rowIndex = i;
    }
  });
  return [rowIndex, columnIndex];
};

export const getFormElementInstance = (id: string) => {
  return formElementInstances.value
    .flat()
    .find((instance) => instance.id === id);
};

export const setSelectedFormElementInstance = (id?: string) => {
  if (!id) {
    selectedFormElementInstance.value = undefined;
    return;
  }
  selectedFormElementInstance.value = getFormElementInstance(id);
};

export function setShowFormPreview(value: boolean) {
  showFormPreview.value = value;
}
