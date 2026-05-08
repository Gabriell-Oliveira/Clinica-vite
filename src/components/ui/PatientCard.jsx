// src/components/ui/PatientCard.jsx
import { Avatar, Badge, ProgressBar } from "./index";
import { mascararCPF, mascararTelefone, formatarTelefone } from "../../utils/security";

export default function PatientCard({ paciente: p, doses = [], onClick }) {
  const totalAplicado = doses
    .filter(d => d.paciente_id === p.id)
    .reduce((s, d) => s + Number(d.dose_ml), 0);

  const falta = Math.max(0, p.total_ml - totalAplicado);
  const pct   = p.total_ml > 0 ? Math.round((totalAplicado / p.total_ml) * 100) : 0;

  return (
    <div className="patient-card" onClick={onClick}>
      <div className="patient-card-top">
        <div className="patient-info">
          <Avatar nome={p.nome} />
          <div>
            <div className="patient-name">{p.nome}</div>
            <div className="patient-meta">
              {mascararCPF(p.cpf)} · {mascararTelefone(formatarTelefone(p.telefone))}
            </div>
          </div>
        </div>
        <Badge status={p.status} />
      </div>

      {/* PROGRESSO */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
          <span>{p.medicamento}</span>
          <span style={{ fontWeight: 700, color: "var(--primary)" }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>
          <span>{totalAplicado.toFixed(1)} ml aplicados de {p.total_ml} ml</span>
          <span>Falta {falta.toFixed(1)} ml</span>
        </div>
      </div>
    </div>
  );
}
