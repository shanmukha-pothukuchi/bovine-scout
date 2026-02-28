import {
  alignmentAttr,
  type Alignment,
} from "@/components/website-builder/attributes/alignment";
import { expressionAttr } from "@/components/website-builder/attributes/expression";
import { fontSizeAttr } from "@/components/website-builder/attributes/font-size";
import { paddingAttr } from "@/components/website-builder/attributes/padding";
import {
  verticalAlignAttr,
  type VerticalAlign,
} from "@/components/website-builder/attributes/vertical-align";
import { evaluate } from "@/lib/bovine-basic/interpreter";
import Parser from "@/lib/bovine-basic/parser";
import { runtimeValToString } from "@/lib/bovine-basic/values";
import { makeEntity } from "@/lib/website-builder";
import { useConfig } from "@/pages/config/context";
import type { Expr } from "@/lib/bovine-basic/ast";
import Environment from "@/lib/bovine-basic/environment";
import { TextTIcon } from "@phosphor-icons/react";
import { useMemo } from "react";

const verticalAlignMap: Record<VerticalAlign, string> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
};

const expressionParser = new Parser();

export const textEntity = makeEntity({
  name: "Text",
  icon: TextTIcon,
  attributes: {
    padding: paddingAttr,
    fontSize: fontSizeAttr,
    alignment: alignmentAttr,
    verticalAlign: verticalAlignAttr,
    expression: expressionAttr,
  },
  component: ({ attributes }) => {
    const { padding, fontSize, alignment, verticalAlign, expression } =
      attributes;
    const { expressionEnvironment } = useConfig();

    const evalResult = useMemo(() => {
      const src = expression as string;
      if (!src || src.trim() === "") return null;
      try {
        const ast = expressionParser.produceAST(src);
        const env = new Environment(expressionEnvironment ?? undefined);
        const val = evaluate(ast as unknown as Expr, env);
        const output = runtimeValToString(val);
        return output === "unit" ? null : output;
      } catch {
        return null;
      }
    }, [expression, expressionEnvironment]);

    return (
      <div
        className="flex size-full bg-accent"
        style={{
          padding: `${padding}px`,
          fontSize: `${fontSize}px`,
          textAlign: alignment as Alignment,
          justifyContent: verticalAlignMap[verticalAlign as VerticalAlign],
          flexDirection: "column",
        }}
      >
        <span>{evalResult ?? "Text block"}</span>
      </div>
    );
  },
});
