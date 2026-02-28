export type TokenType =
  // Literals
  | "Number"
  | "String"
  | "Identifier"
  // Keywords
  | "If"
  | "Then"
  | "Else"
  | "While"
  | "For"
  | "In"
  | "Match"
  | "True"
  | "False"
  | "Unit"
  // Operators
  | "BinaryOperator"
  | "CompareOperator"
  | "Equals"
  | "Arrow"
  // Symbols
  | "Comma"
  | "Colon"
  | "Dot"
  | "Semicolon"
  | "Underscore"
  | "OpenParen"
  | "CloseParen"
  | "OpenBrace"
  | "CloseBrace"
  | "OpenBracket"
  | "CloseBracket"
  | "EOF";

export interface Token {
  value: string;
  type: TokenType;
}

const KEYWORDS: Record<string, TokenType> = {
  if: "If",
  then: "Then",
  else: "Else",
  while: "While",
  for: "For",
  in: "In",
  match: "Match",
  true: "True",
  false: "False",
  unit: "Unit",
};

function token(value: string, type: TokenType): Token {
  return { value, type };
}

const isAlpha = (char: string) => /^[a-zA-Z_]$/.test(char);
const isAlphaNum = (char: string) => /^[a-zA-Z0-9_]$/.test(char);
const isDigit = (char: string) => /^\d$/.test(char);
const isWhitespace = (char: string) => /^\s$/.test(char);

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const char = src[i];

    if (char === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      let str = "";
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === "\\" && i + 1 < src.length) {
          const next = src[i + 1];
          switch (next) {
            case "n": str += "\n"; break;
            case "t": str += "\t"; break;
            case "r": str += "\r"; break;
            default: str += next;
          }
          i += 2;
        } else {
          str += src[i];
          i++;
        }
      }
      i++;
      tokens.push(token(str, "String"));
      continue;
    }

    if (char === "-" && src[i + 1] === ">") {
      tokens.push(token("->", "Arrow"));
      i += 2;
      continue;
    }

    if (char === "=" && src[i + 1] === "=") {
      tokens.push(token("==", "CompareOperator"));
      i += 2;
      continue;
    }

    if (char === "!" && src[i + 1] === "=") {
      tokens.push(token("!=", "CompareOperator"));
      i += 2;
      continue;
    }

    if (char === "<" && src[i + 1] === "=") {
      tokens.push(token("<=", "CompareOperator"));
      i += 2;
      continue;
    }

    if (char === ">" && src[i + 1] === "=") {
      tokens.push(token(">=", "CompareOperator"));
      i += 2;
      continue;
    }

    if (char === "<" || char === ">") {
      tokens.push(token(char, "CompareOperator"));
      i++;
      continue;
    }

    if (char === "=") {
      tokens.push(token(char, "Equals"));
      i++;
      continue;
    }

    if (char === "+" || char === "*" || char === "/" || char === "%") {
      tokens.push(token(char, "BinaryOperator"));
      i++;
      continue;
    }

    if (char === "-") {
      tokens.push(token(char, "BinaryOperator"));
      i++;
      continue;
    }

    if (char === "(") { tokens.push(token(char, "OpenParen")); i++; continue; }
    if (char === ")") { tokens.push(token(char, "CloseParen")); i++; continue; }
    if (char === "{") { tokens.push(token(char, "OpenBrace")); i++; continue; }
    if (char === "}") { tokens.push(token(char, "CloseBrace")); i++; continue; }
    if (char === "[") { tokens.push(token(char, "OpenBracket")); i++; continue; }
    if (char === "]") { tokens.push(token(char, "CloseBracket")); i++; continue; }
    if (char === ",") { tokens.push(token(char, "Comma")); i++; continue; }
    if (char === ":") { tokens.push(token(char, "Colon")); i++; continue; }
    if (char === ".") { tokens.push(token(char, "Dot")); i++; continue; }
    if (char === ";") { tokens.push(token(char, "Semicolon")); i++; continue; }

    if (char === "_" && !isAlphaNum(src[i + 1] ?? "")) {
      tokens.push(token(char, "Underscore"));
      i++;
      continue;
    }

    if (isDigit(char) || (char === "." && isDigit(src[i + 1] ?? ""))) {
      let num = "";
      while (i < src.length && (isDigit(src[i]) || src[i] === ".")) {
        num += src[i];
        i++;
      }
      tokens.push(token(num, "Number"));
      continue;
    }

    if (isAlpha(char)) {
      let ident = "";
      while (i < src.length && isAlphaNum(src[i])) {
        ident += src[i];
        i++;
      }

      if (ident === "_") {
        tokens.push(token(ident, "Underscore"));
      } else {
        const reserved = KEYWORDS[ident];
        tokens.push(token(ident, reserved ?? "Identifier"));
      }
      continue;
    }

    if (isWhitespace(char)) {
      i++;
      continue;
    }

    throw new Error(`Unrecognized character in source at position ${i}: '${char}'`);
  }

  tokens.push(token("", "EOF"));
  return tokens;
}
