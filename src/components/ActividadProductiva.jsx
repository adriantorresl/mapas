import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Función para generar colores para actividad económica usando valores numéricos
const generateActividadColorPalette = (values) => {
  if (!values || values.length === 0) return {};

  const numericValues = values
    .filter((v) => v != null && !isNaN(v))
    .map(Number);
  if (numericValues.length === 0) return {};

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const colors = ["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837"];

  const result = {};
  numericValues.forEach((value) => {
    const normalizedValue = (value - min) / (max - min);
    const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
    result[value] =
      colors[Math.max(0, Math.min(colorIndex, colors.length - 1))];
  });

  return result;
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
const ColorLegend = ({ colorMap, isVisible, currentField }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

  const fieldNames = {
    PEA: "Población Económicamente Activa",
    PE_INAC: "Población Económicamente Inactiva",
    POCUPADA: "Población Ocupada",
    PDESOCUP: "Población Desocupada",
  };

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

  // Ordenar valores numéricamente
  const sortedEntries = Object.entries(colorMap).sort(([a], [b]) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Leyenda</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #ddd",
            backgroundColor: "#fafafa",
            scrollbarWidth: "thin",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "11px",
            }}
          >
            {fieldNames[currentField] || currentField}
          </div>
          {sortedEntries.map(([value, color]) => (
            <div
              key={value}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
                fontSize: "11px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "2px",
                }}
              />
              <span style={{ color: "#333" }}>
                {parseFloat(value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Control de coordenadas en la esquina inferior izquierda
const CoordinateControl = () => {
  const map = useMap();
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    map.on("mousemove", handleMouseMove);
    return () => map.off("mousemove", handleMouseMove);
  }, [map]);

  const controlStyle = {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    backgroundColor: "white",
    padding: "5px 10px",
    borderRadius: "3px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "monospace",
    fontSize: "12px",
  };

  return (
    <div style={controlStyle}>
      Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
    </div>
  );
};

// Control de escala
const ScaleControl = () => {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({ position: "bottomleft" });
    scale.addTo(map);
    return () => map.removeControl(scale);
  }, [map]);

  return null;
};

// Control de información en la esquina superior izquierda
const InfoControl = ({ currentField }) => {
  const fieldNames = {
    PEA: "Población Económicamente Activa",
    PE_INAC: "Población Económicamente Inactiva",
    POCUPADA: "Población Ocupada",
    PDESOCUP: "Población Desocupada",
  };

  const controlStyle = {
    position: "absolute",
    top: "80px",
    left: "10px",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    maxWidth: "300px",
  };

  return (
    <div style={controlStyle}>
      <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
        Actividad Productiva
      </h4>
      <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>
        Datos económicos ITER 2020: {fieldNames[currentField] || currentField}
      </p>
      <div style={{ fontSize: "11px", color: "#007bff", fontWeight: "bold" }}>
        Fuente: INEGI - ITER 2020
      </div>
    </div>
  );
};

// Control de arrastre en la esquina superior derecha
const DraggingControl = () => {
  const map = useMap();
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(true);

  const toggleDragging = () => {
    if (isDraggingEnabled) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
    setIsDraggingEnabled(!isDraggingEnabled);
  };

  const controlStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: "5px",
    cursor: "pointer",
    zIndex: 1000,
  };

  return (
    <div
      style={controlStyle}
      onClick={toggleDragging}
      title={isDraggingEnabled ? "Deshabilitar arrastre" : "Habilitar arrastre"}
    >
      <span style={{ fontSize: "18px" }}>
        {isDraggingEnabled ? "🔓" : "🔒"}
      </span>
    </div>
  );
};

