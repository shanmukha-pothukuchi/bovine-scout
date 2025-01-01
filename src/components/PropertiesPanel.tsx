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
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col h-full text-wrap p-3 border-2 border-gray-400 rounded-md ${className}`}
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
          ).map(([id, { name, type, description }]) => (
            <PropertyField
              key={id}
              id={id}
              name={name}
              type={type}
              description={description}
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
}: {
  id: string;
  name: string;
  type: PropertyType;
  description: string;
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
