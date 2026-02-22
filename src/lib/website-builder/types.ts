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
> {
  readonly definition: Entity<TName, TAttributes>;
  readonly wrapper: React.ComponentType<EntityWrapperProps>;
}

export type AnyAttributeEntry = AttributeRegistryEntry<string, any>;
export type AnyEntityEntry = EntityRegistryEntry<string, any>;

export type AttributeValues<T extends Record<string, AnyAttributeEntry>> = {
  [K in keyof T]: T[K]["definition"]["defaultValue"];
};

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
> {
  name: TName;
  icon: React.ComponentType<{ size?: number | string }>;
  attributes: TAttributes;
  component: React.ComponentType<EntityComponentProps<TAttributes>>;
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
> {
  attributes: AttributeValues<TAttributes>;
  disabled?: boolean;
}

export interface GridPoint {
  top: number;
  left: number;
}

export interface GridArea {
  start: GridPoint;
  end: GridPoint;
}

export interface AttributeStateData {
  name: string;
  value: unknown;
  error: string | null;
}

export interface EntityStateData {
  name: string;
  region: GridArea;
  attributes: Record<string, AttributeStateData>;
}

export interface BuilderState {
  [entityId: string]: EntityStateData;
}

export interface AttributeWrapperProps {
  entityId: string;
  attributeKey: string;
  defaultAttributeState?: AttributeStateData;
}

export interface EntityWrapperProps {
  entityId: string;
  defaultEntityState?: EntityStateData;
  disabled?: boolean;
}
