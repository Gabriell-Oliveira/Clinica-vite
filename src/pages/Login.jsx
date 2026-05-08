// src/pages/Login.jsx
// ─────────────────────────────────────────────────────────────
// Tela de login com:
//   - Rate limiting (máx 5 tentativas por minuto)
//   - Sanitização dos inputs
//   - Feedback de erro sem revelar detalhes internos
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { checkRateLimit, sanitize } from "../utils/security";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

    // Rate limiting — bloqueia após 5 tentativas em 1 minuto
    const rate = checkRateLimit("login", 5, 60000);
    if (!rate.allowed) {
      setErro(rate.message);
      return;
    }

    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    const { error } = await signIn(sanitize(email.toLowerCase()), senha);
    setLoading(false);

    if (error) {
      // Mensagem genérica — não revela se o e-mail existe ou não
      setErro("E-mail ou senha incorretos.");
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.logo}>💊</div>
        <h1 style={styles.title}>ClinicaDose</h1>
        <p style={styles.sub}>Acesso restrito à equipe autorizada</p>

        {erro && <div style={styles.erro}>{erro}</div>}

        <form onSubmit={handleLogin} autoComplete="off">
          <div style={styles.group}>
            <label style={styles.label}>E-mail</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="username"
              maxLength={254}
            />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Senha</label>
            <input
              style={styles.input}
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              maxLength={128}
            />
          </div>
          <button
            type="submit"
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={styles.nota}>
          Sistema de uso interno. Acesso não autorizado é crime (Lei 12.737/2012).
        </p>
      </div>
    </div>
  );
}

const C = {
  primary: "#1a6fb5",
  primaryLight: "#e8f4fd",
  border: "#d4e4f0",
  bg: "#f0f5fa",
  text: "#1e2d3d",
  muted: "#5a7a95",
  danger: "#dc2626",
  dangerLight: "#fee2e2",
};

const styles = {
  wrap: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  card: {
    background: "#fff",
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    textAlign: "center",
  },
  logo: { fontSize: 40, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 6px" },
  sub: { fontSize: 13, color: C.muted, margin: "0 0 28px" },
  erro: {
    background: C.dangerLight,
    color: C.danger,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "left",
  },
  group: { marginBottom: 14, textAlign: "left" },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: C.text,
    outline: "none",
    boxSizing: "border-box",
  },
  btn: {
    width: "100%",
    padding: "12px",
    background: C.primary,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    cursor: "pointer",
    marginTop: 8,
  },
  nota: {
    fontSize: 11,
    color: C.muted,
    marginTop: 20,
    lineHeight: 1.5,
  },
};
