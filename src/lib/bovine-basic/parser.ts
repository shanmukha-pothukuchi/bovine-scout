import { Stmt, Program, Expr, BinaryExpr, NumericLiteral, Identifier } from "./ast";
import { tokenize, Token, TokenType } from "./lexer";

export default class Parser {
    private tokens: Token[] = [];
    private i = 0;

    private at() {
        return this.tokens[this.i];
    }

    private eat() {
        return this.tokens[this.i++];
    }

    private expect(type: TokenType, err: any) {
        const token = this.eat();
        if (!token || token.type != type) {
            throw new Error(`${err}: ${JSON.stringify(token)} - Expecting: ${type}`);
        }

        return token;
    }

    private notEOF() {
        return this.at().type != "EOF";
    }

    public produceAST(src: string): Program {
        this.tokens = tokenize(src);
        this.i = 0;

        const program: Program = {
            type: "Program",
            body: []
        }

        while (this.notEOF()) {
            program.body.push(this.parseStmt());
        }

        return program;
    }

    private parseStmt(): Stmt {
        return this.parseExpr();
    }

    private parseExpr(): Expr {
        return this.parseAdditiveExpr();
    }

    private parseAdditiveExpr(): Expr {
        let left = this.parseMultiplicativeExpr();

        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.eat().value;
            const right = this.parseMultiplicativeExpr();
            left = {
                type: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }

        return left;
    }

    private parseMultiplicativeExpr(): Expr {
        let left = this.parsePrimaryExpr();

        while (this.at().value == "*" || this.at().value == "/" || this.at().value == "%") {
            const operator = this.eat().value;
            const right = this.parsePrimaryExpr();
            left = {
                type: "BinaryExpr",
                left,
                right,
                operator
            } as BinaryExpr
        }

        return left;
    }

    private parsePrimaryExpr(): Expr {
        switch (this.at().type) {
            case "Identifier":
                return { type: "Identifier", symbol: this.eat().value } as Identifier;
            case "Number":
                return { type: "NumericLiteral", value: parseFloat(this.eat().value) } as NumericLiteral;
            case "OpenParen": {
                this.eat();
                const value = this.parseExpr();
                this.expect("CloseParen", "Unexpected token found inside parenthesised expression.");
                return value;
            }
            default:
                throw new Error("Unexpected token found during parsing: " + JSON.stringify(this.eat()));
        }
    }
}