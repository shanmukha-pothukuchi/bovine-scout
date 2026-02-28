import { Label } from "@/components/ui/label";
import { ExpressionField } from "@/components/expression-field";
import { makeAttribute } from "@/lib/website-builder";
import { useConfig } from "@/pages/config/context";

export const expressionAttr = makeAttribute({
  name: "expression",
  defaultValue: "",
  validate: (value: string) => value,
  component: ({ value, setValue, disabled }) => {
    const { expressionEnvironment } = useConfig();

    return (
      <div className="w-full space-y-2">
        <Label>Expression</Label>
        <ExpressionField
          value={value}
          onChange={setValue}
          environment={expressionEnvironment}
          placeholder="e.g. score * 2"
          disabled={disabled}
        />
      </div>
    );
  },
});
