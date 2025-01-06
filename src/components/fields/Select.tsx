import { ListIcon } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
} from "react";
import { string, ValidationError } from "yup";
import {
  FormElement,
  FormElementImperativeHandle,
  formElements,
  FormValidationResponse,
  UpdateFormValue,
} from "../FormElements";

interface SelectProps {
  label: string;
  options: Array<string>;
  default: string;
  required?: boolean;
  placeholder?: string;
}

const defaultProperties: SelectProps = {
  label: "Select Label",
  options: ["option1", "option2"],
  default: "",
  required: false,
  placeholder: "Select an option",
};

export const Select: FormElement<SelectProps, "string"> = {
  type: "Select",
  properties: {
    label: {
      type: "string",
      name: "Label",
      description: "Label for the select field",
    },
    options: {
      type: "array",
      name: "Options",
      description: "List of options for the select field",
    },
    default: {
      type: "string",
      name: "Default",
      description: "Default selected value",
    },
    required: {
      type: "boolean",
      name: "Required",
      description: "Whether selecting an option is required",
    },
    placeholder: {
      type: "string",
      name: "Placeholder",
      description: "Placeholder text when no option is selected",
    },
  },
  paletteComponent: {
    name: "Select",
    icon: ListIcon,
  },
  builderComponent: ({ instance }) => {
    return <SelectComponent properties={instance.properties} dummy />;
  },
  renderedComponent: forwardRef(({ instance, updateFormValue }, ref) => {
    return (
      <SelectComponent
        ref={ref}
        formValidate={(value: unknown) =>
          formElements[instance.type].validate(instance, value)
        }
        properties={instance.properties}
        updateFormValue={updateFormValue}
      />
    );
  }),
  generateInstance: (id) => ({
    id,
    type: "Select",
    properties: { ...defaultProperties },
  }),
  validate: ({ properties }, value) => {
    let schema = string();

    if (properties.required) {
      schema = schema.required("This field is required.");
    }

    try {
      schema.validateSync(value);
      return { error: false };
    } catch (err) {
      const error: FormValidationResponse = { error: true };
      if (err instanceof ValidationError) {
        return { ...error, message: err.message };
      }
      return error;
    }
  },
};

// eslint-disable-next-line react-refresh/only-export-components
const SelectComponent = forwardRef<
  FormElementImperativeHandle,
  {
    properties: SelectProps;
    formValidate?: (value: unknown) => FormValidationResponse;
    updateFormValue?: UpdateFormValue<"string">;
    dummy?: boolean;
  }
>(
  (
    {
      properties: {
        label,
        options,
        default: defaultValue,
        required,
        placeholder,
      },
      formValidate,
      updateFormValue,
      dummy,
    },
    ref
  ) => {
    const [selectedValue, setSelectedValue] = useState(defaultValue);
    const [validation, setValidation] = useState<FormValidationResponse>({
      error: false,
    });
    const selectId = useId();

    const validate = () => {
      if (!formValidate) return true;
      const res = formValidate(selectedValue);
      setValidation(res);
      return !res.error;
    };

    useImperativeHandle(ref, () => ({
      validate,
    }));

    useEffect(() => {
      if (!dummy && updateFormValue) updateFormValue(selectedValue);
    }, [selectedValue, dummy, updateFormValue]);

    useEffect(() => {
      setSelectedValue(defaultValue);
    }, [defaultValue]);

    return (
      <div className="bg-white w-full p-2 ring-1 ring-gray-400 rounded-sm space-y-1 min-h-full">
        <label htmlFor={selectId} className="text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={selectId}
          value={selectedValue}
          onChange={(e) => setSelectedValue(e.target.value)}
          onBlur={validate}
          disabled={dummy}
          className={`w-full p-2 border rounded-sm text-sm ${
            validation.error ? "border-red-400" : "border-gray-300"
          } ${dummy ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, i) => (
            <option key={i} value={option}>
              {option}
            </option>
          ))}
        </select>
        {validation.error && (
          <p className="text-red-500 text-xs">{validation.message}</p>
        )}
      </div>
    );
  }
);

SelectComponent.displayName = "SelectComponent";
