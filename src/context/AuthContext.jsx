// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────
// Contexto global de autenticação.
// Envolve toda a aplicação e fornece: usuário logado, funções
// de login/logout e estado de carregamento da sessão.
// ─────────────────────────────────────────────────────────────
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { auditLog } from "../utils/security";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true enquanto verifica sessão

  useEffect(() => {
    // 1. Verifica se já existe uma sessão salva (ex: usuário reabriu o browser)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuta mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (_event === "SIGNED_IN") auditLog("LOGIN", { email: session?.user?.email });
        if (_event === "SIGNED_OUT") auditLog("LOGOUT");
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login com e-mail e senha
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  // Logout
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar em qualquer componente: const { user } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
