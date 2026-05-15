// // src/pages/Cliente.jsx
// import { useState, useEffect, useCallback } from "react";
// import { Icon, Loading, Alert, Badge, Avatar, ProgressBar } from "../components/ui";
// import { getPaciente, getDoses, addDose, updatePacienteStatus } from "../services/database";
// import { mascararCPF, mascararTelefone, formatarTelefone, sanitize, validarML, checkRateLimit } from "../utils/security";

// const fmtDate     = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
// const fmtDateTime = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// export default function Cliente({ pacienteId, onVoltar, onUpdate }) {
//   const [paciente, setPaciente] = useState(null);
//   const [doses, setDoses]       = useState([]);
//   const [loading, setLoading]   = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [nova, setNova]         = useState({ dose_ml: "", data_aplicada: "", observacao: "" });
//   const [erros, setErros]       = useState({});
//   const [salvando, setSalvando] = useState(false);
//   const [erro, setErro]         = useState("");
//   const [sucesso, setSucesso]   = useState("");

//   const load = useCallback(async () => {
//     setLoading(true);
//     const [{ data: p }, { data: d }] = await Promise.all([
//       getPaciente(pacienteId),
//       getDoses(pacienteId),
//     ]);
//     setPaciente(p);
//     setDoses(d || []);
//     setLoading(false);
//   }, [pacienteId]);

//   useEffect(() => { load(); }, [load]);

//   const totalAplicado = doses.reduce((s, d) => s + Number(d.dose_ml), 0);
//   const falta = paciente ? Math.max(0, paciente.total_ml - totalAplicado) : 0;
//   const pct   = paciente?.total_ml > 0 ? Math.round((totalAplicado / paciente.total_ml) * 100) : 0;

//   // ── Registrar nova dose ──────────────────────────────────
//   const handleAddDose = async () => {
//     setErro("");
//     const e = {};
//     if (!validarML(nova.dose_ml))       e.dose_ml = "Informe uma dose válida em ml.";
//     if (!nova.data_aplicada)            e.data_aplicada = "Informe a data e hora.";
//     if (parseFloat(nova.dose_ml) > falta + 0.01)
//       e.dose_ml = `Dose maior que o saldo restante (${falta.toFixed(1)} ml).`;
//     if (Object.keys(e).length > 0) { setErros(e); return; }

//     const rate = checkRateLimit("dose", 20, 60000);
//     if (!rate.allowed) { setErro(rate.message); return; }

//     setSalvando(true);
//     const { error } = await addDose({
//       paciente_id:   pacienteId,
//       dose_ml:       parseFloat(nova.dose_ml),
//       data_aplicada: new Date(nova.data_aplicada).toISOString(),
//       observacao:    sanitize(nova.observacao.trim()),
//     });
//     setSalvando(false);

//     if (error) { setErro("Erro ao registrar dose. Tente novamente."); return; }

//     setShowModal(false);
//     setNova({ dose_ml: "", data_aplicada: "", observacao: "" });
//     setErros({});
//     setSucesso("Dose registrada com sucesso!");
//     setTimeout(() => setSucesso(""), 3000);
//     await load();
//     if (onUpdate) onUpdate();
//   };

//   // ── Alterar status ───────────────────────────────────────
//   const handleStatus = async (status) => {
//     await updatePacienteStatus(pacienteId, status);
//     setPaciente(p => ({ ...p, status }));
//     if (onUpdate) onUpdate();
//   };

//   const abrirModal = () => {
//     setNova({ dose_ml: "", data_aplicada: new Date().toISOString().slice(0, 16), observacao: "" });
//     setErros({});
//     setErro("");
//     setShowModal(true);
//   };

//   if (loading) return <Loading />;
//   if (!paciente) return (
//     <div>
//       <button className="back-btn" onClick={onVoltar}><Icon name="arrow_left" size={16} /> Voltar</button>
//       <Alert type="error">Paciente não encontrado.</Alert>
//     </div>
//   );

//   return (
//     <div>
//       <button className="back-btn" onClick={onVoltar}>
//         <Icon name="arrow_left" size={16} /> Voltar para pacientes
//       </button>

//       {sucesso && <Alert type="success">{sucesso}</Alert>}

