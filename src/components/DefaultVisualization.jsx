import React from "react";
import MapChart from "./MapChart";

/**
 * Componente de fallback que se muestra cuando una sección no tiene
 * componente de visualización específico asignado
 */
const DefaultVisualization = ({ sectionId }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        backgroundColor: "#f5f5f5",
      }}
    >
      <MapChart
        geoJsonUrl="/PAISAJES.geojson"
        categoriaCol="paisaje"
        hectareasCol="sup_ha"
        showChart={true}
        showDelimitationControl={false}
        showPaletteControl={false}
        showChartLabels={true}
      />
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "8px",
          textAlign: "center",
          fontSize: "0.9rem",
          color: "#666",
          maxWidth: "300px",
        }}
      >
        <p>
          📍 <strong>Sección: {sectionId}</strong>
        </p>
        <p>
          Visualización en desarrollo. Mostrando mapa base de paisajes
          bioculturales.
        </p>
      </div>
    </div>
  );
};

export default DefaultVisualization;
