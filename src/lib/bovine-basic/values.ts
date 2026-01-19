export type ValueType =
    | "null"
    | "number"
    | "boolean";

export interface RuntimeVal {
    type: ValueType
}

export interface NullVal extends RuntimeVal {
    type: "null";
    value: null;
}

export function MAKE_NULL(): NullVal {
    return { type: "null", value: null };
}

export interface BooleanVal extends RuntimeVal {
    type: "boolean";
    value: boolean;
}

export function MAKE_BOOL(b = true): BooleanVal {
    return { type: "boolean", value: b };
}

export interface NumberVal extends RuntimeVal {
    type: "number";
    value: number;
}

export function MAKE_NUMBER(n = 0): NumberVal {
    return { type: "number", value: n };
}