//       {/* ── CABEÇALHO DO PACIENTE ── */}
//       <div className="patient-header">
//         <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
//           <Avatar nome={paciente.nome} size="lg" />
//           <div className="patient-header-info">
//             <div className="patient-header-name">{paciente.nome}</div>
//             <div className="patient-header-meta">
//               <span>📱 {mascararTelefone(formatarTelefone(paciente.telefone))}</span>
//               <span>🪪 {mascararCPF(paciente.cpf)}</span>
//               <span>💊 {paciente.medicamento}</span>
//               <span>📅 Início: {fmtDate(paciente.data_inicio)}</span>
//             </div>
//             {paciente.observacao && (
//               <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
//                 📝 {paciente.observacao}
//               </div>
//             )}
//           </div>
//         </div>
//         <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
//           <Badge status={paciente.status} />
//           {paciente.status !== "Concluído" ? (
//             <button className="btn btn-sm btn-secondary" onClick={() => handleStatus("Concluído")}>
//               <Icon name="check" size={14} color="var(--primary)" /> Concluir tratamento
//             </button>
//           ) : (
//             <button className="btn btn-sm btn-outline" onClick={() => handleStatus("Em andamento")}>
//               Reativar tratamento
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ── RESUMO DE DOSES ── */}
//       <div className="dose-summary">
//         <div className="dose-box">
//           <div className="dose-box-label">Total comprado</div>
//           <div>
//             <span className="dose-box-value">{Number(paciente.total_ml).toFixed(1)}</span>
//             <span className="dose-box-unit"> ml</span>
//           </div>
//         </div>
//         <div className="dose-box">
//           <div className="dose-box-label">Total aplicado</div>
//           <div>
//             <span className="dose-box-value" style={{ color: "var(--teal)" }}>{totalAplicado.toFixed(1)}</span>
//             <span className="dose-box-unit"> ml</span>
//           </div>
//         </div>
//         <div className="dose-box">
//           <div className="dose-box-label">Falta aplicar</div>
//           <div>
//             <span className="dose-box-value" style={{ color: falta === 0 ? "var(--success)" : "var(--warning)" }}>
//               {falta.toFixed(1)}
//             </span>
//             <span className="dose-box-unit"> ml</span>
//           </div>
//         </div>
//       </div>

//       {/* ── BARRA DE PROGRESSO ── */}
//       <div className="card" style={{ marginBottom: 20 }}>
//         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//           <span style={{ fontSize: 14, fontWeight: 600 }}>Progresso do tratamento</span>
//           <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{pct}%</span>
//         </div>
//         <ProgressBar pct={pct} height={10} />
//         <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
//           <span>{totalAplicado.toFixed(1)} ml aplicados</span>
//           <span>de {Number(paciente.total_ml).toFixed(1)} ml totais</span>
//         </div>
//       </div>

//       {/* ── HISTÓRICO DE DOSES ── */}
//       <div className="card">
//         <div className="section-header" style={{ marginBottom: 16 }}>
//           <span style={{ fontSize: 15, fontWeight: 700 }}>Histórico de doses</span>
//           {paciente.status !== "Concluído" && (
//             <button className="btn btn-primary btn-sm" onClick={abrirModal}>
//               <Icon name="plus" size={14} color="#fff" /> Nova dose
//             </button>
//           )}
//         </div>

//         {doses.length === 0 ? (
//           <div className="empty" style={{ padding: 24 }}>
//             <div className="empty-icon">💉</div>
//             <div className="empty-text">Nenhuma dose registrada ainda.</div>
//           </div>
//         ) : (
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Data / Hora</th>
//                 <th>Dose aplicada</th>
//                 <th>Observação</th>
//               </tr>
//             </thead>
//             <tbody>
//               {doses.map((d, i) => (
//                 <tr key={d.id}>
//                   <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{doses.length - i}</td>
//                   <td style={{ color: "var(--text-secondary)" }}>{fmtDateTime(d.data_aplicada)}</td>
//                   <td><strong>{Number(d.dose_ml).toFixed(1)} ml</strong></td>
//                   <td style={{ color: "var(--text-secondary)" }}>{d.observacao || "—"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* ── MODAL NOVA DOSE ── */}
//       {showModal && (
//         <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
//           <div className="modal">
//             <div className="modal-title">💉 Registrar nova dose</div>
//             {erro && <Alert type="error">{erro}</Alert>}

