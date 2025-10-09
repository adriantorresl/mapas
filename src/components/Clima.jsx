import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

// Función para generar colores específicos para tipos de clima
const generateClimaColorPalette = (values) => {
  const colorMap = {
    "Calido-Arido": "#fef4de", // beige
    "Calido-semiarido": "#eae1ce", // arena
    "Calido-Humedo": "#f4f281", // verde lima
    "Semicalido-semiarido": "#d3d37f", // tostado
    "Semicalido-Subhumedo": "#81f2d4", // verde pálido
    "Semicalido-Humedo": "#7fbaa6", // verde lima medio
    "Templado-Semiarido": "#b9d9fe", // azul cielo
    "Templado-Subhumedo": "#7faef3", // azul cielo claro
    "Templado-Humedo": "#a2b1c4", // gris pizarra claro
    "Semifrio--Subhumedo": "#d5b2e6", // ciruela
    "Semifrio--Humedo": "#c4a1b1", // rosa viejo
  };

  // Mapeo de nombres sin acentos a nombres con acentos para la leyenda
  const displayNames = {
    "Calido-Arido": "Cálido-Árido",
    "Calido-semiarido": "Cálido-Semiárido",
    "Calido-Humedo": "Cálido-Húmedo",
    "Semicalido-semiarido": "Semicálido-Semiárido",
    "Semicalido-Subhumedo": "Semicálido-Subhúmedo",
    "Semicalido-Humedo": "Semicálido-Húmedo",
    "Templado-Semiarido": "Templado-Semiárido",
    "Templado-Subhumedo": "Templado-Subhúmedo",
    "Templado-Humedo": "Templado-Húmedo",
    "Semifrio--Subhumedo": "Semifrío-Subhúmedo",
    "Semifrio--Humedo": "Semifrío-Húmedo",
  };

  // Crear dos mapas: uno para coloreado (sin acentos) y otro para leyenda (con acentos)
  const uniqueValues = [...new Set(values)];
  const coloringMap = {}; // Para asignar colores a las características
  const legendMap = {}; // Para mostrar en la leyenda

  uniqueValues.forEach((value) => {
    if (colorMap[value]) {
      coloringMap[value] = colorMap[value]; // Clave sin acentos para coloreado
      legendMap[displayNames[value] || value] = colorMap[value]; // Clave con acentos para leyenda
    } else {
      // Fallback color si no está en la guía
      coloringMap[value] = "#CCCCCC";
      legendMap[value] = "#CCCCCC";
    }
  });

  return { coloringMap, legendMap };
};

// Función para generar colores específicos para precipitación anual
const generatePrecipitacionColorPalette = () => {
  const precipitacionData = [
    { rango: "313 - 400", color: "#FFFACD" }, // Amarillo muy claro
    { rango: "400 - 600", color: "#F0E68C" }, // Amarillo khaki claro
    { rango: "600 - 800", color: "#9ACD32" }, // Verde amarillento
    { rango: "800 - 1,000", color: "#32CD32" }, // Verde lima
    { rango: "1,000 - 1,100", color: "#228B22" }, // Verde bosque
    { rango: "1,100 - 1,200", color: "#006400" }, // Verde oscuro
    { rango: "1,200 - 1,600", color: "#87CEEB" }, // Azul cielo claro
    { rango: "1,600 - 1,800", color: "#4169E1" }, // Azul real
    { rango: "1,800 - 2,000", color: "#0000CD" }, // Azul medio
  ];

  return precipitacionData;
};

// Paleta unificada de colores para temperatura (de frío a cálido)
const UNIFIED_TEMPERATURE_COLORS = [
  "#2E4F8C", // Azul muy oscuro (más frío)
  "#4A6FA5", // Azul oscuro
  "#6B8DB5", // Azul medio oscuro
  "#8BADD5", // Azul claro
  "#A7CAE8", // Azul muy claro
  "#C8E1F5", // Azul pálido
  "#F0F0DC", // Beige muy claro (neutro)
  "#F4E4A6", // Amarillo pálido
  "#F4A460", // Naranja claro
  "#E0873F", // Naranja medio
  "#CD6F2E", // Naranja oscuro
  "#B8541D", // Naranja muy oscuro (más cálido)
];

