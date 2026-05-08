// src/utils/security.js
// ─────────────────────────────────────────────────────────────
// Funções de segurança do sistema:
//   - Sanitização de inputs (prevenção de XSS)
//   - Validação de dados sensíveis (CPF, telefone)
//   - Rate limiting no frontend (prevenção de brute force)
//   - Mascaramento de dados para exibição
// ─────────────────────────────────────────────────────────────

// ── 1. SANITIZAÇÃO (previne XSS — Cross-Site Scripting) ──────
// Remove tags HTML e caracteres perigosos de qualquer string
export function sanitize(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

// Sanitiza todos os campos de um objeto de uma vez
export function sanitizeObject(obj) {
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    clean[key] = typeof value === "string" ? sanitize(value) : value;
  }
  return clean;
}

// ── 2. VALIDAÇÕES ─────────────────────────────────────────────
// Valida CPF (algoritmo oficial brasileiro)
export function validarCPF(cpf) {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11) return false;
  // Rejeita CPFs com todos os dígitos iguais (ex: 000.000.000-00)
  if (/^(\d)\1+$/.test(nums)) return false;

  const calc = (offset) => {
    let sum = 0;
    for (let i = 0; i < offset; i++) {
      sum += parseInt(nums[i]) * (offset + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 || rest === 11 ? 0 : rest;
  };

  return calc(9) === parseInt(nums[9]) && calc(10) === parseInt(nums[10]);
}

// Valida telefone brasileiro (8 ou 9 dígitos + DDD)
export function validarTelefone(tel) {
  const nums = tel.replace(/\D/g, "");
  return nums.length >= 10 && nums.length <= 11;
}

// Valida se um número é positivo e tem no máximo 2 casas decimais
export function validarML(valor) {
  const n = parseFloat(valor);
  return !isNaN(n) && n > 0 && n <= 9999;
}

// ── 3. MASCARAMENTO (exibe dados parciais para proteger privacidade) ─
// CPF: 123.456.789-01 → 123.***.***-01
export function mascararCPF(cpf) {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11) return cpf;
  return `${nums.slice(0, 3)}.***.***-${nums.slice(9)}`;
}

// Telefone: (85) 99999-9999 → (85) 9****-9999
export function mascararTelefone(tel) {
  const nums = tel.replace(/\D/g, "");
  if (nums.length === 11) {
    return `(${nums.slice(0, 2)}) ${nums[2]}****-${nums.slice(7)}`;
  }
  if (nums.length === 10) {
    return `(${nums.slice(0, 2)}) ****-${nums.slice(6)}`;
  }
  return tel;
}

// ── 4. FORMATAÇÃO DE INPUTS ───────────────────────────────────
export function formatarTelefone(value) {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

export function formatarCPF(value) {
  const n = value.replace(/\D/g, "").slice(0, 11);
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
}

// ── 5. RATE LIMITING no frontend (previne submissões em excesso) ─
// Armazena tentativas em memória por chave (ex: "login", "cadastro")
const attempts = {};

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  if (!attempts[key]) attempts[key] = [];

  // Remove tentativas antigas fora da janela de tempo
  attempts[key] = attempts[key].filter((t) => now - t < windowMs);

  if (attempts[key].length >= maxAttempts) {
    const oldest = attempts[key][0];
    const wait = Math.ceil((windowMs - (now - oldest)) / 1000);
    return {
      allowed: false,
      message: `Muitas tentativas. Aguarde ${wait} segundos.`,
    };
  }

  attempts[key].push(now);
  return { allowed: true };
}

// ── 6. VALIDAÇÃO DE SESSÃO ────────────────────────────────────
// Verifica se o token JWT não está expirado
export function sessionIsValid(session) {
  if (!session || !session.expires_at) return false;
  // expires_at é em segundos (Unix timestamp)
  return session.expires_at * 1000 > Date.now();
}

// ── 7. LOG DE AUDITORIA (registra ações sensíveis no console em dev) ─
export function auditLog(action, details = {}) {
  if (import.meta.env.VITE_ENV === "development") {
    console.log(`[AUDIT] ${new Date().toISOString()} — ${action}`, details);
  }
  // Em produção, você poderia enviar para um serviço de logging
  // como Sentry, LogRocket, ou uma tabela de auditoria no Supabase
}
