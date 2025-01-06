import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  ArrowLeftIcon,
  ChevronLeft,
  Edit2Icon,
  EyeIcon,
  SaveIcon,
  ShareIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLoaderData, useRevalidator } from "react-router";
import { BuilderForm } from "../components/BuilderForm";
import { ElementsPanel } from "../components/ElementsPanel";
import {
  formElementInstanceRows,
  setShowFormPreview,
  showFormPreview,
} from "../components/FormElements";
import { NewForm } from "../components/NewForm";
import { PreviewForm } from "../components/PreviewForm";
import { PropertiesPanel } from "../components/PropertiesPanel";
import { ShareDialog } from "../components/ShareDialog";
import { Button } from "../components/ui/Button";
import { databases } from "../lib/appwrite";
import { FormDocument, UserWithCustomPreferences } from "../lib/router";

export function Builder() {
  const { form } = useLoaderData<{
    user: UserWithCustomPreferences;
    form: FormDocument;
  }>();

  useEffect(() => {
    formElementInstanceRows.value = JSON.parse(form.content);
  }, [form]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const [showEditFormDialog, setShowEditFormDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  return (
    <DndContext sensors={sensors}>
      <div className="w-fit h-screen flex flex-col p-3 gap-3 mx-auto">
        <div className="rounded-md border border-gray-400 p-3 flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            {!showFormPreview.value && (
              <Link to="/">
                <Button variant="outline" className="flex items-center gap-2">
                  <ChevronLeft className="size-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            )}
            <p
              className="flex items-center gap-2 hover:text-gray-600 cursor-pointer"
              onClick={() => setShowEditFormDialog(true)}
            >
              <span className="truncate max-w-[250px]">
                {!showFormPreview.value ? form.name : "Preview"}
              </span>
              <Edit2Icon className="size-4" />
            </p>
          </div>
          <div>
            {showFormPreview.value ? (
              <Button
                className="flex items-center gap-2"
                onClick={() => setShowFormPreview(false)}
              >
                <ArrowLeftIcon className="size-4" /> <span>Back</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <SaveButton formId={form.$id} />
                <Button
                  className="flex items-center gap-2"
                  onClick={() => setShowShareDialog(true)}
                >
                  <ShareIcon className="size-4" /> <span>Share</span>
                </Button>
                <Button
                  className="flex items-center gap-2"
                  onClick={() => setShowFormPreview(true)}
                >
                  <EyeIcon className="size-4" /> <span>Preview</span>
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow flex flex-col overflow-hidden gap-3">
          {showFormPreview.value ? (
            <PreviewForm className="min-w-[600px] max-w-[600px] overflow-y-auto" />
          ) : (
            <div className="flex flex-row gap-3 h-full">
              <ElementsPanel className="w-[300px] overflow-y-auto" />
              <BuilderForm className="w-[600px] overflow-y-auto" />
              <PropertiesPanel className="w-[300px] overflow-y-auto" />
            </div>
          )}
        </div>
      </div>
      <EditFormDialog
        isOpen={showEditFormDialog}
        onClose={() => setShowEditFormDialog(false)}
        existingForm={form}
      />
      <ShareDialog
        formId={form.$id}
        formName={form.name}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />
    </DndContext>
  );
}

function EditFormDialog({
  isOpen,
  onClose,
  existingForm,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingForm?: FormDocument;
}) {
  const revalidator = useRevalidator();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3">
        <DialogPanel>
          <NewForm
            editing={true}
            existingForm={existingForm}
            onSubmit={() => {
              onClose();
              revalidator.revalidate();
            }}
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function SaveButton({ formId }: { formId: string }) {
  const updateFormContent = async () => {
    toast.promise(
      databases.updateDocument(
        import.meta.env.APPWRITE_DB_ID,
        import.meta.env.APPWRITE_FORMS_COLLECTION_ID,
        formId,
        {
          content: JSON.stringify(formElementInstanceRows.value),
        }
      ),
      {
        loading: "Saving form...",
        success: "Form saved successfully",
        error: "Failed to save form",
      }
    );
  };

  return (
    <Button className="flex items-center gap-2" onClick={updateFormContent}>
      <SaveIcon className="size-4" /> <span>Save</span>
    </Button>
  );
}
