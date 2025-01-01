import { HTMLAttributes } from "react";
import { formElementInstances, formElements } from "./FormElements";

export function PreviewForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`gap-3 flex flex-col h-full w-full p-3 border-2 border-gray-400 rounded-md ${className}`}
      {...props}
    >
      {formElementInstances.value.map((instance, i) => {
        return (
          <div key={i} className="flex flex-row gap-3">
            {instance.map((subInstance) => {
              const RenderedComponent =
                formElements[subInstance.type].renderedComponent;
              return (
                <RenderedComponent
                  key={subInstance.id}
                  instance={subInstance}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
