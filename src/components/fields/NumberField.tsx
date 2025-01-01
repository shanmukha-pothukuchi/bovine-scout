import { MdNumbers } from "react-icons/md";
import { FormElement } from "../FormElements";
import { useId } from "react";

const defaultProperties = {
  label: "Number Label",
  default: "",
  placeholder: "Number Placeholder",
  required: false,
};

export const NumberField: FormElement<typeof defaultProperties> = {
  type: "NumberField",
  properties: {
    label: {
      name: "Label",
      type: "string",
      description: "The label of the number field",
    },
    default: {
      name: "Default Value",
      type: "number",
      description: "The default value of the number field",
    },
    placeholder: {
      name: "Placeholder",
      type: "string",
      description: "The placeholder of the number field",
    },
    required: {
      name: "Required",
      type: "boolean",
      description: "Whether the number field is required",
    },
  },
  paletteComponent: {
    name: "Number Field",
    icon: MdNumbers,
  },
  builderComponent: ({ instance }) => {
    return <NumberFieldComponent properties={instance.properties} dummy />;
  },
  renderedComponent: ({ instance }) => {
    return <NumberFieldComponent properties={instance.properties} />;
  },
  generateInstance: (id: string) => {
    return {
      id,
      type: "NumberField",
      properties: { ...defaultProperties },
    };
  },
};

// eslint-disable-next-line react-refresh/only-export-components
function NumberFieldComponent({
  properties: { label, required, placeholder, default: defaultValue },
  dummy = false,
}: {
  properties: typeof defaultProperties;
  dummy?: boolean;
}) {
  const inputId = useId();
  return (
    <div className="bg-white w-full p-2 ring-1 ring-gray-800 rounded-sm space-y-1 h-full">
      <label htmlFor={inputId} className="text-xs">
        {label} {required && <span>(Required)</span>}
      </label>
      <input
        type="number"
        className="w-full p-2 border border-gray-300 rounded-sm text-sm"
        placeholder={placeholder}
        defaultValue={defaultValue}
        readOnly={dummy}
        disabled={dummy}
        id={inputId}
      />
    </div>
  );
}
