import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ZodError } from 'zod';

export interface EntityRegistryEntry {
    definition: Entity<any, any, any>;
    wrapper: React.ComponentType<EntityWrapperProps>;
}

export interface AttributeRegistryEntry {
    definition: Attribute<any, any>;
    wrapper: React.ComponentType<AttributeWrapperProps>;
}

export const ENTITY_REGISTRY: Record<string, EntityRegistryEntry> = {}
export const ATTRIBUTE_REGISTRY: Record<string, AttributeRegistryEntry> = {}

// Utilities & Error Handling
function getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof ZodError) {
        return error.issues.map(issue => issue.message).join(', ');
    }
    if (error instanceof Error) return error.message;
    return "An unexpected validation error occurred";
}

// Types
export type InferAttributeValue<A> = A extends Attribute<any, infer V> ? V : never;

export type AttributeValues<T extends Record<string, Attribute<any, any>>> = {
    [K in keyof T]: InferAttributeValue<T[K]>;
};

export interface Attribute<TName extends string, TValue> {
    name: TName;
    defaultValue: TValue;
    validate: (value: TValue) => (TValue | null | undefined) | Promise<TValue | null | undefined>;
    component: React.ComponentType<AttributeComponentProps<TValue>>;
}

export interface Entity<
    TName extends string,
    TAttributes extends Record<string, Attribute<any, any>>,
    TValue
> {
    name: TName;
    icon: React.ReactNode;
    attributes: TAttributes;
    defaultValue: TValue;
    validate: (
        value: TValue,
        attributes: AttributeValues<TAttributes>
    ) => (TValue | null | undefined) | Promise<TValue | null | undefined>;
    component: React.ComponentType<EntityComponentProps<TAttributes, TValue>>;
}

export interface AttributeComponentProps<TValue = unknown> {
    value: TValue;
    setValue: (value: TValue) => void;
    validateValue: () => Promise<void>;
    error: string | null;
    resetError: () => void;
    entity: EntityStateData;
}

export interface EntityComponentProps<TAttributes extends Record<string, Attribute<string, any>>, TValue = unknown> {
    attributes: AttributeValues<TAttributes>;
    value: TValue;
    setValue: (value: TValue) => void;
    validateValue: () => Promise<void>;
    error: string | null;
    resetError: () => void;
}

// State Definitions
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

// Contexts
interface FormContextValue {
    state: FormState;

    registerEntity: <TName extends string, TAttributes extends Record<string, Attribute<string, any>>, TValue>(
        entityId: string,
        entity: Entity<TName, TAttributes, TValue>
    ) => void;
    deregisterEntity: (entityId: string) => void;

    // Entity Methods
    updateEntityValue: (entityId: string, value: unknown) => void;
    setEntityError: (entityId: string, error: string | null) => void;
    validateEntity: (entityId: string) => Promise<void>;

    // Attribute Methods
    updateAttributeValue: (entityId: string, attributeName: string, value: unknown) => void;
    setAttributeError: (entityId: string, attributeName: string, error: string | null) => void;
    validateAttribute: (entityId: string, attributeName: string) => Promise<void>;

    getEntityState: (entityId: string) => EntityStateData | undefined;
}

const FormContext = createContext<FormContextValue | null>(null);
const EntityContext = createContext<{ entityId: string } | null>(null);
const AttributeContext = createContext<{ attributeName: string } | null>(null);

// Hooks
export function useFormContext() {
    const context = useContext(FormContext);
    if (!context) throw new Error('useFormContext must be used within a FormProvider');
    return context;
}

export function useEntityContext() {
    return useContext(EntityContext);
}

