import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Colores consistentes para los valores
const VALUE_COLORS = {
  Deforestación: "#FF4444",
  "Permanencia antrópica": "#ecd120ff",
  Revegetación: "#4ff321ff",
  "Permanencia vegetación": "#087908ff",
  // Puedes agregar más valores aquí si aparecen en tus datos
};
const DEFAULT_COLOR = "#CCCCCC";

// Función memoizada para generar el colorMap para la serie actual
const generateSeriesColorPalette = (values) => {
  const colorMap = {};
  [
    ...new Set(
      values.filter((v) => v && v !== "" && v !== null && v !== undefined)
    ),
  ].forEach((value) => {
    colorMap[value] = VALUE_COLORS[value] || DEFAULT_COLOR;
  });
  return colorMap;
};

// Hook para throttling (más agresivo que debounce para sliders)
const useThrottle = (value, delay) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecuted = useRef(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay - (Date.now() - lastExecuted.current));

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
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
const ColorLegend = ({ colorMap, isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

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
            maxHeight: "500px",
            overflowY: "auto",
            border: "1px solid #ddd",
            backgroundColor: "#fafafa",
          }}
        >
          {Object.entries(colorMap).map(([value, color]) => (
            <div
              key={value}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #ccc",
                  flexShrink: 0,
                }}
              ></div>
              <span style={{ fontSize: "11px", lineHeight: "1.2" }}>
                {value}
              </span>
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

    // Añadir al contenedor del mapa
    map.getContainer().appendChild(coordinateDiv);

    // Función para actualizar coordenadas
    const updateCoordinates = (e) => {
      const lat = e.latlng.lat.toFixed(5);
      const lng = e.latlng.lng.toFixed(5);
      coordinateDiv.innerHTML = `Lat: ${lat}, Lon: ${lng}`;
    };

    map.on("mousemove", updateCoordinates);

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

// Control de capas agrupado para series temporales
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  seriesData,
  currentSeriesIndex,
  setCurrentSeriesIndex,
  seriesKeys,
  tooltipsEnabled,
  onColorMapChange,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Topográfico (OSM)");

  // Throttle del índice de serie para mejor rendimiento (más agresivo que debounce)
  const throttledSeriesIndex = useThrottle(currentSeriesIndex, 200);

  // Etiquetas para el slider - memoizadas
  const seriesLabels = useMemo(
    () => [
      "1980-1993",
      "1993-2002",
      "2002-2007",
      "2007-2011",
      "2011-2014",
      "2014-2018",
      "2018-presente",
    ],
    []
  );

  // Capas base - memoizadas para evitar recrearlas
  const baseLayers = useMemo(
    () => ({
      Satelital: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
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
    }),
    []
  );

  // Función para cambiar capa base - memoizada
  const changeBaseLayer = useCallback(
    (newBaseLayerName) => {
      if (layers.baseLayers && layers.baseLayers[activeBaseLayer]) {
        map.removeLayer(layers.baseLayers[activeBaseLayer]);
      }
      if (baseLayers[newBaseLayerName]) {
        baseLayers[newBaseLayerName].addTo(map);
      }
      setActiveBaseLayer(newBaseLayerName);
    },
    [layers.baseLayers, activeBaseLayer, baseLayers, map]
  );

  // Función para manejar opacidad - memoizada
  const handleOpacityChange = useCallback(
    (layerKey, newOpacity) => {
      setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
    },
    [setOpacity]
  );

  // Separar los useEffects para mejor rendimiento
  // useEffect para configurar capas base solo una vez - CORREGIDO
  useEffect(() => {
    if (!map) return;

    // Verificar si las capas base ya están configuradas
    const currentBaseLayers = layers.baseLayers;
    if (currentBaseLayers) return;

    // Configurar capas base solo si no existen
    const newLayers = { ...layers, baseLayers: baseLayers };

    // Agregar la capa base inicial
    if (!activeBaseLayer || !baseLayers[activeBaseLayer]) {
      setActiveBaseLayer("Topográfico (OSM)");
      baseLayers["Topográfico (OSM)"].addTo(map);
    } else {
      baseLayers[activeBaseLayer].addTo(map);
    }

    setLayers(newLayers);
  }, [map, baseLayers, activeBaseLayer]); // Remover 'layers' de las dependencias

  // useEffect para manejar capas vectoriales (límites) - Optimizado para memoria
  useEffect(() => {
    if (!map) return;

    const newLayers = { ...layers };

    // Función para limpiar capas con eliminación agresiva de event listeners
    const cleanupVectorLayers = () => {
      Object.keys(newLayers).forEach((key) => {
        if (key !== "baseLayers" && newLayers[key]) {
          const layer = newLayers[key];
          // Limpiar event listeners de manera agresiva
          if (layer.eachLayer) {
            layer.eachLayer((subLayer) => {
              if (subLayer.off) {
                subLayer.off();
              }
            });
          }
          if (layer.off) {
            layer.off();
          }
          map.removeLayer(layer);
          delete newLayers[key];
        }
      });
    };

    // Limpiar capas vectoriales anteriores
    cleanupVectorLayers();

    // Configuración base para capas optimizada (reducir opciones innecesarias)
    const baseLayerConfig = {
      onEachFeature: null, // Eliminar callbacks innecesarios
      pointToLayer: null, // Eliminar conversión de puntos
      coordsToLatLng: L.GeoJSON.coordsToLatLng, // Usar función por defecto
      style: null, // Se define específicamente para cada capa
    };

    // Agregar área de estudio con configuración optimizada
    if (area && activeLayers.area) {
      newLayers.area = L.geoJSON(area, {
        ...baseLayerConfig,
        style: {
          color: "black",
          weight: 6,
          fillOpacity: 0,
          opacity: opacity.area,
        },
      }).addTo(map);
    }

    // Agregar paisajes con configuración optimizada
    if (paisajes && activeLayers.paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        ...baseLayerConfig,
        style: {
          color: "white",
          weight: 3,
          fillOpacity: 0,
          opacity: opacity.paisajes,
        },
      }).addTo(map);
    }

    // Agregar municipios con configuración optimizada
    if (municipios && activeLayers.municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        ...baseLayerConfig,
        style: {
          color: "black",
          weight: 1,
          fillOpacity: 0,
          opacity: opacity.municipios,
        },
      }).addTo(map);
    }

    setLayers(newLayers);

    // Zoom inicial basado en el área (solo una vez y limpiar inmediatamente)
    if (area && area.features && area.features.length > 0 && !layers.area) {
      const areaLayer = L.geoJSON(area, baseLayerConfig);
      map.fitBounds(areaLayer.getBounds());
      // Limpiar inmediatamente la capa temporal
      areaLayer.remove();
    }

    // Cleanup function para liberar memoria al desmontar
    return () => {
      cleanupVectorLayers();
      // Sugerir garbage collection si está disponible
      if (window.gc) {
        setTimeout(() => window.gc(), 100);
      }
    };
  }, [
    map,
    area,
    paisajes,
    municipios,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
    opacity.area,
    opacity.paisajes,
    opacity.municipios,
    layers,
  ]);

  // useEffect separado para datos de series temporales - OPTIMIZADO PARA MEMORIA
  useEffect(() => {
    if (
      !map ||
      !seriesData ||
      !activeLayers.cambios ||
      !seriesKeys[throttledSeriesIndex]
    )
      return;

    const currentSeries = seriesKeys[throttledSeriesIndex];

    // Limpiar capa anterior de manera agresiva
    if (layers.cambios) {
      const oldLayer = layers.cambios;
      // Limpiar todos los event listeners
      if (oldLayer.eachLayer) {
        oldLayer.eachLayer((layer) => {
          if (layer.off) layer.off();
          if (layer.closeTooltip) layer.closeTooltip();
          if (layer.unbindTooltip) layer.unbindTooltip();
        });
      }
      if (oldLayer.off) oldLayer.off();
      map.removeLayer(oldLayer);
    }

    // Optimización: Pre-filtrar features para evitar procesamiento innecesario
    const validFeatures = seriesData.features.filter((feature) => {
      const value = feature.properties[currentSeries];
      return value && value !== "" && value !== null && value !== undefined;
    });

    if (validFeatures.length === 0) {
      setLayers((prev) => ({ ...prev, cambios: null }));
      return;
    }

    // Optimización: Crear un GeoJSON con solo las features válidas
    const optimizedGeoJSON = {
      type: "FeatureCollection",
      features: validFeatures,
    };

    const values = validFeatures.map((f) => f.properties[currentSeries]);
    const colorMap = generateSeriesColorPalette(values);

    if (onColorMapChange) {
      onColorMapChange(colorMap);
    }

    // Configuración optimizada para la capa
    const layerConfig = {
      style: (feature) => ({
        fillColor: colorMap[feature.properties[currentSeries]] || DEFAULT_COLOR,
        weight: 0,
        opacity: 0,
        color: "transparent",
        fillOpacity: opacity.cambios,
      }),
      // Optimización: Solo agregar tooltips si están habilitados
      onEachFeature: tooltipsEnabled
        ? (feature, layer) => {
            const props = feature.properties;
            layer.bindTooltip(
              `<strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
           <strong>Valor:</strong> ${props[currentSeries] || "N/A"}<br>
           <strong>Serie:</strong> ${
             seriesLabels[throttledSeriesIndex] || "N/A"
           }`,
              {
                permanent: false,
                direction: "auto",
                className: "temporal-tooltip", // Para identificar en limpieza
              }
            );
          }
        : null,
      // Optimizaciones de rendimiento
      coordsToLatLng: L.GeoJSON.coordsToLatLng,
      pointToLayer: null,
    };

    const cambiosLayer = L.geoJSON(optimizedGeoJSON, layerConfig).addTo(map);

    setLayers((prev) => ({ ...prev, cambios: cambiosLayer }));

    // Cleanup function para esta capa específica
    return () => {
      if (cambiosLayer && map.hasLayer(cambiosLayer)) {
        if (cambiosLayer.eachLayer) {
          cambiosLayer.eachLayer((layer) => {
            if (layer.off) layer.off();
            if (layer.closeTooltip) layer.closeTooltip();
            if (layer.unbindTooltip) layer.unbindTooltip();
          });
        }
        if (cambiosLayer.off) cambiosLayer.off();
        map.removeLayer(cambiosLayer);
      }
    };
  }, [
    map,
    seriesData,
    throttledSeriesIndex, // Usar el valor throttled
    activeLayers.cambios,
    seriesKeys,
    opacity.cambios,
    tooltipsEnabled,
    onColorMapChange,
    seriesLabels,
    layers.cambios,
  ]);

  // Función optimizada para toggle de capas
  const toggleLayer = useCallback(
    (layerKey) => {
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
    },
    [activeLayers, layers, map, setActiveLayers]
  );

  // Estilos memoizados
  const controlStyle = useMemo(
    () => ({
      position: "absolute",
      top: "10px",
      right: "10px",
      backgroundColor: "white",
      border: "2px solid rgba(0,0,0,0.2)",
      borderRadius: "0px",
      boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
      zIndex: 1000,
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      maxWidth: "300px",
    }),
    []
  );

  const headerStyle = useMemo(
    () => ({
      padding: "10px 15px",
      fontWeight: "bold",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: isCollapsed ? "none" : "1px solid #eee",
    }),
    [isCollapsed]
  );

  // LayerItem optimizado y memoizado
  const LayerItem = React.memo(
    ({ layerKey, title, data, showDownload = true, showOpacity = true }) => {
      const handleDownload = useCallback(() => {
        if (data) {
          downloadGeoJSON(data, title.toLowerCase().replace(/\s+/g, "_"));
        }
      }, [data, title]);

      const handleOpacityRangeChange = useCallback(
        (e) => {
          handleOpacityChange(layerKey, parseFloat(e.target.value));
        },
        [layerKey, handleOpacityChange]
      );

      const handleMouseEvents = useCallback(
        (e, shouldDisable) => {
          e.stopPropagation();
          if (shouldDisable) {
            map.dragging.disable();
          } else {
            map.dragging.enable();
          }
        },
        [map]
      );

      return (
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
                onClick={handleDownload}
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
          {showOpacity && (
            <>
              <div
                style={{ fontSize: "10px", color: "#666", marginBottom: "5px" }}
              >
                Opacidad: {Math.round(opacity[layerKey] * 100)}%
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity[layerKey]}
                onChange={handleOpacityRangeChange}
                onMouseDown={(e) => handleMouseEvents(e, true)}
                onMouseUp={(e) => handleMouseEvents(e, false)}
                onMouseLeave={() => map.dragging.enable()}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => handleMouseEvents(e, true)}
                onTouchEnd={(e) => handleMouseEvents(e, false)}
                style={{ width: "100%" }}
              />
            </>
          )}
        </div>
      );
    }
  );

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Capas</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
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
                color: "#2c3e50",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Capas Base
            </strong>
            <div style={{ marginLeft: "10px" }}>
              {layers.baseLayers
                ? Object.keys(layers.baseLayers).map((baseLayerName) => (
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
                  ))
                : // Mostrar opciones alternativas si baseLayers no está configurado
                  Object.keys(baseLayers).map((baseLayerName) => (
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
              Zona de Estudio
            </strong>
            <div style={{ marginLeft: "10px" }}>
              <LayerItem
                layerKey="area"
                title="Área de estudio"
                data={area}
                showOpacity={true}
              />
              <LayerItem
                layerKey="paisajes"
                title="Paisajes"
                data={paisajes}
                showOpacity={true}
              />
              <LayerItem
                layerKey="municipios"
                title="Municipios"
                data={municipios}
                showOpacity={true}
              />
            </div>
          </div>

          {/* Series Temporales */}
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
              Datos Temporales
            </strong>

            {/* Slider de Series */}
            <div style={{ marginBottom: "15px", marginLeft: "10px" }}>
              <div
                style={{
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Serie Temporal: {seriesLabels[currentSeriesIndex]}
              </div>
              <input
                type="range"
                min={0}
                max={seriesKeys.length - 1}
                value={currentSeriesIndex}
                onChange={(e) => setCurrentSeriesIndex(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "9px",
                  marginTop: "2px",
                  color: "#666",
                }}
              >
                <span>1980</span>
                <span>2018</span>
              </div>
            </div>

            <div style={{ marginLeft: "10px" }}>
              <LayerItem
                layerKey="cambios"
                title="Cambios de cobertura"
                data={seriesData}
                showOpacity={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal optimizado
const TimeSeriesMapViewer = React.memo(() => {
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [seriesData, setSeriesData] = useState(null);
  const [currentSeriesIndex, setCurrentSeriesIndex] = useState(0);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState({});
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    cambios: true,
  });
  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    cambios: 0.7,
  });

  // Series temporales
  const seriesKeys = [
    "S0_S1",
    "S1_S2",
    "S2_S3",
    "S3_S4",
    "S4_S5",
    "S5_S6",
    "S6_S7",
  ];

  // Cargar datos una sola vez
  useEffect(() => {
    const loadData = async () => {
      try {
        const responses = await Promise.all([
          fetch("/CUS_cambios.geojson"),
          fetch("/AREA.geojson"),
          fetch("/PAISAJES.geojson"),
          fetch("/MUNICIPIOS.geojson"),
        ]);

        const [cusData, areaData, paisajesData, municipiosData] =
          await Promise.all(responses.map((res) => res.json()));

        setSeriesData(cusData);
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

  // useEffect de limpieza agresiva de memoria al desmontar el componente
  useEffect(() => {
    return () => {
      // Función de limpieza ejecutada al desmontar
      if (typeof window !== "undefined") {
        try {
          // Limpiar timeouts y intervals activos
          const highestTimeoutId = setTimeout(() => {}, 0);
          for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
            clearInterval(i);
          }

          // Cerrar todos los tooltips activos de Leaflet
          const tooltips = document.querySelectorAll(
            ".leaflet-tooltip, .temporal-tooltip, .leaflet-popup"
          );
          tooltips.forEach((tooltip) => {
            try {
              if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
            } catch (e) {
              // Ignorar errores de DOM
            }
          });

          // Limpiar event listeners del DOM si existen
          const mapContainers = document.querySelectorAll(".leaflet-container");
          mapContainers.forEach((container) => {
            try {
              // Remover event listeners comunes de Leaflet
              [
                "mousedown",
                "mouseup",
                "click",
                "touchstart",
                "touchend",
              ].forEach((event) => {
                container.removeEventListener(event, () => {}, true);
              });
            } catch (e) {
              // Ignorar errores
            }
          });

          // Forzar garbage collection en desarrollo si está disponible
          if (window.gc && process.env.NODE_ENV === "development") {
            setTimeout(() => {
              try {
                window.gc();
              } catch (e) {
                // Ignorar si no está disponible
              }
            }, 1000);
          }

          // Limpiar caché de clases CSS de Leaflet
          if (
            window.L &&
            window.L.DomUtil &&
            window.L.DomUtil._classListCache
          ) {
            try {
              window.L.DomUtil._classListCache = {};
            } catch (e) {
              // Ignorar errores
            }
          }
        } catch (error) {
          console.warn("Error durante la limpieza de memoria:", error);
        }
      }
    };
  }, []); // Solo se ejecuta una vez

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
        Cargando datos...
      </div>
    );
  }

  return (
    <MapContainer
      center={[16.67566, -96.28311]}
      zoom={10}
      scrollWheelZoom={true}
      dragging={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <GroupedLayerControl
        area={area}
        paisajes={paisajes}
        municipios={municipios}
        seriesData={seriesData}
        currentSeriesIndex={currentSeriesIndex}
        setCurrentSeriesIndex={setCurrentSeriesIndex}
        seriesKeys={seriesKeys}
        tooltipsEnabled={tooltipsEnabled}
        onColorMapChange={setColorMap}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
      />
      <CoordinateControl />
      <ScaleControl />
      <ColorLegend
        colorMap={colorMap}
        isVisible={Object.keys(colorMap).length > 0}
      />
    </MapContainer>
  );
});

export default TimeSeriesMapViewer;
