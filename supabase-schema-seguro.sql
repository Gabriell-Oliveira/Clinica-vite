-- ============================================================
-- CLÍNICA DOSAGEM — Schema Supabase com Segurança (RLS)
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ── 1. TABELAS ────────────────────────────────────────────────

create table if not exists pacientes (
  id            uuid default gen_random_uuid() primary key,
  nome          text not null check (char_length(nome) between 2 and 150),
  telefone      text not null check (telefone ~ '^\d{10,11}$'),
  cpf           text not null unique check (char_length(cpf) = 11 AND cpf ~ '^\d+$'),
  total_ml      numeric(6,2) not null check (total_ml > 0 and total_ml <= 9999),
  data_inicio   date not null,
  medicamento   text not null check (medicamento in ('Mounjaro', 'Ozempic')),
  observacao    text check (char_length(observacao) <= 500),
  status        text default 'Em andamento' check (status in ('Em andamento', 'Concluído')),
  created_by    uuid references auth.users(id),   -- quem cadastrou
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists doses (
  id            uuid default gen_random_uuid() primary key,
  paciente_id   uuid not null references pacientes(id) on delete cascade,
  dose_ml       numeric(6,2) not null check (dose_ml > 0 and dose_ml <= 9999),
  data_aplicada timestamptz not null,
  observacao    text check (char_length(observacao) <= 300),
  created_by    uuid references auth.users(id),   -- quem registrou
  created_at    timestamptz default now()
);

-- ── 2. ÍNDICES ────────────────────────────────────────────────
create index if not exists idx_doses_paciente  on doses(paciente_id);
create index if not exists idx_pacientes_nome  on pacientes(nome);
create index if not exists idx_pacientes_created on pacientes(created_at desc);

-- ── 3. TRIGGER: atualiza updated_at automaticamente ──────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_pacientes_updated
  before update on pacientes
  for each row execute function set_updated_at();

-- ── 4. ROW LEVEL SECURITY (RLS) ──────────────────────────────
-- Garante que APENAS usuários autenticados acessam os dados.
-- Mesmo se alguém descobrir sua chave anon, não consegue ler nada.

alter table pacientes enable row level security;
alter table doses      enable row level security;

-- Política: apenas usuários logados podem ver e modificar dados
create policy "Autenticados podem ler pacientes"
  on pacientes for select
  using (auth.role() = 'authenticated');

create policy "Autenticados podem inserir pacientes"
  on pacientes for insert
  with check (auth.role() = 'authenticated');

create policy "Autenticados podem atualizar pacientes"
  on pacientes for update
  using (auth.role() = 'authenticated');

create policy "Autenticados podem ler doses"
  on doses for select
  using (auth.role() = 'authenticated');

create policy "Autenticados podem inserir doses"
  on doses for insert
  with check (auth.role() = 'authenticated');

-- ── 5. TABELA DE AUDITORIA ────────────────────────────────────
-- Registra quem fez o quê e quando (LGPD/segurança)
create table if not exists auditoria (
  id         uuid default gen_random_uuid() primary key,
  usuario_id uuid references auth.users(id),
  acao       text not null,
  tabela     text,
  registro_id uuid,
  detalhes   jsonb,
  ip         text,
  created_at timestamptz default now()
);

alter table auditoria enable row level security;

-- Apenas leitura para autenticados (insert é feito via service_role no backend)
create policy "Autenticados podem ver auditoria"
  on auditoria for select
  using (auth.role() = 'authenticated');

-- ── 6. CRIAR USUÁRIO ADMIN (execute UMA VEZ) ─────────────────
-- Substitua com seu e-mail e senha reais.
-- Depois, adicione mais usuários pelo painel: Authentication → Users
/*
  Vá em: Supabase → Authentication → Users → Add user
  E-mail: admin@suaclinica.com
  Senha: (mínimo 8 caracteres, use uma senha forte!)
*/

-- ── 7. DADOS DE TESTE (opcional, remova em produção) ──────────
/*
insert into pacientes (nome, telefone, cpf, total_ml, data_inicio, medicamento, observacao)
values
  ('João Antonio Costa',    '85998672354', '12345678901', 50, '2024-01-10', 'Mounjaro', 'Sem restrições'),
  ('Maria Fernanda Silva',  '85987654321', '98765432100', 40, '2024-02-01', 'Ozempic',  ''),
  ('Carlos Eduardo Lima',   '85912345678', '11122233344', 30, '2024-01-05', 'Mounjaro', 'Alérgico a penicilina');
*/
