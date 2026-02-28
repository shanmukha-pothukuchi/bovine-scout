import type {
  Program,
  Expr,
  UnaryExpr,
  BinaryExpr,
  NumericLiteral,
  StringLiteral,
  BooleanLiteral,
  UnitLiteral,
  ArrayLiteral,
  DictionaryLiteral,
  Identifier,
  AssignmentExpr,
  IndexExpr,
  MemberExpr,
  LambdaExpr,
  CallExpr,
  BlockExpr,
  IfExpr,
  MatchExpr,
  MatchArm,
  WhileExpr,
  ForExpr,
} from "./ast";
import { tokenize, type Token, type TokenType } from "./lexer";

export default class Parser {
  private tokens: Token[] = [];
  private i = 0;

  private at(): Token {
    return this.tokens[this.i];
  }

  private eat(): Token {
    return this.tokens[this.i++];
  }

  private expect(type: TokenType, err: string): Token {
    const tok = this.eat();
    if (!tok || tok.type !== type) {
      throw new Error(`${err} — got '${tok?.value ?? "EOF"}' (${tok?.type}), expected ${type}`);
    }
    return tok;
  }

  private check(type: TokenType): boolean {
    return this.at().type === type;
  }

  private notEOF(): boolean {
    return this.at().type !== "EOF";
  }

  /** Consume an OpenParen and return true if one is present; return false if not. */
  private tryEatOpenParen(): boolean {
    if (this.check("OpenParen")) {
      this.eat();
      return true;
    }
    return false;
  }

  public produceAST(src: string): Program {
    this.tokens = tokenize(src);
    this.i = 0;

    const program: Program = {
      type: "Program",
      body: [],
    };

    while (this.notEOF()) {
      this.skipSeparators();
      if (!this.notEOF()) break;
      program.body.push(this.parseExpr());
      this.skipSeparators();
    }

    return program;
  }

  private skipSeparators() {
    while (this.check("Semicolon")) {
      this.eat();
    }
  }

  // --- Expression hierarchy ---

  private parseExpr(): Expr {
    return this.parseAssignment();
  }

