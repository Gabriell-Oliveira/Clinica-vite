// src/App.jsx
// ─────────────────────────────────────────────────────────────
// Componente raiz da aplicação.
// Envolve tudo com o AuthProvider e usa ProtectedRoute
// para garantir que apenas usuários logados acessem o sistema.
// ─────────────────────────────────────────────────────────────
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import MainApp from "./components/layout/MainApp";
import "./styles/global.css";

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}
