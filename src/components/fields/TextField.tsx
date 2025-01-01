import { MdTextFields } from "react-icons/md";
import { FormElement } from "../FormElements";
import { useId } from "react";

const defaultProperties = {
  label: "Text Label",
  default: "",
  placeholder: "Text Placeholder",
  required: false,
};

export const TextField: FormElement<typeof defaultProperties> = {
  type: "TextField",
  properties: {
    label: {
      name: "Label",
      type: "string",
      description: "The label of the text field",
    },
    default: {
      name: "Default Value",
      type: "string",
      description: "The default value of the text field",
    },
    placeholder: {
      name: "Placeholder",
      type: "string",
      description: "The placeholder of the text field",
    },
    required: {
      name: "Required",
      type: "boolean",
      description: "Whether the text field is required",
    },
  },
  paletteComponent: {
    name: "Text Field",
    icon: MdTextFields,
  },
  builderComponent: ({ instance }) => {
    return <TextFieldComponent properties={instance.properties} dummy />;
  },
  renderedComponent: ({ instance }) => {
    return <TextFieldComponent properties={instance.properties} />;
  },
  generateInstance: (id: string) => {
    return {
      id,
      type: "TextField",
      properties: { ...defaultProperties },
    };
  },
};

// eslint-disable-next-line react-refresh/only-export-components
function TextFieldComponent({
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
        type="text"
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
