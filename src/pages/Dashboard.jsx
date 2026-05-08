// src/pages/Dashboard.jsx
import { ProgressBar } from "../components/ui";

const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function Dashboard({ pacientes, doses }) {
  const total    = pacientes.length;
  const emAndamento = pacientes.filter(p => p.status === "Em andamento").length;
  const concluidos  = pacientes.filter(p => p.status === "Concluído").length;
  const totalMl  = doses.reduce((s, d) => s + Number(d.dose_ml), 0);
  const recentes = [...pacientes]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  const StatCard = ({ icon, label, value, color, bg }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Dashboard</div>
          <div className="section-subtitle">Visão geral da clínica</div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stats-grid">
        <StatCard icon="👥" label="Total de pacientes"         value={total}       color="var(--text)"    bg="var(--primary-light)" />
        <StatCard icon="💉" label="Em tratamento"              value={emAndamento} color="var(--teal)"    bg="var(--teal-light)" />
        <StatCard icon="✅" label="Tratamentos concluídos"     value={concluidos}  color="var(--success)" bg="var(--success-light)" />
      </div>

      {/* ── LINHA 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Total ml */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>💊 Total de ml aplicados</div>
          <div>
            <span style={{ fontSize: 36, fontWeight: 700, color: "var(--primary)" }}>
              {totalMl.toFixed(1)}
            </span>
            <span style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 500, marginLeft: 4 }}>ml</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
            {doses.length} aplicações registradas no total
          </div>
        </div>

        {/* Por medicamento */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📊 Por medicamento</div>
          {["Mounjaro", "Ozempic"].map(med => {
            const count = pacientes.filter(p => p.medicamento === med).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={med} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{med}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{count} paciente{count !== 1 ? "s" : ""} · {pct}%</span>
                </div>
                <ProgressBar pct={pct} height={6} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ÚLTIMOS CADASTROS ── */}
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🕒 Últimos cadastros</div>
        {recentes.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>
            <div className="empty-text">Nenhum paciente cadastrado ainda.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Medicamento</th>
                <th>Início</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.nome}</td>
                  <td>{p.medicamento}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{fmtDate(p.data_inicio)}</td>
                  <td>
                    <span className={`badge ${p.status === "Concluído" ? "badge-done" : "badge-active"}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
