import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

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

// Componente para mostrar el valor del pixel
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
        <span style={labelStyle}>Polinizadores:</span>
        <span style={valueNumberStyle}>{pixelValue.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Componente de leyenda para Anoura geoffroyi
const AnouraLegend = ({ isVisible, season, layerControlCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado
    : "250px"; // Espacio suficiente para evitar superposición con el control expandido

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

  const seasonNames = {
    PRI: "Primavera",
    VER: "Verano",
    OTO: "Otoño",
    INV: "Invierno",
  };

  // Rampa de colores para abundancia - usando la nueva paleta
  const createColorRamp = () => {
    const colors = [
      "#c59d7f", // Café claro (muy baja)
      "#e7d4aa", // Beige
      "#fefad6", // Amarillo muy claro
      "#aaccc8", // Verde agua claro
      "#8dbabe", // Verde agua (muy alta)
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
          <span>Baja</span>
          <span>Alta</span>
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
          <span>Abundancia relativa</span>
        </div>
      </div>
    );
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
            Anoura geoffroyi - {seasonNames[season] || season}
          </div>
          {createColorRamp()}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para Polinizadores generales
const PolinizadoresLegend = ({ isVisible, season, layerControlCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado
    : "250px"; // Espacio suficiente para evitar superposición con el control expandido

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

  const seasonNames = {
    PRI: "Primavera",
    VER: "Verano",
  };

  // Rampa de colores para polinizadores - usando la rampa específica
  const createColorRamp = () => {
    const colors = [
      "#ffffb4", // Amarillo claro (muy baja)
      "#feff70", // Amarillo más intenso
      "#85e966", // Verde claro
      "#78bfb9", // Verde azulado
      "#7190ae", // Azul (muy alta)
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
          <span>Baja</span>
          <span>Alta</span>
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
          <span>Abundancia relativa</span>
        </div>
      </div>
    );
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
            Polinizadores - {seasonNames[season] || season}
          </div>
          {createColorRamp()}
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
  onControlStateChange,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Hillshade (ESRI)");

  // Notificar cambios en el estado del control para posicionamiento dinámico
  useEffect(() => {
    if (onControlStateChange) {
      const width = isCollapsed ? 90 : 300; // Ancho colapsado vs expandido
      onControlStateChange(isCollapsed, width);
    }
  }, [isCollapsed, onControlStateChange]);

  useEffect(() => {
    const baseLayers = {
      "Hillshade (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
        }
      ),
      "Satelital (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
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
            setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
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
            setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
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
        <span>{isCollapsed ? "Capas" : "Capas"}</span>
        <span style={{ fontSize: "8px" }}>{isCollapsed ? "" : ""}</span>
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
              {["Hillshade (ESRI)", "Satelital (ESRI)"].map((layerName) => (
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

          {/* Grupo de Polinizadores */}
          <div style={{ marginBottom: "10px" }}>
            <strong
              style={{
                color: "white",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Polinizadores
            </strong>

            {/* Anoura geoffroyi */}
            <div style={{ marginBottom: "15px" }}>
              <strong
                style={{
                  color: "white",
                  marginBottom: "8px",
                  display: "block",
                  fontSize: "14px",
                  marginLeft: "10px",
                }}
              >
                Anoura geoffroyi
              </strong>
              <RasterLayerItem
                layerKey="rasterAG_PRI"
                title="Primavera"
                filename="AG_PRI.tif"
              />
              <RasterLayerItem
                layerKey="rasterAG_VER"
                title="Verano"
                filename="AG_VER.tif"
              />
              <RasterLayerItem
                layerKey="rasterAG_OTO"
                title="Otoño"
                filename="AG_OTO.tif"
              />
              <RasterLayerItem
                layerKey="rasterAG_INV"
                title="Invierno"
                filename="AG_INV.tif"
              />
            </div>

            {/* Polinizadores generales */}
            <div style={{ marginBottom: "10px" }}>
              <strong
                style={{
                  color: "white",
                  marginBottom: "8px",
                  display: "block",
                  fontSize: "14px",
                  marginLeft: "10px",
                }}
              >
                Polinizadores generales
              </strong>
              <RasterLayerItem
                layerKey="rasterPOLIN_PRI"
                title="Primavera"
                filename="POLIN_PRI.tif"
              />
              <RasterLayerItem
                layerKey="rasterPOLIN_VER"
                title="Verano"
                filename="POLIN_VER.tif"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const Polinizadores = () => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    rasterAG_PRI: true,
    rasterAG_VER: false,
    rasterAG_OTO: false,
    rasterAG_INV: false,
    rasterPOLIN_PRI: false,
    rasterPOLIN_VER: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    rasterAG_PRI: 0.7,
    rasterAG_VER: 0.7,
    rasterAG_OTO: 0.7,
    rasterAG_INV: 0.7,
    rasterPOLIN_PRI: 0.7,
    rasterPOLIN_VER: 0.7,
  });

  // Estados para leyendas
  const [anouraLegendVisible, setAnouraLegendVisible] = useState(false);
  const [anouraLegendSeason, setAnouraLegendSeason] = useState("");
  const [polinizadoresLegendVisible, setPolinizadoresLegendVisible] =
    useState(false);
  const [polinizadoresLegendSeason, setPolinizadoresLegendSeason] =
    useState("");

  // Estados para manejo de carga y errores del raster
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el valor del pixel
  const [pixelValue, setPixelValue] = useState(null);

  // Estado para controlar la posición dinámica de la leyenda
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Función para manejar cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Estado para el centro del mapa
  const [mapCenter, setMapCenter] = useState([16.67566, -95.96711]);
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
          // Comentado para mantener el centro fijo en [16.67566, -95.96711]
          // if (areaData && areaData.features && areaData.features.length > 0) {
          //   const bounds = L.geoJSON(areaData).getBounds();
          //   const center = bounds.getCenter();
          //   setMapCenter([center.lat, center.lng]);

          //   // Calcular zoom apropiado basado en el tamaño del área
          //   const latDiff = bounds.getNorth() - bounds.getSouth();
          //   const lngDiff = bounds.getEast() - bounds.getWest();
          //   const maxDiff = Math.max(latDiff, lngDiff);

          //   // Ajustar zoom basado en el tamaño del área
          //   let zoom = 10;
          //   if (maxDiff > 2) zoom = 8;
          //   else if (maxDiff > 1) zoom = 9;
          //   else if (maxDiff > 0.5) zoom = 10;
          //   else if (maxDiff > 0.2) zoom = 11;
          //   else zoom = 12;

          //   setMapZoom(zoom);
          // }
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
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, []);

  // Efecto para controlar la visibilidad de las leyendas
  useEffect(() => {
    // Determinar qué leyenda mostrar basado en las capas activas
    const activeAnouraLayers = Object.keys(activeLayers).filter(
      (key) => key.startsWith("rasterAG_") && activeLayers[key]
    );

    const activePolinizadoresLayers = Object.keys(activeLayers).filter(
      (key) => key.startsWith("rasterPOLIN_") && activeLayers[key]
    );

    // Mostrar leyenda de Anoura si hay alguna capa activa
    if (activeAnouraLayers.length > 0) {
      setAnouraLegendVisible(true);
      // Tomar la primera capa activa para determinar la estación
      const season = activeAnouraLayers[0].replace("rasterAG_", "");
      setAnouraLegendSeason(season);
    } else {
      setAnouraLegendVisible(false);
    }

    // Mostrar leyenda de Polinizadores si hay alguna capa activa
    if (activePolinizadoresLayers.length > 0) {
      setPolinizadoresLegendVisible(true);
      // Tomar la primera capa activa para determinar la estación
      const season = activePolinizadoresLayers[0].replace("rasterPOLIN_", "");
      setPolinizadoresLegendSeason(season);
    } else {
      setPolinizadoresLegendVisible(false);
    }

    // Si ambos grupos tienen capas activas, priorizar Polinizadores
    if (activeAnouraLayers.length > 0 && activePolinizadoresLayers.length > 0) {
      setAnouraLegendVisible(false);
    }
  }, [activeLayers]);

  // Paletas de colores para cada tipo
  const anouraColorMap = [
    "#c59d7f",
    "#e7d4aa",
    "#fefad6",
    "#aaccc8",
    "#8dbabe",
  ];

  const polinizadoresColorMap = [
    "#ffffb4",
    "#feff70",
    "#85e966",
    "#78bfb9",
    "#7190ae",
  ];

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
      >
        {/* RasterOverlays para Anoura geoffroyi */}
        {activeLayers.rasterAG_PRI && (
          <RasterOverlay
            fileName="AG_PRI.tif"
            colorMap={anouraColorMap}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterAG_PRI}
          />
        )}
        {activeLayers.rasterAG_VER && (
          <RasterOverlay
            fileName="AG_VER.tif"
            colorMap={anouraColorMap}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterAG_VER}
          />
        )}
        {activeLayers.rasterAG_OTO && (
          <RasterOverlay
            fileName="AG_OTO.tif"
            colorMap={anouraColorMap}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterAG_OTO}
          />
        )}
        {activeLayers.rasterAG_INV && (
          <RasterOverlay
            fileName="AG_INV.tif"
            colorMap={anouraColorMap}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterAG_INV}
          />
        )}

        {/* RasterOverlays para Polinizadores */}
        {activeLayers.rasterPOLIN_PRI && (
          <RasterOverlay
            fileName="POLIN_PRI.tif"
            colorMap={polinizadoresColorMap}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterPOLIN_PRI}
          />
        )}
        {activeLayers.rasterPOLIN_VER && (
          <RasterOverlay
            fileName="POLIN_VER.tif"
            colorMap={polinizadoresColorMap}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterPOLIN_VER}
          />
        )}

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          onControlStateChange={handleControlStateChange}
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
        <AnouraLegend
          isVisible={anouraLegendVisible}
          season={anouraLegendSeason}
          layerControlCollapsed={layerControlCollapsed}
        />
        <PolinizadoresLegend
          isVisible={polinizadoresLegendVisible}
          season={polinizadoresLegendSeason}
          layerControlCollapsed={layerControlCollapsed}
        />

        {/* Controles de coordenadas y escala */}
        <CoordinateControl />
        <ScaleControl />

        {/* Componente para mostrar el valor del pixel */}
        <PixelValueDisplay pixelValue={pixelValue} />
      </MapContainer>
    </div>
  );
};

export default Polinizadores;
