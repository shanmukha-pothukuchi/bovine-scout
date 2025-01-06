import { Account, Client, Databases } from "appwrite";

export const client = new Client();

client
  .setEndpoint(import.meta.env.APPWRITE_API_ENDPOINT)
  .setProject(import.meta.env.APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export { ID } from "appwrite";
