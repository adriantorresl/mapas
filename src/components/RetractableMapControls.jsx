import React, { useState } from "react";

/**
 * Controles retráctiles para acciones de mapa (descargar GeoJSON, exportar imagen, etc.)
 * Se posiciona por defecto en la esquina inferior izquierda, sobre el control de coordenadas.
 */
const RetractableMapControls = ({
  buttons = [],
  position = { bottom: 140, left: 14 }, // un poco arriba del control de coordenadas (bottomleft)
  collapsedLabel = "⚙️",
  panelTitle = "Herramientas",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 1400,
        ...position,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      {/* Botón toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Ocultar controles" : "Mostrar controles"}
        style={{
          background: open ? "#1976d2" : "#1e3c20",
          color: "#fff",
          border: "none",
          borderRadius: 28,
          width: 48,
          height: 48,
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.25s, transform 0.25s",
        }}
      >
        {open ? "×" : collapsedLabel}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(4px)",
            borderRadius: 14,
            padding: "14px 16px 12px 16px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
            minWidth: 180,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            animation: "rmc-fade-in 260ms ease",
            border: "1px solid #e0e0e0",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#333",
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {panelTitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {buttons.map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                title={btn.title || btn.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: btn.bg || "#fff8e6",
                  color: "#222",
                  border: "1px solid #d7c9b5",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  transition: "background 0.2s, transform 0.2s",
                }}
                onMouseDown={(e) =>
                  (e.currentTarget.style.transform = "scale(0.96)")
                }
                onMouseUp={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                {btn.icon && <span style={{ fontSize: 18 }}>{btn.icon}</span>}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetractableMapControls;
