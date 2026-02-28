import {
  Program,
  Expr,
  NumericLiteral,
  StringLiteral,
  BooleanLiteral,
  ArrayLiteral,
  DictionaryLiteral,
  Identifier,
  BinaryExpr,
  AssignmentExpr,
  IndexExpr,
  MemberExpr,
  LambdaExpr,
  CallExpr,
  BlockExpr,
  IfExpr,
  MatchExpr,
  WhileExpr,
  ForExpr,
} from "./ast";
import {
  RuntimeVal,
  UnitVal,
  NumberVal,
  BooleanVal,
  StringVal,
  ArrayVal,
  DictionaryVal,
  FunctionVal,
  MAKE_UNIT,
  MAKE_NUMBER,
  MAKE_BOOL,
  MAKE_STRING,
  MAKE_ARRAY,
  MAKE_DICT,
  MAKE_FUNCTION,
} from "./values";
import Environment from "./environment";

// --- Helpers ---

function isTruthy(val: RuntimeVal): boolean {
  switch (val.type) {
    case "unit": return false;
    case "boolean": return (val as BooleanVal).value;
    case "number": return (val as NumberVal).value !== 0;
    case "string": return (val as StringVal).value !== "";
    case "array": return (val as ArrayVal).elements.length > 0;
    case "dictionary": return (val as DictionaryVal).entries.size > 0;
    case "function": return true;
  }
}

function runtimeEqual(a: RuntimeVal, b: RuntimeVal): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "unit": return true;
    case "boolean": return (a as BooleanVal).value === (b as BooleanVal).value;
    case "number": return (a as NumberVal).value === (b as NumberVal).value;
    case "string": return (a as StringVal).value === (b as StringVal).value;
    default: return false;
  }
}

// --- Evaluators ---

function evalProgram(program: Program, env: Environment): RuntimeVal {
  let last: RuntimeVal = MAKE_UNIT();
  for (const expr of program.body) {
    last = evaluate(expr, env);
  }
  return last;
}

function evalBinaryExpr(node: BinaryExpr, env: Environment): RuntimeVal {
  const left = evaluate(node.left, env);
  const right = evaluate(node.right, env);

  const ln = (left as NumberVal).value;
  const rn = (right as NumberVal).value;

  switch (node.operator) {
    // Arithmetic (numbers only)
    case "+":
      if (left.type === "string" || right.type === "string") {
        return MAKE_STRING(
          (left.type === "string" ? (left as StringVal).value : String(ln)) +
          (right.type === "string" ? (right as StringVal).value : String(rn))
        );
      }
      if (left.type === "number" && right.type === "number") return MAKE_NUMBER(ln + rn);
      return MAKE_UNIT();
    case "-":
      if (left.type === "number" && right.type === "number") return MAKE_NUMBER(ln - rn);
      return MAKE_UNIT();
    case "*":
      if (left.type === "number" && right.type === "number") return MAKE_NUMBER(ln * rn);
      return MAKE_UNIT();
    case "/":
      if (left.type === "number" && right.type === "number") return MAKE_NUMBER(ln / rn);
      return MAKE_UNIT();
    case "%":
      if (left.type === "number" && right.type === "number") return MAKE_NUMBER(ln % rn);
      return MAKE_UNIT();
    // Comparison
    case "==": return MAKE_BOOL(runtimeEqual(left, right));
    case "!=": return MAKE_BOOL(!runtimeEqual(left, right));
    case "<":
      if (left.type === "number" && right.type === "number") return MAKE_BOOL(ln < rn);
      return MAKE_UNIT();
    case ">":
      if (left.type === "number" && right.type === "number") return MAKE_BOOL(ln > rn);
      return MAKE_UNIT();
    case "<=":
      if (left.type === "number" && right.type === "number") return MAKE_BOOL(ln <= rn);
      return MAKE_UNIT();
    case ">=":
      if (left.type === "number" && right.type === "number") return MAKE_BOOL(ln >= rn);
      return MAKE_UNIT();
    default:
      throw new Error(`Unknown operator: ${node.operator}`);
  }
}

function evalAssignment(node: AssignmentExpr, env: Environment): RuntimeVal {
  const value = evaluate(node.value, env);

  if (node.target.type === "Identifier") {
    return env.setVar((node.target as Identifier).symbol, value);
  }

  if (node.target.type === "IndexExpr") {
    const target = node.target as IndexExpr;
    const obj = evaluate(target.object, env);
    const idx = evaluate(target.index, env);

    if (obj.type === "array") {
      const arr = obj as ArrayVal;
      if (idx.type !== "number") throw new Error("Array index must be a number");
      const i = Math.floor((idx as NumberVal).value);
      arr.elements[i] = value;
      return value;
    }

    if (obj.type === "dictionary") {
      const dict = obj as DictionaryVal;
      const key = idx.type === "string" ? (idx as StringVal).value : String((idx as NumberVal).value);
      dict.entries.set(key, value);
      return value;
    }

    throw new Error("Cannot index into non-array/dict value");
  }

  if (node.target.type === "MemberExpr") {
    const target = node.target as MemberExpr;
    const obj = evaluate(target.object, env);
    if (obj.type !== "dictionary") throw new Error("Cannot set member on non-dictionary value");
    (obj as DictionaryVal).entries.set(target.property, value);
    return value;
  }

  throw new Error("Invalid assignment target");
}