// Providers
export function FormProvider({ children, initialState = {} }: { children: React.ReactNode; initialState?: FormState }) {
    const [state, setState] = useState<FormState>(initialState);

    const getEntityState = useCallback((entityId: string) => {
        return state[entityId];
    }, [state]);

    const registerEntity = useCallback(<TName extends string, TAttributes extends Record<string, Attribute<string, any>>, TValue>(
        entityId: string,
        entity: Entity<TName, TAttributes, TValue>
    ) => {
        setState(prev => {
            if (prev[entityId]) return prev;

            const attributeStates: Record<string, AttributeStateData> = {};

            Object.values(entity.attributes).forEach(attr => {
                attributeStates[attr.name] = {
                    name: attr.name,
                    value: attr.defaultValue,
                    error: null,
                };
            });

            return {
                ...prev,
                [entityId]: {
                    name: entity.name,
                    value: entity.defaultValue,
                    error: null,
                    attributes: attributeStates,
                },
            };
        });
    }, []);

    const deregisterEntity = useCallback((entityId: string) => {
        setState(prev => {
            const newState = { ...prev };
            delete newState[entityId];
            return newState;
        });
    }, []);

    const updateEntityValue = useCallback((entityId: string, value: unknown) => {
        setState(prev => ({
            ...prev,
            [entityId]: {
                ...prev[entityId]!,
                value,
            },
        }));
    }, []);

    const setEntityError = useCallback((entityId: string, error: string | null) => {
        setState(prev => ({
            ...prev,
            [entityId]: { ...prev[entityId]!, error },
        }));
    }, []);

    const validateEntity = useCallback(async (entityId: string) => {
        let currentValue: unknown;
        let entityName: unknown;
        let attributeValues: Record<string, unknown> = {};

        await setState(prev => {
            currentValue = prev[entityId]?.value;
            entityName = prev[entityId]?.name;

            for (const [name, attrState] of Object.entries(prev[entityId]?.attributes)) {
                attributeValues[name] = attrState.value;
            }

            return prev;
        });

        const entityDef = ENTITY_REGISTRY[entityName as string].definition;
        if (!entityDef) return;

        try {
            await entityDef.validate(
                currentValue,
                attributeValues as AttributeValues<typeof entityDef.attributes>
            );
            setEntityError(entityId, null);
        } catch (error) {
            setEntityError(entityId, getErrorMessage(error));
        }
    }, [setEntityError]);

    const updateAttributeValue = useCallback((entityId: string, attributeName: string, value: unknown) => {
        setState(prev => ({
            ...prev,
            [entityId]: {
                ...prev[entityId]!,
                attributes: {
                    ...prev[entityId]?.attributes,
                    [attributeName]: {
                        ...prev[entityId]?.attributes?.[attributeName]!,
                        value,
                    },
                },
            },
        }));
    }, []);

    const setAttributeError = useCallback((entityId: string, attributeName: string, error: string | null) => {
        setState(prev => ({
            ...prev,
            [entityId]: {
                ...prev[entityId]!,
                attributes: {
                    ...prev[entityId]?.attributes,
                    [attributeName]: {
                        ...prev[entityId]?.attributes?.[attributeName]!,
                        error,
                    },
                },
            },
        }));
    }, []);

    const validateAttribute = useCallback(async (entityId: string, attributeName: string) => {
        let currentValue: unknown;
        let entityName: string | undefined;

        await setState(prev => {
            currentValue = prev[entityId]?.attributes?.[attributeName]?.value;
            entityName = prev[entityId]?.name;
            return prev;
        });

        const entityDef = ENTITY_REGISTRY[entityName!].definition;
        const attributeDef = entityDef?.attributes[attributeName];

        if (!attributeDef) return;

        try {
            await attributeDef.validate(currentValue);
            setAttributeError(entityId, attributeName, null);
        } catch (error) {
            setAttributeError(entityId, attributeName, getErrorMessage(error));
        }
    }, [setAttributeError]);

    const contextValue = useMemo(() => ({
        state,
        registerEntity,
        deregisterEntity,
        updateEntityValue,
        setEntityError,
        validateEntity,
        updateAttributeValue,
        setAttributeError,
        validateAttribute,
        getEntityState
    }), [state, registerEntity, updateEntityValue, setEntityError, validateEntity, updateAttributeValue, setAttributeError, validateAttribute, getEntityState]);

    return (
        <FormContext.Provider value={contextValue}>
            {children}
        </FormContext.Provider>
    );
}

// Factory Functions
interface AttributeWrapperProps {
    entityId: string;
    defaultAttributeState?: AttributeStateData;
}

export function makeAttribute<const TName extends string, TValue>(
    options: Attribute<TName, TValue>
): Attribute<TName, TValue> {
    function AttributeWrapper(props: AttributeWrapperProps) {
        const formContext = useFormContext();
        const entityContext = useEntityContext();
        const entityId = props.entityId ?? entityContext?.entityId;

        const setValue = useCallback((value: TValue) => {
            if (entityId) {
                formContext.updateAttributeValue(entityId, options.name, value);
            }
        }, [formContext, entityId]);

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
        const attributeState = entityState?.attributes[options.name] ?? props.defaultAttributeState;

        if (!attributeState) return null;

        return (
            <AttributeContext.Provider value={{ attributeName: options.name }}>
                <options.component
                    value={attributeState.value as TValue}
                    setValue={setValue}
                    validateValue={validateValue}
                    error={attributeState.error}
                    resetError={resetError}
                    entity={entityState!}
                />
            </AttributeContext.Provider>
        );
    }

    ATTRIBUTE_REGISTRY[options.name] = {
        definition: options,
        wrapper: AttributeWrapper
    };

    return options;
}

interface EntityWrapperProps {
    entityId: string;
    defaultEntityState?: EntityStateData;
}

export function makeEntity<
    const TName extends string,
    const TAttributes extends Record<string, Attribute<any, any>>,
    TValue
>(
    options: Entity<TName, TAttributes, TValue>
): Entity<TName, TAttributes, TValue> {
    function EntityWrapper({ entityId, defaultEntityState }: EntityWrapperProps) {
        const formContext = useFormContext();

        useEffect(() => {
            formContext.registerEntity(entityId, options);
        }, [entityId]);

        const entityState = formContext.getEntityState(entityId) ?? defaultEntityState;

        if (!entityState) return null;

        const attributesProp = {} as AttributeValues<TAttributes>;
        for (const key in options.attributes) {
            const attr = options.attributes[key];
            const state = entityState.attributes[attr.name];
            attributesProp[key] = state?.value ?? attr.defaultValue;
        }

        const setValue = (newValue: TValue) => {
            formContext.updateEntityValue(entityId, newValue);
        };

        const validateValue = async () => {
            await formContext.validateEntity(entityId);
        };

        const resetError = () => {
            formContext.setEntityError(entityId, null);
        };

        return (
            <EntityContext.Provider value={{ entityId }}>
                <options.component
                    attributes={attributesProp}
                    value={(entityState.value as TValue) ?? options.defaultValue}
                    setValue={setValue}
                    validateValue={validateValue}
                    error={entityState.error}
                    resetError={resetError}
                />
            </EntityContext.Provider>
        );
    }

    ENTITY_REGISTRY[options.name] = {
        definition: options,
        wrapper: EntityWrapper
    };

    return options;
}