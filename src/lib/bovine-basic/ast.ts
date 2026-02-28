export type NodeType =
  | "Program"
  // Literals
  | "NumericLiteral"
  | "StringLiteral"
  | "BooleanLiteral"
  | "UnitLiteral"
  | "ArrayLiteral"
  | "DictionaryLiteral"
  // Expressions
  | "Identifier"
  | "UnaryExpr"
  | "BinaryExpr"
  | "AssignmentExpr"
  | "IndexExpr"
  | "MemberExpr"
  | "LambdaExpr"
  | "CallExpr"
  | "BlockExpr"
  | "IfExpr"
  | "MatchExpr"
  | "WhileExpr"
  | "ForExpr";

export interface Stmt {
  type: NodeType;
}

export interface Program extends Stmt {
  type: "Program";
  body: Expr[];
}

export interface Expr extends Stmt {}

// --- Literals ---

export interface NumericLiteral extends Expr {
  type: "NumericLiteral";
  value: number;
}

export interface StringLiteral extends Expr {
  type: "StringLiteral";
  value: string;
}

export interface BooleanLiteral extends Expr {
  type: "BooleanLiteral";
  value: boolean;
}

export interface UnitLiteral extends Expr {
  type: "UnitLiteral";
}

export interface ArrayLiteral extends Expr {
  type: "ArrayLiteral";
  elements: Expr[];
}

export interface DictionaryEntry {
  key: string;
  value: Expr;
}

export interface DictionaryLiteral extends Expr {
  type: "DictionaryLiteral";
  entries: DictionaryEntry[];
}

// --- Core Expressions ---

export interface Identifier extends Expr {
  type: "Identifier";
  symbol: string;
}

export interface UnaryExpr extends Expr {
  type: "UnaryExpr";
  operator: "not";
  operand: Expr;
}

export interface BinaryExpr extends Expr {
  type: "BinaryExpr";
  left: Expr;
  right: Expr;
  operator: string;
}

export interface AssignmentExpr extends Expr {
  type: "AssignmentExpr";
  target: Identifier | IndexExpr | MemberExpr;
  value: Expr;
}

export interface IndexExpr extends Expr {
  type: "IndexExpr";
  object: Expr;
  index: Expr;
}

export interface MemberExpr extends Expr {
  type: "MemberExpr";
  object: Expr;
  property: string;
}

export interface LambdaExpr extends Expr {
  type: "LambdaExpr";
  params: string[];
  body: Expr;
}

export interface CallExpr extends Expr {
  type: "CallExpr";
  callee: Expr;
  args: Expr[];
}

export interface BlockExpr extends Expr {
  type: "BlockExpr";
  body: Expr[];
}

export interface IfExpr extends Expr {
  type: "IfExpr";
  condition: Expr;
  consequent: Expr;
  alternate: Expr | null;
}

export interface MatchArm {
  pattern: Expr | "_";
  body: Expr;
}

export interface MatchExpr extends Expr {
  type: "MatchExpr";
  subject: Expr;
  arms: MatchArm[];
}

export interface WhileExpr extends Expr {
  type: "WhileExpr";
  condition: Expr;
  body: BlockExpr;
}

export interface ForExpr extends Expr {
  type: "ForExpr";
  variable: string;
  iterable: Expr;
  body: BlockExpr;
}
