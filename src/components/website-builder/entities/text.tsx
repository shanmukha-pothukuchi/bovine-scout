import {
  alignmentAttr,
  type Alignment,
} from "@/components/website-builder/attributes/alignment";
import { fontSizeAttr } from "@/components/website-builder/attributes/font-size";
import { paddingAttr } from "@/components/website-builder/attributes/padding";
import {
  verticalAlignAttr,
  type VerticalAlign,
} from "@/components/website-builder/attributes/vertical-align";
import { makeEntity } from "@/lib/website-builder";
import { TextTIcon } from "@phosphor-icons/react";

const verticalAlignMap: Record<VerticalAlign, string> = {
  top: "flex-start",
  middle: "center",
  bottom: "flex-end",
};

export const textEntity = makeEntity({
  name: "Text",
  icon: TextTIcon,
  attributes: {
    padding: paddingAttr,
    fontSize: fontSizeAttr,
    alignment: alignmentAttr,
    verticalAlign: verticalAlignAttr,
  },
  component: ({ attributes }) => {
    const { padding, fontSize, alignment, verticalAlign } = attributes;

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
        <span>Text block</span>
      </div>
    );
  },
});
