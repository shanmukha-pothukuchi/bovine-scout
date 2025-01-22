import { CalculatorIcon } from "lucide-react";
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

interface CounterProps {
  label: string;
  default: number;
  incrementBy: number;
  decrementBy: number;
  layout: "vertical" | "horizontal";
  required?: boolean;
  min?: number;
  max?: number;
}

const defaultProperties: CounterProps = {
  label: "Number Label",
  default: 0,
  incrementBy: 1,
  decrementBy: 1,
  layout: "vertical",
  required: false,
  min: undefined,
  max: undefined,
};

export const Counter: FormElement<CounterProps, number> = {
  type: "Counter",
  properties: {
    label: {
      type: "string",
      name: "Label",
      description: "Label for the counter",
    },
    default: {
      type: "number",
      name: "Default",
      description: "Default value for the counter",
    },
    incrementBy: {
      type: "number",
      name: "Increment By",
      description: "Value to increment by",
    },
    decrementBy: {
      type: "number",
      name: "Decrement By",
      description: "Value to decrement by",
    },
    layout: {
      type: "select",
      name: "Layout",
      description: "Layout of the counter",
      options: [
        { value: "vertical", label: "Vertical" },
        { value: "horizontal", label: "Horizontal" },
      ],
    },
    required: {
      type: "boolean",
      name: "Required",
      description: "Whether the counter value is required",
    },
    min: {
      type: "number",
      name: "Minimum",
      description: "Minimum allowed value",
    },
    max: {
      type: "number",
      name: "Maximum",
      description: "Maximum allowed value",
    },
  },
  paletteComponent: {
    name: "Counter",
    icon: CalculatorIcon,
  },
  builderComponent: ({ instance }) => {
    return <CounterComponent properties={instance.properties} dummy />;
  },
  renderedComponent: forwardRef(({ instance, updateFormValue }, ref) => {
    return (
      <CounterComponent
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
    type: "Counter",
    properties: { ...defaultProperties },
  }),
  validate: ({ properties }, value) => {
    let schema = number();

    if (properties.required) {
      schema = schema.required("This field is required.");
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

function getNumWithSign(value: number) {
  return (value < 0 ? "-" : value > 0 ? "+" : "") + Math.abs(value);
}

// eslint-disable-next-line react-refresh/only-export-components
const CounterComponent = forwardRef<
  FormElementImperativeHandle,
  {
    properties: CounterProps;
    formValidate?: (value: unknown) => FormValidationResponse;
    updateFormValue?: UpdateFormValue<number>;
    dummy?: boolean;
  }
>(
  (
    {
      properties: {
        label,
        default: defaultValue,
        incrementBy,
        decrementBy,
        layout,
        required,
        min,
        max,
      },
      formValidate,
      updateFormValue,
      dummy,
    },
    ref
  ) => {
    const [count, setCount] = useState(defaultValue);
    const [validation, setValidation] = useState<FormValidationResponse>({
      error: false,
    });
    const inputId = useId();

    const validate = () => {
      if (!formValidate) return true;
      const res = formValidate(count);
      setValidation(res);
      return !res.error;
    };

    useImperativeHandle(ref, () => ({
      validate,
    }));

    useEffect(() => {
      if (!dummy && updateFormValue) updateFormValue(count);
    }, [count, dummy, updateFormValue]);

    useEffect(() => {
      setCount(defaultValue);
    }, [defaultValue]);

    const handleIncrement = () => {
      setCount((prevCount) => {
        const newValue = prevCount + incrementBy;
        return max !== undefined ? Math.min(newValue, max) : newValue;
      });
    };

    const handleDecrement = () => {
      setCount((prevCount) => {
        const newValue = prevCount - decrementBy;
        return min !== undefined ? Math.max(newValue, min) : newValue;
      });
    };

    return (
      <div className="bg-white w-full p-2 ring-1 ring-gray-400 rounded-sm space-y-1 min-h-full">
        <label htmlFor={inputId} className="text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className={`flex ${layout === "vertical" && "flex-col"} gap-2 w-full`}
        >
          <button
            onClick={handleDecrement}
            disabled={dummy || (max !== undefined && count >= max)}
            className={`border p-2 border-gray-300 rounded-sm text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-1 ${
              layout === "horizontal" && "w-1/3"
            }`}
          >
            {getNumWithSign(-decrementBy)}
          </button>
          <input
            type="number"
            id={inputId}
            value={count}
            readOnly
            className={`${
              layout === "horizontal" && "w-1/3"
            } border p-2 rounded-sm text-sm text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              validation.error ? "border-red-400" : "border-gray-300"
            }`}
            style={{ textAlign: "center" }}
            onBlur={validate}
          />
          <button
            onClick={handleIncrement}
            disabled={dummy || (max !== undefined && count >= max)}
            className={`border p-2 border-gray-300 rounded-sm text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-1 ${
              layout === "horizontal" && "w-1/3"
            }`}
          >
            {getNumWithSign(incrementBy)}
          </button>
        </div>
        {validation.error && (
          <p className="text-red-500 text-sm">{validation.message}</p>
        )}
      </div>
    );
  }
);

CounterComponent.displayName = "CounterComponent";
