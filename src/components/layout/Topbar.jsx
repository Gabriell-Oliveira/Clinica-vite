// src/components/layout/Topbar.jsx
// export default function Topbar({ title, badge }) {
//   return (
//     <div className="topbar">
//       <span className="topbar-title">{title}</span>
//       {badge !== undefined && (
//         <span className="topbar-badge">{badge}</span>
//       )}
//     </div>
//   );
// }

// src/components/layout/Topbar.jsx
import { USE_MOCK } from "../../services/supabaseClient";

export default function Topbar({ title, badge }) {
  return (
    <>
      {USE_MOCK && (
        <div style={{
          background: "#fef3c7", color: "#92400e",
          fontSize: 12, fontWeight: 600, textAlign: "center",
          padding: "6px 16px", borderBottom: "1px solid #fcd34d",
        }}>
          ⚠️ MODO DEMONSTRAÇÃO — dados fictícios, sem conexão com banco de dados
        </div>
      )}
      <div className="topbar">
        <span className="topbar-title">{title}</span>
        {badge !== undefined && (
          <span className="topbar-badge">{badge}</span>
        )}
      </div>
    </>
  );
}