import { StarIcon } from "lucide-react";
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

interface RatingProps {
  label: string;
  maxRating: number;
  required?: boolean;
  default?: number;
  showNumber?: boolean;
}

const defaultProperties: RatingProps = {
  label: "Rating",
  maxRating: 5,
  required: false,
  default: 0,
};

export const Rating: FormElement<RatingProps, number> = {
  type: "Rating",
  properties: {
    label: {
      type: "string",
      name: "Label",
      description: "Label for the rating",
    },
    maxRating: {
      type: "number",
      name: "Maximum Rating",
      description: "Maximum rating value",
    },
    required: {
      type: "boolean",
      name: "Required",
      description: "Whether rating is required",
    },
    default: {
      type: "number",
      name: "Default",
      description: "Default rating value",
    },
    showNumber: {
      type: "boolean",
      name: "Show Number",
      description: "Show numerical value",
    },
  },
  paletteComponent: {
    name: "Rating",
    icon: StarIcon,
  },
  builderComponent: ({ instance }) => {
    return <RatingComponent properties={instance.properties} dummy />;
  },
  renderedComponent: forwardRef(({ instance, updateFormValue }, ref) => {
    return (
      <RatingComponent
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
    type: "Rating",
    properties: { ...defaultProperties },
  }),
  validate: ({ properties }, value) => {
    let schema = number();

    if (properties.required) {
      schema = schema.required("This field is required");
    }

    schema = schema
      .min(0, "Rating cannot be negative")
      .max(
        properties.maxRating,
        `Rating cannot exceed ${properties.maxRating}`
      );

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
const RatingComponent = forwardRef<
  FormElementImperativeHandle,
  {
    properties: RatingProps;
    formValidate?: (value: unknown) => FormValidationResponse;
    updateFormValue?: UpdateFormValue<number>;
    dummy?: boolean;
  }
>(
  (
    {
      properties: {
        label,
        maxRating,
        required,
        default: defaultValue = 0,
        showNumber,
      },
      formValidate,
      updateFormValue,
      dummy,
    },
    ref
  ) => {
    const [hover, setHover] = useState<number>(-1);
    const [rating, setRating] = useState(defaultValue);
    const [validation, setValidation] = useState<FormValidationResponse>({
      error: false,
    });
    const inputId = useId();

    const validate = () => {
      if (!formValidate) return true;
      const res = formValidate(rating);
      setValidation(res);
      return !res.error;
    };

    useImperativeHandle(ref, () => ({
      validate,
    }));

    useEffect(() => {
      if (!dummy && updateFormValue) updateFormValue(rating / maxRating);
    }, [rating, dummy, maxRating, updateFormValue]);

    useEffect(() => {
      setRating(defaultValue);
    }, [defaultValue]);

    const handleClick = (value: number) => {
      if (dummy) return;
      setRating(value);
      validate();
    };

    return (
      <div className="bg-white w-full p-2 ring-1 ring-gray-400 rounded-sm space-y-1 min-h-full">
        <label htmlFor={inputId} className="text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className="flex justify-center items-end space-x-1"
          onMouseLeave={() => setHover(-1)}
        >
          {[...Array(maxRating || 0)].map((_, i) => (
            <StarIcon
              key={i}
              className={`cursor-pointer ${
                rating <= i
                  ? "text-gray-400"
                  : "text-yellow-500 fill-yellow-500"
              } ${i <= hover ? "text-yellow-500" : ""} w-5 h-5`}
              onClick={() => handleClick(i + 1)}
              onMouseEnter={() => setHover(i)}
            />
          ))}
          {showNumber && (
            <p className="text-xs text-gray-400 tabular-nums">
              {rating}/{maxRating}
            </p>
          )}
        </div>
        {validation.error && (
          <p className="text-red-500 text-sm">{validation.message}</p>
        )}
      </div>
    );
  }
);

RatingComponent.displayName = "RatingComponent";
