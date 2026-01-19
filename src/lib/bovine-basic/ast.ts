export type NodeType =
    | "Program"
    | "NumericLiteral"
    | "Identifier"
    | "BinaryExpr";

export interface Stmt {
    type: NodeType;
}

export interface Program extends Stmt {
    type: "Program";
    body: Stmt[];
}

export interface Expr extends Stmt { }

export interface BinaryExpr extends Expr {
    type: "BinaryExpr";
    left: Expr;
    right: Expr;
    operator: string;
}

export interface Identifier extends Expr {
    type: "Identifier";
    symbol: string;
}

export interface NumericLiteral extends Expr {
    type: "NumericLiteral";
    value: number;
}