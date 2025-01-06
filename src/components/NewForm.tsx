import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useLoaderData, useNavigate } from "react-router";

import { HTMLAttributes } from "react";
import toast from "react-hot-toast";
import { InferType, object, string } from "yup";
import { databases, ID } from "../lib/appwrite";
import { FormDocument, UserWithCustomPreferences } from "../lib/router";
import { Button } from "./ui/Button";

export function NewForm({
  editing,
  existingForm,
  className,
  onSubmit,
  ...props
}: {
  editing?: boolean;
  existingForm?: FormDocument;
  onSubmit?: () => void;
} & HTMLAttributes<HTMLDivElement>) {
  const { user } = useLoaderData<{ user: UserWithCustomPreferences }>();

  const newFormSchema = object({
    name: string().required().max(255),
    description: string().max(1025),
  });

  type NewForm = InferType<typeof newFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<NewForm>({
    resolver: yupResolver(newFormSchema),
  });

  const navigate = useNavigate();

  const submitHandler = async (data: NewForm) => {
    try {
      if (!editing) {
        const document = await toast.promise(
          databases.createDocument(
            import.meta.env.APPWRITE_DB_ID,
            import.meta.env.APPWRITE_FORMS_COLLECTION_ID,
            ID.unique(),
            { ...data, createdBy: user.$id }
          ),
          {
            loading: "Creating form...",
            success: "Form created successfully",
            error: "Failed to create form",
          }
        );
        navigate(`/forms/${document.$id}/edit`);
      } else if (existingForm) {
        toast.promise(
          databases.updateDocument(
            import.meta.env.APPWRITE_DB_ID,
            import.meta.env.APPWRITE_FORMS_COLLECTION_ID,
            existingForm.$id,
            { ...data }
          ),
          {
            loading: "Saving form...",
            success: "Form saved successfully",
            error: "Failed to save form",
          }
        );
        if (onSubmit) onSubmit();
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError("root", { message: error.message });
      } else {
        setError("root", { message: "An unknown error occurred" });
      }
    }
  };

  return (
    <div
      className={`w-full sm:w-fit border rounded-md p-4 border-gray-400 bg-white ${className}`}
      {...props}
    >
      {errors.root && (
        <p className="w-full mb-2 sm:w-[300px] p-2 rounded-md border text-sm border-red-400 bg-red-100 text-red-500">
          {errors.root.message}
        </p>
      )}
      <h1 className="text-2xl font-semibold mb-2 text-center">
        {!editing ? "New" : "Update"} Form
      </h1>
      <form
        className="w-full sm:w-[300px] space-y-2.5"
        onSubmit={handleSubmit(submitHandler)}
      >
        <div className="flex flex-col gap-0.5">
          <label htmlFor="name" className="text-sm">
            Name
          </label>
          <input
            id="name"
            {...register("name")}
            defaultValue={existingForm?.name}
            type="text"
            placeholder="Crescendo Scouting Form"
            className="border border-gray-300 p-2 rounded-md"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <label htmlFor="description" className="text-sm">
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            defaultValue={existingForm?.description}
            placeholder="Scouting form for the 2024 main season"
            className="border border-gray-300 p-2 rounded-md"
          ></textarea>
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-md hover:bg-gray-800 transition duration-300"
        >
          Submit
        </Button>
      </form>
    </div>
  );
}