// Función para generar colorMap con valores específicos usando paleta unificada
const generateUnifiedTemperatureColorMap = (ranges, colorCount = 12) => {
  const colorMap = {};
  const step = Math.floor(UNIFIED_TEMPERATURE_COLORS.length / colorCount);

  ranges.forEach((range, index) => {
    const colorIndex = Math.min(
      index * step,
      UNIFIED_TEMPERATURE_COLORS.length - 1
    );
    colorMap[range.min] = UNIFIED_TEMPERATURE_COLORS[colorIndex];
  });

  // Agregar el valor máximo del último rango
  if (ranges.length > 0) {
    const lastRange = ranges[ranges.length - 1];
    colorMap[lastRange.max] =
      UNIFIED_TEMPERATURE_COLORS[UNIFIED_TEMPERATURE_COLORS.length - 1];
  }

  return colorMap;
};

// Función para generar colores específicos para temperatura máxima
const generateTemperaturaMaxColorPalette = () => {
  const ranges = getTemperaturaMaxRanges();
  const temperaturaData = ranges.map((range, index) => {
    const colorIndex = Math.floor(
      (index / (ranges.length - 1)) * (UNIFIED_TEMPERATURE_COLORS.length - 1)
    );
    return {
      rango: `${range.min} - ${range.max}`,
      color: UNIFIED_TEMPERATURE_COLORS[colorIndex],
    };
  });
  return temperaturaData;
};

// Función para generar colores específicos para temperatura media
const generateTemperaturaMedColorPalette = () => {
  const ranges = getTemperaturaMedRanges();
  const temperaturaData = ranges.map((range, index) => {
    const colorIndex = Math.floor(
      (index / (ranges.length - 1)) * (UNIFIED_TEMPERATURE_COLORS.length - 1)
    );
    return {
      rango: `${range.min} - ${range.max}`,
      color: UNIFIED_TEMPERATURE_COLORS[colorIndex],
    };
  });
  return temperaturaData;
};

// Función para generar colores específicos para temperatura mínima
const generateTemperaturaMinColorPalette = () => {
  const ranges = getTemperaturaMinRanges();
  const temperaturaData = ranges.map((range, index) => {
    const colorIndex = Math.floor(
      (index / (ranges.length - 1)) * (UNIFIED_TEMPERATURE_COLORS.length - 1)
    );
    return {
      rango: `${range.min} - ${range.max}`,
      color: UNIFIED_TEMPERATURE_COLORS[colorIndex],
    };
  });
  return temperaturaData;
};

// Función para obtener rangos de valores reales para precipitación
const getPrecipitacionRanges = () => {
  return [
    { min: 313, max: 400 },
    { min: 400, max: 600 },
    { min: 600, max: 800 },
    { min: 800, max: 1000 },
    { min: 1000, max: 1100 },
    { min: 1100, max: 1200 },
    { min: 1200, max: 1600 },
    { min: 1600, max: 1800 },
    { min: 1800, max: 2000 },
  ];
};

// Función para obtener rangos de valores reales para temperatura máxima
const getTemperaturaMaxRanges = () => {
  return [
    { min: 16, max: 18 },
    { min: 18, max: 20 },
    { min: 20, max: 22 },
    { min: 22, max: 24 },
    { min: 24, max: 26 },
    { min: 26, max: 28 },
    { min: 28, max: 30 },
    { min: 30, max: 32 },
    { min: 32, max: 33 },
  ];
};

// Función para obtener rangos de valores reales para temperatura media
const getTemperaturaMedRanges = () => {
  return [
    { min: 10, max: 12 },
    { min: 12, max: 14 },
    { min: 14, max: 16 },
    { min: 16, max: 18 },
    { min: 18, max: 20 },
    { min: 20, max: 22 },
    { min: 22, max: 24 },
    { min: 24, max: 26 },
  ];
};

