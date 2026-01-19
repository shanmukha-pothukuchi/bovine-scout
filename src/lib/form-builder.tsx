import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import z, { ZodError } from 'zod';

// Utilities & Error Handling
function getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error instanceof ZodError) {
        return z.prettifyError(error);
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
}

export interface Entity<
    TName extends string,
    TAttributes extends Record<string, Attribute<any, any>>,
    TValue
> {
    name: TName;
    attributes: TAttributes;
    defaultValue: TValue;
    validate: (
        value: TValue,
        attributes: AttributeValues<TAttributes>
    ) => (TValue | null | undefined) | Promise<TValue | null | undefined>;
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
    [rowId: string]: {
        [entityId: string]: EntityStateData;
    };
}

// Contexts
interface FormContextValue {
    state: FormState;
    registerEntity: <TName extends string, TAttributes extends Record<string, Attribute<string, any>>, TValue>(
        rowId: string,
        entityId: string,
        entity: Entity<TName, TAttributes, TValue>
    ) => void;

    // Entity Methods
    updateEntityValue: (rowId: string, entityId: string, value: unknown) => void;
    setEntityError: (rowId: string, entityId: string, error: string | null) => void;
    validateEntity: (rowId: string, entityId: string) => Promise<void>;

    // Attribute Methods
    updateAttributeValue: (rowId: string, entityId: string, attributeName: string, value: unknown) => void;
    setAttributeError: (rowId: string, entityId: string, attributeName: string, error: string | null) => void;
    validateAttribute: (rowId: string, entityId: string, attributeName: string) => Promise<void>;

    getEntityState: (rowId: string, entityId: string) => EntityStateData | undefined;
}

const FormContext = createContext<FormContextValue | null>(null);
const RowContext = createContext<{ rowId: string } | null>(null);
const EntityContext = createContext<{ entityId: string; entityName: string } | null>(null);
const AttributeContext = createContext<{ attributeName: string } | null>(null);

// Hooks
export function useFormContext() {
    const context = useContext(FormContext);
    if (!context) throw new Error('useFormContext must be used within a FormProvider');
    return context;
}

export function useRowContext() {
    return useContext(RowContext);
}

export function useEntityContext() {
    return useContext(EntityContext);
}

