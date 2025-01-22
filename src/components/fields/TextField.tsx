import { TypeIcon } from "lucide-react";
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

interface TextFieldProps {
  label: string;
  default: string;
  placeholder: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

const defaultProperties: TextFieldProps = {
  label: "Text Label",
  default: "",
  placeholder: "Text Placeholder",
  required: false,
  minLength: undefined,
  maxLength: undefined,
  pattern: undefined,
};

export const TextField: FormElement<TextFieldProps, string> = {
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
    minLength: {
      name: "Minimum Length",
      type: "number",
      description: "The minimum length of the text",
    },
    maxLength: {
      name: "Maximum Length",
      type: "number",
      description: "The maximum length of the text",
    },
    pattern: {
      name: "Pattern",
      type: "string",
      description: "Regular expression pattern for validation",
    },
  },
  paletteComponent: {
    name: "Text Field",
    icon: TypeIcon,
  },
  builderComponent: ({ instance }) => {
    return <TextFieldComponent properties={instance.properties} dummy />;
  },
  renderedComponent: forwardRef(({ instance, updateFormValue }, ref) => {
    return (
      <TextFieldComponent
        ref={ref}
        formValidate={(value: unknown) =>
          formElements[instance.type].validate(instance, value)
        }
        properties={instance.properties}
        updateFormValue={updateFormValue}
      />
    );
  }),
  generateInstance: (id: string) => {
    return {
      id,
      type: "TextField",
      properties: { ...defaultProperties },
    };
  },
  validate: ({ properties }, value) => {
    let schema = string();

    if (properties.required) {
      schema = schema.required("This field is required");
    }

    if (properties.minLength !== undefined) {
      schema = schema.min(
        properties.minLength,
        `Must be at least ${properties.minLength} characters`
      );
    }

    if (properties.maxLength !== undefined) {
      schema = schema.max(
        properties.maxLength,
        `Must not exceed ${properties.maxLength} characters`
      );
    }

    if (properties.pattern) {
      try {
        const regex = new RegExp(properties.pattern);
        schema = schema.matches(regex, "Must match the specified pattern");
      } catch (error) {
        console.error("Invalid regex pattern:", error);
      }
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
const TextFieldComponent = forwardRef<
  FormElementImperativeHandle,
  {
    properties: TextFieldProps;
    formValidate?: (value: unknown) => FormValidationResponse;
    updateFormValue?: UpdateFormValue<string>;
    dummy?: boolean;
  }
>(
  (
    {
      properties: {
        label,
        required,
        placeholder,
        default: defaultValue,
        minLength,
        maxLength,
        pattern,
      },
      formValidate,
      updateFormValue,
      dummy = false,
    },
    ref
  ) => {
    const [value, setValue] = useState(defaultValue);
    const [validation, setValidation] = useState<FormValidationResponse>({
      error: false,
    });
    const inputId = useId();

    const validate = () => {
      if (!formValidate) return true;
      const res = formValidate(value);
      setValidation(res);
      return !res.error;
    };

    useImperativeHandle(ref, () => ({
      validate,
    }));

    useEffect(() => {
      if (!dummy && updateFormValue) {
        updateFormValue(value);
      }
    }, [value, dummy, updateFormValue]);

    useEffect(() => {
      setValue(defaultValue);
    }, [defaultValue]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    };

    return (
      <div className="bg-white w-full p-2 ring-1 ring-gray-400 rounded-sm space-y-1 min-h-full">
        <div className="text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </div>
        <input
          id={inputId}
          type="text"
          className={`w-full p-2 border rounded-sm text-sm ${
            validation.error ? "border-red-400" : "border-gray-300"
          }`}
          placeholder={placeholder}
          value={value}
          readOnly={dummy}
          disabled={dummy}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          onChange={handleChange}
          onBlur={validate}
        />
        {validation.error && (
          <p className="text-red-500 text-xs">{validation.message}</p>
        )}
      </div>
    );
  }
);

TextFieldComponent.displayName = "TextFieldComponent";