// Control de capas siguiendo el formato exacto de Población
const LayerControl = ({
  layers,
  activeLayers,
  toggleLayer,
  opacity,
  handleOpacityChange,
  tooltipsEnabled,
  toggleTooltips,
  activeBaseLayer,
  changeBaseLayer,
  currentField,
  onFieldChange,
  onZoomToData,
  onDownloadData,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const map = useMap();

  const controlStyle = {
    position: "absolute",
    top: "80px",
    right: "10px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "300px",
    maxWidth: "350px",
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
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

  // Componente para elementos de capa
  const LayerItem = ({
    layerKey,
    title,
    data,
    showOpacity = false,
    showDownload = true,
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
          onChange={(e) => toggleLayer(layerKey)}
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
            onClick={() =>
              downloadGeoJSON(data, title.toLowerCase().replace(/\s+/g, "_"))
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
        )}
      </div>
      {showOpacity && activeLayers[layerKey] && (
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

  if (isCollapsed) {
    return (
      <div style={controlStyle}>
        <div style={headerStyle} onClick={() => setIsCollapsed(false)}>
          <span>Capas</span>
          <span style={{ fontSize: "10px" }}>▼</span>
        </div>
      </div>
    );
  }

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(true)}>
        <span>Capas</span>
        <span style={{ fontSize: "10px" }}>▲</span>
      </div>

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
              color: "#2c3e50",
              marginBottom: "10px",
              display: "block",
              fontSize: "16px",
            }}
          >
            Límites
          </strong>
          {layers.area && (
            <LayerItem
              layerKey="area"
              title="Área de estudio"
              data={layers.area}
              showOpacity={false}
              showDownload={true}
            />
          )}
          {layers.paisajes && (
            <LayerItem
              layerKey="paisajes"
              title="Paisajes bioculturales"
              data={layers.paisajes}
              showOpacity={false}
              showDownload={true}
            />
          )}
          {layers.municipios && (
            <LayerItem
              layerKey="municipios"
              title="Municipios"
              data={layers.municipios}
              showOpacity={false}
              showDownload={true}
            />
          )}
        </div>

        {/* Actividad Productiva */}
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
            }}
          >
            Actividad Productiva
          </strong>

          {/* Selector de campo */}
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Variable a mostrar:
            </label>
            <select
              value={currentField}
              onChange={(e) => onFieldChange(e.target.value)}
              style={{
                width: "100%",
                padding: "5px",
                fontSize: "11px",
                border: "1px solid #ccc",
                borderRadius: "3px",
              }}
            >
              <option value="PEA">Población Económicamente Activa</option>
              <option value="PE_INAC">Población Económicamente Inactiva</option>
              <option value="POCUPADA">Población Ocupada</option>
              <option value="PDESOCUP">Población Desocupada</option>
            </select>
          </div>

          {layers.iter2020 && (
            <LayerItem
              layerKey="iter2020"
              title="Datos económicos ITER 2020"
              data={layers.iter2020}
              showOpacity={true}
              showDownload={true}
            />
          )}
        </div>

        {/* Controles adicionales */}
        <div style={{ marginTop: "10px", display: "flex", gap: "5px" }}>
          <button
            onClick={onZoomToData}
            style={{
              padding: "8px 12px",
              fontSize: "11px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
              flex: "1",
            }}
          >
            Zoom a datos
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal
const ActividadProductiva = ({ geojsonUrl = "/ITER_2020.geojson" }) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [iter2020, setIter2020] = useState(null);

  // Estados para controles
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    iter2020: true,
  });

  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    iter2020: 0.8,
  });

  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [activeBaseLayer, setActiveBaseLayer] = useState("OpenStreetMap");
  const [currentField, setCurrentField] = useState("PEA");
  const [colorMap, setColorMap] = useState({});

  // Cargar datos
  useEffect(() => {
    fetch("/AREA.geojson")
      .then((res) => res.json())
      .then(setArea)
      .catch(console.error);
    fetch("/PAISAJES.geojson")
      .then((res) => res.json())
      .then(setPaisajes)
      .catch(console.error);
    fetch("/MUNICIPIOS.geojson")
      .then((res) => res.json())
      .then(setMunicipios)
      .catch(console.error);
    fetch(geojsonUrl)
      .then((res) => res.json())
      .then(setIter2020)
      .catch(console.error);
  }, [geojsonUrl]);

  // Generar mapa de colores cuando cambien los datos o el campo
  useEffect(() => {
    if (iter2020 && currentField) {
      const values = iter2020.features
        .map((f) => f.properties[currentField])
        .filter((val) => val !== null && val !== undefined && !isNaN(val));

      const newColorMap = generateActividadColorPalette(values);
      setColorMap(newColorMap);
    }
  }, [iter2020, currentField]);

  // Control del mapa usando el patrón exacto de Población
  const MapController = () => {
    const map = useMap();

    useEffect(() => {
      // Limpiar capas anteriores (excepto base)
      map.eachLayer((layer) => {
        try {
          if (layer.options && (layer.options.id || layer._customId)) {
            map.removeLayer(layer);
          }
        } catch (e) {
          // La capa podría no estar en el mapa, ignorar error
        }
      });

      const newLayers = {};

      // Crear panes personalizados para controlar el orden de las capas
      if (!map.getPane("vectorPane")) {
        map.createPane("vectorPane");
        map.getPane("vectorPane").style.zIndex = 400; // Capas vectoriales debajo
      }

      // Capas base
      const baseLayers = {
        OpenStreetMap: L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 18,
          }
        ),
        "Topográfico (OpenTopoMap)": L.tileLayer(
          "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
          {
            attribution:
              'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
            maxZoom: 17,
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
        if (activeLayers.area) {
          newLayers.area.addTo(map);
        }
      }

      if (paisajes) {
        newLayers.paisajes = L.geoJSON(paisajes, {
          style: { color: "white", weight: 3, fillOpacity: 0 },
        });
        if (activeLayers.paisajes) {
          newLayers.paisajes.addTo(map);
        }
      }

      if (municipios) {
        newLayers.municipios = L.geoJSON(municipios, {
          style: { color: "black", weight: 1, fillOpacity: 0 },
        });
        if (activeLayers.municipios) {
          newLayers.municipios.addTo(map);
        }
      }

      // Capas de Interés - ITER 2020 con coloreado por campo
      if (iter2020 && Object.keys(colorMap).length > 0) {
        newLayers.iter2020 = L.geoJSON(iter2020, {
          pane: "vectorPane",
          style: (feature) => {
            const value = feature.properties[currentField];
            return {
              fillColor: colorMap[value] || "#CCCCCC",
              weight: 0,
              opacity: 1,
              color: "white",
              fillOpacity: opacity.iter2020 || 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              const props = feature.properties;
              const fieldNames = {
                PEA: "Población Económicamente Activa",
                PE_INAC: "Población Económicamente Inactiva",
                POCUPADA: "Población Ocupada",
                PDESOCUP: "Población Desocupada",
              };

              // Configurar tooltip al hacer hover si está habilitado
              const bindTooltipIfEnabled = () => {
                if (tooltipsEnabled) {
                  layer.bindTooltip(
                    `
                    <strong>${
                      props.NOMGEO || props.NOMBRE || "Área"
                    }:</strong><br>
                    <strong>${fieldNames[currentField]}:</strong> ${
                      props[currentField] || "N/A"
                    }
                    `,
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

              bindTooltipIfEnabled();

              // Configurar popup al hacer clic
              layer.on("click", (e) => {
                const content = `
                  <div style="font-family: Arial, sans-serif; font-size: 12px;">
                    <h4 style="margin: 0 0 8px 0;">${
                      props.NOMGEO || props.NOMBRE || "Área"
                    }</h4>
                    <div><strong>PEA:</strong> ${props.PEA || "N/A"}</div>
                    <div><strong>PE Inactiva:</strong> ${
                      props.PE_INAC || "N/A"
                    }</div>
                    <div><strong>Población Ocupada:</strong> ${
                      props.POCUPADA || "N/A"
                    }</div>
                    <div><strong>Población Desocupada:</strong> ${
                      props.PDESOCUP || "N/A"
                    }</div>
                  </div>
                `;
                layer.bindPopup(content).openPopup();
              });
            }
          },
        });
        if (activeLayers.iter2020) {
          newLayers.iter2020.addTo(map);
        }
      }

      // Guardar referencia de capas
      window.mapLayers = newLayers;
      window.mapBaseLayers = baseLayers;
    }, [
      area,
      paisajes,
      municipios,
      iter2020,
      activeLayers,
      activeBaseLayer,
      opacity,
      tooltipsEnabled,
      currentField,
      colorMap,
    ]);

    return null;
  };

  // Funciones de control
  const toggleLayer = (layerKey) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({
      ...prev,
      [layerKey]: newOpacity,
    }));
  };

  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  const changeBaseLayer = (layerName) => {
    setActiveBaseLayer(layerName);
  };

  const handleZoomToData = () => {
    if (iter2020 && window.mapLayers && window.mapLayers.iter2020) {
      const bounds = window.mapLayers.iter2020.getBounds();
      if (window.mapInstance) {
        window.mapInstance.fitBounds(bounds);
      }
    }
  };

  const handleDownloadData = () => {
    if (iter2020) {
      downloadGeoJSON(iter2020, "ITER_2020_actividad_productiva");
    }
  };

  // Datos para el control de capas
  const layers = {
    baseLayers: {
      OpenStreetMap: null,
      "Topográfico (OpenTopoMap)": null,
    },
    area,
    paisajes,
    municipios,
    iter2020,
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={[19.5, -99.0]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        ref={(mapInstance) => {
          if (mapInstance) {
            window.mapInstance = mapInstance;
          }
        }}
      >
        <MapController />

        {/* Controles */}
        <InfoControl currentField={currentField} />
        <DraggingControl />
        <CoordinateControl />
        <ScaleControl />

        <LayerControl
          layers={layers}
          activeLayers={activeLayers}
          toggleLayer={toggleLayer}
          opacity={opacity}
          handleOpacityChange={handleOpacityChange}
          tooltipsEnabled={tooltipsEnabled}
          toggleTooltips={toggleTooltips}
          activeBaseLayer={activeBaseLayer}
          changeBaseLayer={changeBaseLayer}
          currentField={currentField}
          onFieldChange={setCurrentField}
          onZoomToData={handleZoomToData}
          onDownloadData={handleDownloadData}
        />

        <ColorLegend
          colorMap={colorMap}
          isVisible={activeLayers.iter2020 && Object.keys(colorMap).length > 0}
          currentField={currentField}
        />
      </MapContainer>
    </div>
  );
};

export default ActividadProductiva;
