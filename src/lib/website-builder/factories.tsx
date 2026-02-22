import { useCallback, useEffect } from "react";
import {
  AttributeContext,
  EntityContext,
  useBuilderContext,
  useEntityContext,
} from "./context";
import type {
  AnyAttributeEntry,
  Attribute,
  AttributeRegistryEntry,
  AttributeValues,
  AttributeWrapperProps,
  Entity,
  EntityRegistryEntry,
  EntityWrapperProps,
} from "./types";

export function makeAttribute<const TName extends string, TValue>(
  options: Attribute<TName, TValue>,
): AttributeRegistryEntry<TName, TValue> {
  function AttributeWrapper({
    entityId,
    attributeKey,
    defaultAttributeState,
  }: AttributeWrapperProps) {
    const builderContext = useBuilderContext();
    const entityContext = useEntityContext();
    const resolvedEntityId = entityId ?? entityContext?.entityId;

    if (!resolvedEntityId) {
      throw new Error(
        `Attribute "${options.name}" rendered without an entityId. ` +
          "Either pass entityId directly or render inside an EntityWrapper.",
      );
    }

    const setValue = useCallback(
      (value: TValue) => {
        if (resolvedEntityId) {
          builderContext.setAttributeValue(
            resolvedEntityId,
            attributeKey,
            value,
          );
        }
      },
      [builderContext, resolvedEntityId],
    );

    const validateValue = useCallback(async () => {
      if (resolvedEntityId) {
        await builderContext.validateAttribute(resolvedEntityId, attributeKey);
      }
    }, [builderContext, resolvedEntityId]);

    const resetError = useCallback(() => {
      if (resolvedEntityId) {
        builderContext.setAttributeError(resolvedEntityId, attributeKey, null);
      }
    }, [builderContext, resolvedEntityId]);

    if (!resolvedEntityId) return null;

    const entityState = builderContext.getEntityState(resolvedEntityId);
    const attributeState =
      entityState?.attributes[attributeKey] ?? defaultAttributeState;

    if (!attributeState) return null;

    return (
      <AttributeContext.Provider
        value={{ attributeKey, attributeName: options.name }}
      >
        <options.component
          value={attributeState.value as TValue}
          setValue={setValue}
          validateValue={validateValue}
          error={attributeState.error}
          resetError={resetError}
        />
      </AttributeContext.Provider>
    );
  }

  return { definition: options, wrapper: AttributeWrapper };
}

export function makeEntity<
  const TName extends string,
  const TAttributes extends Record<string, AnyAttributeEntry>,
>(
  options: Entity<TName, TAttributes>,
): EntityRegistryEntry<TName, TAttributes> {
  function EntityWrapper({
    entityId,
    defaultEntityState,
    disabled,
  }: EntityWrapperProps) {
    const builderContext = useBuilderContext();

    const entityState =
      builderContext.getEntityState(entityId) ?? defaultEntityState;

    if (!entityState) return null;

    const attributesProp = Object.fromEntries(
      Object.entries(options.attributes).map(([key, attrEntry]) => {
        const attr = (attrEntry as AnyAttributeEntry).definition;
        const attrState = entityState.attributes[key];
        return [key, attrState?.value ?? attr.defaultValue];
      }),
    ) as AttributeValues<TAttributes>;

    return (
      <EntityContext.Provider value={{ entityId }}>
        <options.component attributes={attributesProp} disabled={disabled} />
      </EntityContext.Provider>
    );
  }

  return { definition: options, wrapper: EntityWrapper };
}
