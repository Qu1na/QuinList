/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MATUDB_URL?: string
  readonly VITE_MATUDB_PROJECT_ID?: string
  readonly VITE_MATUDB_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
