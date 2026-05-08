// src/pages/Pesquisa.jsx
import { useState } from "react";
import { Icon, Loading, Empty } from "../components/ui";
import PatientCard from "../components/ui/PatientCard";

export default function Pesquisa({ pacientes, doses, loading, onSelect, onNovo }) {
  const [q, setQ] = useState("");

  const filtered = pacientes.filter(p =>
    p.nome.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Pacientes</div>
          <div className="section-subtitle">Pesquise por nome ou veja os cadastros recentes</div>
        </div>
        <button className="btn btn-primary" onClick={onNovo}>
          <Icon name="plus" size={16} color="#fff" />
          Novo paciente
        </button>
      </div>

      <div className="search-wrap">
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input
          placeholder="Buscar por nome..."
          value={q}
          onChange={e => setQ(e.target.value)}
          maxLength={100}
        />
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty
          icon="👤"
          text={q ? "Nenhum paciente encontrado para essa busca." : "Nenhum paciente cadastrado ainda."}
        />
      ) : (
        filtered.map(p => (
          <PatientCard
            key={p.id}
            paciente={p}
            doses={doses}
            onClick={() => onSelect(p.id)}
          />
        ))
      )}
    </div>
  );
}
