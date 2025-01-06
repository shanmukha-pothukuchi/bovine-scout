import { Dialog, DialogPanel } from "@headlessui/react";
import { Query } from "appwrite";
import {
  CalendarIcon,
  EyeIcon,
  FilePlus2Icon,
  PencilIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { NewForm } from "../components/NewForm";
import { ShareDialog } from "../components/ShareDialog";
import { Button } from "../components/ui/Button";
import { databases } from "../lib/appwrite";
import { FormDocument, UserWithCustomPreferences } from "../lib/router";

type QueriedDocument = Omit<FormDocument, "content" | "createdBy">;

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  formName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formName: string;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3">
        <DialogPanel className="border border-gray-400 bg-white rounded-lg p-4 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-2">Delete Form</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete "{formName}"? This action cannot be
            undone.
          </p>
          <div className="flex gap-2">
            <Button onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function FormCard({
  form,
  onDelete,
}: {
  form: QueriedDocument;
  onDelete?: () => void;
}) {
  const navigate = useNavigate();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formattedDate = new Date(form.$createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDelete = async () => {
    try {
      await databases.deleteDocument(
        import.meta.env.APPWRITE_DB_ID,
        import.meta.env.APPWRITE_FORMS_COLLECTION_ID,
        form.$id
      );
      if (onDelete) onDelete();
    } catch (error) {
      console.error("Failed to delete form:", error);
    }
  };

  return (
    <>
      <div
        onClick={() => navigate(`/forms/${form.$id}/edit`)}
        className="border border-gray-300 rounded-md p-3 hover:border-gray-400 transition-colors cursor-pointer relative group"
      >
        <div className="flex flex-col gap-3 mb-12">
          <h2 className="text-xl font-semibold text-gray-800 line-clamp-2">
            {form.name}
          </h2>
          <p className="text-gray-600 line-clamp-4 h-4">{form.description}</p>
        </div>
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <Button
              className="flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setShowShareDialog(true);
              }}
            >
              <ShareIcon className="w-4 h-4" />
              <span>Share</span>
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/forms/${form.$id}`);
              }}
            >
              <EyeIcon className="w-4 h-4" />
              <span>View Live</span>
            </Button>
          </div>
          <Button
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
          >
            <Trash2Icon className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm text-gray-500">
          <CalendarIcon className="w-4 h-4" />
          <span>{formattedDate}</span>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-2 text-sm text-gray-500">
          <PencilIcon className="w-4 h-4" />
          <span>Click to edit</span>
        </div>
      </div>
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        formId={form.$id}
        formName={form.name}
      />
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        formName={form.name}
      />
    </>
  );
}

function NewFormDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3">
        <DialogPanel>
          <NewForm />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export function Dashboard() {
  const { user } = useLoaderData<{ user: UserWithCustomPreferences }>();
  const [showNewFormDialog, setShowNewFormDialog] = useState(false);
  const [forms, setForms] = useState<QueriedDocument[]>([]);

  const fetchForms = useCallback(async () => {
    setForms(
      (
        await databases.listDocuments(
          import.meta.env.APPWRITE_DB_ID,
          import.meta.env.APPWRITE_FORMS_COLLECTION_ID,
          [
            Query.equal("createdBy", user.$id),
            Query.select(["$id", "$createdAt", "name", "description"]),
          ]
        )
      ).documents
    );
  }, [user.$id]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to your forms dashboard!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {forms.map((form, i) => (
            <FormCard
              key={form.$id}
              form={form}
              onDelete={() => {
                setForms(forms.filter((_, idx) => idx !== i));
              }}
            />
          ))}
        </div>

        <Button
          className="flex items-center gap-2 fixed bottom-0 right-0 m-4"
          onClick={() => setShowNewFormDialog(true)}
        >
          <FilePlus2Icon className="size-4" />
          <span>New Form</span>
        </Button>
      </div>

      <NewFormDialog
        isOpen={showNewFormDialog}
        onClose={() => setShowNewFormDialog(false)}
      />
    </div>
  );
}
