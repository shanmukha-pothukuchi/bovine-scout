export type ValueType =
  | "unit"
  | "number"
  | "boolean"
  | "string"
  | "array"
  | "dictionary"
  | "function";

export interface RuntimeVal {
  type: ValueType;
}

export interface UnitVal extends RuntimeVal {
  type: "unit";
}

export function MAKE_UNIT(): UnitVal {
  return { type: "unit" };
}

export interface NumberVal extends RuntimeVal {
  type: "number";
  value: number;
}

export function MAKE_NUMBER(n = 0): NumberVal {
  return { type: "number", value: n };
}

export interface BooleanVal extends RuntimeVal {
  type: "boolean";
  value: boolean;
}

export function MAKE_BOOL(b = true): BooleanVal {
  return { type: "boolean", value: b };
}

export interface StringVal extends RuntimeVal {
  type: "string";
  value: string;
}

export function MAKE_STRING(s = ""): StringVal {
  return { type: "string", value: s };
}

export interface ArrayVal extends RuntimeVal {
  type: "array";
  elements: RuntimeVal[];
}

export function MAKE_ARRAY(elements: RuntimeVal[] = []): ArrayVal {
  return { type: "array", elements };
}

export interface DictionaryVal extends RuntimeVal {
  type: "dictionary";
  entries: Map<string, RuntimeVal>;
}

export function MAKE_DICT(entries: Map<string, RuntimeVal> = new Map()): DictionaryVal {
  return { type: "dictionary", entries };
}

export type NativeFn = (args: RuntimeVal[]) => RuntimeVal;

export interface FunctionVal extends RuntimeVal {
  type: "function";
  params: string[];
  body: import("./ast").Expr | import("./ast").BlockExpr;
  closure: import("./environment").default;
  native?: NativeFn;
}

export function MAKE_FUNCTION(
  params: string[],
  body: import("./ast").Expr | import("./ast").BlockExpr,
  closure: import("./environment").default,
): FunctionVal {
  return { type: "function", params, body, closure };
}

export function MAKE_NATIVE_FN(fn: NativeFn): FunctionVal {
  return {
    type: "function",
    params: [],
    body: null as unknown as import("./ast").Expr,
    closure: null as unknown as import("./environment").default,
    native: fn,
  };
}

export function runtimeValToString(val: RuntimeVal): string {
  switch (val.type) {
    case "unit":
      return "unit";
    case "number":
      return String((val as NumberVal).value);
    case "boolean":
      return String((val as BooleanVal).value);
    case "string":
      return (val as StringVal).value;
    case "array": {
      const arr = val as ArrayVal;
      return "[" + arr.elements.map(runtimeValToString).join(", ") + "]";
    }
    case "dictionary": {
      const dict = val as DictionaryVal;
      const pairs: string[] = [];
      dict.entries.forEach((v, k) => {
        pairs.push(`${k}: ${runtimeValToString(v)}`);
      });
      return "{ " + pairs.join(", ") + " }";
    }
    case "function":
      return "<function>";
  }
}
