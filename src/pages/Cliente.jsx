// src/pages/Cliente.jsx
import { useState, useEffect, useCallback } from "react";
import { Icon, Loading, Alert, Badge, Avatar, ProgressBar } from "../components/ui";
import { getPaciente, getDoses, addDose, updatePacienteStatus } from "../services/database";
import { mascararCPF, mascararTelefone, formatarTelefone, sanitize, validarML, checkRateLimit } from "../utils/security";

const fmtDate     = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Cliente({ pacienteId, onVoltar, onUpdate }) {
  const [paciente, setPaciente] = useState(null);
  const [doses, setDoses]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nova, setNova]         = useState({ dose_ml: "", data_aplicada: "", observacao: "" });
  const [erros, setErros]       = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState("");
  const [sucesso, setSucesso]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: d }] = await Promise.all([
      getPaciente(pacienteId),
      getDoses(pacienteId),
    ]);
    setPaciente(p);
    setDoses(d || []);
    setLoading(false);
  }, [pacienteId]);

  useEffect(() => { load(); }, [load]);

  const totalAplicado = doses.reduce((s, d) => s + Number(d.dose_ml), 0);
  const falta = paciente ? Math.max(0, paciente.total_ml - totalAplicado) : 0;
  const pct   = paciente?.total_ml > 0 ? Math.round((totalAplicado / paciente.total_ml) * 100) : 0;

  // ── Registrar nova dose ──────────────────────────────────
  const handleAddDose = async () => {
    setErro("");
    const e = {};
    if (!validarML(nova.dose_ml))       e.dose_ml = "Informe uma dose válida em ml.";
    if (!nova.data_aplicada)            e.data_aplicada = "Informe a data e hora.";
    if (parseFloat(nova.dose_ml) > falta + 0.01)
      e.dose_ml = `Dose maior que o saldo restante (${falta.toFixed(1)} ml).`;
    if (Object.keys(e).length > 0) { setErros(e); return; }

    const rate = checkRateLimit("dose", 20, 60000);
    if (!rate.allowed) { setErro(rate.message); return; }

    setSalvando(true);
    const { error } = await addDose({
      paciente_id:   pacienteId,
      dose_ml:       parseFloat(nova.dose_ml),
      data_aplicada: new Date(nova.data_aplicada).toISOString(),
      observacao:    sanitize(nova.observacao.trim()),
    });
    setSalvando(false);

    if (error) { setErro("Erro ao registrar dose. Tente novamente."); return; }

    setShowModal(false);
    setNova({ dose_ml: "", data_aplicada: "", observacao: "" });
    setErros({});
    setSucesso("Dose registrada com sucesso!");
    setTimeout(() => setSucesso(""), 3000);
    await load();
    if (onUpdate) onUpdate();
  };

  // ── Alterar status ───────────────────────────────────────
  const handleStatus = async (status) => {
    await updatePacienteStatus(pacienteId, status);
    setPaciente(p => ({ ...p, status }));
    if (onUpdate) onUpdate();
  };

  const abrirModal = () => {
    setNova({ dose_ml: "", data_aplicada: new Date().toISOString().slice(0, 16), observacao: "" });
    setErros({});
    setErro("");
    setShowModal(true);
  };

  if (loading) return <Loading />;
  if (!paciente) return (
    <div>
      <button className="back-btn" onClick={onVoltar}><Icon name="arrow_left" size={16} /> Voltar</button>
      <Alert type="error">Paciente não encontrado.</Alert>
    </div>
  );

  return (
    <div>
      <button className="back-btn" onClick={onVoltar}>
        <Icon name="arrow_left" size={16} /> Voltar para pacientes
      </button>

      {sucesso && <Alert type="success">{sucesso}</Alert>}

      {/* ── CABEÇALHO DO PACIENTE ── */}
      <div className="patient-header">
        <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
          <Avatar nome={paciente.nome} size="lg" />
          <div className="patient-header-info">
            <div className="patient-header-name">{paciente.nome}</div>
            <div className="patient-header-meta">
              <span>📱 {mascararTelefone(formatarTelefone(paciente.telefone))}</span>
              <span>🪪 {mascararCPF(paciente.cpf)}</span>
              <span>💊 {paciente.medicamento}</span>
              <span>📅 Início: {fmtDate(paciente.data_inicio)}</span>
            </div>
            {paciente.observacao && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                📝 {paciente.observacao}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          <Badge status={paciente.status} />
          {paciente.status !== "Concluído" ? (
            <button className="btn btn-sm btn-secondary" onClick={() => handleStatus("Concluído")}>
              <Icon name="check" size={14} color="var(--primary)" /> Concluir tratamento
            </button>
          ) : (
            <button className="btn btn-sm btn-outline" onClick={() => handleStatus("Em andamento")}>
              Reativar tratamento
            </button>
          )}
        </div>
      </div>

      {/* ── RESUMO DE DOSES ── */}
      <div className="dose-summary">
        <div className="dose-box">
          <div className="dose-box-label">Total comprado</div>
          <div>
            <span className="dose-box-value">{Number(paciente.total_ml).toFixed(1)}</span>
            <span className="dose-box-unit"> ml</span>
          </div>
        </div>
        <div className="dose-box">
          <div className="dose-box-label">Total aplicado</div>
          <div>
            <span className="dose-box-value" style={{ color: "var(--teal)" }}>{totalAplicado.toFixed(1)}</span>
            <span className="dose-box-unit"> ml</span>
          </div>
        </div>
        <div className="dose-box">
          <div className="dose-box-label">Falta aplicar</div>
          <div>
            <span className="dose-box-value" style={{ color: falta === 0 ? "var(--success)" : "var(--warning)" }}>
              {falta.toFixed(1)}
            </span>
            <span className="dose-box-unit"> ml</span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE PROGRESSO ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Progresso do tratamento</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{pct}%</span>
        </div>
        <ProgressBar pct={pct} height={10} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
          <span>{totalAplicado.toFixed(1)} ml aplicados</span>
          <span>de {Number(paciente.total_ml).toFixed(1)} ml totais</span>
        </div>
      </div>

      {/* ── HISTÓRICO DE DOSES ── */}
      <div className="card">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Histórico de doses</span>
          {paciente.status !== "Concluído" && (
            <button className="btn btn-primary btn-sm" onClick={abrirModal}>
              <Icon name="plus" size={14} color="#fff" /> Nova dose
            </button>
          )}
        </div>

        {doses.length === 0 ? (
          <div className="empty" style={{ padding: 24 }}>
            <div className="empty-icon">💉</div>
            <div className="empty-text">Nenhuma dose registrada ainda.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data / Hora</th>
                <th>Dose aplicada</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {doses.map((d, i) => (
                <tr key={d.id}>
                  <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{doses.length - i}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{fmtDateTime(d.data_aplicada)}</td>
                  <td><strong>{Number(d.dose_ml).toFixed(1)} ml</strong></td>
                  <td style={{ color: "var(--text-secondary)" }}>{d.observacao || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL NOVA DOSE ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-title">💉 Registrar nova dose</div>
            {erro && <Alert type="error">{erro}</Alert>}

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Dose (ml) *</label>
              <input
                className={`form-input${erros.dose_ml ? " error" : ""}`}
                type="number" min="0.1" step="0.1" max={falta}
                value={nova.dose_ml}
                onChange={e => { setNova(f => ({ ...f, dose_ml: e.target.value })); setErros(v => ({ ...v, dose_ml: "" })); }}
                placeholder={`Máx: ${falta.toFixed(1)} ml`}
              />
              {erros.dose_ml && <span className="form-input-error">⚠ {erros.dose_ml}</span>}
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Saldo disponível: {falta.toFixed(1)} ml
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Data e hora da aplicação *</label>
              <input
                className={`form-input${erros.data_aplicada ? " error" : ""}`}
                type="datetime-local"
                value={nova.data_aplicada}
                onChange={e => { setNova(f => ({ ...f, data_aplicada: e.target.value })); setErros(v => ({ ...v, data_aplicada: "" })); }}
                max={new Date().toISOString().slice(0, 16)}
              />
              {erros.data_aplicada && <span className="form-input-error">⚠ {erros.data_aplicada}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Observação</label>
              <textarea
                className="form-input"
                value={nova.observacao}
                onChange={e => setNova(f => ({ ...f, observacao: e.target.value }))}
                placeholder="Reações, observações relevantes..."
                maxLength={300}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAddDose} disabled={salvando}>
                {salvando ? "Salvando..." : "Registrar dose"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
