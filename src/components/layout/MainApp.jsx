// src/components/layout/MainApp.jsx
// ─────────────────────────────────────────────────────────────
// Shell principal da aplicação autenticada.
// Gerencia qual página está ativa e carrega os dados globais.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";
import PagePesquisa  from "../../pages/Pesquisa";
import PageCadastro  from "../../pages/Cadastro";
import PageCliente   from "../../pages/Cliente";
import PageDashboard from "../../pages/Dashboard";
import { getPacientes, getAllDoses } from "../../services/database";

const TITLES = {
  pesquisa:  "Pacientes",
  cadastro:  "Novo paciente",
  dashboard: "Dashboard",
  cliente:   "Ficha do paciente",
};

export default function MainApp() {
  const [page, setPage]           = useState("pesquisa");
  const [selectedId, setSelectedId] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [doses, setDoses]         = useState([]);
  const [loading, setLoading]     = useState(true);

  // Carrega todos os dados (pacientes + todas as doses para progresso)
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: ps }, { data: ds }] = await Promise.all([
      getPacientes(),
      getAllDoses(),
    ]);
    setPacientes(ps || []);
    setDoses(ds || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const navigate = (p, id = null) => {
    setPage(p);
    setSelectedId(id);
    // Scroll ao topo ao trocar de página
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="layout">
      <Sidebar
        page={page}
        onNav={(p) => navigate(p)}
      />

      <main className="main">
        <Topbar
          title={TITLES[page] || "Paciente"}
          badge={page === "pesquisa" ? `${pacientes.length} paciente${pacientes.length !== 1 ? "s" : ""}` : undefined}
        />

        <div className="content">
          {page === "pesquisa" && (
            <PagePesquisa
              pacientes={pacientes}
              doses={doses}
              loading={loading}
              onSelect={(id) => navigate("cliente", id)}
              onNovo={() => navigate("cadastro")}
            />
          )}

          {page === "cadastro" && (
            <PageCadastro
              onSalvar={async () => { await loadAll(); navigate("pesquisa"); }}
              onCancelar={() => navigate("pesquisa")}
            />
          )}

          {page === "cliente" && selectedId && (
            <PageCliente
              pacienteId={selectedId}
              onVoltar={() => navigate("pesquisa")}
              onUpdate={loadAll}
            />
          )}

          {page === "dashboard" && (
            <PageDashboard pacientes={pacientes} doses={doses} />
          )}
        </div>
      </main>
    </div>
  );
}
