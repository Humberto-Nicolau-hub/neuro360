import {
  createClient,
} from "@supabase/supabase-js";

/* ======================================================
   ENV
====================================================== */

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL;

const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY;

/* ======================================================
   VALIDACAO
====================================================== */

if (
  !supabaseUrl ||
  !supabaseAnonKey
) {

  console.error(
    "Supabase ENV não configurado."
  );
}

/* ======================================================
   CLIENT
====================================================== */

export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
