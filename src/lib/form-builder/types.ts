import type React from "react";

export type ErrorSerializer = (error: unknown) => string;

export const defaultErrorSerializer: ErrorSerializer = (error) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "An unexpected validation error occurred";
};

export interface AttributeRegistryEntry<TName extends string, TValue> {
  readonly definition: Attribute<TName, TValue>;
  readonly wrapper: React.ComponentType<AttributeWrapperProps>;
}

export interface EntityRegistryEntry<
  TName extends string,
  TAttributes extends Record<string, AttributeRegistryEntry<string, any>>,
  TValue,
> {
  readonly definition: Entity<TName, TAttributes, TValue>;
  readonly wrapper: React.ComponentType<EntityWrapperProps>;
}

export type AnyAttributeEntry = AttributeRegistryEntry<string, any>;
export type AnyEntityEntry = EntityRegistryEntry<string, any, any>;

export type AttributeValues<T extends Record<string, AnyAttributeEntry>> = {
  [K in keyof T]: T[K]["definition"]["defaultValue"];
};

export type EntityDefaultValue<
  TValue,
  TAttributes extends Record<string, AnyAttributeEntry>,
> =
  | { type: "literal"; value: TValue }
  | { type: "attribute"; value: keyof TAttributes & string };

export interface Attribute<TName extends string, TValue> {
  name: TName;
  defaultValue: TValue;
  validate: (
    value: TValue,
  ) => (TValue | null | undefined) | Promise<TValue | null | undefined>;
  component: React.ComponentType<AttributeComponentProps<TValue>>;
}

export interface Entity<
  TName extends string,
  TAttributes extends Record<string, AnyAttributeEntry>,
  TValue,
> {
  name: TName;
  icon: React.ComponentType<{ size?: number | string }>;
  attributes: TAttributes;
  defaultValue: EntityDefaultValue<TValue, TAttributes>;
  validate: (
    value: TValue,
    attributes: AttributeValues<TAttributes>,
  ) => (TValue | null | undefined) | Promise<TValue | null | undefined>;
  component: React.ComponentType<EntityComponentProps<TAttributes, TValue>>;
}

export interface AttributeComponentProps<TValue = unknown> {
  value: TValue;
  setValue: (value: TValue) => void;
  validateValue: () => Promise<void>;
  error: string | null;
  resetError: () => void;
  disabled?: boolean;
}

export interface EntityComponentProps<
  TAttributes extends Record<string, AnyAttributeEntry>,
  TValue = unknown,
> {
  attributes: AttributeValues<TAttributes>;
  value: TValue;
  setValue: (value: TValue) => void;
  validateValue: () => Promise<void>;
  error: string | null;
  resetError: () => void;
  disabled?: boolean;
}

export interface AttributeStateData {
  name: string;
  value: unknown;
  error: string | null;
}

export interface EntityStateData {
  name: string;
  value: unknown;
  error: string | null;
  attributes: Record<string, AttributeStateData>;
}

export interface FormState {
  [entityId: string]: EntityStateData;
}

export interface AttributeWrapperProps {
  entityId: string;
  defaultAttributeState?: AttributeStateData;
}

export interface EntityWrapperProps {
  entityId: string;
  defaultEntityState?: EntityStateData;
  disabled?: boolean;
}

export function resolveEntityDefaultValue<
  TValue,
  TAttributes extends Record<string, AnyAttributeEntry>,
>(
  defaultValue: EntityDefaultValue<TValue, TAttributes>,
  attributeStates: Record<string, AttributeStateData>,
  attributeDefinitions: TAttributes,
): TValue {
  if (defaultValue.type === "literal") {
    return defaultValue.value;
  }

  const attrKey = defaultValue.value;

  const attrState = attributeStates[attrKey];
  if (attrState !== undefined) return attrState.value as TValue;

  const attrEntry = attributeDefinitions[attrKey];
  if (attrEntry !== undefined)
    return attrEntry.definition.defaultValue as TValue;

  throw new Error(
    `resolveEntityDefaultValue: attribute key "${String(attrKey)}" not found in attribute definitions`,
  );
}
