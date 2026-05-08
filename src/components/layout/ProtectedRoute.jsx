// src/components/layout/ProtectedRoute.jsx
// ─────────────────────────────────────────────────────────────
// Componente de rota protegida.
// Se o usuário NÃO está logado, redireciona para o login.
// Se está logado, renderiza o conteúdo normalmente.
// Use para envolver todas as páginas que exigem autenticação.
// ─────────────────────────────────────────────────────────────
import { useAuth } from "../../context/AuthContext";
import Login from "../../pages/Login";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Enquanto verifica a sessão, mostra um loader simples
  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <span>Verificando acesso...</span>
      </div>
    );
  }

  // Se não está logado, mostra o login
  if (!user) return <Login />;

  // Está logado — renderiza a aplicação
  return children;
}

const styles = {
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    color: "#5a7a95",
  },
  spinner: {
    width: 22,
    height: 22,
    border: "2px solid #d4e4f0",
    borderTopColor: "#1a6fb5",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
