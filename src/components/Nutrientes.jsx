import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

// Función para descargar GeoJSON
const downloadGeoJSON = (data, filename) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.geojson`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Función para descargar archivos raster
const downloadRaster = async (filename, displayName) => {
  try {
    const url = `/${filename}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error(`Error descargando ${displayName}:`, error);
    alert(`Error al descargar ${displayName}`);
  }
};

// Componente de leyenda para Balance de Nitrógeno
const NitrogenoLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "200px",
    maxWidth: "250px",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const categories = [
    { name: "0 - 300", color: "#1a9850" },
    { name: "301 - 900", color: "#91bfdb" },
    { name: "901 - 1,500", color: "#ffffbf" },
    { name: "1,501 - 2,100", color: "#fc8d59" },
    { name: "2,101 - 3,202", color: "#d73027" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Balance de Nitrógeno (Ton/Nitrógeno)</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && (
        <div>
          {categories.map((category) => (
            <div
              key={category.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: category.color,
                  border: "1px solid #666",
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              />
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para Balance de Fósforo
const FosforoLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "200px",
    maxWidth: "250px",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const categories = [
    { name: "0 - 5000", color: "#762a83" },
    { name: "5001 - 10000", color: "#af8dc3" },
    { name: "10001 - 20000", color: "#f7f7f7" },
    { name: "20001 - 40000", color: "#7fbf7b" },
    { name: "40001 - 80455", color: "#1b7837" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Balance de Fósforo (Ton/Fósforo)</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && (
        <div>
          {categories.map((category) => (
            <div
              key={category.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: category.color,
                  border: "1px solid #666",
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              />
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para raster de Tendencia de Nitrógeno
const TendenciaNitrogenoLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para tendencia de nitrógeno (RdBu invertido)
  const createColorRamp = () => {
    const colors = [
      "#67001f", // Rojo oscuro (pérdida alta)
      "#b2182b", // Rojo
      "#d6604d", // Rojo claro
      "#f4a582", // Rosa
      "#fddbc7", // Rosa muy claro
      "#ffffff", // Blanco (neutro)
      "#d1e5f0", // Azul muy claro
      "#92c5de", // Azul claro
      "#4393c3", // Azul
      "#2166ac", // Azul oscuro
      "#053061", // Azul muy oscuro (ganancia alta)
    ];

    return (
      <div style={{ marginTop: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          <span>Muy baja</span>
          <span>Muy alta</span>
        </div>
        <div
          style={{
            height: "20px",
            background: `linear-gradient(to right, ${colors.join(", ")})`,
            border: "1px solid #666",
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: "10px",
            marginTop: "4px",
            fontStyle: "italic",
          }}
        >
          <span>Tendencia de Nitrógeno (kg/ha/año)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Tendencia Nitrógeno</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente de leyenda para raster de Tendencia de Fósforo
const TendenciaFosforoLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para tendencia de fósforo (PRGn)
  const createColorRamp = () => {
    const colors = [
      "#40004b", // Púrpura oscuro (pérdida alta)
      "#762a83", // Púrpura
      "#9970ab", // Púrpura claro
      "#c2a5cf", // Lavanda
      "#e7d4e8", // Lavanda claro
      "#ffffff", // Blanco (neutro)
      "#d9f0d3", // Verde muy claro
      "#a6dba0", // Verde claro
      "#5aae61", // Verde
      "#1b7837", // Verde oscuro
      "#00441b", // Verde muy oscuro (ganancia alta)
    ];

    return (
      <div style={{ marginTop: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          <span>Muy baja</span>
          <span>Muy alta</span>
        </div>
        <div
          style={{
            height: "20px",
            background: `linear-gradient(to right, ${colors.join(", ")})`,
            border: "1px solid #666",
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: "10px",
            marginTop: "4px",
            fontStyle: "italic",
          }}
        >
          <span>Tendencia de Fósforo (kg/ha/año)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Tendencia Fósforo</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente para el control de capas agrupadas
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  expNutr,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState(
    "Topográfico (OpenTopoMap)"
  );

  useEffect(() => {
    const baseLayers = {
      "Topográfico (OpenTopoMap)": L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        }
      ),
      "Satelital (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
        }
      ),
      "Calles (OpenStreetMap)": L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ),
    };

    // Agregar capa base activa
    const currentBaseLayer = baseLayers[activeBaseLayer];
    if (currentBaseLayer && !map.hasLayer(currentBaseLayer)) {
      // Remover otras capas base
      Object.values(baseLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      currentBaseLayer.addTo(map);
    }

    const newLayers = {};

    // Área de estudio
    if (area) {
      newLayers.area = L.geoJSON(area, {
        style: { color: "black", weight: 6, fillOpacity: 0 },
      });
      if (activeLayers.area) {
        newLayers.area.addTo(map);
      }
    }

    // Paisajes
    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 4, fillOpacity: 0 },
      });
      if (activeLayers.paisajes) {
        newLayers.paisajes.addTo(map);
      }
    }

    // Municipios
    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 2, fillOpacity: 0 },
      });
      if (activeLayers.municipios) {
        newLayers.municipios.addTo(map);
      }
    }

    // Exportación de Nutrientes - Nitrógeno
    if (expNutr) {
      const fieldN = "S7_N";
      const colorCategoriesN = {
        "0 - 300": "#1a9850",
        "301 - 900": "#91bfdb",
        "901 - 1,500": "#ffffbf",
        "1,501 - 2,100": "#fc8d59",
        "2,101 - 3,202": "#d73027",
      };

      newLayers.expNutrN = L.geoJSON(expNutr, {
        style: (feature) => {
          const value = feature.properties[fieldN];
          let color = "#666666";
          let fillColor = "#999999";

          // Clasificar valores en categorías según rangos de Nitrógeno
          if (value >= 0 && value <= 300) {
            color = colorCategoriesN["0 - 300"];
            fillColor = colorCategoriesN["0 - 300"];
          } else if (value >= 301 && value <= 900) {
            color = colorCategoriesN["301 - 900"];
            fillColor = colorCategoriesN["301 - 900"];
          } else if (value >= 901 && value <= 1500) {
            color = colorCategoriesN["901 - 1,500"];
            fillColor = colorCategoriesN["901 - 1,500"];
          } else if (value >= 1501 && value <= 2100) {
            color = colorCategoriesN["1,501 - 2,100"];
            fillColor = colorCategoriesN["1,501 - 2,100"];
          } else if (value >= 2101 && value <= 3202) {
            color = colorCategoriesN["2,101 - 3,202"];
            fillColor = colorCategoriesN["2,101 - 3,202"];
          }

          return {
            color: color,
            weight: 2,
            fillOpacity: 0.6,
            fillColor: fillColor,
          };
        },
      });
      if (activeLayers.expNutrN) {
        newLayers.expNutrN.addTo(map);
      }
    }

    // Exportación de Nutrientes - Fósforo
    if (expNutr) {
      const fieldP = "S7_P";
      const colorCategoriesP = {
        "0 - 5000": "#762a83",
        "5001 - 10000": "#af8dc3",
        "10001 - 20000": "#f7f7f7",
        "20001 - 40000": "#7fbf7b",
        "40001 - 80455": "#1b7837",
      };

      newLayers.expNutrP = L.geoJSON(expNutr, {
        style: (feature) => {
          const value = feature.properties[fieldP];
          let color = "#666666";
          let fillColor = "#999999";

          // Clasificar valores en categorías según rangos de Fósforo
          if (value >= 0 && value <= 5000) {
            color = colorCategoriesP["0 - 5000"];
            fillColor = colorCategoriesP["0 - 5000"];
          } else if (value >= 5001 && value <= 10000) {
            color = colorCategoriesP["5001 - 10000"];
            fillColor = colorCategoriesP["5001 - 10000"];
          } else if (value >= 10001 && value <= 20000) {
            color = colorCategoriesP["10001 - 20000"];
            fillColor = colorCategoriesP["10001 - 20000"];
          } else if (value >= 20001 && value <= 40000) {
            color = colorCategoriesP["20001 - 40000"];
            fillColor = colorCategoriesP["20001 - 40000"];
          } else if (value >= 40001 && value <= 80455) {
            color = colorCategoriesP["40001 - 80455"];
            fillColor = colorCategoriesP["40001 - 80455"];
          }

          return {
            color: color,
            weight: 2,
            fillOpacity: 0.6,
            fillColor: fillColor,
          };
        },
      });
      if (activeLayers.expNutrP) {
        newLayers.expNutrP.addTo(map);
      }
    }

    setLayers(newLayers);

    return () => {
      Object.values(newLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      Object.values(baseLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [
    map,
    area,
    paisajes,
    municipios,
    expNutr,
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
    activeLayers.expNutrN,
    activeLayers.expNutrP,
  ]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };

    if (layerKey === "rasterN" || layerKey === "rasterP") {
      // Manejo especial para las capas raster
      newActiveLayers[layerKey] = !activeLayers[layerKey];
      setActiveLayers(newActiveLayers);
      return;
    }

    newActiveLayers[layerKey] = !activeLayers[layerKey];
    setActiveLayers(newActiveLayers);

    const layer = layers[layerKey];
    if (layer) {
      if (newActiveLayers[layerKey]) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
      }
    }
  };

  const changeBaseLayer = (baseLayerName) => {
    setActiveBaseLayer(baseLayerName);
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
    const layer = layers[layerKey];
    if (layer && activeLayers[layerKey]) {
      layer.setStyle({ fillOpacity: newOpacity });
    }
  };

  const controlStyle = {
    position: "absolute",
    top: "20px",
    right: "10px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    maxWidth: isCollapsed ? "auto" : "220px",
    minWidth: isCollapsed ? "auto" : "200px",
    width: isCollapsed ? "fit-content" : "auto",
  };

  const headerStyle = {
    padding: isCollapsed ? "8px 10px" : "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    fontSize: isCollapsed ? "12px" : "13px",
    whiteSpace: "nowrap",
  };

  const LayerItem = ({
    layerKey,
    title,
    data,
    showDownload = true,
    showOpacity = true,
  }) => (
    <div
      style={{
        marginBottom: "6px",
        padding: "0px",
        backgroundColor: "transparent",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "8px",
          gap: "8px",
        }}
      >
        <input
          type="checkbox"
          checked={activeLayers[layerKey] || false}
          onChange={() => toggleLayer(layerKey)}
        />
        <span style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}>
          {title}
        </span>
        {showDownload && data && (
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              padding: "0px",
              borderRadius: "3px",
              cursor: "pointer",
              marginLeft: "2px",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={`Descargar ${title}`}
            onClick={() => downloadGeoJSON(data, title)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2v8m0 0l-3-3m3 3l3-3"
                stroke="#333"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="3"
                y="13"
                width="10"
                height="1.5"
                rx="0.75"
                fill="#333"
              />
            </svg>
          </button>
        )}
      </div>
      {showOpacity && (
        <>
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "5px" }}>
            Opacidad: {Math.round(opacity[layerKey] * 100)}%
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity[layerKey]}
            onChange={(e) =>
              handleOpacityChange(layerKey, parseFloat(e.target.value))
            }
            onMouseDown={(e) => {
              e.target.style.cursor = "grabbing";
            }}
            onMouseUp={(e) => {
              e.target.style.cursor = "grab";
            }}
            onMouseLeave={(e) => {
              e.target.style.cursor = "grab";
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              e.target.style.cursor = "grabbing";
            }}
            onTouchEnd={(e) => {
              e.target.style.cursor = "grab";
            }}
            style={{ width: "100%" }}
          />
        </>
      )}
    </div>
  );

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{isCollapsed ? "Capas" : "Capas"}</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "15px" }}>
          {/* Capas Base */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "15px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Mapa Base
            </div>
            {[
              "Topográfico (OpenTopoMap)",
              "Satelital (ESRI)",
              "Calles (OpenStreetMap)",
            ].map((layerName) => (
              <div
                key={layerName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <input
                  type="radio"
                  name="baseLayer"
                  checked={activeBaseLayer === layerName}
                  onChange={() => changeBaseLayer(layerName)}
                />
                <span style={{ marginLeft: "8px", fontSize: "12px" }}>
                  {layerName}
                </span>
              </div>
            ))}
          </div>

          {/* Límites */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "15px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Límites
            </div>
            <LayerItem
              layerKey="area"
              title="Área de estudio"
              data={area}
              showOpacity={false}
            />
            <LayerItem
              layerKey="paisajes"
              title="Paisajes bioculturales"
              data={paisajes}
              showOpacity={false}
            />
            <LayerItem
              layerKey="municipios"
              title="Municipios"
              data={municipios}
              showOpacity={false}
            />
          </div>

          {/* Grupo de Nitrógeno */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "15px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Nitrógeno
            </div>
            <LayerItem
              layerKey="expNutrN"
              title="Balance de Nitrógeno"
              data={expNutr}
              showOpacity={true}
            />
            <div
              style={{
                marginBottom: "6px",
                padding: "0px",
                backgroundColor: "transparent",
                borderRadius: "0px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={activeLayers.rasterN || false}
                  onChange={() => toggleLayer("rasterN")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Tendencia de Nitrógeno
                </span>
                <button
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "0px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    marginLeft: "2px",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Descargar TEND_N.tif"
                  onClick={() =>
                    downloadRaster("TEND_N.tif", "Tendencia Nitrógeno")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 2v8m0 0l-3-3m3 3l3-3"
                      stroke="#333"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="3"
                      y="13"
                      width="10"
                      height="1.5"
                      rx="0.75"
                      fill="#333"
                    />
                  </svg>
                </button>
              </div>
              <div
                style={{ fontSize: "10px", color: "#666", marginBottom: "5px" }}
              >
                Opacidad: {Math.round(opacity.rasterN * 100)}%
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity.rasterN}
                onChange={(e) =>
                  handleOpacityChange("rasterN", parseFloat(e.target.value))
                }
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* Grupo de Fósforo */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Fósforo
            </div>
            <LayerItem
              layerKey="expNutrP"
              title="Balance de Fósforo"
              data={expNutr}
              showOpacity={true}
            />
            <div
              style={{
                marginBottom: "6px",
                padding: "0px",
                backgroundColor: "transparent",
                borderRadius: "0px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                  gap: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={activeLayers.rasterP || false}
                  onChange={() => toggleLayer("rasterP")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Tendencia de Fósforo
                </span>
                <button
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    padding: "0px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    marginLeft: "2px",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Descargar TEND_P.tif"
                  onClick={() =>
                    downloadRaster("TEND_P.tif", "Tendencia Fósforo")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 2v8m0 0l-3-3m3 3l3-3"
                      stroke="#333"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="3"
                      y="13"
                      width="10"
                      height="1.5"
                      rx="0.75"
                      fill="#333"
                    />
                  </svg>
                </button>
              </div>
              <div
                style={{ fontSize: "10px", color: "#666", marginBottom: "5px" }}
              >
                Opacidad: {Math.round(opacity.rasterP * 100)}%
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity.rasterP}
                onChange={(e) =>
                  handleOpacityChange("rasterP", parseFloat(e.target.value))
                }
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const Nutrientes = ({
  rastersBasePath = "/data/rasters/nutrientes/",
  geojsonUrl = "/EXP_NUTR.geojson",
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [expNutr, setExpNutr] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    expNutrN: false,
    expNutrP: false,
    rasterN: false,
    rasterP: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    expNutrN: 0.6,
    expNutrP: 0.6,
    rasterN: 0.7,
    rasterP: 0.7,
  });

  // Estados para leyendas
  const [nitrogenoLegendVisible, setNitrogenoLegendVisible] = useState(false);
  const [fosforoLegendVisible, setFosforoLegendVisible] = useState(false);
  const [tendenciaNitrogenoLegendVisible, setTendenciaNitrogenoLegendVisible] =
    useState(true);
  const [tendenciaFosforoLegendVisible, setTendenciaFosforoLegendVisible] =
    useState(false);

  // Estados para manejo de carga y errores del raster
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el centro del mapa
  const [mapCenter, setMapCenter] = useState([19.5, -99.0]);
  const [mapZoom, setMapZoom] = useState(10);

  // Cargar datos GeoJSON al montar el componente
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        // Cargar área de estudio
        const areaResponse = await fetch("/AREA.geojson");
        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          setArea(areaData);

          // Calcular el centro y zoom basado en el área de estudio
          if (areaData && areaData.features && areaData.features.length > 0) {
            const bounds = L.geoJSON(areaData).getBounds();
            const center = bounds.getCenter();
            setMapCenter([center.lat, center.lng]);

            // Calcular zoom apropiado basado en el tamaño del área
            const latDiff = bounds.getNorth() - bounds.getSouth();
            const lngDiff = bounds.getEast() - bounds.getWest();
            const maxDiff = Math.max(latDiff, lngDiff);

            // Ajustar zoom basado en el tamaño del área
            let zoom = 10;
            if (maxDiff > 2) zoom = 8;
            else if (maxDiff > 1) zoom = 9;
            else if (maxDiff > 0.5) zoom = 10;
            else if (maxDiff > 0.2) zoom = 11;
            else zoom = 12;

            setMapZoom(zoom);
          }
        }

        // Cargar paisajes
        const paisajesResponse = await fetch("/PAISAJES.geojson");
        if (paisajesResponse.ok) {
          const paisajesData = await paisajesResponse.json();
          setPaisajes(paisajesData);
        }

        // Cargar municipios
        const municipiosResponse = await fetch("/MUNICIPIOS.geojson");
        if (municipiosResponse.ok) {
          const municipiosData = await municipiosResponse.json();
          setMunicipios(municipiosData);
        }

        // Cargar exportación de nutrientes
        const expNutrResponse = await fetch(geojsonUrl);
        if (expNutrResponse.ok) {
          const expNutrData = await expNutrResponse.json();
          setExpNutr(expNutrData);
        }
      } catch (error) {
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, [geojsonUrl]);

  // Efecto para controlar la visibilidad de las leyendas
  useEffect(() => {
    // Mostrar leyenda de nitrógeno
    if (activeLayers.expNutrN && !activeLayers.rasterN) {
      setNitrogenoLegendVisible(true);
      setTendenciaNitrogenoLegendVisible(false);
    } else if (activeLayers.rasterN && !activeLayers.expNutrN) {
      setNitrogenoLegendVisible(false);
      setTendenciaNitrogenoLegendVisible(true);
    } else if (activeLayers.rasterN && activeLayers.expNutrN) {
      // Si ambos están activos, priorizar raster
      setNitrogenoLegendVisible(false);
      setTendenciaNitrogenoLegendVisible(true);
    } else {
      setNitrogenoLegendVisible(false);
      setTendenciaNitrogenoLegendVisible(false);
    }

    // Mostrar leyenda de fósforo
    if (activeLayers.expNutrP && !activeLayers.rasterP) {
      setFosforoLegendVisible(true);
      setTendenciaFosforoLegendVisible(false);
    } else if (activeLayers.rasterP && !activeLayers.expNutrP) {
      setFosforoLegendVisible(false);
      setTendenciaFosforoLegendVisible(true);
    } else if (activeLayers.rasterP && activeLayers.expNutrP) {
      // Si ambos están activos, priorizar raster
      setFosforoLegendVisible(false);
      setTendenciaFosforoLegendVisible(true);
    } else {
      setFosforoLegendVisible(false);
      setTendenciaFosforoLegendVisible(false);
    }
  }, [
    activeLayers.expNutrN,
    activeLayers.expNutrP,
    activeLayers.rasterN,
    activeLayers.rasterP,
  ]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
      >
        {/* RasterOverlay para tendencias */}
        {activeLayers.rasterN && (
          <RasterOverlay
            fileName="TEND_N.tif"
            colorMap={[
              "#67001f",
              "#b2182b",
              "#d6604d",
              "#f4a582",
              "#fddbc7",
              "#ffffff",
              "#d1e5f0",
              "#92c5de",
              "#4393c3",
              "#2166ac",
              "#053061",
            ]}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={() => {}}
            overlayOpacity={opacity.rasterN}
          />
        )}

        {activeLayers.rasterP && (
          <RasterOverlay
            fileName="TEND_P.tif"
            colorMap={[
              "#40004b",
              "#762a83",
              "#9970ab",
              "#c2a5cf",
              "#e7d4e8",
              "#ffffff",
              "#d9f0d3",
              "#a6dba0",
              "#5aae61",
              "#1b7837",
              "#00441b",
            ]}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={() => {}}
            overlayOpacity={opacity.rasterP}
          />
        )}

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          expNutr={expNutr}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
        />

        {/* Indicador de carga */}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "10px 20px",
              borderRadius: "5px",
              zIndex: 2000,
              fontFamily: "Arial, sans-serif",
            }}
          >
            Cargando raster...
          </div>
        )}

        {/* Indicador de error */}
        {error && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#ff4444",
              color: "white",
              padding: "10px 20px",
              borderRadius: "5px",
              zIndex: 2000,
              fontFamily: "Arial, sans-serif",
            }}
          >
            Error: {error}
          </div>
        )}

        {/* Leyendas */}
        <NitrogenoLegend isVisible={nitrogenoLegendVisible} />
        <FosforoLegend isVisible={fosforoLegendVisible} />
        <TendenciaNitrogenoLegend isVisible={tendenciaNitrogenoLegendVisible} />
        <TendenciaFosforoLegend isVisible={tendenciaFosforoLegendVisible} />
      </MapContainer>
    </div>
  );
};

export default Nutrientes;
