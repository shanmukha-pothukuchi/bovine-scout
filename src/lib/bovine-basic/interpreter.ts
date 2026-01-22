import { BinaryExpr, Identifier, NumericLiteral, Program, Stmt } from "./ast";
import { MAKE_NULL, MAKE_NUMBER, NumberVal, RuntimeVal } from "./values";
import Environment from "./environment";

function evalProgram(program: Program, env: Environment): RuntimeVal {
  let lastEvaluated: RuntimeVal = MAKE_NULL();

  for (const stmt of program.body) {
    lastEvaluated = evaluate(stmt, env);
  }

  return lastEvaluated;
}

function evalNumericBinaryExpression(
  lhs: NumberVal,
  rhs: NumberVal,
  operator: string,
): NumberVal {
  let res = 0;
  if (operator == "+") {
    res = lhs.value + rhs.value;
  } else if (operator == "-") {
    res = lhs.value - rhs.value;
  } else if (operator == "*") {
    res = lhs.value * rhs.value;
  } else if (operator == "/") {
    res = lhs.value / rhs.value;
  } else if (operator == "%") {
    res = lhs.value % rhs.value;
  }

  return MAKE_NUMBER(res);
}

function evalBinaryExpression(binOp: BinaryExpr, env: Environment): RuntimeVal {
  const lhs = evaluate(binOp.left, env);
  const rhs = evaluate(binOp.right, env);

  if (lhs.type == "number" && rhs.type == "number") {
    return evalNumericBinaryExpression(
      lhs as NumberVal,
      rhs as NumberVal,
      binOp.operator,
    );
  }

  return MAKE_NULL();
}

function evalIdentifier(ident: Identifier, env: Environment): RuntimeVal {
  const val = env.lookupVar(ident.symbol);
  return val;
}

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
  switch (astNode.type) {
    case "NumericLiteral":
      return MAKE_NUMBER((astNode as NumericLiteral).value);
    case "Identifier":
      return evalIdentifier(astNode as Identifier, env);
    case "BinaryExpr":
      return evalBinaryExpression(astNode as BinaryExpr, env);
    case "Program":
      return evalProgram(astNode as Program, env);
    default:
      throw new Error(
        `This AST Node has not yet been setup for interpretation: ${JSON.stringify(astNode)}`,
      );
  }
}