// Función para obtener rangos de valores reales para temperatura mínima
const getTemperaturaMinRanges = () => {
  return [
    { min: 4, max: 6 },
    { min: 6, max: 8 },
    { min: 8, max: 10 },
    { min: 10, max: 12 },
    { min: 12, max: 14 },
    { min: 14, max: 16 },
    { min: 16, max: 18 },
    { min: 18, max: 20 },
  ];
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

// Componente de leyenda retráctil en esquina inferior derecha
const ColorLegend = ({
  colorMap,
  isVisible,
  layerControlCollapsed,
  layerControlWidth,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  // Mantener una separación constante y razonable entre controles
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado (más espacio)
    : "270px"; // Solo se mueve lo necesario para evitar superposición (más espacio)

  const legendStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: rightPosition,
    backgroundColor: "#1E3C20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    transition: "right 0.3s ease", // Animación suave
  };

  const headerStyle = {
    padding: "10px 15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  // Orden específico para tipos de clima según la imagen (con acentos para la leyenda)
  const climaOrder = [
    "Cálido-Árido",
    "Cálido-Semiárido",
    "Cálido-Húmedo",
    "Semicálido-Semiárido",
    "Semicálido-Subhúmedo",
    "Semicálido-Húmedo",
    "Templado-Semiárido",
    "Templado-Subhúmedo",
    "Templado-Húmedo",
    "Semifrío-Subhúmedo",
    "Semifrío-Húmedo",
  ];

  const sortedEntries = Object.entries(colorMap).sort(([a], [b]) => {
    const indexA = climaOrder.indexOf(a);
    const indexB = climaOrder.indexOf(b);

    // Si ambos están en el orden, usar ese orden
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // Si solo uno está en el orden, ponerlo primero
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Si ninguno está en el orden, orden alfabético
    return a.localeCompare(b);
  });

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "10px",
          }}
        >
          {sortedEntries.map(([item, color]) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "5px 0",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: color,
                    display: "inline-block",
                    marginRight: "8px",
                    borderRadius: "0px",
                    verticalAlign: "middle",
                  }}
                ></div>
                <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                  {item}
                </span>
              </div>
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
    // Crear el div de coordenadas con posicionamiento absoluto
    const coordinateDiv = L.DomUtil.create("div", "coordinate-control");
    coordinateDiv.style.position = "absolute";
    coordinateDiv.style.bottom = "5px"; // Mismo nivel exacto que la escala
    coordinateDiv.style.left = "80px"; // Más cerca de la escala
    coordinateDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    coordinateDiv.style.padding = "1px 4px"; // Padding más pequeño
    coordinateDiv.style.border = "2px solid rgba(0, 0, 0, 0.2)";
    coordinateDiv.style.borderRadius = "0px";
    coordinateDiv.style.fontSize = "11px";
    coordinateDiv.style.fontFamily = "Inter, sans-serif"; // Inter como pediste
    coordinateDiv.style.lineHeight = "1.2";
    coordinateDiv.style.height = "auto";
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
      position: "bottomleft",
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

// Componente de leyenda específico para precipitación anual
const PrecipitacionLegend = ({
  isVisible,
  layerControlCollapsed,
  layerControlWidth,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed ? "105px" : "270px";

  const legendStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: rightPosition,
    backgroundColor: "#1E3C20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    padding: "10px 15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  const precipitacionData = generatePrecipitacionColorPalette();

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "10px" }}>
          <div
            style={{
              marginBottom: "8px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Precipitación total anual actual (mm/año)
          </div>
          {precipitacionData.map(({ rango, color }) => (
            <div
              key={rango}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "3px 0",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: color,
                    display: "inline-block",
                    marginRight: "8px",
                    borderRadius: "0px",
                    verticalAlign: "middle",
                  }}
                ></div>
                <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                  {rango}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda específico para temperatura
const TemperaturaLegend = ({
  isVisible,
  layerControlCollapsed,
  layerControlWidth,
  layerType, // "tempMax", "tempMed", "tempMin"
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed ? "105px" : "270px";

  const legendStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: rightPosition,
    backgroundColor: "#1E3C20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    padding: "10px 15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  const temperaturaData =
    layerType === "tempMax"
      ? generateTemperaturaMaxColorPalette()
      : layerType === "tempMed"
      ? generateTemperaturaMedColorPalette()
      : layerType === "tempMin"
      ? generateTemperaturaMinColorPalette()
      : generateTemperaturaMinColorPalette(); // fallback

  // Títulos específicos para cada tipo de temperatura
  const titles = {
    tempMax: "Temperatura máxima anual actual (°C)",
    tempMed: "Temperatura media anual actual (°C)",
    tempMin: "Temperatura mínima anual actual (°C)",
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "10px" }}>
          <div
            style={{
              marginBottom: "8px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {titles[layerType] || "Temperatura anual actual (°C)"}
          </div>
          {temperaturaData.map(({ rango, color }) => (
            <div
              key={rango}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "3px 0",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: color,
                    display: "inline-block",
                    marginRight: "8px",
                    borderRadius: "0px",
                    verticalAlign: "middle",
                  }}
                ></div>
                <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                  {rango}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  clima,
  onColorMapChange,
  onLegendVisibilityChange,
  tooltipsEnabled,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  onControlStateChange,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Topográfico (OSM)");

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

    // Crear panes personalizados para controlar el orden de las capas
    if (!map.getPane("vectorPane")) {
      map.createPane("vectorPane");
      map.getPane("vectorPane").style.zIndex = 400; // Capas vectoriales debajo
    }

    if (!map.getPane("rasterPane")) {
      map.createPane("rasterPane");
      map.getPane("rasterPane").style.zIndex = 450; // Capas raster encima
    }

    // Capas base
    const baseLayers = {
      "Topográfico (OSM)": L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
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

    // Capas de Interés - Clima (usando clima con colores por CLIMA)
    if (clima) {
      // Generar mapas de colores para el campo CLIMA usando la guía específica
      const climaValues = clima.features
        .map((f) => f.properties.CLIMA)
        .filter(Boolean);
      const { coloringMap, legendMap } = generateClimaColorPalette(climaValues);

      newLayers.clima = L.geoJSON(clima, {
        pane: "vectorPane", // Asignar al pane vectorial
        style: (feature) => {
          const climaValue = feature.properties.CLIMA;
          return {
            fillColor: coloringMap[climaValue] || "#gray", // Usar coloringMap sin acentos
            weight: 0,
            opacity: opacity.clima,
            color: "white",
            fillOpacity: opacity.clima,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;

            // Configurar popup al hacer clic
            const bindPopupOnClick = () => {
              layer.bindPopup(
                `
                <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
                <strong>Paisaje:</strong> ${props.PAISAJE || "N/A"}<br>
                <strong>Tipo de Clima:</strong> ${props.CLIMA || "N/A"}<br>
                <strong>Hectáreas:</strong> ${props.HECTARES || "N/A"}
                `,
                {
                  className: "custom-popup",
                }
              );
            };

            bindPopupOnClick();

            // Reconfigurar popup cuando cambie el estado
            layer.bindPopupOnClick = bindPopupOnClick;
          }
        },
      });

      // Solo agregar al mapa si está activa, pero siempre crear la capa para poder togglearla
      if (activeLayers.clima) {
        newLayers.clima.addTo(map);
        if (onColorMapChange) {
          onColorMapChange(legendMap); // Usar legendMap con acentos para la leyenda
        }
        if (onLegendVisibilityChange) {
          onLegendVisibilityChange(true);
        }
      } else {
        // Si no está activa, asegurar que la leyenda esté oculta
        if (onColorMapChange) {
          onColorMapChange({});
        }
        if (onLegendVisibilityChange) {
          onLegendVisibilityChange(false);
        }
      }
    }

    newLayers.baseLayers = baseLayers;
    setLayers(newLayers);

    // Configurar el zoom inicial basado en el área
    if (area && area.features && area.features.length > 0) {
      const layer = L.geoJSON(area);
      map.fitBounds(layer.getBounds());
    }
  }, [
    map,
    area,
    paisajes,
    municipios,
    clima,
    activeLayers,
    activeBaseLayer,
    onColorMapChange,
    onLegendVisibilityChange,
    opacity.clima,
  ]);

  // Actualizar popups cuando cambien las capas
  useEffect(() => {
    Object.values(layers).forEach((layer) => {
      if (layer && layer.eachLayer) {
        layer.eachLayer((subLayer) => {
          if (subLayer.bindPopupOnClick) {
            subLayer.bindPopupOnClick();
          }
        });
      }
    });
  }, [layers]);

  // Notificar cambios en el estado del control para posicionamiento dinámico
  useEffect(() => {
    if (onControlStateChange) {
      const width = isCollapsed ? 90 : 300; // Ancho colapsado vs expandido
      onControlStateChange(isCollapsed, width);
    }
  }, [isCollapsed, onControlStateChange]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = {
      ...activeLayers,
      [layerKey]: !activeLayers[layerKey],
    };
    setActiveLayers(newActiveLayers);

    const layer = layers[layerKey];
    if (layer && layer !== layers.baseLayers) {
      if (newActiveLayers[layerKey]) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
      }
    }

    // Controlar visibilidad de la leyenda y actualizar colorMap para clima
    if (layerKey === "clima" && onLegendVisibilityChange && onColorMapChange) {
      if (newActiveLayers.clima && clima) {
        // Clima activa, mostrar leyenda
        const climaValues = clima.features
          .map((f) => f.properties.CLIMA)
          .filter(Boolean);
        const { legendMap } = generateClimaColorPalette(climaValues);
        onColorMapChange(legendMap); // Usar legendMap con acentos para la leyenda
        onLegendVisibilityChange(true);
      } else {
        // Clima inactiva, ocultar leyenda
        onColorMapChange({});
        onLegendVisibilityChange(false);
      }
    }
  };

  const changeBaseLayer = (newBaseLayer) => {
    // Remover capa base actual
    if (layers.baseLayers && layers.baseLayers[activeBaseLayer]) {
      map.removeLayer(layers.baseLayers[activeBaseLayer]);
    }

    // Agregar nueva capa base
    if (layers.baseLayers && layers.baseLayers[newBaseLayer]) {
      layers.baseLayers[newBaseLayer].addTo(map);
      setActiveBaseLayer(newBaseLayer);
    }
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));

    const layer = layers[layerKey];
    if (layer && layer.setStyle) {
      layer.setStyle({ fillOpacity: newOpacity });
    }
  };

  const controlStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#1e3c20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "300px",
  };

  const headerStyle = {
    fontSize: "16px",
    padding: "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
    paddingBottom: "10px",
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "5px",
            gap: "5px",
          }}
        >
          <span style={{ fontSize: "10px", color: "white" }}>
            Opacidad: {Math.round(opacity[layerKey] * 100)}%
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newOpacity = Math.max(0, opacity[layerKey] - 0.1);
              handleOpacityChange(layerKey, newOpacity);
            }}
            style={{
              backgroundColor: "transparent",
              border: "1px solid white",
              color: "white",
              width: "16px",
              height: "16px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            disabled={opacity[layerKey] <= 0}
          >
            -
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const newOpacity = Math.min(1, opacity[layerKey] + 0.1);
              handleOpacityChange(layerKey, newOpacity);
            }}
            style={{
              backgroundColor: "transparent",
              border: "1px solid white",
              color: "white",
              width: "16px",
              height: "16px",
              borderRadius: "2px",
              cursor: "pointer",
              fontSize: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            disabled={opacity[layerKey] >= 1}
          >
            +
          </button>
        </div>
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
        <div style={{ padding: "12px" }}>
          {/* Capas Base */}
          <div
            style={{
              marginBottom: "15px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
            }}
          >
            <strong
              style={{
                color: "white",
                marginBottom: "6px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Capas Base
            </strong>
            <div style={{ marginLeft: "10px" }}>
              {layers.baseLayers &&
                Object.keys(layers.baseLayers).map((baseLayerName) => (
                  <div key={baseLayerName} style={{ marginBottom: "3px" }}>
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
              marginBottom: "15px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
            }}
          >
            <strong
              style={{
                color: "white",
                marginBottom: "6px",
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
              marginBottom: "0px",
              paddingBottom: "0px",
            }}
          >
            <strong
              style={{
                color: "white",
                marginBottom: "6px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Clima
            </strong>
            {clima && (
              <LayerItem
                layerKey="clima"
                title="Tipos de clima"
                data={clima}
                showOpacity={true}
              />
            )}

            {/* Precipitación anual */}
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
                  checked={activeLayers.precipitacion || false}
                  onChange={() => toggleLayer("precipitacion")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Precipitación anual
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
                  title="Descargar Precipitación Anual"
                  onClick={() =>
                    downloadRaster(
                      "PREC_TOTAL_ANUAL.tif",
                      "Precipitación Anual"
                    )
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
                  display: "flex",
                  alignItems: "center",
                  marginTop: "5px",
                  gap: "5px",
                }}
              >
                <span style={{ fontSize: "10px", color: "white" }}>
                  Opacidad: {Math.round(opacity.precipitacion * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.precipitacion - 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      precipitacion: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.precipitacion <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.precipitacion + 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      precipitacion: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.precipitacion >= 1}
                >
                  +
                </button>
              </div>
            </div>

            {/* Temperatura máxima anual */}
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
                  checked={activeLayers.tempMax || false}
                  onChange={() => toggleLayer("tempMax")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Temperatura máxima anual
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
                  title="Descargar Temperatura Máxima Anual"
                  onClick={() =>
                    downloadRaster(
                      "TEMP_MAX_ANUAL.tif",
                      "Temperatura Máxima Anual"
                    )
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "5px",
                  gap: "5px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#ffffffff" }}>
                  Opacidad: {Math.round(opacity.tempMax * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.tempMax - 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      tempMax: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.tempMax <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.tempMax + 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      tempMax: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.tempMax >= 1}
                >
                  +
                </button>
              </div>
            </div>

            {/* Temperatura media anual */}
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
                  checked={activeLayers.tempMed || false}
                  onChange={() => toggleLayer("tempMed")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Temperatura media anual
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
                  title="Descargar Temperatura Media Anual"
                  onClick={() =>
                    downloadRaster(
                      "TEMP_MED_ANUAL.tif",
                      "Temperatura Media Anual"
                    )
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "5px",
                  gap: "5px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#ffffffff" }}>
                  Opacidad: {Math.round(opacity.tempMed * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.tempMed - 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      tempMed: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.tempMed <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.tempMed + 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      tempMed: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.tempMed >= 1}
                >
                  +
                </button>
              </div>
            </div>

            {/* Temperatura mínima anual */}
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
                  checked={activeLayers.tempMin || false}
                  onChange={() => toggleLayer("tempMin")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Temperatura mínima anual
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
                  title="Descargar Temperatura Mínima Anual"
                  onClick={() =>
                    downloadRaster(
                      "TEMP_MIN_ANUAL.tif",
                      "Temperatura Mínima Anual"
                    )
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "5px",
                  gap: "5px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#ffffffff" }}>
                  Opacidad: {Math.round(opacity.tempMin * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.tempMin - 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      tempMin: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.tempMin <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.tempMin + 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      tempMin: newOpacity,
                    }));
                  }}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  disabled={opacity.tempMin >= 1}
                >
                  +
                </button>
              </div>
            </div>
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
    const enableDragging = () => {
      map.dragging.enable();
    };

    map.getContainer().addEventListener("mouseleave", enableDragging);

    return () => {
      map.getContainer().removeEventListener("mouseleave", enableDragging);
    };
  }, [map]);

  return null;
};

// Componente para mostrar valores de píxeles raster
const PixelValueDisplay = ({ pixelValues, activeLayers }) => {
  const hasActiveRasterLayers = Object.entries(activeLayers).some(
    ([key, isActive]) =>
      isActive &&
      ["precipitacion", "tempMax", "tempMed", "tempMin"].includes(key)
  );

  const hasPixelValues = Object.values(pixelValues).some(
    (value) => value !== null
  );

  if (!hasActiveRasterLayers) {
    return null;
  }

  const displayStyle = {
    color: "white",
    position: "absolute",
    bottom: "45px", // Arriba de la escala y coordenadas
    left: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    padding: "8px 12px",
    minWidth: "180px",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: "6px",
    fontSize: "12px",
    color: "white",
    backgroundColor: "#1E3C20",
  };

  const valueStyle = {
    marginBottom: "3px",
    display: "flex",
    justifyContent: "space-between",
  };

  const labelStyle = {
    color: "white",
  };

  const valueNumberStyle = {
    fontWeight: "bold",
    color: "white",
  };

  const getLayerName = (key) => {
    const names = {
      precipitacion: "Precipitación",
      tempMax: "Temp. Máxima",
      tempMed: "Temp. Media",
      tempMin: "Temp. Mínima",
    };
    return names[key] || key;
  };

  const getUnit = (key) => {
    const units = {
      precipitacion: "mm",
      tempMax: "°C",
      tempMed: "°C",
      tempMin: "°C",
    };
    return units[key] || "";
  };

  // Función para obtener el rango correspondiente al valor del píxel
  const getValueRange = (key, value) => {
    if (value === null || typeof value !== "number") return null;

    if (key === "precipitacion") {
      const ranges = getPrecipitacionRanges();
      for (let range of ranges) {
        if (value >= range.min && value < range.max) {
          return `${range.min} - ${range.max}`;
        }
      }
      // Para el último rango
      if (value >= 1800) return "1,800 - 2,000";
    } else if (key === "tempMax") {
      const ranges = getTemperaturaMaxRanges();
      for (let range of ranges) {
        if (value >= range.min && value < range.max) {
          return `${range.min} - ${range.max}`;
        }
      }
      // Para el último rango
      if (value >= 32) return "32 - 33";
    } else if (key === "tempMed") {
      const ranges = getTemperaturaMedRanges();
      for (let range of ranges) {
        if (value >= range.min && value < range.max) {
          return `${range.min} - ${range.max}`;
        }
      }
      // Para el último rango
      if (value >= 24) return "24 - 26";
    } else if (key === "tempMin") {
      const ranges = getTemperaturaMinRanges();
      for (let range of ranges) {
        if (value >= range.min && value < range.max) {
          return `${range.min} - ${range.max}`;
        }
      }
      // Para el último rango
      if (value >= 18) return "18 - 20";
    }

    return null;
  };

  return (
    <div style={displayStyle}>
      <div style={headerStyle}>Valores del Pixel</div>
      {!hasPixelValues && (
        <div style={{ color: "#888", fontStyle: "italic" }}>
          Pasa el cursor sobre el mapa
        </div>
      )}
      {Object.entries(pixelValues).map(([key, value]) => {
        if (!activeLayers[key] || value === null) return null;

        const range = getValueRange(key, value);

        return (
          <div key={key} style={valueStyle}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "2px",
                }}
              >
                <span style={labelStyle}>{getLayerName(key)}:</span>
                <span style={valueNumberStyle}>
                  {typeof value === "number" ? value.toFixed(1) : value}{" "}
                  {getUnit(key)}
                </span>
              </div>
              {range && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "#ccc",
                    fontStyle: "italic",
                  }}
                >
                  Rango: {range} {getUnit(key)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Clima = () => {
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [clima, setClima] = useState(null);
  const [colorMap, setColorMap] = useState({});
  const [showLegend, setShowLegend] = useState(false);
  const [pixelValues, setPixelValues] = useState({
    precipitacion: null,
    tempMax: null,
    tempMed: null,
    tempMin: null,
  });
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    municipios: true,
    paisajes: true,
    clima: true,
    precipitacion: false,
    tempMax: false,
    tempMed: false,
    tempMin: false,
  });
  const [opacity, setOpacity] = useState({
    area: 1,
    municipios: 1,
    paisajes: 1,
    clima: 0.7,
    precipitacion: 0.7,
    tempMax: 0.7,
    tempMed: 0.7,
    tempMin: 0.7,
  });
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Handler para cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Limpiar valores de píxeles cuando se desactivan capas raster
  useEffect(() => {
    setPixelValues((prev) => {
      const newValues = { ...prev };
      Object.keys(newValues).forEach((key) => {
        if (!activeLayers[key]) {
          newValues[key] = null;
        }
      });
      return newValues;
    });
  }, [activeLayers]);

  // Funciones de callback estabilizadas para evitar re-renders
  const onPrecipitacionPixelValue = useCallback((value) => {
    setPixelValues((prev) => ({ ...prev, precipitacion: value }));
  }, []);

  const onTempMaxPixelValue = useCallback((value) => {
    setPixelValues((prev) => ({ ...prev, tempMax: value }));
  }, []);

  const onTempMedPixelValue = useCallback((value) => {
    setPixelValues((prev) => ({ ...prev, tempMed: value }));
  }, []);

  const onTempMinPixelValue = useCallback((value) => {
    setPixelValues((prev) => ({ ...prev, tempMin: value }));
  }, []);

  // Funciones estabilizadas para manejar errores y loading
  const handleError = useCallback(() => {
    // Opcional: manejar errores si es necesario
  }, []);

  const handleLoading = useCallback(() => {
    // Opcional: manejar estado de carga si es necesario
  }, []);

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
    fetch("/CLIMA.geojson")
      .then((res) => res.json())
      .then(setClima);
  }, []);

  return (
    <MapContainer
      center={[16.67566, -96.28311]}
      zoom={10}
      scrollWheelZoom={true}
      dragging={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <DraggingControl />
      <PixelValueDisplay
        pixelValues={pixelValues}
        activeLayers={activeLayers}
      />
      <GroupedLayerControl
        area={area}
        paisajes={paisajes}
        municipios={municipios}
        clima={clima}
        onColorMapChange={setColorMap}
        onLegendVisibilityChange={setShowLegend}
        tooltipsEnabled={true}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
        onControlStateChange={handleControlStateChange}
      />
      <CoordinateControl />
      <ScaleControl />
      <ColorLegend
        colorMap={colorMap}
        isVisible={showLegend}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
      />
      <PrecipitacionLegend
        isVisible={activeLayers.precipitacion}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
      />
      <TemperaturaLegend
        isVisible={activeLayers.tempMax}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
        layerType="tempMax"
      />
      <TemperaturaLegend
        isVisible={activeLayers.tempMed}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
        layerType="tempMed"
      />
      <TemperaturaLegend
        isVisible={activeLayers.tempMin}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
        layerType="tempMin"
      />

      {/* Capas raster con control de visibilidad */}
      <RasterOverlay
        fileName="PREC_TOTAL_ANUAL.tif"
        colorMap={{
          313: "#FFFACD",
          400: "#F0E68C",
          600: "#9ACD32",
          800: "#32CD32",
          1000: "#228B22",
          1100: "#006400",
          1200: "#87CEEB",
          1600: "#4169E1",
          1800: "#0000CD",
          2000: "#0000CD",
        }}
        baseUrl="/"
        continuous={true}
        setError={handleError}
        setLoading={handleLoading}
        onPixelValue={onPrecipitacionPixelValue}
        overlayOpacity={opacity.precipitacion}
        visible={activeLayers.precipitacion}
      />

      <RasterOverlay
        fileName="TEMP_MAX_ANUAL.tif"
        colorMap={generateUnifiedTemperatureColorMap(getTemperaturaMaxRanges())}
        baseUrl="/"
        continuous={true}
        setError={handleError}
        setLoading={handleLoading}
        onPixelValue={onTempMaxPixelValue}
        overlayOpacity={opacity.tempMax}
        visible={activeLayers.tempMax}
      />

      <RasterOverlay
        fileName="TEMP_MED_ANUAL.tif"
        colorMap={generateUnifiedTemperatureColorMap(getTemperaturaMedRanges())}
        baseUrl="/"
        continuous={true}
        setError={handleError}
        setLoading={handleLoading}
        onPixelValue={onTempMedPixelValue}
        overlayOpacity={opacity.tempMed}
        visible={activeLayers.tempMed}
      />

      <RasterOverlay
        fileName="TEMP_MIN_ANUAL.tif"
        colorMap={generateUnifiedTemperatureColorMap(getTemperaturaMinRanges())}
        baseUrl="/"
        continuous={true}
        setError={handleError}
        setLoading={handleLoading}
        onPixelValue={onTempMinPixelValue}
        overlayOpacity={opacity.tempMin}
        visible={activeLayers.tempMin}
      />
    </MapContainer>
  );
};

export default Clima;
