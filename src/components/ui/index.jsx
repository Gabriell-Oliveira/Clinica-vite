// src/components/ui/index.jsx
// ─────────────────────────────────────────────────────────────
// Componentes reutilizáveis de UI.
// Importe daqui em qualquer página:
//   import { Icon, ProgressBar, Spinner, Badge } from "../ui";
// ─────────────────────────────────────────────────────────────

// ── ÍCONES SVG ────────────────────────────────────────────────
const PATHS = {
  home:       "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  users:      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  plus:       "M12 5v14 M5 12h14",
  search:     "M11 3a8 8 0 100 16A8 8 0 0011 3z M21 21l-4.35-4.35",
  arrow_left: "M19 12H5 M12 19l-7-7 7-7",
  activity:   "M22 12h-4l-3 9L9 3l-3 9H2",
  check:      "M20 6L9 17l-5-5",
  clock:      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
  chart:      "M18 20V10 M12 20V4 M6 20v-6",
  logout:     "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  syringe:    "M17 3l4 4-14 14-4-4L17 3z M11 11l-2 2 M14 8l-2 2",
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  eye_off:    "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94 M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19 M1 1l22 22",
  user:       "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  calendar:   "M3 9h18 M8 3v4 M16 3v4 M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z",
  pill:       "M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM3.75 10.5a6.75 6.75 0 1113.5 0 6.75 6.75 0 01-13.5 0z",
};

export function Icon({ name, size = 18, color = "currentColor", style }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {(PATHS[name] || "").split(" M").map((d, i) => (
        <path key={i} d={i === 0 ? d : "M" + d} />
      ))}
    </svg>
  );
}

// ── PROGRESS BAR ──────────────────────────────────────────────
export function ProgressBar({ pct, height = 7 }) {
  const p = Math.min(100, Math.max(0, pct || 0));
  return (
    <div className="progress-bar-bg" style={{ height }}>
      <div className="progress-bar-fill" style={{ width: `${p}%` }} />
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────────
export function Spinner() {
  return <div className="spinner" />;
}

// ── LOADING FULL ──────────────────────────────────────────────
export function Loading({ text = "Carregando..." }) {
  return (
    <div className="loading">
      <Spinner /> {text}
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────────────────
export function Badge({ status }) {
  const cls = status === "Concluído" ? "badge-done" : "badge-active";
  return <span className={`badge ${cls}`}>{status}</span>;
}

// ── EMPTY STATE ───────────────────────────────────────────────
export function Empty({ icon = "👤", text = "Nenhum item encontrado." }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-text">{text}</div>
    </div>
  );
}

// ── ALERT ─────────────────────────────────────────────────────
export function Alert({ type = "error", children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

// ── AVATAR ────────────────────────────────────────────────────
export function Avatar({ nome, size = "sm" }) {
  const ini = nome?.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  const cls = size === "lg" ? "avatar-lg" : "avatar";
  return <div className={cls}>{ini}</div>;
}
