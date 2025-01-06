import { HTMLAttributes } from "react";
import { formElementInstanceRows, formElements } from "./FormElements";

export function PreviewForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`gap-3 flex flex-col h-full w-full p-3 border border-gray-400 rounded-md ${className}`}
      {...props}
    >
      {formElementInstanceRows.value.map((instance, i) => {
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
