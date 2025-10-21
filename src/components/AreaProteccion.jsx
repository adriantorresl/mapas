import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

// Función para generar colores específicos para categorías de manejo de ANP basada en Areas_Conservacion.sld
const generateANPColorPalette = (values) => {
  const colorMap = {
    ADVC: "#db524a", // rojo - Área dedicada voluntariamente a la conservación
    "Monumento Nacional": "#4887e7", // azul - Monumento nacional
    "Parque estatal": "#7cda85", // verde - Parque estatal
    // Colores adicionales para otras categorías que puedan existir en los datos
    "Área de Protección de Flora y Fauna": "#4CAF50", // Verde
    "Área de Protección de Recursos Naturales": "#8BC34A", // Verde claro
    "Parque Nacional": "#2196F3", // Azul
    "Reserva de la Biosfera": "#9C27B0", // Púrpura
    "Otra Categoría": "#607D8B", // Gris azulado
  };

  // Crear mapa solo con los valores que existen en los datos
  const uniqueValues = [...new Set(values)];
  const result = {};
  uniqueValues.forEach((value) => {
    if (colorMap[value]) {
      result[value] = colorMap[value];
    } else {
      // Fallback color si no está en la guía
      result[value] = "#CCCCCC";
    }
  });

  return result;
};

// Función para generar mapa de leyenda con nombres descriptivos basados en el SLD
const generateLegendMap = (colorMap) => {
  const displayNames = {
    ADVC: "Área dedicada voluntariamente a la conservación",
    "Monumento Nacional": "Monumento Nacional",
    "Parque estatal": "Parque estatal",
    // Mantener nombres adicionales para otras categorías
    "Área de Protección de Flora y Fauna":
      "Área de Protección de Flora y Fauna",
    "Área de Protección de Recursos Naturales":
      "Área de Protección de Recursos Naturales",
    "Parque Nacional": "Parque Nacional",
    "Reserva de la Biosfera": "Reserva de la Biosfera",
    "Otra Categoría": "Otra Categoría",
  };

  const legendMap = {};
  Object.entries(colorMap).forEach(([originalName, color]) => {
    const displayName = displayNames[originalName] || originalName;
    legendMap[displayName] = color;
  });

  return legendMap;
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
    : "290px"; // Espacio suficiente para evitar superposición con el control expandido (más espacio)

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
    minHeight: "auto", // Altura mínima para consistencia
    transition: "right 0.3s ease", // Animación suave
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
            padding: "15px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {Object.entries(colorMap).map(([value, color]) => (
            <div
              key={value}
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
                    verticalAlign: "middle",
                  }}
                ></div>
                <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Control de coordenadas
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

    // Función para actualizar coordenadas
    const updateCoordinates = (e) => {
      const lat = e.latlng.lat.toFixed(5);
      const lng = e.latlng.lng.toFixed(5);
      coordinateDiv.innerHTML = `Lat: ${lat}, Lon: ${lng}`;
    };

    // Agregar listener de mouse move
    map.on("mousemove", updateCoordinates);

    // Cleanup
    return () => {
      map.off("mousemove", updateCoordinates);
      if (coordinateDiv.parentNode) {
        coordinateDiv.parentNode.removeChild(coordinateDiv);
      }
    };
  }, [map]);

  return null;
};

