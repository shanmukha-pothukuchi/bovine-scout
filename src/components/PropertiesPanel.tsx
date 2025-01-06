import { HTMLAttributes } from "react";
import {
  formElements,
  getFormElementInstance,
} from "../components/FormElements";
import {
  FormElementInstance,
  PropertyType,
  selectedFormElementInstance,
  updateFormElementInstance,
} from "./FormElements";

export function PropertiesPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col h-full text-wrap p-3 border border-gray-400 rounded-md ${className}`}
      {...props}
    >
      {!selectedFormElementInstance.value && (
        <p className="flex flex-grow items-center justify-center text-gray-500">
          Select a form element
        </p>
      )}
      <div className="space-y-2">
        {selectedFormElementInstance.value &&
          Object.entries(
            formElements[selectedFormElementInstance.value.type].properties
          ).map(([id, { name, type, description, ...props }]) => (
            <PropertyField
              key={id}
              id={id}
              name={name}
              type={type}
              description={description}
              options={
                type === "select" && "options" in props
                  ? props.options
                  : undefined
              }
            />
          ))}
      </div>
    </div>
  );
}

function PropertyField({
  id,
  name,
  type,
  description,
  options,
}: {
  id: string;
  name: string;
  type: PropertyType;
  description: string;
  options?: { value: string; label: string }[];
}) {
  const formElementInstance = {
    ...getFormElementInstance(selectedFormElementInstance.value?.id as string),
  } as FormElementInstance<unknown>;
  const props = formElementInstance?.properties as Record<string, unknown>;

  let input = null;
  switch (type) {
    case "boolean":
      input = (
        <input
          type="checkbox"
          id={id}
          checked={props[id] as boolean}
          onChange={(event) => {
            if (formElementInstance) {
              (formElementInstance.properties as Record<string, unknown>)[id] =
                event.target.checked;
              updateFormElementInstance(formElementInstance);
            }
          }}
        />
      );
      break;
    case "number":
      input = (
        <input
          className="w-full p-2 border border-gray-300 rounded-sm text-sm"
          type="number"
          id={id}
          value={props[id] as number}
          onChange={(event) => {
            if (formElementInstance) {
              (formElementInstance.properties as Record<string, unknown>)[id] =
                event.target.valueAsNumber;
              updateFormElementInstance(formElementInstance);
            }
          }}
        />
      );
      break;
    case "select":
      input = (
        <select
          className="w-full p-2 border border-gray-300 rounded-sm text-sm"
          id={id}
          defaultValue={props[id] as string}
          onChange={(event) => {
            if (formElementInstance) {
              (formElementInstance.properties as Record<string, unknown>)[id] =
                event.target.value;
              updateFormElementInstance(formElementInstance);
            }
          }}
        >
          {options &&
            options.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
      );
      break;
    case "array":
      input = (
        <ArrayPropertyField
          id={id}
          value={(props[id] as string[]) || []}
          onChange={(newValue) => {
            if (formElementInstance) {
              (formElementInstance.properties as Record<string, unknown>)[id] =
                newValue;
              updateFormElementInstance(formElementInstance);
            }
          }}
        />
      );
      break;
    case "string":
    case "any":
    default:
      input = (
        <input
          className="w-full p-2 border border-gray-300 rounded-sm text-sm"
          type="text"
          id={id}
          value={props[id] as string}
          onChange={(event) => {
            if (formElementInstance) {
              (formElementInstance.properties as Record<string, unknown>)[id] =
                event.target.value;
              updateFormElementInstance(formElementInstance);
            }
          }}
        />
      );
      break;
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <label htmlFor={id} className="text-xs">
        {name}
      </label>
      {input}
      <p className="text-xs">{description}</p>
    </div>
  );
}

import { PlusCircle, Trash2 } from "lucide-react";

function ArrayPropertyField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const handleAdd = () => {
    onChange([...value, ""]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, newValue: string) => {
    const newArray = [...value];
    newArray[index] = newValue;
    onChange(newArray);
  };

  return (
    <div className="flex flex-col gap-2" id={id}>
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            className="flex-grow p-2 border border-gray-300 rounded-sm text-sm"
            type="text"
            value={item}
            onChange={(e) => handleChange(index, e.target.value)}
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="p-1 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
      >
        <PlusCircle className="w-4 h-4" />
        Add Item
      </button>
    </div>
  );
}
