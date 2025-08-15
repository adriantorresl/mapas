import React, { useState, useEffect, useRef } from "react";
import RetractableMapControls from "./RetractableMapControls";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-mouse-position";
import "leaflet-mouse-position/src/L.Control.MousePosition.css";

// Hook para cargar capas adicionales (igual que en MapChart)
function useMapLayers(layersConfig) {
  const [layers, setLayers] = useState({});
  useEffect(() => {
    layersConfig.forEach(({ key, url }) => {
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setLayers((prev) => ({ ...prev, [key]: data }));
        })
        .catch(() => {
          setLayers((prev) => ({ ...prev, [key]: null }));
        });
    });
    // eslint-disable-next-line
  }, []);
  return layers;
}

const Heatmap = ({
  geojsonUrl,
  valueColumn,
  colorRamp = null,
  startColor = "#ffeda0",
  endColor = "#f03b20",
  style = { height: "100vh", width: "100%" },
  borderColor = "#333",
  borderWidth = 1,
  legendTitle = "Población Total",
  valueUnit = "habitantes",
}) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paisajesData, setPaisajesData] = useState(null);
  const mapRef = useRef(null);
  const geojsonRef = useRef(null);

  // Interpolación de colores entre dos extremos
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

  // Genera la rampa si no se pasa directamente como prop
  const generateColorRamp = (steps = 10) => {
    if (colorRamp && Array.isArray(colorRamp)) return colorRamp;
    const colors = [];
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      colors.push(interpolateColor(startColor, endColor, ratio));
    }
    return colors;
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

  useEffect(() => {
    const fetchPaisajes = async () => {
      try {
        const response = await fetch("/PAISAJES.geojson");
        if (!response.ok) throw new Error("No se pudo cargar PAISAJES.geojson");
        const data = await response.json();
        setPaisajesData(data);
      } catch (err) {
        console.error("Error cargando PAISAJES.geojson:", err);
      }
    };
    fetchPaisajes();
  }, []);

  useEffect(() => {
    if (geojsonData && mapRef.current && geojsonRef.current) {
      const bounds = geojsonRef.current.getBounds();
      mapRef.current.fitBounds(bounds, { maxZoom: 12 });
    }
  }, [geojsonData]);

  const values = geojsonData
    ? geojsonData.features
        .map((f) => f.properties[valueColumn])
        .filter((val) => typeof val === "number")
    : [];

  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const ramp = generateColorRamp();

  const getColor = (value, min, max, ramp) => {
    if (min === max) return ramp[0];
    const normalized = (value - min) / (max - min);
    const index = Math.min(
      Math.floor(normalized * ramp.length),
      ramp.length - 1
    );
    return ramp[index];
  };

  const renderHeatmap = () => {
    if (!geojsonData || !valueColumn) return null;

    const styleFeature = (feature) => {
      const value = feature.properties[valueColumn];
      return {
        fillColor: getColor(value, minValue, maxValue, ramp),
        weight: borderWidth,
        opacity: 1,
        color: borderColor,
        dashArray: "3",
        fillOpacity: 0.7,
      };
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
              ${feature.properties[valueColumn]} ${valueUnit}
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

  // Componente para agregar controles de escala y coordenadas
  function MapExtraControls() {
    const map = useMap();
    useEffect(() => {
      // Control de escala
      const scale = L.control.scale({
        position: "bottomright",
        metric: true,
        imperial: false,
      });
      scale.addTo(map);

      // Control de posición del mouse
      const mousePosition = L.control.mousePosition({
        position: "bottomleft",
        separator: " | ",
        emptyString: "Mueve el cursor sobre el mapa",
        lngFirst: false,
        numDigits: 5,
        lngFormatter: (lng) => `Lon: ${lng.toFixed(5)}°`,
        latFormatter: (lat) => `Lat: ${lat.toFixed(5)}°`,
      });
      mousePosition.addTo(map);

      return () => {
        scale.remove();
        mousePosition.remove();
      };
    }, [map]);
    return null;
  }

  // Cargar capas adicionales
  const layersConfig = [
    { key: "areaBorders", url: "AREA.geojson" },
    { key: "municipiosBorders", url: "MARGINACION.geojson" },
  ];
  const { areaBorders, municipiosBorders } = useMapLayers(layersConfig);

  // --- BOTÓN: Exportar mapa como imagen ---
  const exportMapAsImage = async () => {
    if (!mapRef.current) {
      alert("El mapa aún no está listo para exportar.");
      return;
    }
    try {
      const html2canvas = await import("html2canvas");
      const mapContainer = mapRef.current.getContainer
        ? mapRef.current.getContainer()
        : mapRef.current._container;

      // Oculta controles antes de exportar
      const controls = mapContainer.querySelectorAll(
        ".leaflet-control-container"
      );
      controls.forEach((el) => (el.style.visibility = "hidden"));

      const canvas = await html2canvas.default(mapContainer, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        logging: false,
      });

      // Restaura controles
      controls.forEach((el) => (el.style.visibility = "visible"));

      const link = document.createElement("a");
      link.download = "mapa_heatmap.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Mapa exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar el mapa:", error);
      alert("Error al exportar el mapa. Intenta de nuevo.");
    }
  };

  // --- BOTÓN: Descargar GeoJSON ---
  const downloadGeoJson = async () => {
    try {
      const response = await fetch(geojsonUrl);
      if (!response.ok) throw new Error("No se pudo descargar el archivo.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = geojsonUrl.split("/").pop() || "datos.geojson";
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al descargar el archivo GeoJSON.");
      console.error(error);
    }
  };

  return (
    <div className="heatmap-container" style={{ position: "relative" }}>
      <RetractableMapControls
        panelTitle="Herramientas"
        position={{ bottom: 40, left: 14 }}
        buttons={[
          {
            label: "Descargar GeoJSON",
            icon: "⬇️",
            bg: "#e8f5e9",
            onClick: downloadGeoJson,
          },
          {
            label: "Exportar Mapa",
            icon: "📷",
            bg: "#e3f2fd",
            onClick: exportMapAsImage,
          },
        ]}
      />
      <MapContainer
        ref={mapRef}
        center={[23.6345, -102.5528]}
        zoom={5}
        zoomControl={false}
        style={style}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <MapExtraControls />

        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite (ESRI)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          </LayersControl.BaseLayer>

          {/* Área de Estudio */}
          {areaBorders && (
            <LayersControl.Overlay checked name="Área de Estudio">
              <GeoJSON
                data={areaBorders}
                style={() => ({
                  color: "black",
                  weight: 5,
                  fillOpacity: 0,
                })}
              />
            </LayersControl.Overlay>
          )}

          {/* Municipios */}
          {municipiosBorders && (
            <LayersControl.Overlay checked name="Municipios">
              <GeoJSON
                data={municipiosBorders}
                style={() => ({
                  color: "white",
                  weight: 1,
                  fillOpacity: 0,
                })}
              />
            </LayersControl.Overlay>
          )}

          {/* Capa principal */}
          {geojsonData && (
            <LayersControl.Overlay checked name="Capa principal">
              <GeoJSON
                ref={geojsonRef}
                data={geojsonData}
                style={(feature) => ({
                  fillColor: getColor(
                    feature.properties[valueColumn],
                    minValue,
                    maxValue,
                    ramp
                  ),
                  weight: borderWidth,
                  opacity: 1,
                  color: borderColor,
                  dashArray: "3",
                  fillOpacity: 0.7,
                })}
                onEachFeature={(feature, layer) => {
                  layer.bindTooltip(
                    `
                    <div>
                      <strong>${
                        feature.properties.NOMGEO || "Municipio"
                      }</strong><br/>
                      ${feature.properties[valueColumn]} ${valueUnit}
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
            </LayersControl.Overlay>
          )}

          {/* Paisajes opcional */}
          {paisajesData && (
            <LayersControl.Overlay checked name="Paisajes">
              <GeoJSON
                data={paisajesData}
                style={{
                  color: "black",
                  weight: 3,
                  fillOpacity: 0,
                  opacity: 1,
                }}
                interactive={false}
              />
            </LayersControl.Overlay>
          )}
        </LayersControl>
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

      {geojsonData && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "12px 18px",
            zIndex: 999,
            minWidth: 180,
            fontSize: 14,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
            {legendTitle}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{minValue}</span>
            <div style={{ flex: 1, height: 16, display: "flex" }}>
              {ramp.map((color, i) => (
                <div
                  key={i}
                  style={{
                    background: color,
                    width: `${100 / ramp.length}%`,
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
