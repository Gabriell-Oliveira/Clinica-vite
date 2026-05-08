// src/components/layout/Sidebar.jsx
import { useAuth } from "../../context/AuthContext";
import { Icon } from "../ui";

const NAV_ITEMS = [
  { id: "pesquisa",  label: "Pacientes",     icon: "users"    },
  { id: "cadastro",  label: "Novo cadastro", icon: "plus"     },
  { id: "dashboard", label: "Dashboard",     icon: "chart"    },
];

export default function Sidebar({ page, onNav }) {
  const { user, signOut } = useAuth();

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <h1>💊 ClinicaDose</h1>
        <span>Gestão de medicamentos</span>
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu</div>
        {NAV_ITEMS.map(n => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id ? "active" : ""}`}
            onClick={() => onNav(n.id)}
          >
            <Icon name={n.icon} size={16} color="currentColor" />
            {n.label}
          </button>
        ))}
      </nav>

      {/* FOOTER: usuário + logout */}
      <div className="sidebar-footer">
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", padding: "0 4px 10px" }}>
          <div style={{ marginBottom: 2 }}>
            <Icon name="user" size={12} color="rgba(255,255,255,0.4)" style={{ display: "inline", marginRight: 5 }} />
            {user?.email?.split("@")[0]}
          </div>
          <div style={{ fontSize: 10 }}>{user?.email}</div>
        </div>
        <button
          className="nav-item"
          onClick={signOut}
          style={{ color: "rgba(255,100,100,0.8)" }}
        >
          <Icon name="logout" size={16} color="currentColor" />
          Sair
        </button>
      </div>
    </aside>
  );
}
