import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FiEye, FiUpload } from "react-icons/fi";
import { IoMdArrowBack } from "react-icons/io";
import { BuilderForm } from "../components/BuilderForm";
import { ElementsPanel } from "../components/ElementsPanel";
import {
  setShowFormPreview,
  showFormPreview,
} from "../components/FormElements";
import { PreviewForm } from "../components/PreviewForm";
import { PropertiesPanel } from "../components/PropertiesPanel";

export function Builder() {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  return (
    <DndContext sensors={sensors}>
      <div className="w-fit h-screen flex flex-col p-3 gap-3 mx-auto">
        <div className="rounded-md border-2 border-gray-400 p-3 flex flex-row justify-between items-center">
          <p>Form {showFormPreview.value ? "Preview" : "Builder"}</p>
          <div>
            {showFormPreview.value ? (
              <button
                onClick={() => setShowFormPreview(false)}
                className="flex items-center gap-1.5 bg-black text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition duration-300"
              >
                <IoMdArrowBack /> <span>Back</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFormPreview(true)}
                  className="flex items-center gap-1.5 bg-black text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition duration-300"
                >
                  <FiUpload /> <span>Publish</span>
                </button>
                <button
                  onClick={() => setShowFormPreview(true)}
                  className="flex items-center gap-1.5 bg-black text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition duration-300"
                >
                  <FiEye /> <span>Preview</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow flex flex-col overflow-hidden gap-3">
          {showFormPreview.value ? (
            <PreviewForm className="min-w-[600px] max-w-[600px] overflow-y-auto" />
          ) : (
            <div className="flex flex-row gap-3 h-full">
              <ElementsPanel className="w-[250px] overflow-y-auto" />
              <BuilderForm className="w-[600px] overflow-y-auto" />
              <PropertiesPanel className="w-[250px] overflow-y-auto" />
            </div>
          )}
        </div>
      </div>
    </DndContext>
  );
}