// Control de escala
const ScaleControl = () => {
  const map = useMap();

  useEffect(() => {
    const scaleControl = L.control.scale({
      position: "bottomleft",
      metric: true,
      imperial: false,
    });

    scaleControl.addTo(map);

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

// Control de capas agrupado para áreas de protección
const GroupedLayerControl = ({
  anpData,
  area,
  paisajes,
  municipios,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  tooltipsEnabled,
  onColorMapChange,
  onControlStateChange,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Topográfico (OSM)");

  // Capas base
  const baseLayers = {
    Satelital: L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS",
        maxZoom: 18,
      }
    ),
    "Topográfico (OSM)": L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ),
  };

  // Configurar capas base
  useEffect(() => {
    const baseLayer = baseLayers[activeBaseLayer];
    if (baseLayer && !map.hasLayer(baseLayer)) {
      // Limpiar capa base anterior
      Object.values(baseLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      baseLayer.addTo(map);
    }
  }, [map, activeBaseLayer]);

  // Manejar capas vectoriales y raster
  useEffect(() => {
    if (!map) return;

    // Limpiar capas existentes (excepto base)
    Object.keys(layers).forEach((key) => {
      if (layers[key] && key !== "base") {
        map.removeLayer(layers[key]);
      }
    });

    const newLayers = {};

    // Agregar área de estudio
    if (area && activeLayers.area) {
      newLayers.area = L.geoJSON(area, {
        style: {
          color: "black",
          weight: 6,
          fillOpacity: 0,
          opacity: opacity.area,
        },
      }).addTo(map);
    }

    // Agregar paisajes
    if (paisajes && activeLayers.paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: {
          color: "white",
          weight: 3,
          fillOpacity: 0,
          opacity: opacity.paisajes,
        },
      }).addTo(map);
    }

    // Agregar municipios
    if (municipios && activeLayers.municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: {
          color: "black",
          weight: 1,
          fillOpacity: 0,
          opacity: opacity.municipios,
        },
      }).addTo(map);
    }

    // Agregar ANP con etiquetas
    if (anpData && activeLayers.anp) {
      const values = anpData.features
        .map((f) => f.properties.CAT_MANEJO)
        .filter((v) => v);

      const colorMap = generateANPColorPalette(values);
      const legendMap = generateLegendMap(colorMap);
      onColorMapChange(legendMap);

      const anpLayer = L.geoJSON(anpData, {
        style: (feature) => {
          const category = feature.properties.CAT_MANEJO;
          const color = colorMap[category] || "#CCCCCC";
          return {
            fillColor: color,
            weight: 1, // stroke-width del SLD
            opacity: 1,
            color: "#9a9a9a", // stroke color del SLD (gris)
            fillOpacity: opacity.anp,
          };
        },
        onEachFeature: (feature, layer) => {
          // Agregar popup
          if (feature.properties) {
            layer.bindPopup(
              `<strong>Nombre:</strong> ${
                feature.properties.NOMBRE || "N/A"
              }<br>
               <strong>Categoría:</strong> ${
                 feature.properties.CAT_MANEJO || "N/A"
               }`
            );
          }
        },
      }).addTo(map);

      newLayers.anp = anpLayer;
    }

    setLayers(newLayers);

    // Cleanup
    return () => {
      Object.values(newLayers).forEach((layer) => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [
    map,
    anpData,
    area,
    paisajes,
    municipios,
    activeLayers,
    opacity,
    onColorMapChange,
  ]);

  // Notificar cambios en el estado del control para posicionamiento dinámico
  useEffect(() => {
    if (onControlStateChange) {
      const width = isCollapsed ? 90 : 300; // Ancho colapsado vs expandido
      onControlStateChange(isCollapsed, width);
    }
  }, [isCollapsed, onControlStateChange]);

  // Cambiar capa base
  const changeBaseLayer = (newBaseLayerName) => {
    setActiveBaseLayer(newBaseLayerName);
  };

  // Función para toggle de capas
  const toggleLayer = (layerKey) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  // Función para cambiar opacidad
  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
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

  const RasterLayerItem = ({ filename, title }) => (
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
          checked={activeLayers[filename] || false}
          onChange={() => toggleLayer(filename)}
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
          title={`Descargar ${title}`}
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
        <span style={{ fontSize: "10px", color: "white" }}>
          Opacidad: {Math.round((opacity[filename] || 0.7) * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const currentOpacity = opacity[filename] || 0.7;
            const newOpacity = Math.max(0, currentOpacity - 0.1);
            handleOpacityChange(filename, newOpacity);
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
          disabled={(opacity[filename] || 0.7) <= 0}
        >
          -
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const currentOpacity = opacity[filename] || 0.7;
            const newOpacity = Math.min(1, currentOpacity + 0.1);
            handleOpacityChange(filename, newOpacity);
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
          disabled={(opacity[filename] || 0.7) >= 1}
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
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
        minHeight: "auto", // Altura mínima para consistencia
      }}
    >
      <div
        style={{
          fontSize: "16px",
          padding: "10px 15px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: isCollapsed ? "none" : "1px solid #eee",
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
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
              {Object.keys(baseLayers).map((baseLayerName) => (
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
            <div style={{ marginLeft: "10px" }}>
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
          </div>

          {/* Áreas de Protección */}
          <div style={{ marginBottom: "0px" }}>
            <strong
              style={{
                color: "white",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Áreas de Protección
            </strong>
            <div style={{ marginLeft: "10px" }}>
              <LayerItem
                layerKey="anp"
                title="Áreas Naturales Protegidas"
                data={anpData}
                showOpacity={true}
              />
              <RasterLayerItem
                filename="IMPORTANCIA_ECOLOGICA.tif"
                title="Importancia Ecológica"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const AreaProteccion = () => {
  const [anpData, setAnpData] = useState(null);
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState({});
  const [activeLayers, setActiveLayers] = useState({
    anp: true,
    area: true,
    paisajes: true,
    municipios: true,
    "IMPORTANCIA_ECOLOGICA.tif": false,
  });
  const [opacity, setOpacity] = useState({
    anp: 0.7,
    area: 1.0,
    paisajes: 1.0,
    municipios: 1.0,
    "IMPORTANCIA_ECOLOGICA.tif": 0.7,
  });
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Handler para cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Función para obtener el mapa de colores del raster activo
  const getRasterColorMap = () => {
    if (activeLayers["IMPORTANCIA_ECOLOGICA.tif"]) {
      return {
        "0 - Sin datos": "#FFFFFF",
        "1 - Muy Baja": "#E6FFE6",
        "2 - Baja": "#66CC66",
        "3 - Baja-Media": "#99FF99",
        "4 - Media": "#66CCCC",
        "5 - Media-Alta": "#6699CC",
        "6 - Alta": "#9999FF",
        "7 - Muy Alta": "#6666CC",
      };
    }
    return null;
  };

  // Cargar datos una sola vez
  useEffect(() => {
    const loadData = async () => {
      try {
        const responses = await Promise.all([
          fetch("/anp.geojson"),
          fetch("/AREA.geojson"),
          fetch("/PAISAJES.geojson"),
          fetch("/MUNICIPIOS.geojson"),
        ]);

        const [
          anpResponse,
          areaResponse,
          paisajesResponse,
          municipiosResponse,
        ] = responses;

        const [anpData, areaData, paisajesData, municipiosData] =
          await Promise.all([
            anpResponse.json(),
            areaResponse.json(),
            paisajesResponse.json(),
            municipiosResponse.json(),
          ]);

        setAnpData(anpData);
        setArea(areaData);
        setPaisajes(paisajesData);
        setMunicipios(municipiosData);
        setLoading(false);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Cargando mapa de áreas de protección...
      </div>
    );
  }

  return (
    <MapContainer
      center={[16.67566, -95.96711]}
      zoom={10}
      scrollWheelZoom={true}
      doubleClickZoom={false}
      style={{ height: "100vh", width: "100%" }}
    >
      <GroupedLayerControl
        anpData={anpData}
        area={area}
        paisajes={paisajes}
        municipios={municipios}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
        tooltipsEnabled={true}
        onColorMapChange={setColorMap}
        onControlStateChange={handleControlStateChange}
      />

      {/* Capas raster con configuración específica de valores y colores */}
      <RasterOverlay
        fileName="IMPORTANCIA_ECOLOGICA.tif"
        colorMap={[
          "#FFFFFF",
          "#E6FFE6",
          "#66CC66",
          "#99FF99",
          "#66CCCC",
          "#6699CC",
          "#9999FF",
          "#6666CC",
        ]}
        baseUrl="/"
        continuous={false}
        setError={() => {}}
        setLoading={() => {}}
        onPixelValue={() => {}}
        overlayOpacity={opacity["IMPORTANCIA_ECOLOGICA.tif"] || 0.7}
        visible={activeLayers["IMPORTANCIA_ECOLOGICA.tif"]}
      />

      <CoordinateControl />
      <ScaleControl />
      <ColorLegend
        colorMap={getRasterColorMap() || colorMap}
        isVisible={Object.keys(getRasterColorMap() || colorMap).length > 0}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
      />
    </MapContainer>
  );
};

export default AreaProteccion;
