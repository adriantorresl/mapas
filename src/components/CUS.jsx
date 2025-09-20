import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Clasificaciones CUS basadas en la guía de A (Antropogénico) y V (Vegetación)
const CUS_CLASSIFICATIONS = {
  "A-A-A-A-A-A-A": "#8B4513", // marrón muy oscuro
  "A-A-A-A-A-A": "#A0522D", // marrón oscuro
  "A-A-A-A-A": "#CD853F", // marrón medio
  "A-A-A-A": "#D2691E", // chocolate claro
  "A-A-A": "#F4A460", // marrón arena
  "A-A": "#F5DEB3", // beige
  A: "#FFF8DC", // crema
  V: "#90EE90", // verde claro
  "V-V": "#7CFC00", // verde lima
  "V-V-V": "#32CD32", // verde limón
  "V-V-V-V": "#228B22", // verde bosque
  "V-V-V-V-V": "#006400", // verde oscuro
  "V-V-V-V-V-V": "#004d00", // verde muy oscuro
  "V-V-V-V-V-V-V": "#003300", // verde profundo
};

// Función para analizar sucesión consecutiva de campos S1-S7
const analyzeSuccession = (feature) => {
  const series = ["S1", "S2", "S3", "S4", "S5", "S6", "S7"];
  let consecutiveChar = null;
  let consecutiveCount = 0;

  for (const field of series) {
    const value = feature.properties[field];
    if (!value || typeof value !== "string") break;

    const char = value.charAt(0).toUpperCase();
    if (char !== "A" && char !== "V") break;

    if (consecutiveChar === null) {
      consecutiveChar = char;
      consecutiveCount = 1;
    } else if (char === consecutiveChar) {
      consecutiveCount++;
    } else {
      break; // Se rompe la sucesión
    }
  }

  if (consecutiveChar && consecutiveCount > 0) {
    return Array(consecutiveCount).fill(consecutiveChar).join("-");
  }

  return "A"; // valor por defecto
};

// Función para generar colores para SERIE7 USV_S7
const generateSerie7ColorPalette = () => {
  // Mapeo específico basado en la Serie VII (2018) de la guía
  const colorMap = {
    Agua: "#4ed6ff", // Agua - azul cielo
    "Agricultura de temporal": "#eee9fd", // Agricultura de temporal - lavanda
    "Agricultura de riego": "#e99dfd", // Agricultura de riego - púrpura medio
    Ganaderia: "#ffe0a5", // Ganadería - khaki
    Urbano: "#4d4d4d", // Urbano - gris oscuro
    "Vegetacion secundaria arbustiva": "#f7f7a3", // Vegetación sec. arbustiva - beige
    "Selva baja caducifolia": "#acac7c", // Selva baja caducifolia - verde mar oscuro
    "Bosque de mezquite": "#e4c8bb", // Bosque de mezquite - marrón arena
    "Bosque de encino": "#dcc492", // Bosque de encino - tostado
    "Bosque de encino-pino": "#c3dc94", // Bosque de encino-pino - verde amarillento
    "Bosque de pino": "#9bc24b", // Bosque de pino - verde bosque
    "Bosque de pino-encino": "#4dc1a8", // Bosque de pino-encino - turquesa
    "Bosque de oyamel": "#94dcc4", // Bosque de oyamel - verde mar claro
    "Bosque mesófilo": "#4c9d81", // Bosque mesófilo - verde mar
  };

  return colorMap;
};

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

