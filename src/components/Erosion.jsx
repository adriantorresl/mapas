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

// Componente para mostrar coordenadas
const CoordinateControl = () => {
  const map = useMap();
  useEffect(() => {
    // Crear el div de coordenadas con posicionamiento absoluto
    const coordinateDiv = L.DomUtil.create("div", "coordinate-control");
    coordinateDiv.style.position = "absolute";
    coordinateDiv.style.bottom = "10px";
    coordinateDiv.style.left = "10px"; // Lado izquierdo del mapa
    coordinateDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    coordinateDiv.style.padding = "5px";
    coordinateDiv.style.border = "2px solid rgba(0,0,0,0.2)";
    coordinateDiv.style.borderRadius = "0px";
    coordinateDiv.style.font =
      '11px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif';
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

// Componente para mostrar la escala
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
    top: "120px", // Debajo del control de capas
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

// Componente de leyenda para Exportación de Sedimentos
const ExportacionLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "60px",
    right: "20px",
    backgroundColor: "#1E3C20",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "200px",
    maxWidth: "250px",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    color: "white",
  };

  const headerStyle = {
    backgroundColor: "#1E3C20",
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const categories = [
    { name: "Muy bajo", color: "#66CDAA" },
    { name: "Bajo", color: "#90EE90" },
    { name: "Medio", color: "#FFFFE0" },
    { name: "Alto", color: "#FFA500" },
    { name: "Muy alto", color: "#FF6347" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Exportación de Sedimentos</span>
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

// Componente de leyenda para el raster USLE
const RasterLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    color: "white",
    position: "absolute",
    bottom: "60px",
    right: "20px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
  };

  const headerStyle = {
    backgroundColor: "#1E3C20",
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para erosión (de menor a mayor) - usando la paleta de la imagen
  const createColorRamp = () => {
    const colors = [
      "#006837",
      "#31a354",
      "#78c679",
      "#c2e699",
      "#ffffcc",
      "#d73027", // Rojo (muy alta)
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
          <span>Muy Baja</span>
          <span>Muy Alta</span>
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
          <span>Tendencia de Erosión (t/ha/año)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>USLE Tendencia</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
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
  exportacionSedimentos,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  tooltipsEnabled,
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

    // Exportación de Sedimentos
    if (exportacionSedimentos) {
      newLayers.exportacionSedimentos = L.geoJSON(exportacionSedimentos, {
        style: (feature) => {
          const expSed = feature.properties.Exp_Sed;
          let color = "#666666"; // Color por defecto
          let fillColor = "#999999";

          // Asignar colores según el valor de Exp_Sed
          switch (expSed) {
            case "Muy bajo":
              color = "#2E8B57"; // Verde oscuro
              fillColor = "#66CDAA";
              break;
            case "Bajo":
              color = "#32CD32"; // Verde lima
              fillColor = "#90EE90";
              break;
            case "Medio":
              color = "#FFD700"; // Oro
              fillColor = "#FFFFE0";
              break;
            case "Alto":
              color = "#FF8C00"; // Naranja oscuro
              fillColor = "#FFA500";
              break;
            case "Muy alto":
              color = "#DC143C"; // Rojo carmesí
              fillColor = "#FF6347";
              break;
            default:
              color = "#666666";
              fillColor = "#999999";
          }

          return {
            color: color,
            weight: 2,
            fillOpacity: 0.6,
            fillColor: fillColor,
          };
        },
        onEachFeature: (feature, layer) => {
          // Configurar tooltip al hacer hover si está habilitado
          const bindTooltipIfEnabled = () => {
            if (tooltipsEnabled) {
              layer.bindTooltip(
                `<div style="font-family: Arial, sans-serif; font-size: 12px;">
                  <strong>Exportación de Sedimentos:</strong><br/>
                  <strong>Nivel:</strong> ${feature.properties.Exp_Sed || "N/A"}
                </div>`,
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

          // Configurar tooltip inicial
          bindTooltipIfEnabled();

          // Actualizar tooltip cuando cambie el estado
          layer.updateTooltip = bindTooltipIfEnabled;
        },
      });
      if (activeLayers.exportacionSedimentos) {
        newLayers.exportacionSedimentos.addTo(map);
      }
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
    exportacionSedimentos,
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
    activeLayers.exportacionSedimentos,
    tooltipsEnabled,
  ]);

  // Efecto para actualizar tooltips cuando cambie el estado
  useEffect(() => {
    Object.values(layers).forEach((layer) => {
      if (layer && layer.updateTooltip) {
        layer.updateTooltip();
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

    newActiveLayers[layerKey] = !activeLayers[layerKey];
    setActiveLayers(newActiveLayers);

    const layer = layers[layerKey];
    if (layer) {
      if (newActiveLayers[layerKey]) {
        layer.addTo(map);
        if (
          layerKey !== "area" &&
          layerKey !== "paisajes" &&
          layerKey !== "municipios"
        ) {
          layer.setStyle({ fillOpacity: opacity[layerKey] || 0.6 });
        }
      } else {
        map.removeLayer(layer);
      }
    }
  };

  const changeBaseLayer = (baseLayerName) => {
    if (layers.baseLayers) {
      // Remover la capa base anterior
      Object.values(layers.baseLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      // Agregar la nueva capa base
      layers.baseLayers[baseLayerName].addTo(map);
      setActiveBaseLayer(baseLayerName);
    }
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
    const layer = layers[layerKey];
    if (layer && activeLayers[layerKey]) {
      layer.setStyle({ fillOpacity: newOpacity });
    }
  };

  const controlStyle = {
    color: "white",
    position: "absolute",
    top: "20px",
    right: "10px",
    backgroundColor: "#1E3C20",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: isCollapsed ? "auto" : "220px",
    minWidth: isCollapsed ? "auto" : "200px",
    width: isCollapsed ? "fit-content" : "auto",
  };

  const headerStyle = {
    fontSize: "12px",
    padding: isCollapsed ? "4px 4px" : "4px 4px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    fontSize: isCollapsed ? "12px" : "12px",
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
                stroke="#ffffffff"
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
                fill="#ffffffff"
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
              Erosión
            </strong>
            {exportacionSedimentos && (
              <LayerItem
                layerKey="exportacionSedimentos"
                title="Exportación de sedimentos"
                data={exportacionSedimentos}
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
                  Tendencia de erosión
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
                  title="Descargar Tendencia de erosión"
                  onClick={() =>
                    downloadRaster("USLE_TEND.tif", "Tendencia de erosión")
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
                      stroke="#ffffffff"
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
                      fill="#ffffffff"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const Erosion = ({
  rastersBasePath = "/data/rasters/erosion/",
  geojsonUrl = "/EXPORTACION_SEDIMENTOS.geojson",
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [exportacionSedimentos, setExportacionSedimentos] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    exportacionSedimentos: false,
    raster: true,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    exportacionSedimentos: 0.6,
    raster: 0.7,
  });

  // Estados para leyenda de exportación
  const [exportacionLegendVisible, setExportacionLegendVisible] =
    useState(false);

  // Estado para leyenda del raster
  const [rasterLegendVisible, setRasterLegendVisible] = useState(true);

  // Estados para manejo de carga y errores del raster
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para tooltips
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false);

  // Función para toggle de tooltips
  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  // Cargar datos GeoJSON al montar el componente
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        // Cargar área de estudio
        const areaResponse = await fetch("/AREA.geojson");
        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          setArea(areaData);
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

        // Cargar exportación de sedimentos
        const exportacionResponse = await fetch(geojsonUrl);
        if (exportacionResponse.ok) {
          const exportacionData = await exportacionResponse.json();
          setExportacionSedimentos(exportacionData);
        }
      } catch (error) {
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, [geojsonUrl]);

  // Efecto para controlar la visibilidad de las leyendas (solo una a la vez)
  useEffect(() => {
    // Prioridad: si exportación está activa, mostrar esa leyenda
    if (activeLayers.exportacionSedimentos) {
      setExportacionLegendVisible(true);
      setRasterLegendVisible(false);
    }
    // Si solo el raster está activo, mostrar leyenda del raster
    else if (activeLayers.raster) {
      setExportacionLegendVisible(false);
      setRasterLegendVisible(true);
    }
    // Si ninguna está activa, ocultar ambas
    else {
      setExportacionLegendVisible(false);
      setRasterLegendVisible(false);
    }
  }, [activeLayers.exportacionSedimentos, activeLayers.raster]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[19.5, -99.0]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* RasterOverlay para tendencia USLE */}
        {activeLayers.raster && (
          <RasterOverlay
            fileName="USLE_TEND.tif"
            colorMap={[
              "#ffffcc",
              "#c2e699",
              "#78c679",
              "#31a354",
              "#006837",
              "#d73027",
            ]}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={() => {}}
            overlayOpacity={opacity.raster}
          />
        )}

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          exportacionSedimentos={exportacionSedimentos}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          tooltipsEnabled={tooltipsEnabled}
        />

        {/* Leyenda de Exportación de Sedimentos */}
        <ExportacionLegend isVisible={exportacionLegendVisible} />

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

        {/* Leyenda del raster */}
        <RasterLegend isVisible={rasterLegendVisible} />

        {/* Leyenda de exportación de sedimentos */}
        <ExportacionLegend isVisible={exportacionLegendVisible} />

        {/* Controles de coordenadas y escala */}
        <CoordinateControl />
        <ScaleControl />

        {/* Control de información (tooltips) */}
        <InfoControl
          onToggleTooltips={toggleTooltips}
          tooltipsEnabled={tooltipsEnabled}
        />
      </MapContainer>
    </div>
  );
};

export default Erosion;