//             <div className="form-group" style={{ marginBottom: 14 }}>
//               <label className="form-label">Dose (ml) *</label>
//               <input
//                 className={`form-input${erros.dose_ml ? " error" : ""}`}
//                 type="number" min="0.1" step="0.1" max={falta}
//                 value={nova.dose_ml}
//                 onChange={e => { setNova(f => ({ ...f, dose_ml: e.target.value })); setErros(v => ({ ...v, dose_ml: "" })); }}
//                 placeholder={`Máx: ${falta.toFixed(1)} ml`}
//               />
//               {erros.dose_ml && <span className="form-input-error">⚠ {erros.dose_ml}</span>}
//               <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
//                 Saldo disponível: {falta.toFixed(1)} ml
//               </span>
//             </div>

//             <div className="form-group" style={{ marginBottom: 14 }}>
//               <label className="form-label">Data e hora da aplicação *</label>
//               <input
//                 className={`form-input${erros.data_aplicada ? " error" : ""}`}
//                 type="datetime-local"
//                 value={nova.data_aplicada}
//                 onChange={e => { setNova(f => ({ ...f, data_aplicada: e.target.value })); setErros(v => ({ ...v, data_aplicada: "" })); }}
//                 max={new Date().toISOString().slice(0, 16)}
//               />
//               {erros.data_aplicada && <span className="form-input-error">⚠ {erros.data_aplicada}</span>}
//             </div>

//             <div className="form-group" style={{ marginBottom: 24 }}>
//               <label className="form-label">Observação</label>
//               <textarea
//                 className="form-input"
//                 value={nova.observacao}
//                 onChange={e => setNova(f => ({ ...f, observacao: e.target.value }))}
//                 placeholder="Reações, observações relevantes..."
//                 maxLength={300}
//               />
//             </div>

//             <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
//               <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
//               <button className="btn btn-primary" onClick={handleAddDose} disabled={salvando}>
//                 {salvando ? "Salvando..." : "Registrar dose"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// src/pages/Cliente.jsx
// import { useState, useEffect, useCallback } from "react";
// import { Icon, Loading, Alert, Badge, Avatar, ProgressBar } from "../components/ui";
// import { getPaciente, getDoses, addDose, updatePacienteStatus } from "../services/database";
// import { mascararCPF, mascararTelefone, formatarTelefone, sanitize, validarML, checkRateLimit } from "../utils/security";

// const fmtDate     = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
// const fmtDateTime = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// export default function Cliente({ pacienteId, onVoltar, onUpdate }) {
//   const [paciente, setPaciente] = useState(null);
//   const [doses, setDoses]       = useState([]);
//   const [loading, setLoading]   = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [nova, setNova]         = useState({ dose_ml: "", data_aplicada: "", observacao: "" });
//   const [erros, setErros]       = useState({});
//   const [salvando, setSalvando] = useState(false);
//   const [erro, setErro]         = useState("");
//   const [sucesso, setSucesso]   = useState("");
//   const [dadosVisiveis, setDadosVisiveis] = useState(false);

//   const load = useCallback(async () => {
//     setLoading(true);
//     const [{ data: p }, { data: d }] = await Promise.all([
//       getPaciente(pacienteId),
//       getDoses(pacienteId),
//     ]);
//     setPaciente(p);
//     setDoses(d || []);
//     setLoading(false);
//   }, [pacienteId]);

//   useEffect(() => { load(); }, [load]);

//   const totalAplicado = doses.reduce((s, d) => s + Number(d.dose_ml), 0);
//   const falta = paciente ? Math.max(0, paciente.total_ml - totalAplicado) : 0;
//   const pct   = paciente?.total_ml > 0 ? Math.round((totalAplicado / paciente.total_ml) * 100) : 0;

//   const handleAddDose = async () => {
//     setErro("");
//     const e = {};
//     if (!validarML(nova.dose_ml))       e.dose_ml = "Informe uma dose válida em ml.";
//     if (!nova.data_aplicada)            e.data_aplicada = "Informe a data e hora.";
//     if (parseFloat(nova.dose_ml) > falta + 0.01)
//       e.dose_ml = `Dose maior que o saldo restante (${falta.toFixed(1)} ml).`;
//     if (Object.keys(e).length > 0) { setErros(e); return; }

//     const rate = checkRateLimit("dose", 20, 60000);
//     if (!rate.allowed) { setErro(rate.message); return; }

//     setSalvando(true);
//     const { error } = await addDose({
//       paciente_id:   pacienteId,
//       dose_ml:       parseFloat(nova.dose_ml),
//       data_aplicada: new Date(nova.data_aplicada).toISOString(),
//       observacao:    sanitize(nova.observacao.trim()),
//     });
//     setSalvando(false);

