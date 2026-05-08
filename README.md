# 💊 ClinicaDose — Guia Completo

## Índice
1. [Estrutura de pastas](#estrutura)
2. [Como o código funciona](#codigo)
3. [Front e Back — onde está cada coisa](#frontback)
4. [Segurança implementada](#segurança)
5. [Passo a passo: VS Code + React](#vscode)
6. [Passo a passo: Supabase](#supabase)
7. [Passo a passo: Vercel (hospedagem)](#vercel)

---

## 1. Estrutura de pastas {#estrutura}

```
clinica-dosagem/
│
├── public/
│   └── index.html              ← HTML base (não mexa aqui)
│
├── src/
│   ├── index.js                ← Ponto de entrada do React
│   ├── App.jsx                 ← Raiz: envolve tudo com autenticação
│   │
│   ├── styles/
│   │   └── global.css          ← Todos os estilos da aplicação
│   │
│   ├── context/
│   │   └── AuthContext.jsx     ← Estado global de login (usuário logado?)
│   │
│   ├── services/
│   │   ├── supabaseClient.js   ← Conexão com o banco (instância única)
│   │   └── database.js         ← TODAS as funções de banco de dados
│   │
│   ├── utils/
│   │   └── security.js         ← Segurança: validação, sanitização, rate limit
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainApp.jsx     ← Shell: gerencia qual página está ativa
│   │   │   ├── Sidebar.jsx     ← Menu lateral
│   │   │   ├── Topbar.jsx      ← Barra superior
│   │   │   └── ProtectedRoute.jsx ← Bloqueia acesso sem login
│   │   │
│   │   └── ui/
│   │       ├── index.jsx       ← Componentes reutilizáveis (Icon, Badge, etc.)
│   │       └── PatientCard.jsx ← Card de paciente com barra de progresso
│   │
│   └── pages/
│       ├── Login.jsx           ← Tela de login
│       ├── Pesquisa.jsx        ← Lista + busca de pacientes
│       ├── Cadastro.jsx        ← Formulário de novo paciente
│       ├── Cliente.jsx         ← Ficha do paciente + doses
│       └── Dashboard.jsx       ← Estatísticas gerais
│
├── .env                        ← ⚠ SEGREDO — nunca suba no GitHub!
├── .env.example                ← Modelo (este sobe no GitHub)
├── .gitignore                  ← O que o Git deve ignorar
├── vercel.json                 ← Configuração de segurança do Vercel
├── package.json                ← Dependências do projeto
└── supabase-schema-seguro.sql  ← Script para criar o banco
```

**Regra de ouro da organização:**
- `pages/` → cada arquivo é uma tela completa
- `components/` → partes reutilizáveis em várias telas
- `services/` → tudo que fala com o mundo externo (banco, APIs)
- `utils/` → funções puras que não dependem do React
- `context/` → estado global compartilhado entre componentes

---

## 2. Como o código funciona {#codigo}

### Fluxo geral quando o usuário abre o sistema:

```
index.js
  └── App.jsx
        └── AuthProvider (verifica se há sessão salva)
              └── ProtectedRoute
                    ├── Se NÃO logado → mostra Login.jsx
                    └── Se logado → mostra MainApp.jsx
                                        ├── Sidebar (navegação)
                                        ├── Topbar (título)
                                        └── página ativa:
                                            Pesquisa / Cadastro / Cliente / Dashboard
```

### Fluxo de dados (exemplo: listar pacientes):

```
1. MainApp monta → chama loadAll()
2. loadAll() chama getPacientes() em database.js
3. database.js faz a query no Supabase
4. Supabase verifica o token JWT do usuário (RLS)
5. Retorna os dados → MainApp guarda no estado
6. Passa os dados via props para Pesquisa.jsx
7. Pesquisa.jsx renderiza os PatientCards
```

### Fluxo de cadastro de paciente:

```
1. Usuário preenche o formulário em Cadastro.jsx
2. Ao clicar "Cadastrar":
   a. checkRateLimit() → bloqueia spam
   b. validar() → verifica CPF, telefone, ml
   c. sanitize() → limpa caracteres perigosos
   d. createPaciente() em database.js → salva no Supabase
   e. Supabase verifica autenticação (RLS)
3. Sucesso → volta para Pesquisa.jsx
```

---

## 3. Front e Back — onde está cada coisa {#frontback}

**Sim, o frontend é 100% React.** Mas o *backend* não precisa de um servidor Node.js separado porque usamos o **Supabase**, que é um "Backend as a Service":

| Responsabilidade | Onde fica |
|---|---|
| Interface visual | React (seu navegador) |
| Validação de formulários | `security.js` (React) |
| Autenticação / Login | Supabase Auth |
| Banco de dados | Supabase (PostgreSQL) |
| API REST automática | Supabase (gerada automaticamente) |
| Regras de acesso (quem pode ler o quê) | Supabase RLS (Row Level Security) |
| Hospedagem do frontend | Vercel |
| Hospedagem do backend/banco | Supabase Cloud |

**Por que não precisamos de um servidor Node.js?**
O Supabase gera uma API REST automaticamente para cada tabela. Quando você chama `supabase.from("pacientes").select("*")`, ele faz uma chamada HTTP segura direto do browser para os servidores deles, com autenticação via JWT — sem precisar de um servidor intermediário seu.

Se no futuro precisar de lógica complexa no backend (ex: enviar e-mail, integrar com outro sistema), use as **Supabase Edge Functions** — são funções JavaScript que rodam no servidor deles, sem precisar criar seu próprio.

---

## 4. Segurança implementada {#segurança}

### No banco de dados (Supabase)
- ✅ **Row Level Security (RLS)**: só usuários autenticados acessam dados. Mesmo que alguém descubra sua chave anon, não consegue nada sem estar logado.
- ✅ **Constraints no banco**: CPF com exatamente 11 dígitos, telefone com 10-11, ml positivo — validado duas vezes (frontend + banco).
- ✅ **`created_by`**: cada registro sabe quem cadastrou (auditoria).
- ✅ **Tabela de auditoria**: registra ações sensíveis (quem fez o quê e quando).

### No frontend (React)
- ✅ **Autenticação obrigatória**: `ProtectedRoute` bloqueia todas as telas sem login.
- ✅ **Sanitização XSS**: `sanitize()` em `security.js` remove tags HTML de todos os inputs antes de salvar.
- ✅ **Validação de CPF**: algoritmo oficial com verificação dos dois dígitos.
- ✅ **Rate limiting**: máx 5 tentativas de login por minuto, máx 10 cadastros por minuto.
- ✅ **Mascaramento de dados**: CPF e telefone são exibidos parcialmente (`123.***.***-01`).
- ✅ **Mensagem de erro genérica no login**: não revela se o e-mail existe.
- ✅ **maxLength nos inputs**: impede inputs gigantes.
- ✅ **Validação de dose**: não permite registrar mais ml do que o saldo restante.

### Na hospedagem (Vercel)
- ✅ **HTTPS forçado**: HSTS header
- ✅ **X-Frame-Options DENY**: impede clickjacking (colocar sua tela dentro de um iframe)
- ✅ **X-Content-Type-Options**: impede MIME sniffing
- ✅ **Content-Security-Policy**: define exatamente de onde scripts e recursos podem vir
- ✅ **Permissions-Policy**: desativa câmera, microfone, geolocalização

### Variáveis de ambiente
- ✅ Credenciais em `.env` (nunca sobem no GitHub via `.gitignore`)
- ✅ `.env.example` como modelo seguro para outros desenvolvedores

---

## 5. VS Code + React — passo a passo {#vscode}

### 5.1 Instalar o VS Code
1. Acesse https://code.visualstudio.com
2. Baixe a versão para Windows/Mac/Linux
3. Instale normalmente

**Extensões recomendadas** (instale pelo menu Extensions no VS Code):
- `ES7+ React/Redux/React-Native snippets` — atalhos para React
- `Prettier - Code formatter` — formata o código automaticamente
- `ESLint` — aponta erros no código
- `GitLens` — visualiza histórico do Git
- `Tailwind CSS IntelliSense` — (opcional) autocomplete de classes

### 5.2 Instalar o Node.js
1. Acesse https://nodejs.org
2. Baixe a versão **LTS** (recomendada)
3. Instale — ele já vem com o `npm`
4. Verifique abrindo o terminal (Ctrl+`no VS Code):
   ```bash
   node --version   # deve mostrar v18 ou superior
   npm --version    # deve mostrar v9 ou superior
   ```

### 5.3 Criar o projeto React
```bash
# No terminal do VS Code:

# 1. Crie o projeto
npx create-react-app clinica-dosagem

# 2. Entre na pasta
cd clinica-dosagem

# 3. Instale o Supabase
npm install @supabase/supabase-js

# 4. Abra no VS Code
code .
```

### 5.4 Montar a estrutura de arquivos
```bash
# Crie as pastas dentro de src/
mkdir src/components
mkdir src/components/layout
mkdir src/components/ui
mkdir src/pages
mkdir src/services
mkdir src/utils
mkdir src/styles
mkdir src/context
```

### 5.5 Copiar os arquivos
Copie cada arquivo gerado para sua pasta correspondente conforme a estrutura acima.

**Delete os arquivos padrão do create-react-app que não serão usados:**
- `src/App.css`
- `src/App.test.js`
- `src/logo.svg`
- `src/reportWebVitals.js`
- `src/setupTests.js`

### 5.6 Configurar o .env
```bash
# Na raiz do projeto, crie o arquivo .env
# (copie de .env.example e preencha com seus dados do Supabase)
```

Conteúdo do `.env`:
```
REACT_APP_SUPABASE_URL=https://SEU_PROJETO.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_chave_aqui
REACT_APP_ENV=development
```

### 5.7 Rodar o projeto
```bash
npm start
```
Abre automaticamente em http://localhost:3000

---

## 6. Supabase — passo a passo {#supabase}

### 6.1 Criar conta e projeto
1. Acesse https://supabase.com e clique em **Start your project**
2. Faça login com GitHub (mais fácil)
3. Clique em **New project**
4. Preencha:
   - **Name**: `clinica-dosagem`
   - **Database Password**: gere uma senha forte e **guarde em lugar seguro**
   - **Region**: `South America (São Paulo)`
5. Clique em **Create new project** e aguarde ~2 minutos

### 6.2 Criar as tabelas
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Cole todo o conteúdo do arquivo `supabase-schema-seguro.sql`
4. Clique em **Run** (botão verde)
5. Deve aparecer "Success" para cada comando

### 6.3 Criar o primeiro usuário (admin)
1. No menu lateral, clique em **Authentication**
2. Clique em **Users**
3. Clique em **Add user** → **Create new user**
4. Preencha:
   - **Email**: seu e-mail (ex: admin@suaclinica.com)
   - **Password**: senha forte (mínimo 8 caracteres, letras, números e símbolos)
5. Clique em **Create user**

> Para adicionar mais funcionários da clínica, repita esse processo.

### 6.4 Pegar as credenciais
1. No menu lateral, clique em **Settings** (engrenagem)
2. Clique em **API**
3. Copie:
   - **Project URL** → vai para `REACT_APP_SUPABASE_URL` no `.env`
   - **anon public** (em Project API keys) → vai para `REACT_APP_SUPABASE_ANON_KEY`

### 6.5 Verificar o RLS
1. No menu lateral, clique em **Table Editor**
2. Clique em qualquer tabela (ex: `pacientes`)
3. No topo deve aparecer um cadeado 🔒 indicando que RLS está ativo
4. Clique em **Auth Policies** para ver as políticas criadas

---

## 7. Vercel — hospedagem gratuita {#vercel}

### 7.1 Preparar o repositório no GitHub
```bash
# No terminal, dentro da pasta do projeto:

# 1. Iniciar o Git
git init

# 2. Primeiro commit
git add .
git commit -m "primeiro commit — clinica dosagem"

# 3. Criar repositório no GitHub
# Acesse github.com → New repository → nome: clinica-dosagem
# IMPORTANTE: deixe como PRIVADO (Private) para proteger o código

# 4. Conectar ao GitHub (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/clinica-dosagem.git
git push -u origin main
```

> ⚠️ **Verifique antes de fazer push**: abra o `.gitignore` e confirme que `.env` está listado. O arquivo `.env` **nunca** deve ir para o GitHub.

### 7.2 Criar conta no Vercel
1. Acesse https://vercel.com
2. Clique em **Sign Up** → entre com sua conta do **GitHub**
3. Autorize o Vercel a acessar seus repositórios

### 7.3 Fazer o deploy
1. No painel do Vercel, clique em **Add New → Project**
2. Escolha o repositório `clinica-dosagem`
3. Clique em **Import**
4. Na seção **Environment Variables**, adicione:
   - `REACT_APP_SUPABASE_URL` = sua URL do Supabase
   - `REACT_APP_SUPABASE_ANON_KEY` = sua chave anon
   - `REACT_APP_ENV` = `production`
5. Clique em **Deploy**
6. Aguarde ~2 minutos

Pronto! O Vercel vai gerar uma URL tipo `clinica-dosagem.vercel.app`.

### 7.4 Deploy automático
A partir de agora, **toda vez que você fizer `git push`**, o Vercel faz o deploy automaticamente. Você nunca precisa fazer deploy manual.

```bash
# Fluxo de atualização do sistema:
git add .
git commit -m "descrição da alteração"
git push
# → Vercel detecta e faz o deploy em ~1 minuto automaticamente
```

### 7.5 Domínio personalizado (opcional)
Se quiser usar `seusite.com.br` em vez de `clinica.vercel.app`:
1. No painel do Vercel, clique no projeto → **Settings → Domains**
2. Digite seu domínio e siga as instruções de DNS

---

## Resumo do fluxo completo

```
Você edita o código no VS Code
        ↓
git push para o GitHub (privado)
        ↓
Vercel detecta e faz o build automático
        ↓
Site atualizado em clinica-dosagem.vercel.app
        ↓
Usuário faz login → Supabase Auth valida
        ↓
Dados salvos/lidos no Supabase PostgreSQL
        ↓
RLS garante que só usuários logados veem os dados
```

---

## Checklist de segurança antes de publicar

- [ ] `.env` está no `.gitignore` ✅
- [ ] Repositório no GitHub está como **Privado** ✅
- [ ] RLS está ativo no Supabase (cadeado nas tabelas) ✅
- [ ] Variáveis de ambiente configuradas no Vercel ✅
- [ ] `vercel.json` com headers de segurança está no projeto ✅
- [ ] Usuários criados com senhas fortes no Supabase Auth ✅
- [ ] `USE_MOCK = false` no código de produção ✅

---

## Comandos úteis do dia a dia

```bash
npm start          # Roda o projeto localmente
npm run build      # Gera versão de produção (o Vercel faz isso automaticamente)
git status         # Ver o que mudou
git add .          # Preparar todos os arquivos
git commit -m "mensagem"  # Salvar as mudanças
git push           # Enviar para o GitHub (e dispara o deploy no Vercel)
```
