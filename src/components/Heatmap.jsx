import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const Heatmap = ({
  geojsonUrl,
  valueColumn,
  startColor = "#ffeda0",
  endColor = "#f03b20",
  style = { height: "100vh", width: "100%" },
  borderColor = "#333",
  borderWidth = 1,
}) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const geojsonRef = useRef(null);

  // Genera una rampa de colores entre startColor y endColor
  const generateColorRamp = (steps = 10) => {
    const colors = [];
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      colors.push(interpolateColor(startColor, endColor, ratio));
    }
    return colors;
  };

  // Función para interpolar colores
  const interpolateColor = (color1, color2, factor) => {
    const hex = (color) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : [0, 0, 0];
    };

    const rgb1 = hex(color1);
    const rgb2 = hex(color2);

    const result = rgb1.map((channel, i) =>
      Math.round(channel + factor * (rgb2[i] - channel))
    );

    return `#${result.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  };

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        setLoading(true);
        const response = await fetch(geojsonUrl);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setGeojsonData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching GeoJSON:", err);
      } finally {
        setLoading(false);
      }
    };

    if (geojsonUrl) fetchGeoJSON();
  }, [geojsonUrl]);

  // Zoom to bounds cuando los datos están listos
  useEffect(() => {
    if (geojsonData && mapRef.current && geojsonRef.current) {
      const bounds = geojsonRef.current.getBounds();
      mapRef.current.fitBounds(bounds);
    }
  }, [geojsonData]);

  // Calcula valores para la leyenda y el mapa
  const values = geojsonData
    ? geojsonData.features
        .map((f) => f.properties[valueColumn])
        .filter((val) => typeof val === "number")
    : [];
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const colorRamp = generateColorRamp();

  const renderHeatmap = () => {
    if (!geojsonData || !valueColumn) return null;

    const styleFeature = (feature) => {
      const value = feature.properties[valueColumn];
      return {
        fillColor: getColor(value, minValue, maxValue, colorRamp),
        weight: borderWidth,
        opacity: 1,
        color: borderColor,
        dashArray: "3",
        fillOpacity: 0.7,
      };
    };

    const getColor = (value, min, max, ramp) => {
      if (min === max) return ramp[0];
      const normalized = (value - min) / (max - min);
      const index = Math.min(
        Math.floor(normalized * ramp.length),
        ramp.length - 1
      );
      return ramp[index];
    };

    return (
      <GeoJSON
        ref={geojsonRef}
        data={geojsonData}
        style={styleFeature}
        onEachFeature={(feature, layer) => {
          layer.bindTooltip(
            `
            <div>
              <strong>${feature.properties.NOMGEO || "Municipio"}</strong><br/>
              ${feature.properties[valueColumn]} habitantes
            </div>
          `,
            {
              permanent: false,
              direction: "auto",
              className: "heatmap-tooltip",
            }
          );
        }}
      />
    );
  };

  return (
    <div className="heatmap-container" style={{ position: "relative" }}>
      <MapContainer
        ref={mapRef}
        center={[0, 0]}
        zoom={2}
        style={style}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {renderHeatmap()}
      </MapContainer>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-message">Cargando mapa de calor...</div>
        </div>
      )}

      {error && (
        <div className="error-overlay">
          <div className="error-message">Error: {error}</div>
        </div>
      )}

      {/* Leyenda de simbología */}
      {geojsonData && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "12px 18px",
            zIndex: 1000,
            minWidth: 180,
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
            Población Total
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{minValue}</span>
            <div style={{ flex: 1, height: 16, display: "flex" }}>
              {colorRamp.map((color, i) => (
                <div
                  key={i}
                  style={{
                    background: color,
                    width: `${100 / colorRamp.length}%`,
                    height: "100%",
                  }}
                />
              ))}
            </div>
            <span>{maxValue}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
