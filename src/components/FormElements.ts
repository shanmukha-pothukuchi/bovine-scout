import { signal } from "@preact/signals-react";
import { LucideIcon } from "lucide-react";
import { ComponentType, ForwardRefExoticComponent, RefAttributes } from "react";
import { Counter } from "./fields/Counter";
import { Checkbox } from "./fields/Checkbox";
import { NumberField } from "./fields/NumberField";
import { TextField } from "./fields/TextField";

export type ElementType = "TextField" | "NumberField" | "Checkbox" | "Counter";

export type PropertyType = "string" | "number" | "boolean" | "select" | "any";

export type ReturnTypeToTSType = {
  string: string;
  number: number;
  boolean: boolean;
  "string[]": string[];
  "number[]": number[];
  "boolean[]": boolean[];
  "any[]": unknown[];
};

export type ReturnType = keyof ReturnTypeToTSType;

export type SelectOptions<T extends string> = {
  value: T;
  label: string;
}[];

export type FormElementProperties<T> = {
  [K in keyof T]: {
    name: string;
    description: string;
  } & (
    | (T[K] extends string
        ? { type: "select"; options: SelectOptions<T[K]> }
        : never)
    | { type: Exclude<PropertyType, "select"> }
  );
};

export type UpdateFormValue<T extends ReturnType> = (
  value: ReturnTypeToTSType[T]
) => void;

export type FormElementImperativeHandle = {
  validate: () => boolean;
};

export type FormValidationResponse = { error: boolean; message?: string };

export type FormElement<T, RT extends ReturnType> = {
  type: ElementType;
  properties: FormElementProperties<T>;
  generateInstance: (id: string) => FormElementInstance<T>;
  validate: (
    instance: FormElementInstance<T>,
    value: ReturnTypeToTSType[RT]
  ) => FormValidationResponse;
  paletteComponent: {
    name: string;
    icon: LucideIcon;
  };
  builderComponent: ComponentType<{
    instance: FormElementInstance<T>;
  }>;
  renderedComponent: ForwardRefExoticComponent<
    {
      instance: FormElementInstance<T>;
      updateFormValue?: UpdateFormValue<RT>;
    } & RefAttributes<FormElementImperativeHandle>
  >;
};

export type FormElementInstance<T> = {
  id: string;
  type: ElementType;
  properties: T;
};

export type Row<T> = T[];

export type FormElementInstanceRow<T = unknown> = Row<FormElementInstance<T>>;

export const formElements: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in ElementType]: FormElement<any, any>;
} = {
  TextField,
  NumberField,
  Checkbox,
  Counter,
};

// signals
export const formElementInstanceRows = signal<FormElementInstanceRow[]>([]);
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
      formElementInstanceRows.value[rowIndex] as FormElementInstance<unknown>[]
    ).splice(colIndex, 0, instance);
  } else {
    formElementInstanceRows.value.splice(rowIndex, 0, [instance]);
  }
  formElementInstanceRows.value = [...formElementInstanceRows.value];
};

export const updateFormElementInstance = (
  newInstance: FormElementInstance<unknown>
) => {
  const [rowIndex, columnIndex] = getFormElementInstanceIndex(newInstance.id);
  formElementInstanceRows.value[rowIndex][columnIndex] = newInstance;
  formElementInstanceRows.value = [...formElementInstanceRows.value];
};

export const removeFormElementInstance = (id: string) => {
  if (
    formElementInstanceRows.value
      .flat()
      .findIndex((instance) => instance.id === id) === -1
  ) {
    return;
  }
  if (selectedFormElementInstance.value?.id === id)
    setSelectedFormElementInstance();
  const [rowIndex, columnIndex] = getFormElementInstanceIndex(id);
  if (rowIndex !== -1 && columnIndex !== -1) {
    (formElementInstanceRows.value[rowIndex] as []).splice(columnIndex, 1);
  }
  if (
    (rowIndex !== -1 && columnIndex === -1) ||
    (Array.isArray(formElementInstanceRows.value[rowIndex]) &&
      formElementInstanceRows.value[rowIndex].length <= 0)
  ) {
    formElementInstanceRows.value.splice(rowIndex, 1);
  }
  formElementInstanceRows.value = [...formElementInstanceRows.value];
};

export const getFormElementInstanceIndex = (id: string): [number, number] => {
  let rowIndex = -1;
  let columnIndex = -1;
  formElementInstanceRows.value.forEach((row, i) => {
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
  return formElementInstanceRows.value
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
