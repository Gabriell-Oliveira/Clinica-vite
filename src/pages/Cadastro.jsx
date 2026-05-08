// src/pages/Cadastro.jsx
import { useState } from "react";
import { Icon, Alert } from "../components/ui";
import { createPaciente } from "../services/database";
import {
  validarCPF, validarTelefone, validarML,
  formatarTelefone, formatarCPF,
  sanitize, checkRateLimit,
} from "../utils/security";

const VAZIO = {
  nome: "", telefone: "", cpf: "",
  total_ml: "", data_inicio: "",
  medicamento: "Mounjaro", observacao: "",
};

export default function Cadastro({ onSalvar, onCancelar }) {
  const [form, setForm]   = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erro, setErro]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    // Limpa o erro do campo ao digitar
    if (erros[k]) setErros(e => ({ ...e, [k]: "" }));
  };

  // Validação campo a campo
  const validar = () => {
    const e = {};
    if (!form.nome.trim() || form.nome.trim().length < 2)
      e.nome = "Nome deve ter pelo menos 2 caracteres.";
    if (!validarTelefone(form.telefone))
      e.telefone = "Telefone inválido. Use DDD + número (10 ou 11 dígitos).";
    if (!validarCPF(form.cpf))
      e.cpf = "CPF inválido.";
    if (!validarML(form.total_ml))
      e.total_ml = "Informe uma quantidade válida em ml (ex: 50).";
    if (!form.data_inicio)
      e.data_inicio = "Informe a data de início.";
    return e;
  };

  const handleSubmit = async () => {
    setErro("");

    // Rate limiting para cadastro: máx 10 cadastros por minuto
    const rate = checkRateLimit("cadastro", 10, 60000);
    if (!rate.allowed) { setErro(rate.message); return; }

    const e = validar();
    if (Object.keys(e).length > 0) { setErros(e); return; }

    setLoading(true);
    const { error } = await createPaciente({
      nome:        sanitize(form.nome.trim()),
      telefone:    form.telefone.replace(/\D/g, ""),
      cpf:         form.cpf.replace(/\D/g, ""),
      total_ml:    parseFloat(form.total_ml),
      data_inicio: form.data_inicio,
      medicamento: form.medicamento,
      observacao:  sanitize(form.observacao.trim()),
      status:      "Em andamento",
    });
    setLoading(false);

    if (error) {
      // CPF duplicado
      if (error.code === "23505") setErro("Este CPF já está cadastrado.");
      else setErro("Erro ao cadastrar. Tente novamente.");
      return;
    }

    onSalvar();
  };

  const F = ({ name, label, children, required }) => (
    <div className={`form-group${name === "nome" || name === "observacao" || name === "medicamento" ? " full" : ""}`}>
      <label className="form-label">{label}{required && " *"}</label>
      {children}
      {erros[name] && <span className="form-input-error">⚠ {erros[name]}</span>}
    </div>
  );

  return (
    <div>
      <button className="back-btn" onClick={onCancelar}>
        <Icon name="arrow_left" size={16} /> Voltar
      </button>

      <div className="section-header">
        <div>
          <div className="section-title">Novo paciente</div>
          <div className="section-subtitle">Preencha todos os campos obrigatórios (*)</div>
        </div>
      </div>

      <div className="card">
        {erro && <Alert type="error">{erro}</Alert>}

        <div className="form-grid">
          <F name="nome" label="Nome completo" required>
            <input
              className={`form-input${erros.nome ? " error" : ""}`}
              value={form.nome}
              onChange={e => set("nome", e.target.value)}
              placeholder="Ex: João Silva"
              maxLength={150}
            />
          </F>

          <F name="telefone" label="Telefone" required>
            <input
              className={`form-input${erros.telefone ? " error" : ""}`}
              value={formatarTelefone(form.telefone)}
              onChange={e => set("telefone", e.target.value)}
              placeholder="(85) 99999-9999"
              maxLength={16}
            />
          </F>

          <F name="cpf" label="CPF" required>
            <input
              className={`form-input${erros.cpf ? " error" : ""}`}
              value={formatarCPF(form.cpf)}
              onChange={e => set("cpf", e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </F>

          <F name="total_ml" label="Quantidade total (ml)" required>
            <input
              className={`form-input${erros.total_ml ? " error" : ""}`}
              type="number" min="0.1" step="0.5" max="9999"
              value={form.total_ml}
              onChange={e => set("total_ml", e.target.value)}
              placeholder="Ex: 50"
            />
          </F>

          <F name="data_inicio" label="Data início do tratamento" required>
            <input
              className={`form-input${erros.data_inicio ? " error" : ""}`}
              type="date"
              value={form.data_inicio}
              onChange={e => set("data_inicio", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </F>

          <F name="medicamento" label="Medicamento" required>
            <select
              className="form-input"
              value={form.medicamento}
              onChange={e => set("medicamento", e.target.value)}
            >
              <option value="Mounjaro">Mounjaro</option>
              <option value="Ozempic">Ozempic</option>
            </select>
          </F>

          <F name="observacao" label="Observações / Informações adicionais">
            <textarea
              className="form-input"
              value={form.observacao}
              onChange={e => set("observacao", e.target.value)}
              placeholder="Alergias, condições especiais, observações relevantes..."
              maxLength={500}
            />
          </F>
        </div>

        <hr className="divider" />

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Cadastrar paciente"}
          </button>
        </div>
      </div>
    </div>
  );
}
