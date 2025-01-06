import { createRef, useRef } from "react";
import { useLoaderData } from "react-router";
import {
  FormElementImperativeHandle,
  FormElementInstanceRow,
  formElements,
  ReturnType,
  ReturnTypeToTSType,
} from "../components/FormElements";
import { Button } from "../components/ui/Button";
import { FormDocument } from "../lib/router";

export function Form() {
  const {
    form: { content: formContent },
  } = useLoaderData<{ form: FormDocument }>();
  const formData: FormElementInstanceRow[] = JSON.parse(formContent);

  const formElementRefs = useRef<
    React.RefObject<FormElementImperativeHandle>[]
  >(formData.flat().map(() => createRef<FormElementImperativeHandle>()));

  const submitHandler = () => {
    let isValid = true;

    for (const elementRef of formElementRefs.current) {
      const res = elementRef.current?.validate();
      isValid = isValid && (res ?? true);
    }
  };

  const formValues = useRef<{ [key: string]: ReturnTypeToTSType[ReturnType] }>(
    {}
  );

  const updateFormValue = (id: string) => {
    return (value: ReturnTypeToTSType[ReturnType]) => {
      formValues.current[id] = value;
    };
  };

  let refIndex = 0;

  return (
    <div className="w-fit h-screen flex flex-col p-3 mx-auto gap-3">
      <div className="min-w-[600px] max-w-[600px] overflow-y-auto gap-3 flex flex-col h-full p-3 border border-gray-400 rounded-md">
        {formData.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-row gap-3">
            {row.map((instance) => {
              const RenderedComponent =
                formElements[instance.type].renderedComponent;

              const ref = formElementRefs.current[refIndex];
              refIndex += 1;

              return (
                <RenderedComponent
                  key={instance.id}
                  instance={instance}
                  updateFormValue={updateFormValue(instance.id)}
                  ref={ref}
                />
              );
            })}
          </div>
        ))}
      </div>
      <Button className="text-center" onClick={submitHandler}>
        Submit
      </Button>
    </div>
  );
}
