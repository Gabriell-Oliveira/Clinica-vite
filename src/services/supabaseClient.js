// src/services/supabaseClient.js
// ─────────────────────────────────────────────────────────────
// Instância única do cliente Supabase com configurações seguras.
// Importe este arquivo em todos os lugares que precisam do banco.
// ─────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Valida que as variáveis de ambiente existem
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Variáveis de ambiente do Supabase não configuradas. " +
    "Verifique o arquivo .env (copie de .env.example)."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persiste a sessão de login no localStorage
    persistSession: true,
    // Renova o token automaticamente antes de expirar
    autoRefreshToken: true,
    // Detecta sessão na URL (para magic link / OAuth)
    detectSessionInUrl: true,
  },
});