//     if (error) { setErro("Erro ao registrar dose. Tente novamente."); return; }

//     setShowModal(false);
//     setNova({ dose_ml: "", data_aplicada: "", observacao: "" });
//     setErros({});
//     setSucesso("Dose registrada com sucesso!");
//     setTimeout(() => setSucesso(""), 3000);
//     await load();
//     if (onUpdate) onUpdate();
//   };

//   const handleStatus = async (status) => {
//     await updatePacienteStatus(pacienteId, status);
//     setPaciente(p => ({ ...p, status }));
//     if (onUpdate) onUpdate();
//   };

//   const abrirModal = () => {
//     setNova({ dose_ml: "", data_aplicada: new Date().toISOString().slice(0, 16), observacao: "" });
//     setErros({});
//     setErro("");
//     setShowModal(true);
//   };

//   if (loading) return <Loading />;
//   if (!paciente) return (
//     <div>
//       <button className="back-btn" onClick={onVoltar}><Icon name="arrow_left" size={16} /> Voltar</button>
//       <Alert type="error">Paciente não encontrado.</Alert>
//     </div>
//   );

//   const telefoneExibido = dadosVisiveis
//     ? formatarTelefone(paciente.telefone)
//     : mascararTelefone(formatarTelefone(paciente.telefone));

//   const cpfExibido = dadosVisiveis
//     ? paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
//     : mascararCPF(paciente.cpf);

//   return (
//     <div>
//       <button className="back-btn" onClick={onVoltar}>
//         <Icon name="arrow_left" size={16} /> Voltar para pacientes
//       </button>

//       {sucesso && <Alert type="success">{sucesso}</Alert>}

//       {/* ── CABEÇALHO DO PACIENTE ── */}
//       <div className="patient-header">

//         {/* ESQUERDA: avatar + dados */}
//         <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
//           <Avatar nome={paciente.nome} size="lg" /> 
          
//           <div className="patient-header-info">
//             <div className="patient-header-name">{paciente.nome} </div> 
//             <div className="patient-header-meta">
//               <span>📱 {telefoneExibido}</span>
//               <span>🪪 {cpfExibido}</span>
//               <span>💊 {paciente.medicamento}</span>
//               <span>📅 Início: {fmtDate(paciente.data_inicio)}</span>
//             </div>
//             {paciente.observacao && (
//               <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
//                 📝 {paciente.observacao}
//               </div>
//             )}
//               <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
//                 <Badge status={paciente.status} />
//               </div>
//           </div>
//         </div>

//         {/* DIREITA: 2 linhas —
//             linha 1: botão "Ver dados"
//             linha 2: badge "Em andamento" + botão "Concluir tratamento" lado a lado */}
//         <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>

//           {/* Linha 1 */}
//           <button
//             className="btn btn-sm btn-outline"
//             onClick={() => setDadosVisiveis(v => !v)}
//             title={dadosVisiveis ? "Ocultar dados sensíveis" : "Revelar dados sensíveis"}
//             style={{ gap: 6 }}
//           >
//             <Icon name={dadosVisiveis ? "eye_off" : "eye"} size={14} color="var(--primary)" />
//             {dadosVisiveis ? "Ocultar dados" : "Ver dados"}
//           </button>

//           {/* Linha 2: badge + botão lado a lado */}
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            
//             {paciente.status !== "Concluído" ? (
//               <button className="btn btn-sm btn-secondary" onClick={() => handleStatus("Concluído")}>
//                 <Icon name="check" size={14} color="var(--primary)" /> Concluir tratamento
//               </button>
//             ) : (
//               <button className="btn btn-sm btn-outline" onClick={() => handleStatus("Em andamento")}>
//                 Reativar tratamento
//               </button>
//             )}
//           </div>

//         </div>
//       </div>

//       {/* ── RESUMO DE DOSES ── */}
//       <div className="dose-summary">
//         <div className="dose-box">
//           <div className="dose-box-label">Total comprado</div>
//           <div>
//             <span className="dose-box-value">{Number(paciente.total_ml).toFixed(1)}</span>
//             <span className="dose-box-unit"> ml</span>
//           </div>
//         </div>
//         <div className="dose-box">
//           <div className="dose-box-label">Total aplicado</div>
//           <div>
//             <span className="dose-box-value" style={{ color: "var(--teal)" }}>{totalAplicado.toFixed(1)}</span>
//             <span className="dose-box-unit"> ml</span>
//           </div>
//         </div>
//         <div className="dose-box">
//           <div className="dose-box-label">Falta aplicar</div>
//           <div>
//             <span className="dose-box-value" style={{ color: falta === 0 ? "var(--success)" : "var(--warning)" }}>
//               {falta.toFixed(1)}
//             </span>
//             <span className="dose-box-unit"> ml</span>
//           </div>
//         </div>
//       </div>

