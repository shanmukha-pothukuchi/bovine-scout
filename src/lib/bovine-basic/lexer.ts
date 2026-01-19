export type TokenType =
    | "Number"
    | "Identifier"
    | "Let"
    | "BinaryOperator"
    | "Equals" | "OpenParen" | "CloseParen"
    | "EOF";

export interface Token {
    value: string;
    type: TokenType;
}

const KEYWORDS: Record<string, TokenType> = {
    "let": "Let",
}

function token(value: string, type: TokenType): Token {
    return { value, type };
}

const isAlpha = (char: string) => /^[a-z]$/i.test(char);
const isDigit = (char: string) => /^\d$/.test(char);
const isWhitespace = (char: string) => /^\s$/.test(char);

export function tokenize(src: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < src.length) {
        const char = src[i];
        if (char == "(") {
            tokens.push(token(char, "OpenParen"));
            i++;
        } else if (char == ")") {
            tokens.push(token(char, "CloseParen"));
            i++;
        } else if (char == "+" || char == "-" || char == "*" || char == "/" || char == "%") {
            tokens.push(token(char, "BinaryOperator"));
            i++;
        } else if (char == "=") {
            tokens.push(token(char, "Equals"));
            i++;
        } else {
            if (isDigit(char)) {
                let num = "";

                while (i < src.length && isDigit(src[i])) {
                    num += src[i];
                    i++;
                }

                tokens.push(token(num, "Number"));
            } else if (isAlpha(char)) {
                let ident = "";

                while (i < src.length && isAlpha(src[i])) {
                    ident += src[i];
                    i++;
                }

                const reserved = KEYWORDS[ident];
                tokens.push(token(ident, reserved ?? "Identifier"));
            } else if (isWhitespace(char)) {
                i++;
            } else {
                throw new Error(`Unrecognized character found in source: ${char}`);
            }
        }
    }

    tokens.push(token("", "EOF"));
    return tokens;
}