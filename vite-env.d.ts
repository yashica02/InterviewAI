/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;
  readonly VITE_DYNAMODB_TABLE: string;
  readonly VITE_OPENAI_API_KEY?: string;
  // add more VITE_ vars if you have them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
