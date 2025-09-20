import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

/**
 * Componente para visualizar datos de erosión con capas raster y vector
 * Muestra series temporales USLE S1-S7, tendencia de erosión y exportación de sedimentos
 * @param {Object} props - Propiedades del componente
 * @param {string} props.rastersBasePath - Ruta base para archivos raster (default: '/data/rasters/erosion/')
 * @param {string} props.geojsonUrl - URL del archivo GeoJSON vector (default: '/EXPORTACION_SEDIMENTOS.geojson')
 */

// Función para generar paleta de colores por cuantiles para vector
const generateQuantileColorPalette = (values) => {
  const validValues = values.filter(
    (v) => v !== null && v !== undefined && !isNaN(v)
  );
  if (validValues.length === 0) return {};

  validValues.sort((a, b) => a - b);
  const n = validValues.length;

  const quantiles = [
    validValues[Math.floor(n * 0.2)],
    validValues[Math.floor(n * 0.4)],
    validValues[Math.floor(n * 0.6)],
    validValues[Math.floor(n * 0.8)],
    validValues[n - 1],
  ];

  const colors = ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"];

  return {
    quantiles,
    colors,
    getColor: (value) => {
      if (value === null || value === undefined || isNaN(value))
        return "#CCCCCC";
      for (let i = 0; i < quantiles.length; i++) {
        if (value <= quantiles[i]) return colors[i];
      }
      return colors[colors.length - 1];
    },
  };
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

// Componente de leyenda para el raster de erosión
const ErosionLegend = ({ isVisible, currentRaster }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Colores del gradiente de erosión (mismo que en RasterOverlay)
  const colors = ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"];

  // Valores aproximados de erosión para la zona (ajustar según tus datos)
  const minErosion = 0; // ton/ha/año
  const maxErosion = 50; // ton/ha/año

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
    color: "#666",
    marginTop: "4px",
  };

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
            border: "1px solid #ddd",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "11px",
            }}
          >
            {currentRaster || "Erosión (ton/ha/año)"}
          </div>
          <div style={rampStyle}></div>
          <div style={labelsStyle}>
            <span>{minErosion}</span>
            <span>{maxErosion}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para vector
