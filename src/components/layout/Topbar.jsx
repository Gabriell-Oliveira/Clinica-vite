// src/components/layout/Topbar.jsx
export default function Topbar({ title, badge }) {
  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      {badge !== undefined && (
        <span className="topbar-badge">{badge}</span>
      )}
    </div>
  );
}
