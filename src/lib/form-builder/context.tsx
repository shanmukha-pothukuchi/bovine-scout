import { createContext, useContext } from "react";
import type {
  AnyAttributeEntry,
  AnyEntityEntry,
  Entity,
  EntityStateData,
  ErrorSerializer,
  FormState,
} from "./types";

export interface FormContextValue {
  state: FormState;
  entityRegistry: React.RefObject<Record<string, AnyEntityEntry>>;
  attributeRegistry: React.RefObject<Record<string, AnyAttributeEntry>>;
  registerEntity: <
    TName extends string,
    TAttributes extends Record<string, AnyAttributeEntry>,
    TValue,
  >(
    entityId: string,
    entity: Entity<TName, TAttributes, TValue>,
  ) => void;
  deregisterEntity: (entityId: string) => void;
  setEntityValue: (entityId: string, value: unknown) => void;
  setEntityError: (entityId: string, error: string | null) => void;
  validateEntity: (entityId: string) => Promise<void>;
  setAttributeValue: (
    entityId: string,
    attributeName: string,
    value: unknown,
  ) => void;
  setAttributeError: (
    entityId: string,
    attributeName: string,
    error: string | null,
  ) => void;
  validateAttribute: (entityId: string, attributeName: string) => Promise<void>;
  getEntityState: (entityId: string) => EntityStateData | undefined;
  validateAll: () => Promise<boolean>;
  getValues: () => Record<string, unknown>;
  resetValues: () => void;
  isValid: boolean;
  errorSerializer: ErrorSerializer;
}

export const FormContext = createContext<FormContextValue | null>(null);
export const EntityContext = createContext<{ entityId: string } | null>(null);
export const AttributeContext = createContext<{ attributeName: string } | null>(
  null,
);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context)
    throw new Error("useFormContext must be used within a FormProvider");
  return context;
}

export function useEntityContext() {
  return useContext(EntityContext);
}

export function useAttributeContext() {
  return useContext(AttributeContext);
}
