import { makeEntity } from "@/lib/website-builder";
import { TextT } from "@phosphor-icons/react";
import { paddingAttr } from "@/components/website-builder/attributes/padding";
import { fontSizeAttr } from "@/components/website-builder/attributes/font-size";
import {
  alignmentAttr,
  type Alignment,
} from "@/components/website-builder/attributes/alignment";
import {
  verticalAlignAttr,
  type VerticalAlign,
} from "@/components/website-builder/attributes/vertical-align";
import { backgroundColorAttr } from "@/components/website-builder/attributes/background-color";

const verticalAlignMap: Record<VerticalAlign, string> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
};

export const textEntity = makeEntity({
  name: "Text",
  icon: TextT,
  attributes: {
    padding: paddingAttr,
    fontSize: fontSizeAttr,
    alignment: alignmentAttr,
    verticalAlign: verticalAlignAttr,
    backgroundColor: backgroundColorAttr,
  },
  component: ({ attributes }) => {
    const { padding, fontSize, alignment, verticalAlign, backgroundColor } =
      attributes;

    return (
      <div
        className="flex size-full"
        style={{
          padding: `${padding}px`,
          fontSize: `${fontSize}px`,
          textAlign: alignment as Alignment,
          justifyContent: verticalAlignMap[verticalAlign as VerticalAlign],
          backgroundColor: backgroundColor as string,
          flexDirection: "column",
        }}
      >
        <span>Text block</span>
      </div>
    );
  },
});
