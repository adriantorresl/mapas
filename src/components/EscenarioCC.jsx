import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";
import { color } from "framer-motion";

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

// Componente para mostrar valor del pixel
const PixelValueDisplay = ({ pixelValue }) => {
  if (!pixelValue) return null;

  const displayStyle = {
    position: "absolute",
    bottom: "18px",
    left: "10px",
    backgroundColor: "#1E3C20",
    color: "white",
    padding: "8px 12px",
    borderRadius: "0px",
    fontSize: "12px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "bold",
    zIndex: 1000,
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    minWidth: "120px",
  };

  return (
    <div style={displayStyle}>
      <div style={{ fontSize: "10px", marginBottom: "2px", opacity: 0.8 }}>
        Valor del pixel:
      </div>
      <div>{pixelValue.toFixed(2)}</div>
    </div>
  );
};

// Componente de leyenda para Precipitación
const PrecipitacionLegend = ({
  isVisible,
  layerControlCollapsed,
  activePeriod,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const precipitacionRanges = [
    { color: "#fffee3", label: "≤ 400 mm" },
    { color: "#deea51", label: "400 - 600 mm" },
    { color: "#ccf162", label: "600 - 800 mm" },
    { color: "#68d849", label: "800 - 1000 mm" },
    { color: "#2db242", label: "1000 - 1200 mm" },
    { color: "#3a8a79", label: "1200 - 1400 mm" },
    { color: "#5c6fd1", label: "1400 - 1600 mm" },
    { color: "#4843d4", label: "1600 - 1800 mm" },
    { color: "#550056", label: "> 1800 mm" },
  ];

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

// Componente de leyenda para Temperatura
const TemperaturaLegend = ({
  isVisible,
  layerControlCollapsed,
  activePeriod,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
            Temperatura - {activePeriod}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "white",
              marginBottom: "4px",
            }}
          >
            <span>4°C</span>
            <span>36°C</span>
          </div>
          <div
            style={{
              height: "20px",
              background:
                "linear-gradient(to right, #7b39d4, #224988, #306190, #4a8e9f, #66bfaf, #73dc9a, #79f178, #a1fa7e, #defb9d, #fff099, #ffd76d, #ffbf41, #f99b20, #e4581f, #b73b1f, #8a1f1f, #4a2121)",
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
    "2015-2039": "1539",
    "2045-2069": "4569",
    "2075-2099": "7599",
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
              filename={`PT_${periodMap[activePeriod]}.tif`}
            />
            <RasterLayerItem
              layerKey="rasterTEMP"
              title="Temperatura media anual"
              filename={`TEMP_${periodMap[activePeriod]}.tif`}
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
  const [temperaturaLegendVisible, setTemperaturaLegendVisible] =
    useState(false);

  // Estado para el periodo activo
  const [activePeriod, setActivePeriod] = useState("2015-2039");

  // Estado para las capas activas
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    rasterPT: true, // Precipitación activada por defecto
    rasterTEMP: false,
  });

  // Estado para opacidad de las capas
  const [opacity, setOpacity] = useState({
    area: 0.8,
    paisajes: 0.8,
    municipios: 0.8,
    rasterPT: 0.7,
    rasterTEMP: 0.7,
  });

  // Estados para información del mapa
  const [pixelValue, setPixelValue] = useState(null);

  // Mapeo de periodos a códigos de archivo
  const periodMap = {
    "2015-2039": "1539",
    "2045-2069": "4569",
    "2075-2099": "7599",
  };

  // Función para manejar cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Efecto para controlar la visibilidad de las leyendas (solo una a la vez)
  useEffect(() => {
    let activeCount = 0;
    let lastActive = null;

    // Contar capas activas y encontrar la última activa
    if (activeLayers.rasterPT) {
      activeCount++;
      lastActive = "precipitacion";
    }
    if (activeLayers.rasterTEMP) {
      activeCount++;
      lastActive = "temperatura";
    }

    // Ocultar todas las leyendas primero
    setPrecipitacionLegendVisible(false);
    setTemperaturaLegendVisible(false);

    // Mostrar solo la leyenda de la última capa activada
    if (lastActive === "precipitacion") {
      setPrecipitacionLegendVisible(true);
    } else if (lastActive === "temperatura") {
      setTemperaturaLegendVisible(true);
    }
  }, [activeLayers.rasterPT, activeLayers.rasterTEMP]);

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
        {activeLayers.rasterPT && (
          <RasterOverlay
            fileName={`PT_${periodMap[activePeriod]}.tif`}
            baseUrl="/"
            overlayOpacity={opacity.rasterPT}
            colorMap={[
              "#fffee3", // Valores bajos (≤ 400)
              "#deea51", // 400 - 600
              "#ccf162", // 600 - 800
              "#68d849", // 800 - 1000
              "#2db242", // 1000 - 1200
              "#3a8a79", // 1200 - 1400
              "#5c6fd1", // 1400 - 1600
              "#4843d4", // 1600 - 1800
              "#550056", // Valores altos (> 1800)
            ]}
            continuous={true}
            onPixelValue={setPixelValue}
          />
        )}

        {activeLayers.rasterTEMP && (
          <RasterOverlay
            fileName={`TEMP_${periodMap[activePeriod]}.tif`}
            baseUrl="/"
            overlayOpacity={opacity.rasterTEMP}
            colorMap={[
              "#7b39d4", // 4°C
              "#224988", // 6°C
              "#306190", // 8°C
              "#4a8e9f", // 10°C
              "#66bfaf", // 12°C
              "#73dc9a", // 14°C
              "#79f178", // 16°C
              "#a1fa7e", // 18°C
              "#defb9d", // 20°C
              "#fff099", // 22°C
              "#ffd76d", // 24°C
              "#ffbf41", // 26°C
              "#f99b20", // 28°C
              "#e4581f", // 30°C
              "#b73b1f", // 32°C
              "#8a1f1f", // 34°C
              "#4a2121", // 36°C
            ]}
            continuous={true}
            onPixelValue={setPixelValue}
          />
        )}

        {/* Leyenda de Precipitación */}
        <PrecipitacionLegend
          isVisible={precipitacionLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          activePeriod={activePeriod}
        />

        {/* Leyenda de Temperatura */}
        <TemperaturaLegend
          isVisible={temperaturaLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          activePeriod={activePeriod}
        />

        <CoordinateControl />
        <ScaleControl />
        <PixelValueDisplay pixelValue={pixelValue} />
      </MapContainer>
    </div>
  );
};

export default EscenarioCC;
