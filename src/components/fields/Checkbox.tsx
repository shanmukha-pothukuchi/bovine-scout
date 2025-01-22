import { CheckSquareIcon } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
} from "react";
import { boolean, ValidationError } from "yup";
import {
  FormElement,
  FormElementImperativeHandle,
  formElements,
  FormValidationResponse,
  UpdateFormValue,
} from "../FormElements";

interface CheckboxProps {
  label: string;
  default: boolean;
  description: string;
  required: boolean;
}

const defaultProperties: CheckboxProps = {
  label: "Checkbox Label",
  default: false,
  description: "Checkbox description",
  required: false,
};

export const Checkbox: FormElement<CheckboxProps, boolean> = {
  type: "Checkbox",
  properties: {
    label: {
      type: "string",
      name: "Label",
      description: "Label for the checkbox",
    },
    default: {
      type: "boolean",
      name: "Default",
      description: "Default checked state",
    },
    description: {
      type: "string",
      name: "Description",
      description: "Helper text below the checkbox",
    },
    required: {
      type: "boolean",
      name: "Required",
      description: "Whether the checkbox is required",
    },
  },
  paletteComponent: {
    name: "Checkbox",
    icon: CheckSquareIcon,
  },
  builderComponent: ({ instance }) => {
    return <CheckboxComponent properties={instance.properties} dummy />;
  },
  renderedComponent: forwardRef(({ instance, updateFormValue }, ref) => {
    return (
      <CheckboxComponent
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
    type: "Checkbox",
    properties: { ...defaultProperties },
  }),
  validate: ({ properties }, value) => {
    let schema = boolean();
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
const CheckboxComponent = forwardRef<
  FormElementImperativeHandle,
  {
    properties: CheckboxProps;
    formValidate?: (value: unknown) => FormValidationResponse;
    updateFormValue?: UpdateFormValue<boolean>;
    dummy?: boolean;
  }
>(
  (
    {
      properties: { label, default: defaultValue, description, required },
      updateFormValue,
      dummy,
      formValidate,
    },
    ref
  ) => {
    const [checked, setChecked] = useState(defaultValue);
    const [validation, setValidation] = useState<FormValidationResponse>({
      error: false,
    });
    const inputId = useId();

    const validate = () => {
      if (!formValidate) return true;
      const res = formValidate(checked);
      setValidation(res);
      return res.error;
    };

    useImperativeHandle(ref, () => ({
      validate,
    }));

    useEffect(() => {
      if (!dummy && updateFormValue) updateFormValue(checked);
    }, [checked, dummy, updateFormValue]);

    useEffect(() => {
      setChecked(defaultValue);
    }, [defaultValue]);

    return (
      <div className="bg-white w-full p-2 ring-1 ring-gray-400 min-h-full rounded-sm space-y-1">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={inputId}
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            disabled={dummy}
            required={required}
            className={`"h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              validation.error && "border-red-400"
            }`}
            onBlur={validate}
          />
          <label htmlFor={inputId} className="text-sm text-gray-600 flex-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        </div>
        {description && <div className="text-xs">{description}</div>}
        {validation.error && (
          <p className="text-red-500 text-sm">{validation.message}</p>
        )}
      </div>
    );
  }
);

CheckboxComponent.displayName = "CheckboxComponent";