//       {/* ── BARRA DE PROGRESSO ── */}
//       <div className="card" style={{ marginBottom: 20 }}>
//         <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//           <span style={{ fontSize: 14, fontWeight: 600 }}>Progresso do tratamento</span>
//           <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{pct}%</span>
//         </div>
//         <ProgressBar pct={pct} height={10} />
//         <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
//           <span>{totalAplicado.toFixed(1)} ml aplicados</span>
//           <span>de {Number(paciente.total_ml).toFixed(1)} ml totais</span>
//         </div>
//       </div>

//       {/* ── HISTÓRICO DE DOSES ── */}
//       <div className="card">
//         <div className="section-header" style={{ marginBottom: 16 }}>
//           <span style={{ fontSize: 15, fontWeight: 700 }}>Histórico de doses</span>
//           {paciente.status !== "Concluído" && (
//             <button className="btn btn-primary btn-sm" onClick={abrirModal}>
//               <Icon name="plus" size={14} color="#fff" /> Nova dose
//             </button>
//           )}
//         </div>

//         {doses.length === 0 ? (
//           <div className="empty" style={{ padding: 24 }}>
//             <div className="empty-icon">💉</div>
//             <div className="empty-text">Nenhuma dose registrada ainda.</div>
//           </div>
//         ) : (
//           <table className="table">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Data / Hora</th>
//                 <th>Dose aplicada</th>
//                 <th>Observação</th>
//               </tr>
//             </thead>
//             <tbody>
//               {doses.map((d, i) => (
//                 <tr key={d.id}>
//                   <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{doses.length - i}</td>
//                   <td style={{ color: "var(--text-secondary)" }}>{fmtDateTime(d.data_aplicada)}</td>
//                   <td><strong>{Number(d.dose_ml).toFixed(1)} ml</strong></td>
//                   <td style={{ color: "var(--text-secondary)" }}>{d.observacao || "—"}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* ── MODAL NOVA DOSE ── */}
//       {showModal && (
//         <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
//           <div className="modal">
//             <div className="modal-title">💉 Registrar nova dose</div>
//             {erro && <Alert type="error">{erro}</Alert>}

//             <div className="form-group" style={{ marginBottom: 14 }}>
//               <label className="form-label">Dose (ml) *</label>
//               <input
//                 className={`form-input${erros.dose_ml ? " error" : ""}`}
//                 type="number" min="0.1" step="0.1" max={falta}
//                 value={nova.dose_ml}
//                 onChange={e => { setNova(f => ({ ...f, dose_ml: e.target.value })); setErros(v => ({ ...v, dose_ml: "" })); }}
//                 placeholder={`Máx: ${falta.toFixed(1)} ml`}
//               />
//               {erros.dose_ml && <span className="form-input-error">⚠ {erros.dose_ml}</span>}
//               <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
//                 Saldo disponível: {falta.toFixed(1)} ml
//               </span>
//             </div>

//             <div className="form-group" style={{ marginBottom: 14 }}>
//               <label className="form-label">Data e hora da aplicação *</label>
//               <input
//                 className={`form-input${erros.data_aplicada ? " error" : ""}`}
//                 type="datetime-local"
//                 value={nova.data_aplicada}
//                 onChange={e => { setNova(f => ({ ...f, data_aplicada: e.target.value })); setErros(v => ({ ...v, data_aplicada: "" })); }}
//               />
//               {erros.data_aplicada && <span className="form-input-error">⚠ {erros.data_aplicada}</span>}
//             </div>

//             <div className="form-group" style={{ marginBottom: 24 }}>
//               <label className="form-label">Observação</label>
//               <textarea
//                 className="form-input"
//                 value={nova.observacao}
//                 onChange={e => setNova(f => ({ ...f, observacao: e.target.value }))}
//                 placeholder="Reações, observações relevantes..."
//                 maxLength={300}
//               />
//             </div>