function evalIndexExpr(node: IndexExpr, env: Environment): RuntimeVal {
  const obj = evaluate(node.object, env);
  const idx = evaluate(node.index, env);

  if (obj.type === "array") {
    const arr = obj as ArrayVal;
    if (idx.type !== "number") return MAKE_UNIT();
    const i = Math.floor((idx as NumberVal).value);
    return arr.elements[i] ?? MAKE_UNIT();
  }

  if (obj.type === "dictionary") {
    const dict = obj as DictionaryVal;
    const key = idx.type === "string" ? (idx as StringVal).value : String((idx as NumberVal).value);
    return dict.entries.get(key) ?? MAKE_UNIT();
  }

  return MAKE_UNIT();
}

function evalMemberExpr(node: MemberExpr, env: Environment): RuntimeVal {
  const obj = evaluate(node.object, env);
  if (obj.type !== "dictionary") return MAKE_UNIT();
  return (obj as DictionaryVal).entries.get(node.property) ?? MAKE_UNIT();
}

function evalBlock(node: BlockExpr, parentEnv: Environment): RuntimeVal {
  const blockEnv = new Environment(parentEnv);
  let last: RuntimeVal = MAKE_UNIT();
  for (const expr of node.body) {
    last = evaluate(expr, blockEnv);
  }
  return last;
}

function evalIfExpr(node: IfExpr, env: Environment): RuntimeVal {
  const cond = evaluate(node.condition, env);
  if (isTruthy(cond)) {
    return evaluate(node.consequent, env);
  } else if (node.alternate !== null) {
    return evaluate(node.alternate, env);
  }
  return MAKE_UNIT();
}

function evalMatchExpr(node: MatchExpr, env: Environment): RuntimeVal {
  const subject = evaluate(node.subject, env);

  for (const arm of node.arms) {
    if (arm.pattern === "_") {
      return evaluate(arm.body, env);
    }
    const patternVal = evaluate(arm.pattern as Expr, env);
    if (runtimeEqual(subject, patternVal)) {
      return evaluate(arm.body, env);
    }
  }

  return MAKE_UNIT();
}

function evalWhileExpr(node: WhileExpr, env: Environment): RuntimeVal {
  let last: RuntimeVal = MAKE_UNIT();
  let ran = false;

  while (true) {
    const cond = evaluate(node.condition, env);
    if (!isTruthy(cond)) break;
    ran = true;
    last = evalBlock(node.body, env);
  }

  return ran ? last : MAKE_UNIT();
}

function evalForExpr(node: ForExpr, env: Environment): RuntimeVal {
  const iterable = evaluate(node.iterable, env);
  let last: RuntimeVal = MAKE_UNIT();
  let ran = false;

  if (iterable.type !== "array") {
    throw new Error("For loop requires an array iterable");
  }

  for (const element of (iterable as ArrayVal).elements) {
    ran = true;
    const loopEnv = new Environment(env);
    loopEnv.setVar(node.variable, element);
    last = evaluate(node.body, loopEnv);
  }

  return ran ? last : MAKE_UNIT();
}

function evalCallExpr(node: CallExpr, env: Environment): RuntimeVal {
  const callee = evaluate(node.callee, env);
  if (callee.type !== "function") {
    throw new Error("Attempted to call a non-function value");
  }

  const fn = callee as FunctionVal;
  const args = node.args.map((arg) => evaluate(arg, env));

  if (fn.native) {
    return fn.native(args);
  }

  const callEnv = new Environment(fn.closure);
  fn.params.forEach((param, idx) => {
    callEnv.setVar(param, args[idx] ?? MAKE_UNIT());
  });

  return evaluate(fn.body, callEnv);
}

// --- Main evaluate dispatcher ---

export function evaluate(node: Expr | Program["body"][number], env: Environment): RuntimeVal {
  switch (node.type) {
    case "Program":
      return evalProgram(node as Program, env);

    case "NumericLiteral":
      return MAKE_NUMBER((node as NumericLiteral).value);

    case "StringLiteral":
      return MAKE_STRING((node as StringLiteral).value);

    case "BooleanLiteral":
      return MAKE_BOOL((node as BooleanLiteral).value);

    case "UnitLiteral":
      return MAKE_UNIT();

    case "ArrayLiteral": {
      const arrNode = node as ArrayLiteral;
      return MAKE_ARRAY(arrNode.elements.map((el) => evaluate(el, env)));
    }

    case "DictionaryLiteral": {
      const dictNode = node as DictionaryLiteral;
      const map = new Map<string, RuntimeVal>();
      for (const entry of dictNode.entries) {
        map.set(entry.key, evaluate(entry.value, env));
      }
      return MAKE_DICT(map);
    }

    case "Identifier": {
      const ident = node as Identifier;
      if (ident.symbol === "unit") return MAKE_UNIT();
      try {
        return env.lookupVar(ident.symbol);
      } catch {
        return MAKE_UNIT();
      }
    }

    case "BinaryExpr":
      return evalBinaryExpr(node as BinaryExpr, env);

    case "AssignmentExpr":
      return evalAssignment(node as AssignmentExpr, env);

    case "IndexExpr":
      return evalIndexExpr(node as IndexExpr, env);

    case "MemberExpr":
      return evalMemberExpr(node as MemberExpr, env);

    case "LambdaExpr": {
      const lambda = node as LambdaExpr;
      return MAKE_FUNCTION(lambda.params, lambda.body, env);
    }

    case "CallExpr":
      return evalCallExpr(node as CallExpr, env);

    case "BlockExpr":
      return evalBlock(node as BlockExpr, env);

    case "IfExpr":
      return evalIfExpr(node as IfExpr, env);

    case "MatchExpr":
      return evalMatchExpr(node as MatchExpr, env);

    case "WhileExpr":
      return evalWhileExpr(node as WhileExpr, env);

    case "ForExpr":
      return evalForExpr(node as ForExpr, env);

    default:
      throw new Error(`Unknown AST node type: ${(node as { type: string }).type}`);
  }
}