// Providers
export function FormProvider({ children, initialState = {} }: { children: React.ReactNode; initialState?: FormState }) {
    const [state, setState] = useState<FormState>(initialState);

    const schemasRef = useRef<Record<string, Record<string, Entity<any, any, any>>>>({});

    const getEntityState = useCallback((rowId: string, entityId: string) => {
        return state[rowId]?.[entityId];
    }, [state]);

    const registerEntity = useCallback(<TName extends string, TAttributes extends Record<string, Attribute<string, any>>, TValue>(
        rowId: string,
        entityId: string,
        entity: Entity<TName, TAttributes, TValue>
    ) => {
        if (!schemasRef.current[rowId]) {
            schemasRef.current[rowId] = {};
        }
        schemasRef.current[rowId][entityId] = entity;

        setState(prev => {
            if (prev[rowId]?.[entityId]) return prev;

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
                [rowId]: {
                    ...prev[rowId],
                    [entityId]: {
                        name: entity.name,
                        value: entity.defaultValue,
                        error: null,
                        attributes: attributeStates,
                    },
                },
            };
        });
    }, []);

    const updateEntityValue = useCallback((rowId: string, entityId: string, value: unknown) => {
        setState(prev => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [entityId]: {
                    ...prev[rowId]?.[entityId]!,
                    value,
                },
            },
        }));
    }, []);

    const setEntityError = useCallback((rowId: string, entityId: string, error: string | null) => {
        setState(prev => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [entityId]: { ...prev[rowId]?.[entityId]!, error },
            },
        }));
    }, []);

    const validateEntity = useCallback(async (rowId: string, entityId: string) => {
        let currentValue: unknown;
        let attributeValues: Record<string, unknown> = {};

        await setState(prev => {
            const entityState = prev[rowId]?.[entityId];

            if (entityState) {
                currentValue = entityState.value;

                for (const [name, attrState] of Object.entries(entityState.attributes)) {
                    attributeValues[name] = attrState.value;
                }
            }

            return prev;
        });

        const entityDef = schemasRef.current[rowId]?.[entityId];
        if (!entityDef) return;

        try {
            await entityDef.validate(
                currentValue,
                attributeValues as AttributeValues<typeof entityDef.attributes>
            );
            setEntityError(rowId, entityId, null);
        } catch (error) {
            setEntityError(rowId, entityId, getErrorMessage(error));
        }
    }, [setEntityError]);

    const updateAttributeValue = useCallback((rowId: string, entityId: string, attributeName: string, value: unknown) => {
        setState(prev => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [entityId]: {
                    ...prev[rowId]?.[entityId]!,
                    attributes: {
                        ...prev[rowId]?.[entityId]?.attributes,
                        [attributeName]: {
                            ...prev[rowId]?.[entityId]?.attributes?.[attributeName]!,
                            value,
                        },
                    },
                },
            },
        }));
    }, []);

    const setAttributeError = useCallback((rowId: string, entityId: string, attributeName: string, error: string | null) => {
        setState(prev => ({
            ...prev,
            [rowId]: {
                ...prev[rowId],
                [entityId]: {
                    ...prev[rowId]?.[entityId]!,
                    attributes: {
                        ...prev[rowId]?.[entityId]?.attributes,
                        [attributeName]: {
                            ...prev[rowId]?.[entityId]?.attributes?.[attributeName]!,
                            error,
                        },
                    },
                },
            },
        }));
    }, []);

    const validateAttribute = useCallback(async (rowId: string, entityId: string, attributeName: string) => {
        let currentValue: unknown;

        await setState(prev => {
            currentValue = prev[rowId]?.[entityId]?.attributes?.[attributeName]?.value;
            return prev;
        });

        const entityDef = schemasRef.current[rowId]?.[entityId];
        const attributeDef = entityDef?.attributes[attributeName];

        if (!attributeDef) return;

        try {
            await attributeDef.validate(currentValue);
            setAttributeError(rowId, entityId, attributeName, null);
        } catch (error) {
            setAttributeError(rowId, entityId, attributeName, getErrorMessage(error));
        }
    }, [setAttributeError]);

    const contextValue = useMemo(() => ({
        state,
        registerEntity,
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

export function RowProvider({ rowId, children }: { rowId: string; children: React.ReactNode }) {
    return <RowContext.Provider value={{ rowId }}>{children}</RowContext.Provider>;
}

export function EntityProvider({ entityId, entityName, children }: { entityId: string; entityName: string; children: React.ReactNode }) {
    return <EntityContext.Provider value={{ entityId, entityName }}>{children}</EntityContext.Provider>;
}

// Factory Functions
export function createAttribute<const TName extends string, TValue>(
    options: Attribute<TName, TValue>
): Attribute<TName, TValue> {
    return options;
}

export function createEntity<
    const TName extends string,
    const TAttributes extends Record<string, Attribute<any, any>>,
    TValue
>(options: Entity<TName, TAttributes, TValue>): Entity<TName, TAttributes, TValue> {
    return options;
}

// Component Wrappers
export function createAttributeComponent<const TName extends string, TValue>(
    attribute: Attribute<TName, TValue>,
    Component: React.ComponentType<AttributeComponentProps<TValue>>
) {
    return function AttributeWrapper(props: { entityId?: string; rowId?: string }) {
        const formContext = useFormContext();
        const rowContext = useRowContext();
        const entityContext = useEntityContext();

        const rowId = props.rowId ?? rowContext?.rowId;
        const entityId = props.entityId ?? entityContext?.entityId;

        const setValue = useCallback((value: TValue) => {
            if (rowId && entityId) {
                formContext.updateAttributeValue(rowId, entityId, attribute.name, value);
            }
        }, [formContext, rowId, entityId]);

        const validateValue = useCallback(async () => {
            if (rowId && entityId) {
                await formContext.validateAttribute(rowId, entityId, attribute.name);
            }
        }, [formContext, rowId, entityId]);

        const resetError = useCallback(() => {
            if (rowId && entityId) {
                formContext.setAttributeError(rowId, entityId, attribute.name, null);
            }
        }, [formContext, rowId, entityId]);

        if (!rowId || !entityId) return null;

        const entityState = formContext.getEntityState(rowId, entityId);

        if (!entityState || !entityState.attributes[attribute.name]) return null;

        const attributeState = entityState.attributes[attribute.name];

        return (
            <AttributeContext.Provider value={{ attributeName: attribute.name }}>
                <Component
                    value={attributeState.value as TValue}
                    setValue={setValue}
                    validateValue={validateValue}
                    error={attributeState.error}
                    resetError={resetError}
                    entity={entityState}
                />
            </AttributeContext.Provider>
        );
    };
}

export function createEntityComponent<
    const TName extends string,
    const TAttributes extends Record<string, Attribute<string, any>>,
    TValue
>(
    entity: Entity<TName, TAttributes, TValue>,
    Component: React.ComponentType<EntityComponentProps<TAttributes, any>>
) {
    return function EntityWrapper({ entityId, ...props }: { rowId?: string; entityId: string; }) {
        const formContext = useFormContext();
        const rowContext = useRowContext();

        const rowId = props.rowId ?? rowContext?.rowId;

        if (!rowId) {
            console.warn(`EntityWrapper (${entity.name}): Missing 'rowId'.`);
            return null;
        }

        useEffect(() => {
            formContext.registerEntity(rowId, entityId, entity);
        }, [rowId, entityId]);

        const entityState = formContext.getEntityState(rowId, entityId);

        if (!entityState) return null;

        const attributesProp = {} as AttributeValues<TAttributes>;
        for (const key in entity.attributes) {
            const attr = entity.attributes[key];
            const state = entityState.attributes[attr.name];

            attributesProp[key] = state?.value ?? attr.defaultValue;
        }

        const setValue = (newValue: TValue) => {
            formContext.updateEntityValue(rowId, entityId, newValue);
        };

        const validateValue = async () => {
            await formContext.validateEntity(rowId, entityId);
        };

        const resetError = () => {
            formContext.setEntityError(rowId, entityId, null);
        };

        return (
            <EntityProvider entityId={entityId} entityName={entity.name}>
                <Component
                    attributes={attributesProp}
                    value={(entityState.value as TValue) ?? entity.defaultValue}
                    setValue={setValue}
                    validateValue={validateValue}
                    error={entityState.error}
                    resetError={resetError}
                />
            </EntityProvider>
        );
    };
}