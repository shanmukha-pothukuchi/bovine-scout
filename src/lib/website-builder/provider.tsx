import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BuilderContext } from "./context";
import {
  type AnyAttributeEntry,
  type AnyEntityEntry,
  type AttributeStateData,
  type BuilderState,
  type Entity,
  type EntityStateData,
  type ErrorSerializer,
  type GridArea,
  defaultErrorSerializer,
} from "./types";

export function BuilderProvider({
  children,
  initialState = {},
  entities = [],
  errorSerializer = defaultErrorSerializer,
}: {
  children: React.ReactNode;
  initialState?: BuilderState;
  entities?: AnyEntityEntry[];
  errorSerializer?: ErrorSerializer;
}) {
  const [state, setState] = useState<BuilderState>(initialState);

  const stateRef = useRef<BuilderState>(state);

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

  const getAttributeValues = useCallback(
    (entityId: string): Record<string, unknown> | undefined => {
      const entityState = stateRef.current[entityId];
      if (!entityState) return undefined;
      const values: Record<string, unknown> = {};
      for (const [name, attrState] of Object.entries(entityState.attributes)) {
        values[name] = attrState.value;
      }
      return values;
    },
    [],
  );

  const registerEntity = useCallback(
    <
      TName extends string,
      TAttributes extends Record<string, AnyAttributeEntry>,
    >(
      entityId: string,
      entity: Entity<TName, TAttributes>,
      region: GridArea | null = null,
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
            region: region ?? {
              start: { top: 1, left: 1 },
              end: { top: 1, left: 1 },
            },
            attributes: attributeStates,
          },
        };
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  const setEntityRegion = useCallback((entityId: string, region: GridArea) => {
    setState((prev) => {
      const entity = prev[entityId];
      if (!entity) return prev;
      const next = { ...prev, [entityId]: { ...entity, region } };
      stateRef.current = next;
      return next;
    });
  }, []);

  const deregisterEntity = useCallback((entityId: string) => {
    setState((prev) => {
      if (!prev[entityId]) return prev;
      const { [entityId]: removed, ...rest } = prev;

      let removedErrors = 0;
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

  const setAttributeValue = useCallback(
    (entityId: string, attributeKey: string, value: unknown) => {
      setState((prev) => {
        const entity = prev[entityId];
        if (!entity) return prev;
        const attr = entity.attributes[attributeKey];
        if (!attr) return prev;

        const next = {
          ...prev,
          [entityId]: {
            ...entity,
            attributes: {
              ...entity.attributes,
              [attributeKey]: { ...attr, value },
            },
          },
        };
        stateRef.current = next;
        return next;
      });
    },
    [],
  );

  const setAttributeError = useCallback(
    (entityId: string, attributeKey: string, error: string | null) => {
      setState((prev) => {
        const entity = prev[entityId];
        if (!entity) return prev;
        const attr = entity.attributes[attributeKey];
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
              [attributeKey]: { ...attr, error },
            },
          },
        };
        stateRef.current = next;
        return next;
      });
    },
    [updateErrorCount],
  );

  const validateAttribute = useCallback(
    async (entityId: string, attributeKey: string): Promise<void> => {
      const currentState = stateRef.current[entityId];
      if (!currentState) return;

      const entityEntry = entityRegistry.current[currentState.name];
      if (!entityEntry) return;

      const attributeEntry = (
        entityEntry.definition.attributes as Record<string, AnyAttributeEntry>
      )[attributeKey];

      if (!attributeEntry) return;

      const currentValue = currentState.attributes[attributeKey]?.value;

      try {
        await attributeEntry.definition.validate(currentValue);
        setAttributeError(entityId, attributeKey, null);
      } catch (error) {
        setAttributeError(
          entityId,
          attributeKey,
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

        return Object.keys(entityState.attributes).map((attrName) => {
          const attrEntry = entityEntry
            ? (
                entityEntry.definition.attributes as Record<
                  string,
                  AnyAttributeEntry
                >
              )[attrName]
            : undefined;

          if (!attrEntry) return Promise.resolve(null);

          return attrEntry.definition
            .validate(entityState.attributes[attrName].value)
            .then(() => null)
            .catch((e: unknown) => ({
              entityId,
              attrName,
              error: errorSerializerRef.current(e),
            }));
        });
      }),
    );

    let hasErrors = false;
    for (const result of results) {
      if (!result) continue;
      hasErrors = true;
      setAttributeError(result.entityId, result.attrName, result.error);
    }

    return !hasErrors;
  }, [setAttributeError]);

  const contextValue = useMemo(
    () => ({
      state,
      entityRegistry,
      attributeRegistry,
      registerEntity,
      deregisterEntity,
      setEntityRegion,
      setAttributeValue,
      setAttributeError,
      validateAttribute,
      getEntityState,
      validateAll,
      getAttributeValues,
      isValid,
    }),
    [
      state,
      registerEntity,
      deregisterEntity,
      setEntityRegion,
      setAttributeValue,
      setAttributeError,
      validateAttribute,
      getEntityState,
      validateAll,
      getAttributeValues,
      isValid,
    ],
  );

  return (
    <BuilderContext.Provider value={contextValue}>
      {children}
    </BuilderContext.Provider>
  );
}
