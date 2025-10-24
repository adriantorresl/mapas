import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

// Función para parsear archivos SLD
const parseSLD = async (sldPath) => {
  try {
    const response = await fetch(sldPath);
    if (!response.ok) {
      return null;
    }
    const sldText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sldText, "text/xml");

    const colorMapEntries = xmlDoc.querySelectorAll("ColorMapEntry");
    const colorMapType =
      xmlDoc.querySelector("ColorMap")?.getAttribute("type") || "ramp";

    const intervals = {};

    colorMapEntries.forEach((entry) => {
      const color = entry.getAttribute("color");
      const quantity = entry.getAttribute("quantity");

      if (colorMapType === "intervals") {
        // Mantener "inf" como string, parseFloat para números
        const key = quantity === "inf" ? "inf" : quantity;
        intervals[key] = color;
      } else {
        // Para ramp, también necesitamos las quantities, no solo los colores
        const key = quantity === "inf" ? "inf" : quantity;
        intervals[key] = color;
      }
    });

    return {
      type: colorMapType,
      colors: intervals, // Siempre devolver objeto con quantity:color
      continuous: colorMapType === "ramp",
    };
  } catch (error) {
    console.error(`Error parseando SLD ${sldPath}:`, error);
    return null;
  }
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

// Componente de pestañas para periodos
const PeriodTabs = ({ activePeriod, onPeriodChange }) => {
  const tabsStyle = {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "white",
    borderRadius: "5px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    display: "flex",
    overflow: "hidden",
    border: "1px solid #ddd",
  };

  const tabStyle = {
    padding: "10px 15px",
    cursor: "pointer",
    borderRight: "1px solid #ddd",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "background-color 0.3s",
    minWidth: "90px",
    textAlign: "center",
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: "#dc3545",
    color: "white",
  };

  const inactiveTabStyle = {
    ...tabStyle,
    backgroundColor: "white",
    color: "#333",
  };

  const periods = [
    { key: "Actual", label: "Actual" },
    { key: "2015-2039", label: "2015-2039" },
    { key: "2045-2069", label: "2045-2069" },
    { key: "2075-2099", label: "2075-2099" },
  ];

  return (
    <div style={tabsStyle}>
      {periods.map((period, index) => (
        <div
          key={period.key}
          style={{
            ...(activePeriod === period.key
              ? activeTabStyle
              : inactiveTabStyle),
            borderRight:
              index === periods.length - 1 ? "none" : "1px solid #ddd",
          }}
          onClick={() => onPeriodChange(period.key)}
        >
          {period.label}
        </div>
      ))}
    </div>
  );
};

// Componente para mostrar coordenadas
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

// Componente para mostrar la escala
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

