import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ZodError } from "zod";

export interface EntityRegistryEntry<
  TName extends string,
  TAttributes extends Record<string, AttributeRegistryEntry<string, any>>,
  TValue,
> {
  readonly definition: Entity<TName, TAttributes, TValue>;
  readonly wrapper: React.ComponentType<EntityWrapperProps>;
}

export interface AttributeRegistryEntry<TName extends string, TValue> {
  readonly definition: Attribute<TName, TValue>;
  readonly wrapper: React.ComponentType<AttributeWrapperProps>;
}

export type AnyAttributeEntry = AttributeRegistryEntry<string, any>;

export type AnyEntityEntry = EntityRegistryEntry<string, any, any>;

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join(", ");
  }
  if (error instanceof Error) return error.message;
  return "An unexpected validation error occurred";
}

export type AttributeValues<T extends Record<string, AnyAttributeEntry>> = {
  [K in keyof T]: T[K]["definition"]["defaultValue"];
};

export type EntityDefaultValue<
  TValue,
  TAttributes extends Record<string, AnyAttributeEntry>,
> =
  | { type: "literal"; value: TValue }
  | { type: "attribute"; value: keyof TAttributes & string };

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
  if (attrState) {
    return attrState.value as TValue;
  }
  const attrEntry = attributeDefinitions[attrKey];
  if (attrEntry) {
    return attrEntry.definition.defaultValue as TValue;
  }
  return undefined as unknown as TValue;
}

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
}: {
  children: React.ReactNode;
  initialState?: FormState;
  entities?: AnyEntityEntry[];
}) {
  const [state, setState] = useState<FormState>(initialState);

  const stateRef = useRef<FormState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const entityRegistry = useRef<Record<string, AnyEntityEntry>>({});
  const attributeRegistry = useRef<Record<string, AnyAttributeEntry>>({});

  useEffect(() => {
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

  const isValid = useMemo(() => {
    for (const entityState of Object.values(state)) {
      if (entityState.error) return false;
      for (const attrState of Object.values(entityState.attributes)) {
        if (attrState.error) return false;
      }
    }
    return true;
  }, [state]);

  const getEntityState = useCallback(
    (entityId: string) => {
      return state[entityId];
    },
    [state],
  );

  const getValues = useCallback((): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const [entityId, entityState] of Object.entries(state)) {
      values[entityId] = entityState.value;
    }
    return values;
  }, [state]);

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

        return {
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
      });
    },
    [],
  );

  const deregisterEntity = useCallback((entityId: string) => {
    setState((prev) => {
      if (!prev[entityId]) return prev;
      const { [entityId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const setEntityValue = useCallback((entityId: string, value: unknown) => {
    setState((prev) => {
      const entity = prev[entityId];
      if (!entity) return prev;
      return { ...prev, [entityId]: { ...entity, value } };
    });
  }, []);

  const setEntityError = useCallback(
    (entityId: string, error: string | null) => {
      setState((prev) => {
        const entity = prev[entityId];
        if (!entity) return prev;
        return { ...prev, [entityId]: { ...entity, error } };
      });
    },
    [],
  );

  const validateEntity = useCallback(
    async (entityId: string) => {
      const currentState = stateRef.current[entityId];
      if (!currentState) return;

      const currentValue = currentState.value;
      const entityName = currentState.name;

      const attributeValues: Record<string, unknown> = {};
      for (const [name, attrState] of Object.entries(currentState.attributes)) {
        attributeValues[name] = attrState.value;
      }

      const entityEntry = entityRegistry.current[entityName];
      if (!entityEntry) return;

      try {
        await entityEntry.definition.validate(
          currentValue,
          attributeValues as AttributeValues<
            typeof entityEntry.definition.attributes
          >,
        );
        setEntityError(entityId, null);
      } catch (error) {
        setEntityError(entityId, getErrorMessage(error));
      }
    },
    [setEntityError],
  );

  const setAttributeValue = useCallback(
    (entityId: string, attributeName: string, value: unknown) => {
      setState((prev) => {
        const entity = prev[entityId];
        if (!entity) return prev;
        const attr = entity.attributes[attributeName];
        if (!attr) return prev;

        const updatedEntity = {
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

        return {
          ...prev,
          [entityId]: updatedEntity,
        };
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
        return {
          ...prev,
          [entityId]: {
            ...entity,
            attributes: {
              ...entity.attributes,
              [attributeName]: { ...attr, error },
            },
          },
        };
      });
    },
    [],
  );

  const validateAttribute = useCallback(
    async (entityId: string, attributeName: string) => {
      const currentState = stateRef.current[entityId];
      if (!currentState) return;

      const currentValue = currentState.attributes[attributeName]?.value;
      const entityName = currentState.name;

      const entityEntry = entityRegistry.current[entityName];
      if (!entityEntry) return;

      const attributeEntry = (
        Object.values(entityEntry.definition.attributes) as AnyAttributeEntry[]
      ).find((attrEntry) => attrEntry.definition.name === attributeName);

      if (!attributeEntry) return;

      try {
        await attributeEntry.definition.validate(currentValue);
        setAttributeError(entityId, attributeName, null);
      } catch (error) {
        setAttributeError(entityId, attributeName, getErrorMessage(error));
      }
    },
    [setAttributeError],
  );

  const validateAll = useCallback(async (): Promise<boolean> => {
    const currentState = stateRef.current;
    const entityIds = Object.keys(currentState);

    const promises: Promise<void>[] = [];

    for (const entityId of entityIds) {
      promises.push(validateEntity(entityId));

      const entityState = currentState[entityId];
      if (entityState) {
        for (const attrName of Object.keys(entityState.attributes)) {
          promises.push(validateAttribute(entityId, attrName));
        }
      }
    }

    await Promise.all(promises);

    const finalState = stateRef.current;
    for (const entityState of Object.values(finalState)) {
      if (entityState.error) return false;
      for (const attrState of Object.values(entityState.attributes)) {
        if (attrState.error) return false;
      }
    }
    return true;
  }, [validateEntity, validateAttribute]);

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
  function AttributeWrapper(props: AttributeWrapperProps) {
    const formContext = useFormContext();
    const entityContext = useEntityContext();
    const entityId = props.entityId ?? entityContext?.entityId;

    const setValue = useCallback(
      (value: TValue) => {
        if (entityId) {
          formContext.setAttributeValue(entityId, options.name, value);
        }
      },
      [formContext, entityId],
    );

    const validateValue = useCallback(async () => {
      if (entityId) {
        await formContext.validateAttribute(entityId, options.name);
      }
    }, [formContext, entityId]);

    const resetError = useCallback(() => {
      if (entityId) {
        formContext.setAttributeError(entityId, options.name, null);
      }
    }, [formContext, entityId]);

    if (!entityId) return null;

    const entityState = formContext.getEntityState(entityId);
    const attributeState =
      entityState?.attributes[options.name] ?? props.defaultAttributeState;

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

  const registryEntry: AttributeRegistryEntry<TName, TValue> = {
    definition: options,
    wrapper: AttributeWrapper,
  };

  return registryEntry;
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
    }, [entityId]);

    const entityState =
      formContext.getEntityState(entityId) ?? defaultEntityState;

    if (!entityState) return null;

    const attributesProp = {} as AttributeValues<TAttributes>;
    for (const key in options.attributes) {
      const attrEntry = options.attributes[key];
      const attr = attrEntry.definition;
      const state = entityState.attributes[attr.name];
      (attributesProp as Record<string, unknown>)[key] =
        state?.value ?? attr.defaultValue;
    }

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

    return (
      <EntityContext.Provider value={{ entityId }}>
        <options.component
          attributes={attributesProp}
          value={
            (entityState.value as TValue) ??
            resolveEntityDefaultValue(
              options.defaultValue,
              entityState.attributes,
              options.attributes,
            )
          }
          setValue={setValue}
          validateValue={validateValue}
          error={entityState.error}
          resetError={resetError}
          disabled={disabled}
        />
      </EntityContext.Provider>
    );
  }

  const registryEntry: EntityRegistryEntry<TName, TAttributes, TValue> = {
    definition: options,
    wrapper: EntityWrapper,
  };

  return registryEntry;
}