//             <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
//               <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
//               <button className="btn btn-primary" onClick={handleAddDose} disabled={salvando}>
//                 {salvando ? "Salvando..." : "Registrar dose"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// src/pages/Cliente.jsx
import { useState, useEffect, useCallback } from "react";
import { Icon, Loading, Alert, Badge, Avatar, ProgressBar } from "../components/ui";
import { getPaciente, getDoses, addDose, updatePacienteStatus, createPaciente } from "../services/database";
import { mascararCPF, mascararTelefone, formatarTelefone, sanitize, validarML, checkRateLimit } from "../utils/security";

const fmtDate     = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ── Modal de nova dose — F fora do componente para não perder foco ──
const FDose = ({ name, label, children, erros }) => (
  <div className="form-group" style={{ marginBottom: 14 }}>
    <label className="form-label">{label}</label>
    {children}
    {erros[name] && <span className="form-input-error">⚠ {erros[name]}</span>}
  </div>
);

// ── Modal de novo tratamento — F fora do componente ──
const FTrat = ({ name, label, children, erros }) => (
  <div className="form-group" style={{ marginBottom: 14 }}>
    <label className="form-label">{label}</label>
    {children}
    {erros[name] && <span className="form-input-error">⚠ {erros[name]}</span>}
  </div>
);

const NOVO_TRAT_VAZIO = {
  total_ml: "",
  data_inicio: "",
  medicamento: "Tirzepatida",
  observacao: "",
};

