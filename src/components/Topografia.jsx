import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";
import { color } from "framer-motion";

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
    const response = await fetch(url);
    if (!response.ok) throw new Error("No se pudo descargar el archivo");
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Error descargando archivo raster:", error);
    alert(`Error al descargar ${displayName}`);
  }
};

// Componente de leyenda retráctil en esquina inferior derecha
const ColorLegend = ({ colorMap, isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

  const legendStyle = {
    color: "white",
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
  };

  const headerStyle = {
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Leyenda</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
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
          {Object.entries(colorMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([item, color]) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "6px",
                  fontSize: "10px",
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

// Componente de leyenda para el raster de elevaciones
const ElevationLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Colores del gradiente de elevación (mismo que en RasterOverlay)
  const colors = ["#ffff80", "#ffcc66", "#ff9999", "#cc66cc", "#9933cc"];

  // Valores aproximados de elevación para la zona (ajustar según tus datos)
  const minElevation = 0; // metros
  const maxElevation = 3000; // metros

  const legendStyle = {
    color: "white",
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
  };

  const headerStyle = {
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  // Crear gradiente CSS para la rampa
  const gradientColors = colors.join(", ");
  const rampStyle = {
    height: "20px",
    background: `linear-gradient(to right, ${gradientColors})`,
    border: "1px solid #999",
    borderRadius: "2px",
    margin: "8px 0",
  };

  const labelsStyle = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    color: "white",
    marginTop: "4px",
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            backgroundColor: "#1E3C20",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "11px",
            }}
          >
            Elevación (msnm)
          </div>
          <div style={rampStyle}></div>
          <div style={labelsStyle}>
            <span>{minElevation.toLocaleString()}</span>
            <span>{maxElevation.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const CoordinateControl = () => {
  const map = useMap();
  useEffect(() => {
    // Crear el div de coordenadas con posicionamiento absoluto
    const coordinateDiv = L.DomUtil.create("div", "coordinate-control");
    coordinateDiv.style.position = "absolute";
    coordinateDiv.style.bottom = "18px";
    coordinateDiv.style.right = "80px"; // A la izquierda de donde está la escala
    coordinateDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    coordinateDiv.style.padding = "2px";
    coordinateDiv.style.border = "2px solid rgba(0, 0, 0, 0.26)";
    coordinateDiv.style.borderRadius = "0px";
    coordinateDiv.style.font = "10px, Inter, sans-serif";
    coordinateDiv.style.zIndex = "999";
    coordinateDiv.innerHTML = "Lat: 0.00000, Lon: 0.00000";

    // Agregar directamente al contenedor del mapa
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
    top: "80px", // Bajado más abajo del botón de zoom
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
  cuencas,
  escurrimientos,
  rasterFile,
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
      });
      newLayers.area.addTo(map);
    }

    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 3, fillOpacity: 0 },
      });
      newLayers.paisajes.addTo(map);
    }

    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 1, fillOpacity: 0 },
      });
      newLayers.municipios.addTo(map);
    }

    if (cuencas) {
      newLayers.cuencas = L.geoJSON(cuencas, {
        style: { color: "blue", weight: 2, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                layer.bindTooltip(
                  `<strong>Cuenca:</strong> ${
                    props.NOMBRE || props.NAME || "N/A"
                  }`,
                  {
                    permanent: false,
                    direction: "auto",
                    className: "custom-tooltip",
                  }
                );
              } else {
                layer.unbindTooltip();
              }
            };
            layer.bindPopup(
              `<strong>Cuenca:</strong> ${props.NOMBRE || props.NAME || "N/A"}`
            );
            bindTooltipIfEnabled();
            layer.updateTooltip = bindTooltipIfEnabled;
          }
        },
      });
      // No agregar automáticamente al mapa - se controlará por activeLayers
      if (activeLayers.cuencas) {
        newLayers.cuencas.addTo(map);
      }
    }

    if (escurrimientos) {
      newLayers.escurrimientos = L.geoJSON(escurrimientos, {
        style: (feature) => {
          // Obtener el valor del campo ORD_FLOW para determinar el grosor
          const ordFlow = feature.properties.ORD_FLOW || 5;

          // Mapear valores específicos a grosores apropiados
          let weight;
          if (ordFlow <= 5) {
            weight = 1.5; // Escurrimientos menores
          } else if (ordFlow === 6) {
            weight = 3.5; // Escurrimientos principales
          } else {
            weight = 2.5; // Valores intermedios si los hay
          }

          return {
            color: "cyan",
            weight: weight,
            fillOpacity: 0,
            opacity: 0.8,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                layer.bindTooltip(
                  `<strong>Escurrimiento:</strong> ${
                    props.NOMBRE || props.NAME || "N/A"
                  }<br><strong>Orden:</strong> ${props.ORD_FLOW || "N/A"}`,
                  {
                    permanent: false,
                    direction: "auto",
                    className: "custom-tooltip",
                  }
                );
              } else {
                layer.unbindTooltip();
              }
            };
            layer.bindPopup(
              `<strong>Escurrimiento:</strong> ${
                props.NOMBRE || props.NAME || "N/A"
              }<br><strong>Orden:</strong> ${props.ORD_FLOW || "N/A"}`
            );
            bindTooltipIfEnabled();
            layer.updateTooltip = bindTooltipIfEnabled;
          }
        },
      });
      newLayers.escurrimientos.addTo(map);
    }

    setLayers({ ...newLayers, baseLayers });

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
    cuencas,
    escurrimientos,
    activeBaseLayer,
    activeLayers.cuencas,
  ]);

  // Efecto para actualizar tooltips cuando cambie el estado
  useEffect(() => {
    ["cuencas", "escurrimientos"].forEach((layerKey) => {
      if (layers[layerKey]) {
        layers[layerKey].eachLayer((layer) => {
          if (layer.updateTooltip) {
            layer.updateTooltip();
          }
        });
      }
    });
  }, [tooltipsEnabled, layers]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };

    if (layerKey === "raster") {
      // Manejo especial para la capa raster
      newActiveLayers[layerKey] = !activeLayers[layerKey];
      setActiveLayers(newActiveLayers);
      return;
    }

    const layer = layers[layerKey];
    if (!layer) return;

    if (activeLayers[layerKey]) {
      map.removeLayer(layer);
      newActiveLayers[layerKey] = false;
    } else {
      layer.addTo(map);
      newActiveLayers[layerKey] = true;
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
      layer.setStyle({
        fillOpacity: newOpacity * 0.7,
        opacity: newOpacity,
      });
    }
  };

  const controlStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
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
              color: "white",
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
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 2v8m0 0l-3-3m3 3l3-3"
                stroke="white"
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
                fill="white"
              />
            </svg>
          </button>
        )}
      </div>
      {showOpacity && (
        <>
          <div
            style={{ fontSize: "10px", color: "white", marginBottom: "5px" }}
          >
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
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
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
                color: "white",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
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
                color: "white",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
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

          {/* Capas de Interés */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "10px",
            }}
          >
            <strong
              style={{
                color: "white",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Topografía
            </strong>
            {cuencas && (
              <LayerItem
                layerKey="cuencas"
                title="Cuencas"
                data={cuencas}
                showOpacity={true}
              />
            )}
            {escurrimientos && (
              <LayerItem
                layerKey="escurrimientos"
                title="Escurrimientos"
                data={escurrimientos}
                showOpacity={true}
              />
            )}
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
                  checked={activeLayers.raster || false}
                  onChange={() => toggleLayer("raster")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Elevaciones
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
                  title="Descargar Pendiente"
                  onClick={() => downloadRaster("MDE.tif", "Pendiente")}
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
                      stroke="white"
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
                      fill="white"
                    />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "white",
                  marginBottom: "5px",
                }}
              >
                Opacidad: {Math.round(opacity.raster * 100)}%
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity.raster}
                onChange={(e) =>
                  setOpacity((prev) => ({
                    ...prev,
                    raster: parseFloat(e.target.value),
                  }))
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para manejar dragging
const DraggingControl = () => {
  const map = useMap();

  useEffect(() => {
    // Habilitar dragging por defecto después de que se monte el mapa
    setTimeout(() => {
      map.dragging.enable();
    }, 100);
  }, [map]);

  return null;
};

const MapView = () => {
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [cuencas, setCuencas] = useState(null);
  const [escurrimientos, setEscurrimientos] = useState(null);
  const [colorMap, setColorMap] = useState({});
  const [showLegend, setShowLegend] = useState(false);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    cuencas: false,
    escurrimientos: true,
    raster: true,
  });
  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    cuencas: 1,
    escurrimientos: 1,
    raster: 0.85,
  });

  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  useEffect(() => {
    fetch("/AREA.geojson")
      .then((res) => res.json())
      .then(setArea);
    fetch("/PAISAJES.geojson")
      .then((res) => res.json())
      .then(setPaisajes);
    fetch("/MUNICIPIOS.geojson")
      .then((res) => res.json())
      .then(setMunicipios);
    fetch("/CUENCAS.geojson")
      .then((res) => res.json())
      .then(setCuencas);
    fetch("/ESCURRIMIENTOS.geojson")
      .then((res) => res.json())
      .then(setEscurrimientos);
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
        cuencas={cuencas}
        escurrimientos={escurrimientos}
        rasterFile="MDE.tif"
        onColorMapChange={setColorMap}
        onLegendVisibilityChange={setShowLegend}
        tooltipsEnabled={tooltipsEnabled}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
      />
      {activeLayers.raster && (
        <RasterOverlay
          fileName="MDE.tif"
          colorMap={["#ffff80", "#ffcc66", "#ff9999", "#cc66cc", "#9933cc"]}
          baseUrl="/"
          continuous={true}
          setError={() => {}}
          setLoading={() => {}}
          onPixelValue={() => {}}
          overlayOpacity={opacity.raster}
        />
      )}
      <ColorLegend
        colorMap={colorMap}
        isVisible={showLegend && !activeLayers.raster}
      />
      <ElevationLegend isVisible={activeLayers.raster} />
      <CoordinateControl />
      <ScaleControl />
    </MapContainer>
  );
};

export default MapView;