// Componente de leyenda retráctil en esquina inferior derecha
const ColorLegend = ({ colorMap, isVisible, title }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

  // Orden específico para las clasificaciones CUS (A primero, luego V)
  const cusOrder = [
    "A-A-A-A-A-A-A",
    "A-A-A-A-A-A",
    "A-A-A-A-A",
    "A-A-A-A",
    "A-A-A",
    "A-A",
    "A",
    "V",
    "V-V",
    "V-V-V",
    "V-V-V-V",
    "V-V-V-V-V",
    "V-V-V-V-V-V",
    "V-V-V-V-V-V-V",
  ];

  // Función para ordenar los entries según el tipo de leyenda
  const getSortedEntries = () => {
    const entries = Object.entries(colorMap);

    // Si es una leyenda CUS (contiene clasificaciones A-A-A o V-V-V)
    const isCusLegend = entries.some(
      ([key]) =>
        key.includes("A-A") || key.includes("V-V") || key === "A" || key === "V"
    );

    if (isCusLegend) {
      // Ordenar según cusOrder
      return entries.sort(([a], [b]) => {
        const indexA = cusOrder.indexOf(a);
        const indexB = cusOrder.indexOf(b);

        // Si ambos están en cusOrder, usar ese orden
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // Si solo uno está en cusOrder, ese va primero
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Si ninguno está en cusOrder, orden alfabético
        return a.localeCompare(b);
      });
    } else {
      // Para otras leyendas (Serie VII), mantener orden alfabético
      return entries.sort(([a], [b]) => a.localeCompare(b));
    }
  };

  const sortedEntries = getSortedEntries();

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    border: "2px solid rgba(0,0,0,0.2)",
  };

  const headerStyle = {
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#f8f9fa",
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{title || "Leyenda"}</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            maxHeight: "500px",
            overflowY: "auto",
            border: "1px solid #ddd",
            backgroundColor: "#fafafa",
            scrollbarWidth: "thin",
          }}
        >
          {sortedEntries.map(([item, color]) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
                fontSize: "12px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #999",
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              ></div>
              <span style={{ lineHeight: "1.2" }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CoordinateControl = () => {
  const map = useMap();
  useEffect(() => {
    const coordinateDiv = L.DomUtil.create("div", "coordinate-control");
    coordinateDiv.style.position = "absolute";
    coordinateDiv.style.bottom = "10px";
    coordinateDiv.style.right = "80px";
    coordinateDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    coordinateDiv.style.padding = "5px";
    coordinateDiv.style.border = "2px solid rgba(0,0,0,0.2)";
    coordinateDiv.style.borderRadius = "0px";
    coordinateDiv.style.font =
      '11px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif';
    coordinateDiv.style.zIndex = "999";
    coordinateDiv.innerHTML = "Lat: 0.00000, Lon: 0.00000";

    map.getContainer().appendChild(coordinateDiv);

    const updateCoordinates = (e) => {
      const lat = e.latlng.lat.toFixed(5);
      const lng = e.latlng.lng.toFixed(5);
      coordinateDiv.innerHTML = `Lat: ${lat}, Lon: ${lng}`;
    };

    map.on("mousemove", updateCoordinates);

    return () => {
      if (coordinateDiv.parentNode) {
        coordinateDiv.parentNode.removeChild(coordinateDiv);
      }
      map.off("mousemove", updateCoordinates);
    };
  }, [map]);

  return null;
};

const ScaleControl = () => {
  const map = useMap();

  useEffect(() => {
    const scaleControl = L.control.scale({
      position: "bottomright",
      metric: true,
      imperial: false,
    });

    map.addControl(scaleControl);

    return () => {
      map.removeControl(scaleControl);
    };
  }, [map]);

  return null;
};

// Componente para el control de información (tooltips)
const InfoControl = ({ onToggleTooltips, tooltipsEnabled }) => {
  const controlStyle = {
    position: "absolute",
    top: "80px",
    left: "10px",
    backgroundColor: "white",
    borderRadius: "0%",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 999,
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "2px solid rgba(0,0,0,0.2)",
    userSelect: "none",
  };

  const activeStyle = {
    ...controlStyle,
    backgroundColor: tooltipsEnabled ? "#4ECDC4" : "white",
    color: tooltipsEnabled ? "white" : "black",
  };

  return (
    <div
      style={activeStyle}
      onClick={onToggleTooltips}
      title={
        tooltipsEnabled
          ? "Desactivar información al pasar el mouse"
          : "Activar información al pasar el mouse"
      }
    >
      ℹ︎
    </div>
  );
};

// Componente para el control de capas agrupadas con funcionalidad extendida
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  serie7,
  cusData,
  onColorMapChange,
  onLegendVisibilityChange,
  tooltipsEnabled,
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
    // Limpiar capas anteriores (excepto capas base)
    Object.entries(layers).forEach(([key, layer]) => {
      if (key !== "baseLayers" && layer && layer.remove) {
        try {
          map.removeLayer(layer);
        } catch (e) {
          // La capa podría no estar en el mapa, ignorar error
        }
      }
    });

    const newLayers = {};

    // Capas base
    const baseLayers = {
      "Topográfico (OpenTopoMap)": L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
          maxZoom: 17,
        }
      ),
      "Satélite (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
        }
      ),
    };

    // Agregar capa base activa por defecto
    baseLayers[activeBaseLayer].addTo(map);

    // Zona de Estudio
    if (area) {
      newLayers.area = L.geoJSON(area, {
        style: { color: "black", weight: 6, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (tooltipsEnabled && feature.properties) {
            const popup = Object.entries(feature.properties)
              .map(([key, value]) => `<b>${key}:</b> ${value}`)
              .join("<br>");
            layer.bindTooltip(popup, {
              permanent: false,
              direction: "top",
              className: "custom-tooltip",
            });
          }
        },
      });
      if (activeLayers.area) {
        newLayers.area.addTo(map);
      }
    }

    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 3, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (tooltipsEnabled && feature.properties) {
            const popup = Object.entries(feature.properties)
              .map(([key, value]) => `<b>${key}:</b> ${value}`)
              .join("<br>");
            layer.bindTooltip(popup, {
              permanent: false,
              direction: "top",
              className: "custom-tooltip",
            });
          }
        },
      });
      if (activeLayers.paisajes) {
        newLayers.paisajes.addTo(map);
      }
    }

    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 2, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (tooltipsEnabled && feature.properties) {
            const popup = Object.entries(feature.properties)
              .map(([key, value]) => `<b>${key}:</b> ${value}`)
              .join("<br>");
            layer.bindTooltip(popup, {
              permanent: false,
              direction: "top",
              className: "custom-tooltip",
            });
          }
        },
      });
      if (activeLayers.municipios) {
        newLayers.municipios.addTo(map);
      }
    }

    // SERIE7 - Colorear por USV_S7
    if (serie7) {
      const serie7ColorMap = generateSerie7ColorPalette();

      newLayers.serie7 = L.geoJSON(serie7, {
        style: (feature) => ({
          fillColor: serie7ColorMap[feature.properties.USV_S7] || "#CCCCCC",
          weight: 0.5,
          opacity: 1,
          color: "white",
          fillOpacity: opacity.serie7,
        }),
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const popup = Object.entries(feature.properties)
              .map(([key, value]) => `<b>${key}:</b> ${value}`)
              .join("<br>");
            layer.bindPopup(popup);

            if (tooltipsEnabled) {
              layer.bindTooltip(popup, {
                permanent: false,
                direction: "top",
                className: "custom-tooltip",
              });
            }
          }
        },
      });

      if (activeLayers.serie7) {
        newLayers.serie7.addTo(map);
        if (onColorMapChange && onLegendVisibilityChange) {
          onColorMapChange(serie7ColorMap);
          onLegendVisibilityChange(true);
        }
      }
    }

    // CUS - Colorear por clasificación de sucesión A/V
    if (cusData) {
      const cusClassifications = {};
      cusData.features.forEach((feature) => {
        const classification = analyzeSuccession(feature);
        if (CUS_CLASSIFICATIONS[classification]) {
          cusClassifications[classification] =
            CUS_CLASSIFICATIONS[classification];
        }
      });

      newLayers.cus = L.geoJSON(cusData, {
        style: (feature) => {
          const classification = analyzeSuccession(feature);
          return {
            fillColor: CUS_CLASSIFICATIONS[classification] || "#CCCCCC",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: opacity.cus,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const classification = analyzeSuccession(feature);
            const popup = `
              <b>Clasificación CUS:</b> ${classification}<br>
              <b>S1:</b> ${feature.properties.S1 || "N/A"}<br>
              <b>S2:</b> ${feature.properties.S2 || "N/A"}<br>
              <b>S3:</b> ${feature.properties.S3 || "N/A"}<br>
              <b>S4:</b> ${feature.properties.S4 || "N/A"}<br>
              <b>S5:</b> ${feature.properties.S5 || "N/A"}<br>
              <b>S6:</b> ${feature.properties.S6 || "N/A"}<br>
              <b>S7:</b> ${feature.properties.S7 || "N/A"}
            `;
            layer.bindPopup(popup);

            if (tooltipsEnabled) {
              layer.bindTooltip(`CUS: ${classification}`, {
                permanent: false,
                direction: "top",
                className: "custom-tooltip",
              });
            }
          }
        },
      });

      if (activeLayers.cus) {
        newLayers.cus.addTo(map);
        if (onColorMapChange && onLegendVisibilityChange) {
          onColorMapChange(cusClassifications);
          onLegendVisibilityChange(true);
        }
      }
    }

    setLayers({ ...newLayers, baseLayers });

    return () => {
      Object.entries(newLayers).forEach(([key, layer]) => {
        if (key !== "baseLayers" && layer && layer.remove) {
          try {
            map.removeLayer(layer);
          } catch (e) {
            // Ignorar errores
          }
        }
      });
    };
  }, [
    map,
    area,
    paisajes,
    municipios,
    serie7,
    cusData,
    activeLayers,
    activeBaseLayer,
    tooltipsEnabled,
    opacity,
    onColorMapChange,
    onLegendVisibilityChange,
  ]);

  // Efecto para actualizar tooltips cuando cambie el estado
  useEffect(() => {
    Object.entries(layers).forEach(([key, layer]) => {
      if (key !== "baseLayers" && layer && layer.eachLayer) {
        layer.eachLayer((sublayer) => {
          if (tooltipsEnabled) {
            if (!sublayer.getTooltip()) {
              const feature = sublayer.feature;
              if (feature && feature.properties) {
                const popup = Object.entries(feature.properties)
                  .map(([key, value]) => `<b>${key}:</b> ${value}`)
                  .join("<br>");
                sublayer.bindTooltip(popup, {
                  permanent: false,
                  direction: "top",
                  className: "custom-tooltip",
                });
              }
            }
          } else {
            if (sublayer.getTooltip()) {
              sublayer.unbindTooltip();
            }
          }
        });
      }
    });
  }, [tooltipsEnabled, layers]);

  const toggleLayer = (layerKey) => {
    const layer = layers[layerKey];
    if (!layer) return;

    const newActiveLayers = { ...activeLayers };

    if (activeLayers[layerKey]) {
      map.removeLayer(layer);
      newActiveLayers[layerKey] = false;

      // Controlar visibilidad de la leyenda
      if (
        (layerKey === "serie7" || layerKey === "cus") &&
        onLegendVisibilityChange
      ) {
        const otherLayerActive =
          layerKey === "serie7" ? activeLayers.cus : activeLayers.serie7;
        if (!otherLayerActive) {
          onLegendVisibilityChange(false);
        }
      }
    } else {
      layer.addTo(map);
      newActiveLayers[layerKey] = true;

      // Actualizar mapa de colores y mostrar leyenda
      if (
        layerKey === "serie7" &&
        serie7 &&
        onColorMapChange &&
        onLegendVisibilityChange
      ) {
        const serie7ColorMap = generateSerie7ColorPalette();
        onColorMapChange(serie7ColorMap);
        onLegendVisibilityChange(true);
      } else if (
        layerKey === "cus" &&
        cusData &&
        onColorMapChange &&
        onLegendVisibilityChange
      ) {
        const cusClassifications = {};
        cusData.features.forEach((feature) => {
          const classification = analyzeSuccession(feature);
          if (CUS_CLASSIFICATIONS[classification]) {
            cusClassifications[classification] =
              CUS_CLASSIFICATIONS[classification];
          }
        });
        onColorMapChange(cusClassifications);
        onLegendVisibilityChange(true);
      }
    }

    setActiveLayers(newActiveLayers);
  };

  const changeBaseLayer = (newBaseLayer) => {
    // Remover capa base actual
    if (layers.baseLayers && layers.baseLayers[activeBaseLayer]) {
      map.removeLayer(layers.baseLayers[activeBaseLayer]);
    }

    // Agregar nueva capa base
    if (layers.baseLayers && layers.baseLayers[newBaseLayer]) {
      layers.baseLayers[newBaseLayer].addTo(map);
    }

    setActiveBaseLayer(newBaseLayer);
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
    const layer = layers[layerKey];
    if (layer && map.hasLayer(layer)) {
      layer.eachLayer((sublayer) => {
        sublayer.setStyle({ fillOpacity: newOpacity });
      });
    }
  };

  const controlStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    maxWidth: "300px",
  };

  const headerStyle = {
    padding: "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
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
        marginBottom: "2px",
        padding: "0px",
        backgroundColor: "transparent",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "4px",
          gap: "6px",
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
        {showDownload && (
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
            onClick={() => downloadGeoJSON(data, title.toLowerCase())}
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
              e.stopPropagation();
              map.dragging.disable();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              map.dragging.enable();
            }}
            onMouseLeave={(e) => {
              map.dragging.enable();
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              e.stopPropagation();
              map.dragging.disable();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              map.dragging.enable();
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
        <span>Capas</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "15px" }}>
          {/* Capas Base */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "10px",
            }}
          >
            <strong
              style={{
                color: "#2c3e50",
                marginBottom: "10px",
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Capas Base
            </strong>
            <div style={{ marginLeft: "10px" }}>
              {layers.baseLayers &&
                Object.keys(layers.baseLayers).map((baseLayerName) => (
                  <div key={baseLayerName} style={{ marginBottom: "5px" }}>
                    <input
                      type="radio"
                      name="baseLayer"
                      checked={activeBaseLayer === baseLayerName}
                      onChange={() => changeBaseLayer(baseLayerName)}
                    />
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "12px",
                        fontWeight: "normal",
                      }}
                    >
                      {baseLayerName}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Zona de Estudio */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "10px",
            }}
          >
            <strong
              style={{
                color: "#2c3e50",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Límites
            </strong>
            {area && (
              <LayerItem
                layerKey="area"
                title="Área de estudio"
                data={area}
                showOpacity={false}
              />
            )}
            {paisajes && (
              <LayerItem
                layerKey="paisajes"
                title="Paisajes bioculturales"
                data={paisajes}
                showOpacity={false}
              />
            )}
            {municipios && (
              <LayerItem
                layerKey="municipios"
                title="Municipios"
                data={municipios}
                showOpacity={false}
              />
            )}
          </div>

          {/* Capas CUS */}
          <div>
            <strong
              style={{
                color: "#2c3e50",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Cambio de Uso de Suelo
            </strong>
            {serie7 && (
              <LayerItem
                layerKey="serie7"
                title="Serie VII (2018)"
                data={serie7}
                showOpacity={true}
              />
            )}
            {cusData && (
              <LayerItem
                layerKey="cus"
                title="Cambios de uso de suelo (1980-2018)"
                data={cusData}
                showOpacity={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para controlar el dragging del mapa
const DraggingControl = () => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.dragging.enable();
    }, 100);
  }, [map]);

  return null;
};

const CUS = () => {
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [serie7, setSerie7] = useState(null);
  const [cusData, setCusData] = useState(null);
  const [colorMap, setColorMap] = useState({});
  const [showLegend, setShowLegend] = useState(false);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    serie7: true,
    cus: false,
  });
  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    serie7: 0.8,
    cus: 0.8,
  });

  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const [
          areaResponse,
          paisajesResponse,
          municipiosResponse,
          serie7Response,
          cusResponse,
        ] = await Promise.all([
          fetch("/AREA.geojson"),
          fetch("/paisajes.geojson"),
          fetch("/MUNICIPIOS.geojson"),
          fetch("/SERIE7.geojson"),
          fetch("/CUS.geojson"),
        ]);

        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          setArea(areaData);
        }

        if (paisajesResponse.ok) {
          const paisajesData = await paisajesResponse.json();
          setPaisajes(paisajesData);
        }

        if (municipiosResponse.ok) {
          const municipiosData = await municipiosResponse.json();
          setMunicipios(municipiosData);
        }

        if (serie7Response.ok) {
          const serie7Data = await serie7Response.json();
          setSerie7(serie7Data);
        }

        if (cusResponse.ok) {
          const cusDataFile = await cusResponse.json();
          setCusData(cusDataFile);
        }
      } catch (error) {
        console.error("Error cargando datos geoespaciales:", error);
      }
    };

    loadGeoData();
  }, []);

  return (
    <MapContainer
      center={[16.67566, -96.28311]}
      zoom={10}
      scrollWheelZoom={true}
      dragging={false}
      style={{ height: "100vh", width: "100%" }}
    >
      <InfoControl
        onToggleTooltips={toggleTooltips}
        tooltipsEnabled={tooltipsEnabled}
      />
      <DraggingControl />
      <GroupedLayerControl
        area={area}
        paisajes={paisajes}
        municipios={municipios}
        serie7={serie7}
        cusData={cusData}
        onColorMapChange={setColorMap}
        onLegendVisibilityChange={setShowLegend}
        tooltipsEnabled={tooltipsEnabled}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
      />
      <ColorLegend
        colorMap={colorMap}
        isVisible={showLegend}
        title={
          activeLayers.serie7 && !activeLayers.cus
            ? "Serie VII"
            : activeLayers.cus && !activeLayers.serie7
            ? "Cambios de uso de suelo"
            : "Leyenda"
        }
      />
      <CoordinateControl />
      <ScaleControl />
    </MapContainer>
  );
};

export default CUS;
