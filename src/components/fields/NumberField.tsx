import { HashIcon } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
} from "react";
import { number, ValidationError } from "yup";
import {
  FormElement,
  FormElementImperativeHandle,
  formElements,
  FormValidationResponse,
  UpdateFormValue,
} from "../FormElements";

interface NumberFieldProps {
  label: string;
  default: number | null;
  placeholder: string;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
}

const defaultProperties: NumberFieldProps = {
  label: "Number Label",
  default: null,
  placeholder: "Number Placeholder",
  required: false,
  min: undefined,
  max: undefined,
  step: undefined,
};

export const NumberField: FormElement<NumberFieldProps, "number"> = {
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
    min: {
      name: "Minimum",
      type: "number",
      description: "The minimum value allowed",
    },
    max: {
      name: "Maximum",
      type: "number",
      description: "The maximum value allowed",
    },
    step: {
      name: "Step",
      type: "number",
      description: "The increment/decrement step value",
    },
  },
  paletteComponent: {
    name: "Number Field",
    icon: HashIcon,
  },
  builderComponent: ({ instance }) => {
    return <NumberFieldComponent properties={instance.properties} dummy />;
  },
  renderedComponent: forwardRef(({ instance, updateFormValue }, ref) => {
    return (
      <NumberFieldComponent
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
      type: "NumberField",
      properties: { ...defaultProperties },
    };
  },
  validate: ({ properties }, value) => {
    let schema = number();

    if (properties.required) {
      schema = schema.required("This field is required");
    }

    if (properties.min !== undefined) {
      schema = schema.min(properties.min, `Must be at least ${properties.min}`);
    }

    if (properties.max !== undefined) {
      schema = schema.max(properties.max, `Must not exceed ${properties.max}`);
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
const NumberFieldComponent = forwardRef<
  FormElementImperativeHandle,
  {
    properties: NumberFieldProps;
    formValidate?: (value: unknown) => FormValidationResponse;
    updateFormValue?: UpdateFormValue<"number">;
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
        min,
        max,
        step,
      },
      formValidate,
      updateFormValue,
      dummy = false,
    },
    ref
  ) => {
    const [value, setValue] = useState<number | null>(defaultValue);
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
        updateFormValue(value!);
      }
    }, [value, dummy, updateFormValue]);

    useEffect(() => {
      setValue(defaultValue);
    }, [defaultValue]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue =
        event.target.value === "" ? null : parseFloat(event.target.value);
      setValue(newValue);
    };

    return (
      <div className="bg-white w-full p-2 ring-1 ring-gray-400 rounded-sm space-y-1 min-h-full">
        <div className="text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </div>
        <input
          id={inputId}
          type="number"
          className={`w-full p-2 border rounded-sm text-sm ${
            validation.error ? "border-red-400" : "border-gray-300"
          }`}
          placeholder={placeholder}
          value={value === null ? "" : value}
          readOnly={dummy}
          disabled={dummy}
          min={min}
          max={max}
          step={step}
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

NumberFieldComponent.displayName = "NumberFieldComponent";