export default function Cliente({ pacienteId, onVoltar, onUpdate, onNovoTratamento }) {
  const [paciente, setPaciente] = useState(null);
  const [doses, setDoses]       = useState([]);
  const [loading, setLoading]   = useState(true);

  // Modal nova dose
  const [showModalDose, setShowModalDose] = useState(false);
  const [nova, setNova]         = useState({ dose_ml: "", data_aplicada: "", observacao: "" });
  const [errosDose, setErrosDose] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroDose, setErroDose] = useState("");

  // Modal novo tratamento
  const [showModalTrat, setShowModalTrat] = useState(false);
  const [novoTrat, setNovoTrat] = useState(NOVO_TRAT_VAZIO);
  const [errosTrat, setErrosTrat] = useState({});
  const [salvandoTrat, setSalvandoTrat] = useState(false);
  const [erroTrat, setErroTrat] = useState("");

  const [erro, setErro]         = useState("");
  const [sucesso, setSucesso]   = useState("");
  const [dadosVisiveis, setDadosVisiveis] = useState(false);

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

  // ── Registrar nova dose ──────────────────────────────────────
  const handleAddDose = async () => {
    setErroDose("");
    const e = {};
    if (!validarML(nova.dose_ml))       e.dose_ml = "Informe uma dose válida em ml.";
    if (!nova.data_aplicada)            e.data_aplicada = "Informe a data e hora.";
    if (parseFloat(nova.dose_ml) > falta + 0.01)
      e.dose_ml = `Dose maior que o saldo restante (${falta.toFixed(1)} ml).`;
    if (Object.keys(e).length > 0) { setErrosDose(e); return; }

    const rate = checkRateLimit("dose", 20, 60000);
    if (!rate.allowed) { setErroDose(rate.message); return; }

    setSalvando(true);
    const { error } = await addDose({
      paciente_id:   pacienteId,
      dose_ml:       parseFloat(nova.dose_ml),
      data_aplicada: new Date(nova.data_aplicada).toISOString(),
      observacao:    sanitize(nova.observacao.trim()),
    });
    setSalvando(false);

    if (error) { setErroDose("Erro ao registrar dose. Tente novamente."); return; }

    setShowModalDose(false);
    setNova({ dose_ml: "", data_aplicada: "", observacao: "" });
    setErrosDose({});
    setSucesso("Dose registrada com sucesso!");
    setTimeout(() => setSucesso(""), 3000);
    await load();
    if (onUpdate) onUpdate();
  };

  // ── Alterar status ───────────────────────────────────────────
  const handleStatus = async (status) => {
    await updatePacienteStatus(pacienteId, status);
    setPaciente(p => ({ ...p, status }));
    if (onUpdate) onUpdate();
  };

  const abrirModalDose = () => {
    setNova({ dose_ml: "", data_aplicada: new Date().toISOString().slice(0, 16), observacao: "" });
    setErrosDose({});
    setErroDose("");
    setShowModalDose(true);
  };

  // ── Novo tratamento ──────────────────────────────────────────
  const abrirModalTrat = () => {
    setNovoTrat({
      ...NOVO_TRAT_VAZIO,
      data_inicio: new Date().toISOString().split("T")[0],
      observacao: paciente?.observacao || "",
    });
    setErrosTrat({});
    setErroTrat("");
    setShowModalTrat(true);
  };

  const setTrat = (k, v) => {
    setNovoTrat(f => ({ ...f, [k]: v }));
    if (errosTrat[k]) setErrosTrat(e => ({ ...e, [k]: "" }));
  };

  const validarNovoTrat = () => {
    const e = {};
    if (!validarML(novoTrat.total_ml))
      e.total_ml = "Informe uma quantidade válida em ml (ex: 50).";
    if (!novoTrat.data_inicio)
      e.data_inicio = "Informe a data de início.";
    return e;
  };

  const handleNovoTratamento = async () => {
    setErroTrat("");
    const e = validarNovoTrat();
    if (Object.keys(e).length > 0) { setErrosTrat(e); return; }

    const rate = checkRateLimit("cadastro", 10, 60000);
    if (!rate.allowed) { setErroTrat(rate.message); return; }

    setSalvandoTrat(true);
    const { data: novo, error } = await createPaciente({
      nome:        paciente.nome,
      telefone:    paciente.telefone,
      cpf:         paciente.cpf,
      total_ml:    parseFloat(novoTrat.total_ml),
      data_inicio: novoTrat.data_inicio,
      medicamento: novoTrat.medicamento,
      observacao:  sanitize(novoTrat.observacao.trim()),
      status:      "Em andamento",
    });
    setSalvandoTrat(false);

    if (error) {
      // CPF duplicado — esse paciente já tem um tratamento ativo
      if (error.code === "23505")
        setErroTrat("Este paciente já possui um tratamento ativo com este CPF. Conclua o tratamento atual antes de criar um novo.");
      else
        setErroTrat("Erro ao criar novo tratamento. Tente novamente.");
      return;
    }

    setShowModalTrat(false);
    setSucesso("Novo tratamento iniciado com sucesso!");
    setTimeout(() => setSucesso(""), 3000);

    if (onUpdate) onUpdate();
    // Navega para o novo registro criado
    if (onNovoTratamento && novo?.id) onNovoTratamento(novo.id);
  };

  if (loading) return <Loading />;
  if (!paciente) return (
    <div>
      <button className="back-btn" onClick={onVoltar}><Icon name="arrow_left" size={16} /> Voltar</button>
      <Alert type="error">Paciente não encontrado.</Alert>
    </div>
  );

  const telefoneExibido = dadosVisiveis
    ? formatarTelefone(paciente.telefone)
    : mascararTelefone(formatarTelefone(paciente.telefone));

  const cpfExibido = dadosVisiveis
    ? paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : mascararCPF(paciente.cpf);

  const concluido = paciente.status === "Concluído";

  return (
    <div>
      <button className="back-btn" onClick={onVoltar}>
        <Icon name="arrow_left" size={16} /> Voltar para pacientes
      </button>

      {sucesso && <Alert type="success">{sucesso}</Alert>}
      {erro    && <Alert type="error">{erro}</Alert>}

      {/* ── CABEÇALHO DO PACIENTE ── */}
      <div className="patient-header">
        <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
          <Avatar nome={paciente.nome} size="lg" />
          <div className="patient-header-info">
            <div className="patient-header-name">{paciente.nome}</div>
            <div className="patient-header-meta">
              <span>📱 {telefoneExibido}</span>
              <span>🪪 {cpfExibido}</span>
              <span>💊 {paciente.medicamento}</span>
              <span>📅 Início: {fmtDate(paciente.data_inicio)}</span>
            </div>
            {paciente.observacao && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                📝 {paciente.observacao}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
              <Badge status={paciente.status} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          {/* Ver/ocultar dados */}
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setDadosVisiveis(v => !v)}
            style={{ gap: 6 }}
          >
            <Icon name={dadosVisiveis ? "eye_off" : "eye"} size={14} color="var(--primary)" />
            {dadosVisiveis ? "Ocultar dados" : "Ver dados"}
          </button>

          {/* Ações de status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!concluido ? (
              <button className="btn btn-sm btn-secondary" onClick={() => handleStatus("Concluído")}>
                <Icon name="check" size={14} color="var(--primary)" /> Concluir tratamento
              </button>
            ) : (
              <>
                <button className="btn btn-sm btn-outline" onClick={() => handleStatus("Em andamento")}>
                  Reativar tratamento
                </button>
                {/* <button
                  className="btn btn-sm btn-primary"
                  onClick={abrirModalTrat}
                  style={{ gap: 6 }}
                >
                  <Icon name="plus" size={14} color="#fff" /> Novo tratamento
                </button> */}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── BANNER informativo quando concluído ── */}
      {concluido && (
        <div style={{
          background: "var(--success-light)",
          border: "1px solid var(--success)",
          borderRadius: "var(--radius)",
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--success)" }}>
                Tratamento concluído
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                Para iniciar um novo ciclo de tratamento para este paciente, clique em "Novo tratamento".
                Os dados pessoais serão aproveitados automaticamente.
              </div>
            </div>
          </div>
          <button
            className="btn btn-sm"
            onClick={abrirModalTrat}
            style={{
              background: "var(--success)", color: "#fff",
              flexShrink: 0, gap: 6,
            }}
          >
            <Icon name="plus" size={14} color="#fff" /> Novo tratamento
          </button>
        </div>
      )}

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
          {!concluido && (
            <button className="btn btn-primary btn-sm" onClick={abrirModalDose}>
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
      {showModalDose && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModalDose(false)}>
          <div className="modal">
            <div className="modal-title">💉 Registrar nova dose</div>
            {erroDose && <Alert type="error">{erroDose}</Alert>}

            <FDose name="dose_ml" label="Dose (ml) *" erros={errosDose}>
              <input
                className={`form-input${errosDose.dose_ml ? " error" : ""}`}
                type="number" min="0.1" step="0.1" max={falta}
                value={nova.dose_ml}
                onChange={e => { setNova(f => ({ ...f, dose_ml: e.target.value })); setErrosDose(v => ({ ...v, dose_ml: "" })); }}
                placeholder={`Máx: ${falta.toFixed(1)} ml`}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Saldo disponível: {falta.toFixed(1)} ml
              </span>
            </FDose>

            <FDose name="data_aplicada" label="Data e hora da aplicação *" erros={errosDose}>
              <input
                className={`form-input${errosDose.data_aplicada ? " error" : ""}`}
                type="datetime-local"
                value={nova.data_aplicada}
                onChange={e => { setNova(f => ({ ...f, data_aplicada: e.target.value })); setErrosDose(v => ({ ...v, data_aplicada: "" })); }}
                max={new Date().toISOString().slice(0, 16)}
              />
            </FDose>

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
              <button className="btn btn-outline" onClick={() => setShowModalDose(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAddDose} disabled={salvando}>
                {salvando ? "Salvando..." : "Registrar dose"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOVO TRATAMENTO ── */}
      {showModalTrat && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModalTrat(false)}>
          <div className="modal">
            <div className="modal-title">🔄 Iniciar novo tratamento</div>

            {/* Resumo do paciente */}
            <div style={{
              background: "var(--bg)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                {paciente.nome}
              </div>
              <div>Os dados pessoais (nome, CPF, telefone) serão aproveitados automaticamente.</div>
            </div>

            {erroTrat && <Alert type="error">{erroTrat}</Alert>}

            <FTrat name="total_ml" label="Quantidade total do novo tratamento (ml) *" erros={errosTrat}>
              <input
                className={`form-input${errosTrat.total_ml ? " error" : ""}`}
                type="number" min="0.1" step="0.5" max="9999"
                value={novoTrat.total_ml}
                onChange={e => setTrat("total_ml", e.target.value)}
                placeholder="Ex: 50"
              />
            </FTrat>

            <FTrat name="data_inicio" label="Data de início do novo tratamento *" erros={errosTrat}>
              <input
                className={`form-input${errosTrat.data_inicio ? " error" : ""}`}
                type="date"
                value={novoTrat.data_inicio}
                onChange={e => setTrat("data_inicio", e.target.value)}
              />
            </FTrat>

            <FTrat name="medicamento" label="Medicamento" erros={errosTrat}>
              <select
                className="form-input"
                value={novoTrat.medicamento}
                onChange={e => setTrat("medicamento", e.target.value)}
              >
                <option value="Tirzepatida">Tirzepatida</option>
              </select>
            </FTrat>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Observações</label>
              <textarea
                className="form-input"
                value={novoTrat.observacao}
                onChange={e => setTrat("observacao", e.target.value)}
                placeholder="Alergias, condições especiais, observações relevantes..."
                maxLength={500}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowModalTrat(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleNovoTratamento}
                disabled={salvandoTrat}
              >
                {salvandoTrat ? "Criando..." : "Iniciar novo tratamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