  private parseAssignment(): Expr {
    const left = this.parseComparison();

    if (this.check("Equals")) {
      this.eat();
      const value = this.parseAssignment();

      if (
        left.type !== "Identifier" &&
        left.type !== "IndexExpr" &&
        left.type !== "MemberExpr"
      ) {
        throw new Error("Invalid assignment target.");
      }

      return {
        type: "AssignmentExpr",
        target: left as Identifier | IndexExpr | MemberExpr,
        value,
      } as AssignmentExpr;
    }

    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseAdditive();

    while (this.check("CompareOperator")) {
      const operator = this.eat().value;
      const right = this.parseAdditive();
      left = {
        type: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();

    while (this.check("BinaryOperator") && (this.at().value === "+" || this.at().value === "-")) {
      const operator = this.eat().value;
      const right = this.parseMultiplicative();
      left = {
        type: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseCallMemberIndex();

    while (
      this.check("BinaryOperator") &&
      (this.at().value === "*" || this.at().value === "/" || this.at().value === "%")
    ) {
      const operator = this.eat().value;
      const right = this.parseCallMemberIndex();
      left = {
        type: "BinaryExpr",
        left,
        right,
        operator,
      } as BinaryExpr;
    }

    return left;
  }

  private parseCallMemberIndex(): Expr {
    let expr = this.parsePrimary();

    while (true) {
      if (this.check("OpenParen")) {
        this.eat();
        const args: Expr[] = [];
        while (!this.check("CloseParen") && this.notEOF()) {
          args.push(this.parseExpr());
          if (this.check("Comma")) {
            this.eat();
            if (this.check("CloseParen")) {
              throw new Error("Trailing comma in function call arguments");
            }
          }
        }
        this.expect("CloseParen", "Expected ')' after function call arguments");
        expr = { type: "CallExpr", callee: expr, args } as CallExpr;
      } else if (this.check("OpenBracket")) {
        this.eat();
        const index = this.parseExpr();
        this.expect("CloseBracket", "Expected ']' after index expression");
        expr = { type: "IndexExpr", object: expr, index } as IndexExpr;
      } else if (this.check("Dot")) {
        this.eat();
        const prop = this.expect("Identifier", "Expected property name after '.'").value;
        expr = { type: "MemberExpr", object: expr, property: prop } as MemberExpr;
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expr {
    const tok = this.at();

    switch (tok.type) {
      case "Number":
        this.eat();
        return { type: "NumericLiteral", value: parseFloat(tok.value) } as NumericLiteral;

      case "String":
        this.eat();
        return { type: "StringLiteral", value: tok.value } as StringLiteral;

      case "True":
        this.eat();
        return { type: "BooleanLiteral", value: true } as BooleanLiteral;

      case "False":
        this.eat();
        return { type: "BooleanLiteral", value: false } as BooleanLiteral;

      case "Unit":
        this.eat();
        return { type: "UnitLiteral" } as UnitLiteral;

      case "Identifier":
        this.eat();
        return { type: "Identifier", symbol: tok.value } as Identifier;

      case "Underscore":
        this.eat();
        return { type: "Identifier", symbol: "_" } as Identifier;

      case "OpenParen": {
        this.eat();

        // Could be a lambda param list or a grouped expression
        // Check for lambda: () -> ... or (a, b) -> ...
        const savedI = this.i;
        try {
          const params = this.tryParseLambdaParams();
          if (params !== null && this.check("Arrow")) {
            this.eat(); // consume ->
            const body = this.parseLambdaBody();
            return { type: "LambdaExpr", params, body } as LambdaExpr;
          }
        } catch {
          // fall through
        }

        this.i = savedI;
        const value = this.parseExpr();
        this.expect("CloseParen", "Expected ')' after grouped expression");
        return value;
      }

      case "OpenBrace":
        return this.parseBlockOrDict();

      case "OpenBracket":
        return this.parseArrayLiteral();

      case "If":
        return this.parseIfExpr();

      case "Match":
        return this.parseMatchExpr();

      case "While":
        return this.parseWhileExpr();

      case "For":
        return this.parseForExpr();

      case "Not": {
        this.eat();
        const operand = this.parseCallMemberIndex();
        return { type: "UnaryExpr", operator: "not", operand } as UnaryExpr;
      }

      case "BinaryOperator":
        if (tok.value === "-") {
          this.eat();
          const operand = this.parseCallMemberIndex();
          return {
            type: "BinaryExpr",
            left: { type: "NumericLiteral", value: 0 } as NumericLiteral,
            right: operand,
            operator: "-",
          } as BinaryExpr;
        }
        throw new Error(`Unexpected operator '${tok.value}' in primary position`);

      default:
        throw new Error(`Unexpected token '${tok.value}' (${tok.type}) during parsing`);
    }
  }

  private tryParseLambdaParams(): string[] | null {
    const params: string[] = [];
    if (this.check("CloseParen")) {
      this.eat();
      return params;
    }
    while (true) {
      if (!this.check("Identifier")) return null;
      params.push(this.eat().value);
      if (this.check("CloseParen")) {
        this.eat();
        return params;
      }
      if (!this.check("Comma")) return null;
      this.eat();
    }
  }

  private parseLambdaBody(): Expr {
    if (this.check("OpenBrace")) {
      return this.parseBlock();
    }
    return this.parseExpr();
  }

  private parseBlock(): BlockExpr {
    this.expect("OpenBrace", "Expected '{'");
    const body: Expr[] = [];
    this.skipSeparators();
    while (!this.check("CloseBrace") && this.notEOF()) {
      body.push(this.parseExpr());
      this.skipSeparators();
    }
    this.expect("CloseBrace", "Expected '}'");
    return { type: "BlockExpr", body } as BlockExpr;
  }

  private parseBlockOrDict(): Expr {
    this.expect("OpenBrace", "Expected '{'");

    // Empty block
    if (this.check("CloseBrace")) {
      this.eat();
      return { type: "BlockExpr", body: [] } as BlockExpr;
    }

    // Peek ahead: if the first token(s) look like `key:` or `"key":`, it's a dict
    const savedI = this.i;
    const isDictionary = this.looksLikeDictionary();
    this.i = savedI;

    if (isDictionary) {
      return this.parseDictBody();
    }

    // Otherwise it's a block
    const body: Expr[] = [];
    this.skipSeparators();
    while (!this.check("CloseBrace") && this.notEOF()) {
      body.push(this.parseExpr());
      this.skipSeparators();
    }
    this.expect("CloseBrace", "Expected '}'");
    return { type: "BlockExpr", body } as BlockExpr;
  }

  private looksLikeDictionary(): boolean {
    const tok = this.at();
    if (tok.type === "String" || tok.type === "Identifier" || tok.type === "Number") {
      const next = this.tokens[this.i + 1];
      return next?.type === "Colon";
    }
    return false;
  }

  private parseDictBody(): DictionaryLiteral {
    const entries: { key: string; value: Expr }[] = [];
    this.skipSeparators();
    while (!this.check("CloseBrace") && this.notEOF()) {
      let key: string;
      const keyTok = this.at();
      if (keyTok.type === "String" || keyTok.type === "Identifier" || keyTok.type === "Number") {
        key = this.eat().value;
      } else {
        throw new Error(`Expected dictionary key, got '${keyTok.value}'`);
      }
      this.expect("Colon", "Expected ':' after dictionary key");
      const value = this.parseExpr();
      entries.push({ key, value });
      if (this.check("Comma")) this.eat();
      this.skipSeparators();
    }
    this.expect("CloseBrace", "Expected '}' to close dictionary");
    return { type: "DictionaryLiteral", entries } as DictionaryLiteral;
  }

  private parseArrayLiteral(): ArrayLiteral {
    this.expect("OpenBracket", "Expected '['");
    const elements: Expr[] = [];
    while (!this.check("CloseBracket") && this.notEOF()) {
      elements.push(this.parseExpr());
      if (this.check("Comma")) this.eat();
    }
    this.expect("CloseBracket", "Expected ']' after array elements");
    return { type: "ArrayLiteral", elements } as ArrayLiteral;
  }

  private parseIfExpr(): IfExpr {
    this.expect("If", "Expected 'if'");
    const hasParen = this.tryEatOpenParen();
    const condition = this.parseExpr();
    if (hasParen) this.expect("CloseParen", "Expected ')' after if condition");
    this.expect("Then", "Expected 'then' after if condition");
    const consequent = this.parseExpr();

    let alternate: Expr | null = null;
    if (this.check("Else")) {
      this.eat();
      alternate = this.parseExpr();
    }

    return { type: "IfExpr", condition, consequent, alternate } as IfExpr;
  }

  private parseMatchExpr(): MatchExpr {
    this.expect("Match", "Expected 'match'");
    const hasParen = this.tryEatOpenParen();
    const subject = this.parseExpr();
    if (hasParen) this.expect("CloseParen", "Expected ')' after match subject");
    this.expect("OpenBrace", "Expected '{' to start match arms");

    const arms: MatchArm[] = [];
    this.skipSeparators();
    while (!this.check("CloseBrace") && this.notEOF()) {
      let pattern: Expr | "_";
      if (this.check("Underscore")) {
        this.eat();
        pattern = "_";
      } else {
        pattern = this.parseExpr();
      }
      this.expect("Arrow", "Expected '->' in match arm");
      const body = this.parseExpr();
      arms.push({ pattern, body });
      this.skipSeparators();
    }

    this.expect("CloseBrace", "Expected '}' to close match expression");
    return { type: "MatchExpr", subject, arms } as MatchExpr;
  }

  private parseWhileExpr(): WhileExpr {
    this.expect("While", "Expected 'while'");
    const hasParen = this.tryEatOpenParen();
    const condition = this.parseExpr();
    if (hasParen) this.expect("CloseParen", "Expected ')' after while condition");
    const body = this.parseBlock();
    return { type: "WhileExpr", condition, body } as WhileExpr;
  }

  private parseForExpr(): ForExpr {
    this.expect("For", "Expected 'for'");
    const hasParen = this.tryEatOpenParen();
    const variable = this.expect("Identifier", "Expected loop variable name").value;
    this.expect("In", "Expected 'in' in for loop");
    const iterable = this.parseExpr();
    if (hasParen) this.expect("CloseParen", "Expected ')' after for loop iterable");
    const body = this.parseBlock();
    return { type: "ForExpr", variable, iterable, body } as ForExpr;
  }
}
