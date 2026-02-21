import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type ErrorSerializer = (error: unknown) => string;

const defaultErrorSerializer: ErrorSerializer = (error) => {
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

interface AttributeStateData {
  name: string;
  value: unknown;
  error: string | null;
}

interface EntityStateData {
  name: string;
  value: unknown;
  error: string | null;
  attributes: Record<string, AttributeStateData>;
}

interface FormState {
  [entityId: string]: EntityStateData;
}

function resolveEntityDefaultValue<
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

interface FormContextValue {
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

const FormContext = createContext<FormContextValue | null>(null);
const EntityContext = createContext<{ entityId: string } | null>(null);
const AttributeContext = createContext<{ attributeName: string } | null>(null);

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

interface AttributeWrapperProps {
  entityId: string;
  defaultAttributeState?: AttributeStateData;
}

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

interface EntityWrapperProps {
  entityId: string;
  defaultEntityState?: EntityStateData;
  disabled?: boolean;
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
