import { useCallback, useEffect } from "react";
import {
  AttributeContext,
  EntityContext,
  useEntityContext,
  useFormContext,
} from "./context";
import {
  type AnyAttributeEntry,
  type Attribute,
  type AttributeRegistryEntry,
  type AttributeValues,
  type AttributeWrapperProps,
  type Entity,
  type EntityRegistryEntry,
  type EntityWrapperProps,
  resolveEntityDefaultValue,
} from "./types";

export function makeAttribute<const TName extends string, TValue>(
  options: Attribute<TName, TValue>,
): AttributeRegistryEntry<TName, TValue> {
  function AttributeWrapper({
    entityId,
    defaultAttributeState,
  }: AttributeWrapperProps) {
    const formContext = useFormContext();
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
          formContext.setAttributeValue(resolvedEntityId, options.name, value);
        }
      },
      [formContext, resolvedEntityId],
    );

    const validateValue = useCallback(async () => {
      if (resolvedEntityId) {
        await formContext.validateAttribute(resolvedEntityId, options.name);
      }
    }, [formContext, resolvedEntityId]);

    const resetError = useCallback(() => {
      if (resolvedEntityId) {
        formContext.setAttributeError(resolvedEntityId, options.name, null);
      }
    }, [formContext, resolvedEntityId]);

    if (!resolvedEntityId) return null;

    const entityState = formContext.getEntityState(resolvedEntityId);
    const attributeState =
      entityState?.attributes[options.name] ?? defaultAttributeState;

    if (!attributeState) return null;

    return (
      <AttributeContext.Provider value={{ attributeName: options.name }}>
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
  TValue,
>(
  options: Entity<TName, TAttributes, TValue>,
): EntityRegistryEntry<TName, TAttributes, TValue> {
  function EntityWrapper({
    entityId,
    defaultEntityState,
    disabled,
  }: EntityWrapperProps) {
    const formContext = useFormContext();

    useEffect(() => {
      formContext.registerEntity(entityId, options);
    }, [formContext, entityId]);

    const entityState =
      formContext.getEntityState(entityId) ?? defaultEntityState;

    if (!entityState) return null;

    const attributesProp = Object.fromEntries(
      Object.entries(options.attributes).map(([key, attrEntry]) => {
        const attr = (attrEntry as AnyAttributeEntry).definition;
        const attrState = entityState.attributes[attr.name];
        return [key, attrState?.value ?? attr.defaultValue];
      }),
    ) as AttributeValues<TAttributes>;

    const setValue = useCallback(
      (newValue: TValue) => {
        formContext.setEntityValue(entityId, newValue);
      },
      [formContext, entityId],
    );

    const validateValue = useCallback(async () => {
      await formContext.validateEntity(entityId);
    }, [formContext, entityId]);

    const resetError = useCallback(() => {
      formContext.setEntityError(entityId, null);
    }, [formContext, entityId]);

    const resolvedValue =
      (entityState.value as TValue) ??
      resolveEntityDefaultValue(
        options.defaultValue,
        entityState.attributes,
        options.attributes,
      );

    return (
      <EntityContext.Provider value={{ entityId }}>
        <options.component
          attributes={attributesProp}
          value={resolvedValue}
          setValue={setValue}
          validateValue={validateValue}
          error={entityState.error}
          resetError={resetError}
          disabled={disabled}
        />
      </EntityContext.Provider>
    );
  }

  return { definition: options, wrapper: EntityWrapper };
}
