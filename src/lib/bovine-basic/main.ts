import { evaluate } from "./interpreter";
import Parser from "./parser";
import Environment from "./environment";
import { MAKE_NULL, MAKE_BOOL, MAKE_NUMBER } from "./values";

repl();

function repl() {
    const parser = new Parser();
    const env = new Environment();

    env.declareVar("null", MAKE_NULL());
    env.declareVar("true", MAKE_BOOL(true));
    env.declareVar("false", MAKE_BOOL(false));

    env.declareVar("x", MAKE_NUMBER(12));

    console.log("Repl v0.1");
    while (true) {
        const input = prompt("> ");
        if (!input || input.includes("exit")) {
            return 0;
        }

        const program = parser.produceAST(input);
        const result = evaluate(program, env);
        console.log(result);
    }
}