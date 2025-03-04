import { FileEditIcon } from "lucide-react";
import { createRef, useRef } from "react";
import { Link, useLoaderData } from "react-router";
import {
  FormElementImperativeHandle,
  FormElementInstanceRow,
  formElements,
} from "../components/FormElements";
import { Button } from "../components/ui/Button";
import { FormDocument, UserWithCustomPreferences } from "../lib/router";

export function Form() {
  const { form, user } = useLoaderData<{
    form: FormDocument;
    user: UserWithCustomPreferences;
  }>();
  const formData: FormElementInstanceRow[] = JSON.parse(form.content);

  const formElementRefs = useRef<
    React.RefObject<FormElementImperativeHandle>[]
  >(formData.flat().map(() => createRef<FormElementImperativeHandle>()));

  const submitHandler = () => {
    let isValid = true;

    for (const elementRef of formElementRefs.current) {
      const res = elementRef.current?.validate();
      isValid = isValid && (res ?? true);
    }

    console.log(formValues.current);

    if (isValid) {
      console.log("Submitting form");
    }
  };

  const formValues = useRef<{ [key: string]: unknown }>({});

  const updateFormValue = (id: string) => {
    return (value: unknown) => {
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
      {form.createdBy === user?.$id && (
        <Link
          to={`/forms/${form.$id}/edit`}
          className="fixed bottom-0 right-0 m-4"
        >
          <Button className="flex items-center gap-2">
            <FileEditIcon className="size-4" />
            <span>Edit Form</span>
          </Button>
        </Link>
      )}
    </div>
  );
}
