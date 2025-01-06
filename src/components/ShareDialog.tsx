import { Dialog, DialogPanel } from "@headlessui/react";
import { Button } from "./ui/Button";
import toast from "react-hot-toast";

export function ShareDialog({
  isOpen,
  onClose,
  formId,
  formName,
}: {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formName: string;
}) {
  const shareUrl = `${window.location.origin}/forms/${formId}`;

  const copyToClipboard = async () => {
    try {
      toast.promise(navigator.clipboard.writeText(shareUrl), {
        loading: "Copying to clipboard...",
        success: "Successfully copied to clipboard",
        error: "Failed to Copy to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3">
        <DialogPanel className="border border-gray-400 bg-white rounded-lg p-4 max-w-md w-full flex flex-col gap-3">
          <h3 className="text-lg font-semibold line-clamp-2">
            Share {formName || "Form"}
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 p-2 border rounded-md text-gray-600"
            />
            <Button onClick={copyToClipboard}>Copy</Button>
          </div>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
