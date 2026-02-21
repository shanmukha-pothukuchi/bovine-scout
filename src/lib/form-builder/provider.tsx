import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormContext } from "./context";
import {
  type AnyAttributeEntry,
  type AnyEntityEntry,
  type AttributeStateData,
  type AttributeValues,
  type Entity,
  type EntityStateData,
  type ErrorSerializer,
  type FormState,
  defaultErrorSerializer,
  resolveEntityDefaultValue,
} from "./types";

export function FormProvider({
  children,
  initialState = {},
  entities = [],
  errorSerializer = defaultErrorSerializer,
}: {
  children: React.ReactNode;
  initialState?: FormState;
  entities?: AnyEntityEntry[];
  errorSerializer?: ErrorSerializer;
}) {
  const [state, setState] = useState<FormState>(initialState);

  const stateRef = useRef<FormState>(state);

  const entityRegistry = useRef<Record<string, AnyEntityEntry>>({});
  const attributeRegistry = useRef<Record<string, AnyAttributeEntry>>({});

  useEffect(() => {
    entityRegistry.current = {};
    attributeRegistry.current = {};

    entities.forEach((entityEntry) => {
      const entityDef = entityEntry.definition;
      entityRegistry.current[entityDef.name] = entityEntry;

      (Object.values(entityDef.attributes) as AnyAttributeEntry[]).forEach(
        (attrEntry) => {
          attributeRegistry.current[attrEntry.definition.name] = attrEntry;
        },
      );
    });
  }, [entities]);

  const errorCountRef = useRef(0);
  const [isValid, setIsValid] = useState(true);

  const updateErrorCount = useCallback((delta: number) => {
    errorCountRef.current = Math.max(0, errorCountRef.current + delta);
    setIsValid(errorCountRef.current === 0);
  }, []);

  const errorSerializerRef = useRef(errorSerializer);
  useEffect(() => {
    errorSerializerRef.current = errorSerializer;
  }, [errorSerializer]);

  const getEntityState = useCallback(
    (entityId: string): EntityStateData | undefined => {
      return stateRef.current[entityId];
    },
    [],
  );

  const getValues = useCallback((): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const [entityId, entityState] of Object.entries(stateRef.current)) {
      values[entityId] = entityState.value;
    }
    return values;
  }, []);

  const resetValues = useCallback(() => {
    setState((prev) => {
      const nextState: FormState = {};
      for (const [entityId, entityState] of Object.entries(prev)) {
        const entry = entityRegistry.current[entityState.name];
        if (!entry) {
          nextState[entityId] = entityState;
          continue;
        }
        nextState[entityId] = {
          ...entityState,
          value: resolveEntityDefaultValue(
            entry.definition.defaultValue,
            entityState.attributes,
            entry.definition.attributes,
          ),
          error: null,
        };
      }
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const registerEntity = useCallback(
    <
      TName extends string,
      TAttributes extends Record<string, AnyAttributeEntry>,
      TValue,
    >(
      entityId: string,
      entity: Entity<TName, TAttributes, TValue>,
    ) => {
      setState((prev) => {
        if (prev[entityId]) return prev;

        const attributeStates: Record<string, AttributeStateData> = {};
        (
          Object.entries(entity.attributes) as [string, AnyAttributeEntry][]
        ).forEach(([attrName, attrEntry]) => {
          const attr = attrEntry.definition;
          attributeStates[attrName] = {
            name: attr.name,
            value: attr.defaultValue,
            error: null,
          };
        });

        const next = {
          ...prev,
          [entityId]: {
            name: entity.name,
            value: resolveEntityDefaultValue(
              entity.defaultValue,
              attributeStates,
              entity.attributes,
            ),
            error: null,
            attributes: attributeStates,
          },
        };
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  const deregisterEntity = useCallback((entityId: string) => {
    setState((prev) => {
      if (!prev[entityId]) return prev;
      const { [entityId]: removed, ...rest } = prev;

      let removedErrors = removed.error ? 1 : 0;
      for (const attr of Object.values(removed.attributes)) {
        if (attr.error) removedErrors++;
      }
      if (removedErrors > 0) {
        errorCountRef.current = Math.max(
          0,
          errorCountRef.current - removedErrors,
        );
        setIsValid(errorCountRef.current === 0);
      }

      stateRef.current = rest;
      return rest;
    });
  }, []);

  const setEntityValue = useCallback((entityId: string, value: unknown) => {
    setState((prev) => {
      const entity = prev[entityId];
      if (!entity) return prev;
      const next = { ...prev, [entityId]: { ...entity, value } };
      stateRef.current = next;
      return next;
    });
  }, []);

  const setEntityError = useCallback(
    (entityId: string, error: string | null) => {
      setState((prev) => {
        const entity = prev[entityId];
        if (!entity) return prev;
        const hadError = !!entity.error;
        const hasError = !!error;
        if (hadError !== hasError) updateErrorCount(hasError ? 1 : -1);
        const next = { ...prev, [entityId]: { ...entity, error } };
        stateRef.current = next;
        return next;
      });
    },
    [updateErrorCount],
  );

  const setAttributeValue = useCallback(
    (entityId: string, attributeName: string, value: unknown) => {
      setState((prev) => {
        const entity = prev[entityId];
        if (!entity) return prev;
        const attr = entity.attributes[attributeName];
        if (!attr) return prev;

        const updatedEntity: EntityStateData = {
          ...entity,
          attributes: {
            ...entity.attributes,
            [attributeName]: { ...attr, value },
          },
        };

        const entityEntry = entityRegistry.current[entity.name];
        if (
          entityEntry &&
          entityEntry.definition.defaultValue.type === "attribute" &&
          entityEntry.definition.defaultValue.value === attributeName
        ) {
          updatedEntity.value = value;
        }

        const next = { ...prev, [entityId]: updatedEntity };
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  const setAttributeError = useCallback(
    (entityId: string, attributeName: string, error: string | null) => {
      setState((prev) => {
        const entity = prev[entityId];
        if (!entity) return prev;
        const attr = entity.attributes[attributeName];
        if (!attr) return prev;
        const hadError = !!attr.error;
        const hasError = !!error;
        if (hadError !== hasError) updateErrorCount(hasError ? 1 : -1);
        const next = {
          ...prev,
          [entityId]: {
            ...entity,
            attributes: {
              ...entity.attributes,
              [attributeName]: { ...attr, error },
            },
          },
        };
        stateRef.current = next;
        return next;
      });
    },
    [updateErrorCount],
  );

  const validateEntity = useCallback(
    async (entityId: string): Promise<void> => {
      const currentState = stateRef.current[entityId];
      if (!currentState) return;

      const entityEntry = entityRegistry.current[currentState.name];
      if (!entityEntry) return;

      const attributeValues: Record<string, unknown> = {};
      for (const [name, attrState] of Object.entries(currentState.attributes)) {
        attributeValues[name] = attrState.value;
      }

      try {
        await entityEntry.definition.validate(
          currentState.value,
          attributeValues as AttributeValues<
            typeof entityEntry.definition.attributes
          >,
        );
        setEntityError(entityId, null);
      } catch (error) {
        setEntityError(entityId, errorSerializerRef.current(error));
      }
    },
    [setEntityError],
  );

  const validateAttribute = useCallback(
    async (entityId: string, attributeName: string): Promise<void> => {
      const currentState = stateRef.current[entityId];
      if (!currentState) return;

      const entityEntry = entityRegistry.current[currentState.name];
      if (!entityEntry) return;

      const attributeEntry = (
        Object.values(entityEntry.definition.attributes) as AnyAttributeEntry[]
      ).find((e) => e.definition.name === attributeName);

      if (!attributeEntry) return;

      const currentValue = currentState.attributes[attributeName]?.value;

      try {
        await attributeEntry.definition.validate(currentValue);
        setAttributeError(entityId, attributeName, null);
      } catch (error) {
        setAttributeError(
          entityId,
          attributeName,
          errorSerializerRef.current(error),
        );
      }
    },
    [setAttributeError],
  );

  const validateAll = useCallback(async (): Promise<boolean> => {
    const currentState = stateRef.current;

    const results = await Promise.all(
      Object.keys(currentState).flatMap((entityId) => {
        const entityState = currentState[entityId];
        const entityEntry = entityRegistry.current[entityState.name];

        const entityPromise = entityEntry
          ? entityEntry.definition
              .validate(
                entityState.value,
                Object.fromEntries(
                  Object.entries(entityState.attributes).map(([k, v]) => [
                    k,
                    v.value,
                  ]),
                ) as AttributeValues<typeof entityEntry.definition.attributes>,
              )
              .then(() => null)
              .catch((e: unknown) => ({
                type: "entity" as const,
                entityId,
                error: errorSerializerRef.current(e),
              }))
          : Promise.resolve(null);

        const attrPromises = Object.keys(entityState.attributes).map(
          (attrName) => {
            const attrEntry = entityEntry
              ? (
                  Object.values(
                    entityEntry.definition.attributes,
                  ) as AnyAttributeEntry[]
                ).find((e) => e.definition.name === attrName)
              : undefined;

            if (!attrEntry) return Promise.resolve(null);

            return attrEntry.definition
              .validate(entityState.attributes[attrName].value)
              .then(() => null)
              .catch((e: unknown) => ({
                type: "attribute" as const,
                entityId,
                attrName,
                error: errorSerializerRef.current(e),
              }));
          },
        );

        return [entityPromise, ...attrPromises];
      }),
    );

    let hasErrors = false;
    for (const result of results) {
      if (!result) continue;
      hasErrors = true;
      if (result.type === "entity") {
        setEntityError(result.entityId, result.error);
      } else {
        setAttributeError(result.entityId, result.attrName, result.error);
      }
    }

    return !hasErrors;
  }, [setEntityError, setAttributeError]);

  const contextValue = useMemo(
    () => ({
      state,
      entityRegistry,
      attributeRegistry,
      registerEntity,
      deregisterEntity,
      setEntityValue,
      setEntityError,
      validateEntity,
      setAttributeValue,
      setAttributeError,
      validateAttribute,
      getEntityState,
      validateAll,
      getValues,
      resetValues,
      isValid,
      errorSerializer,
    }),
    [
      state,
      registerEntity,
      deregisterEntity,
      setEntityValue,
      setEntityError,
      validateEntity,
      setAttributeValue,
      setAttributeError,
      validateAttribute,
      getEntityState,
      validateAll,
      getValues,
      resetValues,
      isValid,
      errorSerializer,
    ],
  );

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
}
