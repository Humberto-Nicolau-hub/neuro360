import { createClient } from "@supabase/supabase-js";

/*
🔐 CONFIGURAÇÃO SEGURA (FRONTEND)
⚠️ Nunca use SERVICE_ROLE aqui
*/

const supabaseUrl = "https://qodzwxgabuadsnplcscl.supabase.co";
const supabaseKey = "sb_publishable_JGrrfcfRg8fko94mFIGpyQ_mDmSxo5K";

/*
🚀 CLIENTE SUPABASE
- Persistência de sessão ativa
- Refresh automático de token
- Preparado para produção
*/

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/*
📌 OBSERVAÇÕES IMPORTANTES:

1. Esse arquivo é usado SOMENTE no frontend
2. Nunca coloque:
   - SUPABASE_SERVICE_ROLE_KEY aqui ❌
3. O controle de segurança real fica:
   👉 no Supabase (RLS policies)

4. Se quiser escalar depois:
   👉 migramos para variáveis de ambiente (Vercel)

*/
