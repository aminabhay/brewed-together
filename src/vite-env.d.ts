/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_RSVP_ENDPOINT?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_CUSTOMER_ID?: string
}
interface ImportMeta { readonly env: ImportMetaEnv }
