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
    : "300px"; // Espacio suficiente para evitar superposición con el control expandido (más espacio)

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
          {Object.entries(colorMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([item, color]) => (
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

// Componente de leyenda para escurrimientos por orden
const EscurrimientosLegend = ({
  isVisible,
  layerControlCollapsed,
  layerControlWidth,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado (más espacio)
    : "370px"; // Espacio suficiente para evitar superposición con el control expandido (más espacio)

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

  // Definir colores y grosores para cada orden de escurrimiento
  const ordenData = [
    { orden: 1, color: "#d2f7f9", width: 1 },
    { orden: 2, color: "#a1bdc6", width: 1.5 },
    { orden: 3, color: "#708397", width: 2 },
    { orden: 4, color: "#3f4962", width: 2.5 },
    { orden: 5, color: "#0f0f30", width: 3 },
    { orden: 6, color: "#000000", width: 3.5 },
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
            Escurrimientos (Orden)
          </div>
          {ordenData.map(({ orden, color, width }) => (
            <div
              key={orden}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "3px 0",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: `${width}px`,
                  backgroundColor: color,
                  marginRight: "8px",
                  borderRadius: "1px",
                }}
              ></div>
              <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                {orden}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para el raster de pendientes
const PendienteLegend = ({
  isVisible,
  layerControlCollapsed,
  layerControlWidth,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Colores del gradiente de pendiente (extraídos del archivo Pendiente.sld)
  const colors = ["#fef9ae", "#fd9242", "#ff0094", "#0602f2", "#040058"];

  // Valores de pendiente según el archivo SLD (0° a 61.82°)
  const minPendiente = 0; // grados
  const maxPendiente = 61.82; // grados (valor exacto del SLD)

  // Calcular posición dinámica basada en el estado del control de capas
  // Mantener una separación constante y razonable entre controles
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado (más espacio)
    : "250px"; // Espacio suficiente para evitar superposición con el control expandido (más espacio)

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
            Pendiente (°)
          </div>
          <div style={rampStyle}></div>
          <div style={labelsStyle}>
            <span>{minPendiente}°</span>
            <span>{maxPendiente}°</span>
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
    const newLayers = {};

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
            layer.bindPopup(
              `<strong>Cuenca:</strong> ${props.NOMBRE || props.NAME || "N/A"}`
            );
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
          // Obtener el valor del campo ORD_FLOW para determinar el grosor y color
          const ordFlow =
            feature.properties.ORD_STRA || feature.properties.ORD_CLAS || 1;

          // Definir colores y grosores según el orden (los órdenes más altos = ríos principales = más gruesos)
          const colorMap = {
            1: { color: "#d2f7f9", weight: 1 },
            2: { color: "#a1bdc6", weight: 1.5 },
            3: { color: "#708397", weight: 2 },
            4: { color: "#3f4962", weight: 2.5 },
            5: { color: "#0f0f30", weight: 3 },
            6: { color: "#000000", weight: 3.5 },
          };

          // Obtener estilo según el orden o usar valor por defecto
          const style = colorMap[ordFlow] || { color: "#00BFFF", weight: 2 };

          return {
            color: style.color,
            weight: style.weight,
            fillOpacity: 0,
            opacity: 0.8,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            layer.bindPopup(
              `<strong>Escurrimiento:</strong> ${
                props.NOMBRE || props.NAME || "N/A"
              }<br><strong>Orden:</strong> ${props.ORD_FLOW || "N/A"}`
            );
          }
        },
      });
      // Solo agregar al mapa si está activa en el estado
      if (activeLayers.escurrimientos) {
        newLayers.escurrimientos.addTo(map);
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
    cuencas,
    escurrimientos,
    activeBaseLayer,
    activeLayers.cuencas,
    activeLayers.escurrimientos,
  ]);

  // Notificar cambios en el estado del control para posicionamiento dinámico
  useEffect(() => {
    if (onControlStateChange) {
      const width = isCollapsed ? 90 : 300; // Ancho colapsado vs expandido
      onControlStateChange(isCollapsed, width);
    }
  }, [isCollapsed, onControlStateChange]);

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
        padding: " 2px 10px",
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
            {/* Capa especial de Elevaciones con descarga de raster */}
            <div
              style={{
                marginBottom: "2px",
                padding: " 2px 10px",
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
                  checked={activeLayers.raster || false}
                  onChange={() => toggleLayer("raster")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Pendiente
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "2px",
                }}
              >
                <span
                  style={{ fontSize: "9px", color: "white", minWidth: "55px" }}
                >
                  Opacidad: {Math.round(opacity.raster * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.raster - 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      raster: newOpacity,
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
                  disabled={opacity.raster <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.raster + 0.1);
                    setOpacity((prev) => ({
                      ...prev,
                      raster: newOpacity,
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
                  disabled={opacity.raster >= 1}
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
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    cuencas: false,
    escurrimientos: false,
    raster: true,
  });
  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    cuencas: 1,
    escurrimientos: 1,
    raster: 0.6, // Opacidad del archivo SLD
  });

  // Estado para controlar la posición dinámica de la leyenda
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Función para manejar cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
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
      center={[16.67566, -95.96711]}
      zoom={10}
      scrollWheelZoom={true}
      dragging={false}
      style={{ height: "100vh", width: "100%" }}
    >
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
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
        onControlStateChange={handleControlStateChange}
      />
      <RasterOverlay
        fileName="MDE.tif"
        colorMap={["#fef9ae", "#fd9242", "#ff0094", "#0602f2", "#040058"]}
        baseUrl="/"
        continuous={true}
        setError={() => {}}
        setLoading={() => {}}
        onPixelValue={() => {}}
        overlayOpacity={opacity.raster}
        visible={activeLayers.raster}
      />
      <ColorLegend
        colorMap={colorMap}
        isVisible={
          showLegend && !activeLayers.raster && !activeLayers.escurrimientos
        }
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
      />
      <EscurrimientosLegend
        isVisible={activeLayers.escurrimientos && !activeLayers.raster}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
      />
      <PendienteLegend
        isVisible={activeLayers.raster}
        layerControlCollapsed={layerControlCollapsed}
        layerControlWidth={layerControlWidth}
      />
      <CoordinateControl />
      <ScaleControl />
    </MapContainer>
  );
};

export default MapView;
