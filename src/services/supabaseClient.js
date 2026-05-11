// src/services/supabaseClient.js
// ─────────────────────────────────────────────────────────────
// Instância única do cliente Supabase com configurações seguras.
// Importe este arquivo em todos os lugares que precisam do banco.
// ─────────────────────────────────────────────────────────────
// import { createClient } from "@supabase/supabase-js";

// const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL;
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// // Valida que as variáveis de ambiente existem
// if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
//   throw new Error(
//     "Variáveis de ambiente do Supabase não configuradas. " +
//     "Verifique o arquivo .env (copie de .env.example)."
//   );
// }

// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
//   auth: {
//     // Persiste a sessão de login no localStorage
//     persistSession: true,
//     // Renova o token automaticamente antes de expirar
//     autoRefreshToken: true,
//     // Detecta sessão na URL (para magic link / OAuth)
//     detectSessionInUrl: true,
//   },
// });

// src/services/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const USE_MOCK = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// ── MOCK ──────────────────────────────────────────────────────
// Usado quando as variáveis de ambiente não estão configuradas.
// Simula a API do Supabase com dados em memória.

let _mockPacientes = [
  {
    id: "p1", nome: "João Antonio Costa", telefone: "85998672354",
    cpf: "12345678909", total_ml: 50, data_inicio: "2024-01-10",
    medicamento: "Tirzepatida", observacao: "Sem restrições",
    status: "Em andamento", created_at: new Date("2024-01-10").toISOString(),
  },
  {
    id: "p2", nome: "Maria Fernanda Silva", telefone: "85987654321",
    cpf: "98765432100", total_ml: 40, data_inicio: "2024-02-01",
    medicamento: "Tirzepatida", observacao: "",
    status: "Em andamento", created_at: new Date("2024-02-01").toISOString(),
  },
  {
    id: "p3", nome: "Carlos Eduardo Lima", telefone: "85912345678",
    cpf: "11122233396", total_ml: 30, data_inicio: "2024-01-05",
    medicamento: "Tirzepatida", observacao: "Alérgico a penicilina",
    status: "Concluído", created_at: new Date("2024-01-05").toISOString(),
  },
];

let _mockDoses = [
  { id: "d1", paciente_id: "p1", dose_ml: 12.5, data_aplicada: new Date("2024-01-15").toISOString(), observacao: "Aplicação inicial", created_at: new Date("2024-01-15").toISOString() },
  { id: "d2", paciente_id: "p1", dose_ml: 12.5, data_aplicada: new Date("2024-02-15").toISOString(), observacao: "", created_at: new Date("2024-02-15").toISOString() },
  { id: "d3", paciente_id: "p2", dose_ml: 10,   data_aplicada: new Date("2024-02-10").toISOString(), observacao: "Reagiu bem", created_at: new Date("2024-02-10").toISOString() },
  { id: "d4", paciente_id: "p3", dose_ml: 10,   data_aplicada: new Date("2024-01-12").toISOString(), observacao: "", created_at: new Date("2024-01-12").toISOString() },
  { id: "d5", paciente_id: "p3", dose_ml: 10,   data_aplicada: new Date("2024-02-12").toISOString(), observacao: "", created_at: new Date("2024-02-12").toISOString() },
  { id: "d6", paciente_id: "p3", dose_ml: 10,   data_aplicada: new Date("2024-03-12").toISOString(), observacao: "Última dose", created_at: new Date("2024-03-12").toISOString() },
];

// Sessão mock — simula usuário já logado
const _mockSession = {
  user: { id: "mock-user", email: "demo@clinicadose.com" },
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

// Simula os métodos encadeados do Supabase: .from().select().eq()...
function mockQueryBuilder(table) {
  let _data = table === "pacientes" ? _mockPacientes : _mockDoses;
  let _filters = [];
  let _single = false;
  let _orderBy = null;
  let _insert = null;
  let _update = null;

  const builder = {
    select: () => builder,
    eq: (col, val) => { _filters.push({ col, val }); return builder; },
    order: (col, { ascending } = {}) => { _orderBy = { col, ascending }; return builder; },
    single: () => { _single = true; return builder; },

    insert: (rows) => {
      _insert = rows;
      return {
        select: () => ({
          single: async () => {
            const row = { ...rows[0], id: `mock-${Date.now()}`, created_at: new Date().toISOString() };
            if (table === "pacientes") _mockPacientes = [row, ..._mockPacientes];
            else _mockDoses = [row, ..._mockDoses];
            return { data: row, error: null };
          },
        }),
      };
    },

    update: (patch) => {
      _update = patch;
      return {
        eq: (col, val) => ({
          then: (resolve) => {
            if (table === "pacientes") {
              _mockPacientes = _mockPacientes.map(p => p[col] === val ? { ...p, ...patch } : p);
            }
            resolve({ data: null, error: null });
            return { catch: () => {} };
          },
        }),
      };
    },

    // Torna o builder "thenable" (await builder)
    then: (resolve) => {
      let result = [..._data];

      // Aplica filtros
      for (const { col, val } of _filters)
        result = result.filter(r => String(r[col]) === String(val));

      // Ordena
      if (_orderBy) {
        result.sort((a, b) => {
          const cmp = String(a[_orderBy.col]) < String(b[_orderBy.col]) ? -1 : 1;
          return _orderBy.ascending ? cmp : -cmp;
        });
      }

      const out = _single ? result[0] ?? null : result;
      resolve({ data: out, error: null });
      return { catch: () => {} };
    },
  };

  return builder;
}

// Cliente mock completo
const mockClient = {
  from: (table) => mockQueryBuilder(table),
  auth: {
    getSession: async () => ({ data: { session: _mockSession } }),
    onAuthStateChange: (cb) => {
      cb("SIGNED_IN", _mockSession);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async ({ email }) => {
      if (email && email.includes("@"))
        return { data: { session: _mockSession }, error: null };
      return { data: null, error: { message: "Credenciais inválidas" } };
    },
    signOut: async () => ({ error: null }),
  },
};

// ── EXPORTAÇÃO ────────────────────────────────────────────────
export const supabase = USE_MOCK
  ? mockClient
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });