import { createContext, useContext } from "react";
import type {
  AnyAttributeEntry,
  AnyEntityEntry,
  BuilderState,
  Entity,
  EntityStateData,
  GridArea,
} from "./types";

export interface BuilderContextValue {
  // State
  state: BuilderState;
  isValid: boolean;

  // Registries
  entityRegistry: React.RefObject<Record<string, AnyEntityEntry>>;
  attributeRegistry: React.RefObject<Record<string, AnyAttributeEntry>>;

  // Entity management
  registerEntity: <
    TName extends string,
    TAttributes extends Record<string, AnyAttributeEntry>,
  >(
    entityId: string,
    entity: Entity<TName, TAttributes>,
    region?: GridArea | null,
  ) => void;
  deregisterEntity: (entityId: string) => void;
  getEntityState: (entityId: string) => EntityStateData | undefined;
  setEntityRegion: (entityId: string, region: GridArea) => void;

  // Attribute management (by attributeKey)
  setAttributeValue: (
    entityId: string,
    attributeKey: string,
    value: unknown,
  ) => void;
  setAttributeError: (
    entityId: string,
    attributeKey: string,
    error: string | null,
  ) => void;
  validateAttribute: (entityId: string, attributeKey: string) => Promise<void>;

  // Bulk operations
  validateAll: () => Promise<boolean>;
  getAttributeValues: (entityId: string) => Record<string, unknown> | undefined;
}

export const BuilderContext = createContext<BuilderContextValue | null>(null);
export const EntityContext = createContext<{ entityId: string } | null>(null);
export const AttributeContext = createContext<{
  attributeKey: string;
  attributeName: string;
} | null>(null);

export function useBuilderContext() {
  const context = useContext(BuilderContext);
  if (!context)
    throw new Error("useBuilderContext must be used within a BuilderProvider");
  return context;
}

export function useEntityContext() {
  return useContext(EntityContext);
}

export function useAttributeContext() {
  return useContext(AttributeContext);
}
