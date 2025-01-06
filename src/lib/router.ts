import { Models } from "appwrite";
import { LoaderFunctionArgs, redirect } from "react-router";
import { account, databases } from "./appwrite";

export type CustomPreferences = { teamNumber: number };
export type UserWithCustomPreferences = Models.User<CustomPreferences>;

export async function retrieveUser(): Promise<{
  user: UserWithCustomPreferences;
} | void> {
  try {
    const user = await account.get<CustomPreferences>();
    return { user };
  } catch {
    throw redirect("/login");
  }
}

export async function redirectUserToDashboard(): Promise<void> {
  try {
    const user = await account.get<CustomPreferences>();
    if (user) {
      throw redirect("/");
    }
  } catch (e) {
    if (!(e instanceof Error)) {
      throw e;
    }
  }
}

export type FormDocument = Models.Document & {
  name: string;
  description: string;
  createdBy: string;
  content: string;
};

export async function retrieveUserAndForm({
  params,
}: LoaderFunctionArgs): Promise<{
  user: UserWithCustomPreferences;
  form: FormDocument;
} | void> {
  try {
    const user = await account.get<CustomPreferences>();
    try {
      const form = await databases.getDocument<FormDocument>(
        import.meta.env.APPWRITE_DB_ID,
        import.meta.env.APPWRITE_FORMS_COLLECTION_ID,
        params.id!
      );
      if (form.createdBy !== user.$id) {
        throw new Error("Form not found");
      }
      return { user, form };
    } catch {
      throw redirect("/");
    }
  } catch (e) {
    if (e instanceof Error) {
      throw redirect("/login");
    } else {
      throw e;
    }
  }
}

export async function retrieveForm({
  params,
}: LoaderFunctionArgs): Promise<{ form: FormDocument } | void> {
  try {
    const form = await databases.getDocument<FormDocument>(
      import.meta.env.APPWRITE_DB_ID,
      import.meta.env.APPWRITE_FORMS_COLLECTION_ID,
      params.id!
    );
    return { form };
  } catch (error) {
    console.error("Failed to retrieve forms:", error);
  }
}

export async function logout() {
  await account.deleteSession("current");
  redirect("/login");
}
