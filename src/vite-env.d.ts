/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly APPWRITE_API_ENDPOINT: string;
  readonly APPWRITE_PROJECT_ID: string;
  readonly APPWRITE_DB_ID: string;
  readonly APPWRITE_FORMS_COLLECTION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
