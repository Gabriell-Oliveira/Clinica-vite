// src/services/database.js
// ─────────────────────────────────────────────────────────────
// Camada de acesso ao banco de dados.
// TODOS os acessos ao Supabase passam por aqui — nunca chame
// supabase diretamente nos componentes. Isso facilita:
//   - Centralizar validações e sanitização
//   - Trocar o banco futuramente sem reescrever componentes
//   - Auditar o que foi lido/escrito
// ─────────────────────────────────────────────────────────────
import { supabase } from "./supabaseClient";
import { sanitizeObject, auditLog } from "../utils/security";

// ── PACIENTES ─────────────────────────────────────────────────

export async function getPacientes() {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("[DB] getPacientes:", error);
  return { data, error };
}

export async function getPaciente(id) {
  if (!id) return { data: null, error: new Error("ID inválido") };

  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) console.error("[DB] getPaciente:", error);
  return { data, error };
}

export async function createPaciente(paciente) {
  // Sanitiza antes de salvar
  const safe = sanitizeObject(paciente);
  auditLog("CADASTRAR_PACIENTE", { nome: safe.nome });

  const { data, error } = await supabase
    .from("pacientes")
    .insert([safe])
    .select()
    .single();

  if (error) console.error("[DB] createPaciente:", error);
  return { data, error };
}

export async function updatePacienteStatus(id, status) {
  auditLog("UPDATE_STATUS", { id, status });

  const { error } = await supabase
    .from("pacientes")
    .update({ status })
    .eq("id", id);

  if (error) console.error("[DB] updateStatus:", error);
  return { error };
}

// ── DOSES ─────────────────────────────────────────────────────

export async function getDoses(pacienteId) {
  if (!pacienteId) return { data: [], error: null };

  const { data, error } = await supabase
    .from("doses")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("data_aplicada", { ascending: false });

  if (error) console.error("[DB] getDoses:", error);
  return { data, error };
}

export async function getAllDoses() {
  const { data, error } = await supabase
    .from("doses")
    .select("*");

  if (error) console.error("[DB] getAllDoses:", error);
  return { data, error };
}

export async function addDose(dose) {
  const safe = sanitizeObject(dose);
  auditLog("REGISTRAR_DOSE", { paciente_id: safe.paciente_id, dose_ml: safe.dose_ml });

  const { data, error } = await supabase
    .from("doses")
    .insert([safe])
    .select()
    .single();

  if (error) console.error("[DB] addDose:", error);
  return { data, error };
}