// Componente para mostrar valor del pixel
const PixelValueDisplay = ({ pixelValue }) => {
  if (!pixelValue) return null;

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

  return (
    <div style={displayStyle}>
      <div style={headerStyle}>Valor del pixel</div>
      <div style={valueStyle}>
        <span style={labelStyle}>Escenario CC:</span>
        <span style={valueNumberStyle}>{pixelValue.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Componente de leyenda dinámica para Precipitación
const PrecipitacionLegend = ({
  isVisible,
  layerControlCollapsed,
  activePeriod,
  sldCache,
  getSLDColors,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [precipitacionRanges, setPrecipitacionRanges] = useState([]);

  useEffect(() => {
    const loadLegendData = async () => {
      const sldData = await getSLDColors("precipitation", activePeriod);
      if (sldData && sldData.type === "intervals") {
        const ranges = Object.entries(sldData.colors)
          .sort(([a], [b]) => {
            if (a === "inf") return 1;
            if (b === "inf") return -1;
            return parseFloat(a) - parseFloat(b);
          })
          .map(([value, color], index, array) => {
            let label;
            if (index === 0) {
              label = `≤ ${value} mm`;
            } else if (value === "inf") {
              const prevValue = array[index - 1][0];
              label = `> ${prevValue} mm`;
            } else {
              const prevValue = array[index - 1][0];
              label = `${prevValue} - ${value} mm`;
            }
            return { color, label };
          });
        setPrecipitacionRanges(ranges);
      }
    };

    if (isVisible) {
      loadLegendData();
    }
  }, [isVisible, activePeriod, getSLDColors]);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado
    : "270px"; // Espacio suficiente para evitar superposición con el control expandido

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
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Precipitación - {activePeriod}
          </div>
          {precipitacionRanges.map((range, index) => (
            <div
              key={index}
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
                  backgroundColor: range.color,
                  marginRight: "8px",
                  border: "1px solid #999",
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span style={{ lineHeight: "1.2" }}>{range.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda dinámica para Temperatura Mínima
const TemperaturaMinLegend = ({
  isVisible,
  layerControlCollapsed,
  activePeriod,
  getSLDColors,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tempRanges, setTempRanges] = useState([]);

  useEffect(() => {
    const loadLegendData = async () => {
      const sldData = await getSLDColors("tempMin", activePeriod);
      if (sldData && sldData.type === "ramp") {
        const ranges = Object.entries(sldData.colors)
          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
          .map(([value, color]) => ({
            color,
            label: `${value}°C`,
          }));
        setTempRanges(ranges);
      }
    };

    if (isVisible) {
      loadLegendData();
    }
  }, [isVisible, activePeriod, getSLDColors]);

  if (!isVisible) {
    return null;
  }

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
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Temperatura Mínima - {activePeriod}
          </div>
          {tempRanges.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "white",
                  marginBottom: "4px",
                }}
              >
                <span>{tempRanges[0].label}</span>
                <span>{tempRanges[tempRanges.length - 1].label}</span>
              </div>
              <div
                style={{
                  height: "20px",
                  background: `linear-gradient(to right, ${tempRanges
                    .map((r) => r.color)
                    .join(", ")})`,
                  border: "1px solid #999",
                  borderRadius: "2px",
                  margin: "8px 0",
                }}
              ></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "10px",
                  marginTop: "4px",
                  fontStyle: "italic",
                }}
              >
                <span>Temperatura Mínima (°C)</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda dinámica para Temperatura Media
const TemperaturaMedLegend = ({
  isVisible,
  layerControlCollapsed,
  activePeriod,
  getSLDColors,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tempRanges, setTempRanges] = useState([]);

  useEffect(() => {
    const loadLegendData = async () => {
      const sldData = await getSLDColors("tempMed", activePeriod);
      if (sldData && sldData.type === "ramp") {
        const ranges = Object.entries(sldData.colors)
          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
          .map(([value, color]) => ({
            color,
            label: `${value}°C`,
          }));
        setTempRanges(ranges);
      }
    };

    if (isVisible) {
      loadLegendData();
    }
  }, [isVisible, activePeriod, getSLDColors]);

  if (!isVisible) {
    return null;
  }

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
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Temperatura Media - {activePeriod}
          </div>
          {tempRanges.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "white",
                  marginBottom: "4px",
                }}
              >
                <span>{tempRanges[0].label}</span>
                <span>{tempRanges[tempRanges.length - 1].label}</span>
              </div>
              <div
                style={{
                  height: "20px",
                  background: `linear-gradient(to right, ${tempRanges
                    .map((r) => r.color)
                    .join(", ")})`,
                  border: "1px solid #999",
                  borderRadius: "2px",
                  margin: "8px 0",
                }}
              ></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "10px",
                  marginTop: "4px",
                  fontStyle: "italic",
                }}
              >
                <span>Temperatura Media (°C)</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda dinámica para Temperatura Máxima
const TemperaturaMaxLegend = ({
  isVisible,
  layerControlCollapsed,
  activePeriod,
  getSLDColors,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tempRanges, setTempRanges] = useState([]);

  useEffect(() => {
    const loadLegendData = async () => {
      const sldData = await getSLDColors("tempMax", activePeriod);
      if (sldData && sldData.type === "ramp") {
        const ranges = Object.entries(sldData.colors)
          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
          .map(([value, color]) => ({
            color,
            label: `${value}°C`,
          }));
        setTempRanges(ranges);
      }
    };

    if (isVisible) {
      loadLegendData();
    }
  }, [isVisible, activePeriod, getSLDColors]);

  if (!isVisible) {
    return null;
  }

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
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Temperatura Máxima - {activePeriod}
          </div>
          {tempRanges.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "white",
                  marginBottom: "4px",
                }}
              >
                <span>{tempRanges[0].label}</span>
                <span>{tempRanges[tempRanges.length - 1].label}</span>
              </div>
              <div
                style={{
                  height: "20px",
                  background: `linear-gradient(to right, ${tempRanges
                    .map((r) => r.color)
                    .join(", ")})`,
                  border: "1px solid #999",
                  borderRadius: "2px",
                  margin: "8px 0",
                }}
              ></div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontSize: "10px",
                  marginTop: "4px",
                  fontStyle: "italic",
                }}
              >
                <span>Temperatura Máxima (°C)</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para el control de capas agrupadas
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  activePeriod,
  onControlStateChange,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Hillshade (ESRI)");

  // Mapeo de periodos a códigos de archivo
  const periodMap = {
    Actual: "", // Sin sufijo para archivos actuales
    "2015-2039": "_1539",
    "2045-2069": "_4569",
    "2075-2099": "_7599",
  };

  // Notificar cambios en el estado del control para posicionamiento dinámico
  useEffect(() => {
    if (onControlStateChange) {
      const width = isCollapsed ? 90 : 300; // Ancho colapsado vs expandido
      onControlStateChange(isCollapsed, width);
    }
  }, [isCollapsed, onControlStateChange]);

  useEffect(() => {
    const baseLayers = {
      "Satelital (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
        }
      ),
      "Hillshade (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
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
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
  ]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };
    newActiveLayers[layerKey] = !activeLayers[layerKey];
    setActiveLayers(newActiveLayers);

    // Para capas raster, el manejo se hace en el componente principal
    if (layerKey.startsWith("raster")) {
      return;
    }

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
    color: "white",
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#1E3C20",
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
        padding: "2px 10px",
        backgroundColor: "transparent",
        borderRadius: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          alignContent: "center",
          marginBottom: "2px",
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
            gap: "6px",
            marginTop: "2px",
          }}
        >
          <span style={{ fontSize: "9px", color: "white", minWidth: "55px" }}>
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

  const RasterLayerItem = ({ layerKey, title, filename }) => (
    <div
      style={{
        marginBottom: "2px",
        padding: "2px 10px",
        backgroundColor: "transparent",
        borderRadius: "4px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          alignContent: "center",
          marginBottom: "2px",
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
          title={`Descargar ${filename}`}
          onClick={() => downloadRaster(filename, title)}
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
            <rect x="3" y="13" width="10" height="1.5" rx="0.75" fill="white" />
          </svg>
        </button>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "2px",
        }}
      >
        <span style={{ fontSize: "9px", color: "white", minWidth: "55px" }}>
          Opacidad: {Math.round(opacity[layerKey] * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newOpacity = Math.max(0, opacity[layerKey] - 0.1);
            setOpacity((prev) => ({
              ...prev,
              [layerKey]: newOpacity,
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
          disabled={opacity[layerKey] <= 0}
        >
          -
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newOpacity = Math.min(1, opacity[layerKey] + 0.1);
            setOpacity((prev) => ({
              ...prev,
              [layerKey]: newOpacity,
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
          disabled={opacity[layerKey] >= 1}
        >
          +
        </button>
      </div>
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
              {["Satelital (ESRI)", "Hillshade (ESRI)"].map((layerName) => (
                <div key={layerName} style={{ marginBottom: "5px" }}>
                  <input
                    type="radio"
                    name="baseLayer"
                    checked={activeBaseLayer === layerName}
                    onChange={() => changeBaseLayer(layerName)}
                  />
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "12px",
                      fontWeight: "normal",
                    }}
                  >
                    {layerName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Límites */}
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

          {/* Cambio Climático */}
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
              Cambio Climático - {activePeriod}
            </strong>
            <RasterLayerItem
              layerKey="rasterPT"
              title="Precipitación total anual"
              filename={`Prec_Total_Anual${periodMap[activePeriod]}.tif`}
            />
            <RasterLayerItem
              layerKey="rasterTEMPMin"
              title="Temperatura mínima anual"
              filename={`Temp_min_anual${periodMap[activePeriod]}.tif`}
            />
            <RasterLayerItem
              layerKey="rasterTEMPMed"
              title="Temperatura media anual"
              filename={`Temp_med_anual${periodMap[activePeriod]}.tif`}
            />
            <RasterLayerItem
              layerKey="rasterTEMPMax"
              title="Temperatura máxima anual"
              filename={`Temp_max_anual${periodMap[activePeriod]}.tif`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const EscenarioCC = () => {
  // Estados para las capas vectoriales
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estados para visualización
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Estados para leyendas - solo una visible a la vez
  const [precipitacionLegendVisible, setPrecipitacionLegendVisible] =
    useState(true);
  const [tempMinLegendVisible, setTempMinLegendVisible] = useState(false);
  const [tempMedLegendVisible, setTempMedLegendVisible] = useState(false);
  const [tempMaxLegendVisible, setTempMaxLegendVisible] = useState(false);

  // Estado para el periodo activo
  const [activePeriod, setActivePeriod] = useState("Actual");

  // Estado para las capas activas
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    rasterPT: true, // Precipitación activada por defecto
    rasterTEMPMin: false,
    rasterTEMPMed: false,
    rasterTEMPMax: false,
  });

  // Estado para opacidad de las capas
  const [opacity, setOpacity] = useState({
    area: 0.8,
    paisajes: 0.8,
    municipios: 0.8,
    rasterPT: 0.7,
    rasterTEMPMin: 0.7,
    rasterTEMPMed: 0.7,
    rasterTEMPMax: 0.7,
  });

  // Estados para información del mapa
  const [pixelValue, setPixelValue] = useState(null);

  // Cache para archivos SLD parseados
  const [sldCache, setSldCache] = useState({});

  // Mapeo de periodos a códigos de archivo
  const periodMap = {
    Actual: "", // Sin sufijo para archivos actuales
    "2015-2039": "_1539",
    "2045-2069": "_4569",
    "2075-2099": "_7599",
  };

  // Función para obtener colores SLD dinámicamente
  const getSLDColors = async (layerType, period) => {
    console.log(
      `getSLDColors llamada: layerType=${layerType}, period=${period}`
    );
    const periodSuffix = periodMap[period];

    // Mapeo correcto de archivos SLD y TIF
    const layerConfigs = {
      precipitation: {
        sldName: "Prec_Tot_anual",
        tifName: "Prec_Total_Anual",
      },
      tempMin: {
        sldName: "temp_min_anual",
        tifName: "Temp_min_anual",
      },
      tempMed: {
        sldName: "temp_med_anual",
        tifName: "Temp_med_anual",
      },
      tempMax: {
        sldName: "temp_max_anual",
        tifName: "Temp_max_anual",
      },
    };

    const config = layerConfigs[layerType];
    if (!config) {
      console.error(`Configuración no encontrada para layerType: ${layerType}`);
      return null;
    }

    const sldKey = `${config.sldName}${periodSuffix}`;

    // Verificar caché
    if (sldCache[sldKey]) {
      return sldCache[sldKey];
    }

    // Cargar y parsear SLD
    const sldPath = `/Clima/${config.sldName}${periodSuffix}.sld`;
    const sldData = await parseSLD(sldPath);

    if (sldData) {
      // Actualizar caché
      setSldCache((prev) => ({
        ...prev,
        [sldKey]: sldData,
      }));
    }

    return sldData;
  };

  // Función para obtener el nombre del archivo TIF (usando nombres reales de archivos)
  const getTifFileName = (layerType, period) => {
    const periodSuffix = periodMap[period];
    console.log(
      `getTifFileName: layerType=${layerType}, period=${period}, periodSuffix=${periodSuffix}`
    );

    let fileName = null;

    if (layerType === "precipitation") {
      fileName = `Prec_Total_Anual${periodSuffix}.tif`;
    } else if (layerType === "tempMin") {
      // Actual: Temp_min_anual.tif, Otros: Temp_min_1539.tif, etc.
      fileName =
        periodSuffix === ""
          ? "Temp_min_anual.tif"
          : `Temp_min${periodSuffix}.tif`;
    } else if (layerType === "tempMed") {
      // Actual: Temp_med_anual.tif, Otros: Temp_med_1539.tif, etc.
      fileName =
        periodSuffix === ""
          ? "Temp_med_anual.tif"
          : `Temp_med${periodSuffix}.tif`;
    } else if (layerType === "tempMax") {
      // Actual: Temp_max_anual.tif, Otros: Temp_max_1539.tif, etc.
      fileName =
        periodSuffix === ""
          ? "Temp_max_anual.tif"
          : `Temp_max${periodSuffix}.tif`;
    }

    console.log(`getTifFileName resultado: ${fileName}`);
    return fileName;
  };

  // Componente para RasterOverlay con SLD dinámico
  const DynamicRasterOverlay = ({
    layerType,
    isActive,
    opacity,
    onPixelValue,
  }) => {
    const [colorData, setColorData] = useState(null);
    const [key, setKey] = useState(0); // Para forzar re-render

    useEffect(() => {
      console.log(
        `[${layerType}] useEffect ejecutado - isActive: ${isActive}, período: ${activePeriod}`
      );

      // Limpiar datos anteriores cuando cambia el período o se desactiva
      setColorData(null);

      if (!isActive) {
        console.log(`[${layerType}] Capa inactiva, no cargando`);
        return;
      }

      const loadColors = async () => {
        console.log(
          `[${layerType}] Cargando colores para período: ${activePeriod}`
        );
        const sldData = await getSLDColors(layerType, activePeriod);
        if (sldData) {
          console.log(`[${layerType}] SLD cargado, configurando datos`);
          setColorData(sldData);
          setKey((prev) => prev + 1); // Forzar re-render del RasterOverlay
        } else {
          console.error(
            `[${layerType}] Error cargando SLD para período ${activePeriod}`
          );
        }
      };

      loadColors();
    }, [layerType, activePeriod, isActive]);

    if (!isActive || !colorData) return null;

    // Para intervals, necesitamos crear un mapeo de valores del TIF a colores
    // Los SLD definen rangos: valor <= quantity → color
    let colorMapProp;

    if (colorData.type === "intervals") {
      // INTERVALS: Valores discretos - cada quantity es un límite superior del rango
      colorMapProp = {};

      const sortedEntries = Object.entries(colorData.colors).sort(
        ([a], [b]) => {
          if (a === "inf") return 1;
          if (b === "inf") return -1;
          return parseFloat(a) - parseFloat(b);
        }
      );

      // Cubrir un rango amplio de valores posibles (-1000 a 5000)
      for (let value = -1000; value <= 5000; value++) {
        let assignedColor = "#00000000"; // transparente por defecto

        // Buscar el color correcto según los intervalos
        for (const [quantity, color] of sortedEntries) {
          if (quantity === "inf") {
            assignedColor = color;
            break;
          } else if (value <= parseFloat(quantity)) {
            assignedColor = color;
            break;
          }
        }

        colorMapProp[value] = assignedColor;
      }
    } else if (colorData.type === "ramp") {
      // RAMP: También categorizar por intervalos discretos, NO gradiente continuo
      colorMapProp = {};

      const sortedEntries = Object.entries(colorData.colors).sort(
        ([a], [b]) => parseFloat(a) - parseFloat(b)
      );

      // Para cada valor posible del TIF, asignar el color correcto según el rango más cercano
      for (let value = -10; value <= 50; value++) {
        let assignedColor = "#00000000"; // transparente por defecto

        // Buscar el rango correcto - valor debe estar <= quantity para tomar ese color
        for (const [quantity, color] of sortedEntries) {
          if (value <= parseFloat(quantity)) {
            assignedColor = color;
            break;
          }
        }

        // Si el valor es mayor que el último quantity, usar el último color
        if (assignedColor === "#00000000" && sortedEntries.length > 0) {
          assignedColor = sortedEntries[sortedEntries.length - 1][1];
        }

        colorMapProp[value] = assignedColor;
      }
    } else {
      // Fallback para otros tipos
      colorMapProp = colorData.colors;
    }

    const fileName = getTifFileName(layerType, activePeriod);
    if (!fileName) {
      console.error(
        `[${layerType}] getTifFileName devolvió null para período ${activePeriod}`
      );
      return null;
    }

    console.log(
      `[${layerType}] Renderizando RasterOverlay con archivo: ${fileName}, período: ${activePeriod}`
    );

    return (
      <RasterOverlay
        key={`${layerType}-${activePeriod}-${key}`}
        fileName={fileName}
        baseUrl="/Clima/"
        overlayOpacity={opacity}
        colorMap={colorMapProp}
        continuous={false} // SIEMPRE false - usar categorización discreta para todos los tipos
        onPixelValue={onPixelValue}
      />
    );
  };

  // Función para manejar cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Efecto para controlar la visibilidad de las leyendas (solo una a la vez)
  useEffect(() => {
    let lastActive = null;

    // Encontrar la última capa activada
    if (activeLayers.rasterPT) {
      lastActive = "precipitacion";
    }
    if (activeLayers.rasterTEMPMin) {
      lastActive = "tempMin";
    }
    if (activeLayers.rasterTEMPMed) {
      lastActive = "tempMed";
    }
    if (activeLayers.rasterTEMPMax) {
      lastActive = "tempMax";
    }

    // Ocultar todas las leyendas primero
    setPrecipitacionLegendVisible(false);
    setTempMinLegendVisible(false);
    setTempMedLegendVisible(false);
    setTempMaxLegendVisible(false);

    // Mostrar solo la leyenda de la última capa activada
    if (lastActive === "precipitacion") {
      setPrecipitacionLegendVisible(true);
    } else if (lastActive === "tempMin") {
      setTempMinLegendVisible(true);
    } else if (lastActive === "tempMed") {
      setTempMedLegendVisible(true);
    } else if (lastActive === "tempMax") {
      setTempMaxLegendVisible(true);
    }
  }, [
    activeLayers.rasterPT,
    activeLayers.rasterTEMPMin,
    activeLayers.rasterTEMPMed,
    activeLayers.rasterTEMPMax,
  ]);

  // Cargar datos vectoriales
  useEffect(() => {
    const loadData = async () => {
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
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    loadData();
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[16.67566, -95.96711]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <PeriodTabs
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />

        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          activePeriod={activePeriod}
          onControlStateChange={handleControlStateChange}
        />

        {/* Capas raster */}
        <DynamicRasterOverlay
          layerType="precipitation"
          isActive={activeLayers.rasterPT}
          opacity={opacity.rasterPT}
          onPixelValue={setPixelValue}
        />

        <DynamicRasterOverlay
          layerType="tempMin"
          isActive={activeLayers.rasterTEMPMin}
          opacity={opacity.rasterTEMPMin}
          onPixelValue={setPixelValue}
        />

        <DynamicRasterOverlay
          layerType="tempMed"
          isActive={activeLayers.rasterTEMPMed}
          opacity={opacity.rasterTEMPMed}
          onPixelValue={setPixelValue}
        />

        <DynamicRasterOverlay
          layerType="tempMax"
          isActive={activeLayers.rasterTEMPMax}
          opacity={opacity.rasterTEMPMax}
          onPixelValue={setPixelValue}
        />

        {/* Leyenda de Precipitación */}
        <PrecipitacionLegend
          isVisible={precipitacionLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          activePeriod={activePeriod}
          sldCache={sldCache}
          getSLDColors={getSLDColors}
        />

        {/* Leyenda de Temperatura Mínima */}
        <TemperaturaMinLegend
          isVisible={tempMinLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          activePeriod={activePeriod}
          getSLDColors={getSLDColors}
        />

        {/* Leyenda de Temperatura Media */}
        <TemperaturaMedLegend
          isVisible={tempMedLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          activePeriod={activePeriod}
          getSLDColors={getSLDColors}
        />

        {/* Leyenda de Temperatura Máxima */}
        <TemperaturaMaxLegend
          isVisible={tempMaxLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          activePeriod={activePeriod}
          getSLDColors={getSLDColors}
        />

        <CoordinateControl />
        <ScaleControl />
        <PixelValueDisplay pixelValue={pixelValue} />
      </MapContainer>
    </div>
  );
};

export default EscenarioCC;