const VectorLegend = ({ colorPalette, isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorPalette || !colorPalette.colors) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "270px",
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
    backgroundColor: "#f8f9fa",
    borderBottom: isCollapsed ? "none" : "1px solid #dee2e6",
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Exportación Sedimentos</span>
        <span>{isCollapsed ? "+" : "-"}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "8px" }}>
          {colorPalette.colors.map((color, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "15px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontSize: "11px" }}>
                {index === 0
                  ? `≤ ${colorPalette.quantiles[index]?.toFixed(1) || "N/A"}`
                  : index === colorPalette.colors.length - 1
                  ? `> ${
                      colorPalette.quantiles[index - 1]?.toFixed(1) || "N/A"
                    }`
                  : `${
                      colorPalette.quantiles[index - 1]?.toFixed(1) || "N/A"
                    } - ${colorPalette.quantiles[index]?.toFixed(1) || "N/A"}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Controles estándar (CoordinateControl, ScaleControl, InfoControl, DraggingControl)
const CoordinateControl = () => {
  const map = useMap();
  useEffect(() => {
    // Crear el div de coordenadas con posicionamiento absoluto
    const coordinateDiv = L.DomUtil.create("div", "coordinate-control");
    coordinateDiv.style.position = "absolute";
    coordinateDiv.style.bottom = "10px";
    coordinateDiv.style.right = "80px"; // A la izquierda de donde está la escala
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
  exportacionSedimentos,
  currentSerie,
  onSerieChange,
  showTendencia,
  onTendenciaToggle,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  onZoomToLayer = () => {},
  onDownloadRaster = () => {},
  onDownloadVector = () => {},
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      if (activeLayers.area) newLayers.area.addTo(map);
    }

    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 3, fillOpacity: 0 },
      });
      if (activeLayers.paisajes) newLayers.paisajes.addTo(map);
    }

    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 1, fillOpacity: 0 },
      });
      if (activeLayers.municipios) newLayers.municipios.addTo(map);
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
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
  ]);

  const controlStyle = {
    position: "absolute",
    top: "80px",
    right: "10px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "280px",
    maxWidth: "320px",
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

  const sectionStyle = {
    marginBottom: "15px",
    border: "1px solid #ddd",
    borderRadius: "3px",
  };

  const sectionHeaderStyle = {
    backgroundColor: "#f8f9fa",
    padding: "5px 8px",
    fontWeight: "bold",
    fontSize: "12px",
    borderBottom: "1px solid #ddd",
  };

  if (isCollapsed) {
    return (
      <div style={controlStyle}>
        <div style={headerStyle} onClick={() => setIsCollapsed(false)}>
          <span>☰</span>
        </div>
      </div>
    );
  }

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(true)}>
        <span>Control de Capas</span>
        <span>−</span>
      </div>

      {/* Capas Base */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Capas Base</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            <input
              type="checkbox"
              defaultChecked
              style={{ marginRight: "5px" }}
            />
            OpenStreetMap
          </label>
        </div>
      </div>

      {/* Límites */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Límites</div>
        <div style={{ padding: "8px" }}>
          {area && (
            <label style={{ display: "block", marginBottom: "5px" }}>
              <input
                type="checkbox"
                defaultChecked
                style={{ marginRight: "5px" }}
              />
              Área de estudio
            </label>
          )}
          {paisajes && (
            <label style={{ display: "block", marginBottom: "5px" }}>
              <input type="checkbox" style={{ marginRight: "5px" }} />
              Paisajes
            </label>
          )}
          {municipios && (
            <label style={{ display: "block", marginBottom: "5px" }}>
              <input type="checkbox" style={{ marginRight: "5px" }} />
              Municipios
            </label>
          )}
        </div>
      </div>

      {/* Series Temporales */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Series USLE</div>
        <div style={{ padding: "8px" }}>
          <label
            style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}
          >
            Serie temporal (S1-S7):
          </label>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            value={currentSerie}
            onChange={(e) => onSerieChange(parseInt(e.target.value))}
            style={{ width: "100%", marginBottom: "5px" }}
          />
          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              marginBottom: "10px",
            }}
          >
            S{currentSerie}
          </div>

          <label style={{ display: "block", marginBottom: "5px" }}>
            <input
              type="checkbox"
              checked={showTendencia}
              onChange={(e) => onTendenciaToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Mostrar Tendencia
          </label>
        </div>
      </div>

      {/* Capa Raster */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Erosión USLE</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            <input
              type="checkbox"
              checked={activeLayers.raster}
              onChange={(e) =>
                setActiveLayers((prev) => ({
                  ...prev,
                  raster: e.target.checked,
                }))
              }
              style={{ marginRight: "5px" }}
            />
            Mostrar raster erosión
          </label>
        </div>
      </div>

      {/* Capa Vector */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Exportación Sedimentos</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            <input
              type="checkbox"
              checked={activeLayers.exportacion}
              onChange={(e) =>
                setActiveLayers((prev) => ({
                  ...prev,
                  exportacion: e.target.checked,
                }))
              }
              style={{ marginRight: "5px" }}
            />
            Exportación por cuenca
          </label>
        </div>
      </div>

      {/* Control de Opacidad Raster */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Opacidad Raster</div>
        <div style={{ padding: "8px" }}>
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
            style={{ width: "100%" }}
          />
          <div
            style={{ textAlign: "center", fontSize: "11px", marginTop: "3px" }}
          >
            {Math.round(opacity.raster * 100)}%
          </div>
        </div>
      </div>

      {/* Control de Opacidad Vector */}
      {activeLayers.exportacion && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Opacidad Vector</div>
          <div style={{ padding: "8px" }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity.exportacion}
              onChange={(e) =>
                setOpacity((prev) => ({
                  ...prev,
                  exportacion: parseFloat(e.target.value),
                }))
              }
              style={{ width: "100%" }}
            />
            <div
              style={{
                textAlign: "center",
                fontSize: "11px",
                marginTop: "3px",
              }}
            >
              {Math.round(opacity.exportacion * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "5px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onZoomToLayer}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            flex: "1",
          }}
        >
          Zoom
        </button>
        <button
          onClick={onDownloadRaster}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            flex: "1",
          }}
        >
          DL Raster
        </button>
        <button
          onClick={onDownloadVector}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            flex: "1",
          }}
        >
          DL Vector
        </button>
      </div>
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

  // Estados para controles - siguiendo el formato de Topografia.jsx
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    exportacion: true,
    raster: true,
  });

  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    exportacion: 0.6,
    raster: 0.7,
  });

  const [currentSerie, setCurrentSerie] = useState(1);
  const [showTendencia, setShowTendencia] = useState(false);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [vectorColorPalette, setVectorColorPalette] = useState(null);
  const [loading, setLoading] = useState(false);

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
      .then((data) => {
        setExportacionSedimentos(data);
        // Generar paleta de colores para exportación de sedimentos
        const values = data.features.map((f) => f.properties.Exp_Sed);
        const palette = generateQuantileColorPalette(values);
        setVectorColorPalette(palette);
      })
      .catch(console.error);
  }, [geojsonUrl]);

  // Funciones de control
  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  const handleZoomToLayer = () => {
    if (exportacionSedimentos && window.mapInstance) {
      const geojsonLayer = L.geoJSON(exportacionSedimentos);
      window.mapInstance.fitBounds(geojsonLayer.getBounds());
    }
  };

  const handleDownloadRaster = () => {
    const filename = showTendencia
      ? "USLE_TEND.tif"
      : `USLE_S${currentSerie}.tif`;
    downloadRaster(
      filename,
      showTendencia ? "Tendencia USLE" : `Serie USLE S${currentSerie}`
    );
  };

  const handleDownloadVector = () => {
    if (exportacionSedimentos) {
      downloadGeoJSON(exportacionSedimentos, "exportacion_sedimentos");
    }
  };

  // Estilos para capa vector
  const getVectorStyle = (feature) => {
    if (!vectorColorPalette || !vectorColorPalette.getColor) {
      return {
        fillColor: "#CCCCCC",
        weight: 1,
        opacity: 1,
        color: "white",
        fillOpacity: opacity.exportacion,
      };
    }

    const value = feature.properties.Exp_Sed;
    const color = vectorColorPalette.getColor(value);

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: opacity.exportacion,
    };
  };

  const onEachVectorFeature = (feature, layer) => {
    const value = feature.properties.Exp_Sed;

    layer.bindTooltip(
      `<div>
        <strong>Cuenca: ${
          feature.properties.NOMBRE || "Sin nombre"
        }</strong><br/>
        Exportación de sedimentos: ${value || "N/A"} ton/ha/año
      </div>`,
      { permanent: false, sticky: true }
    );

    layer.on("click", () => {
      if (window.mapInstance) {
        window.mapInstance.fitBounds(layer.getBounds());
        console.log("Datos de cuenca:", feature.properties);
      }
    });
  };

  // Obtener raster actual
  const getCurrentRaster = () => {
    const fileName = showTendencia
      ? "USLE_TEND.tif"
      : `USLE_S${currentSerie}.tif`;
    console.log("Loading raster file:", fileName);
    return fileName;
  };

  const getCurrentRasterName = () => {
    if (showTendencia) {
      return "Tendencia de Erosión";
    }
    return `Erosión Serie S${currentSerie}`;
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={[19.5, -99.0]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Raster Overlay */}
        {activeLayers.raster && getCurrentRaster() && (
          <RasterOverlay
            key={getCurrentRaster()} // Force re-render when file changes
            fileName={getCurrentRaster()}
            baseUrl="/"
            colorMap={["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"]}
            continuous={true}
            setError={(error) => console.error("Raster error:", error)}
            setLoading={setLoading}
            onPixelValue={(value) => {
              // Función para manejar valores de píxeles (opcional)
            }}
            overlayOpacity={opacity.raster}
          />
        )}

        {/* Vector Layer */}
        {activeLayers.exportacion &&
          exportacionSedimentos &&
          vectorColorPalette && (
            <GeoJSON
              data={exportacionSedimentos}
              style={getVectorStyle}
              onEachFeature={onEachVectorFeature}
            />
          )}

        {/* Área base */}
        {activeLayers.area && area && (
          <GeoJSON
            data={area}
            style={{
              color: "#ff7800",
              weight: 3,
              opacity: opacity.area,
              fillOpacity: 0,
            }}
          />
        )}

        {/* Controles */}
        <InfoControl
          onToggleTooltips={toggleTooltips}
          tooltipsEnabled={tooltipsEnabled}
        />
        <DraggingControl />
        <CoordinateControl />
        <ScaleControl />

        <GroupedLayerControl
          currentSerie={currentSerie}
          onSerieChange={setCurrentSerie}
          showTendencia={showTendencia}
          onTendenciaToggle={setShowTendencia}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          onZoomToLayer={handleZoomToLayer}
          onDownloadRaster={handleDownloadRaster}
          onDownloadVector={handleDownloadVector}
          area={area}
          paisajes={paisajes}
          municipios={municipios}
        />

        <ErosionLegend
          isVisible={activeLayers.raster && !!getCurrentRaster()}
          currentRaster={getCurrentRasterName()}
        />

        {activeLayers.exportacion && (
          <VectorLegend
            colorPalette={vectorColorPalette}
            isVisible={activeLayers.exportacion}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Erosion;

/**
 * Ejemplo de uso:
 *
 * import Erosion from './components/Erosion';
 *
 * function App() {
 *   return (
 *     <Erosion
 *       rastersBasePath="/data/rasters/erosion/"
 *       geojsonUrl="/data/EXPORTACION_SEDIMENTOS.geojson"
 *     />
 *   );
 * }
 *
 * Test manual sugerido:
 * 1. Cargar componente y verificar que muestra Serie S1 por defecto
 * 2. Usar slider para cambiar de S1 a S7, verificar cambio de raster
 * 3. Activar checkbox "Mostrar Tendencia" y verificar cambio a USLE_TEND.tif
 * 4. Activar/desactivar capa vector de exportación de sedimentos
 * 5. Ajustar opacidades independientes de raster y vector
 * 6. Hacer hover sobre cuencas para ver tooltips
 * 7. Hacer clic en cuencas para zoom y datos en consola
 * 8. Probar botones de descarga para raster y vector
 *
 * Dependencias necesarias:
 * npm install react-leaflet leaflet geotiff
 */
