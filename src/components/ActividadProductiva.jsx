import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Función para generar estilos basados en los archivos SLD para las 5 capas de productividad
const generateProductivityStyles = (data, layerType) => {
  const layerConfigs = {
    agave: {
      field: "Agave",
      title: "Superficie Agave (ha)",
      ranges: [
        { min: 0, max: 50, color: "#def5e5", label: "0 - 50" },
        { min: 50, max: 100, color: "#4bc2ad", label: "50 - 100" },
        { min: 100, max: 200, color: "#357ba3", label: "100 - 200" },
        { min: 200, max: 500, color: "#3e356b", label: "200 - 500" },
        { min: 500, max: 1772, color: "#0b0405", label: "500 - 1772" },
      ],
    },
    maiz: {
      field: "Maiz",
      title: "Superficie Maíz (ha)",
      ranges: [
        { min: 150, max: 250, color: "#d2de49", label: "150 - 250" },
        { min: 250, max: 500, color: "#b2b844", label: "250 - 500" },
        { min: 500, max: 1000, color: "#92923e", label: "500 - 1000" },
        { min: 1000, max: 1500, color: "#726d38", label: "1000 - 1500" },
        { min: 1500, max: 7212, color: "#534733", label: "1500 - 7212" },
      ],
    },
    riego: {
      field: "Riego",
      title: "Superficie Riego (ha)",
      ranges: [
        { min: 0, max: 20, color: "#f7fbff", label: "0 - 20" },
        { min: 20, max: 40, color: "#c8dcf0", label: "20 - 40" },
        { min: 40, max: 80, color: "#73b2d8", label: "40 - 80" },
        { min: 80, max: 160, color: "#2979b9", label: "80 - 160" },
        { min: 160, max: 700, color: "#08306b", label: "160 - 700" },
      ],
    },
    temporal: {
      field: "Temporal",
      title: "Superficie Temporal (ha)",
      ranges: [
        { min: 100, max: 500, color: "#f7fcf5", label: "100 - 500" },
        { min: 500, max: 750, color: "#c9eac2", label: "500 - 750" },
        { min: 750, max: 1000, color: "#7bc77c", label: "750 - 1000" },
        { min: 1000, max: 2000, color: "#2a924b", label: "1000 - 2000" },
        { min: 2000, max: 10000, color: "#00441b", label: "2000 - 10000" },
      ],
    },
    sembrada: {
      field: "Sup_Semb",
      title: "Superficie Sembrada Total (ha)",
      ranges: [
        { min: 260, max: 500, color: "#ffea46", label: "260 - 500" },
        { min: 500, max: 750, color: "#beaf6f", label: "500 - 750" },
        { min: 750, max: 1000, color: "#7d7c78", label: "750 - 1000" },
        { min: 1000, max: 2000, color: "#414d6b", label: "1000 - 2000" },
        { min: 2000, max: 10000, color: "#00204d", label: "2000 - 10000" },
      ],
    },
  };

  const config = layerConfigs[layerType] || layerConfigs.agave;

  // Generar mapa de colores para la leyenda
  const colorMap = generateLegendColorMap(config.ranges);

  // Función de estilo para las features
  const styleFunction = (feature) => {
    const value = feature.properties[config.field];
    const color = getColorFromRanges(value, config.ranges);

    return {
      fillColor: color,
      weight: 0.5,
      opacity: 1,
      color: "white",
      fillOpacity: 0.8,
    };
  };

  return {
    colorMap,
    styleFunction,
    config,
  };
};

// Función para obtener el color basado en el valor y los rangos del SLD
const getColorFromRanges = (value, ranges) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "#CCCCCC"; // Color por defecto para valores nulos
  }

  for (const range of ranges) {
    if (value >= range.min && value <= range.max) {
      return range.color;
    }
  }
  return "#CCCCCC"; // Color por defecto si no encuentra rango
};

// Función para generar mapa de colores para leyenda basado en rangos
const generateLegendColorMap = (ranges) => {
  const colorMap = {};
  ranges.forEach((range) => {
    colorMap[range.label] = range.color;
  });
  return colorMap;
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

// Componente de simbología retráctil en esquina superior derecha (memoizado)
const ColorLegend = React.memo(
  ({
    colorMap,
    isVisible,
    currentLayer,
    layerControlCollapsed,
    layerControlWidth,
  }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
      return null;
    }

    const layerTitles = {
      agave: "Superficie Agave (ha)",
      maiz: "Superficie Maíz (ha)",
      riego: "Superficie Riego (ha)",
      temporal: "Superficie Temporal (ha)",
      sembrada: "Superficie Sembrada Total (ha)",
    };

    // Calcular posición dinámica basada en el estado del control de capas
    const rightPosition = layerControlCollapsed
      ? "105px" // Posición normal cuando está colapsado
      : "310px"; // Se mueve para evitar superposición

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

    // Ordenar valores por rango (extraer el número inicial del label)
    const sortedEntries = Object.entries(colorMap).sort(([a], [b]) => {
      const getFirstNumber = (str) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      return getFirstNumber(a) - getFirstNumber(b);
    });

    return (
      <div style={legendStyle}>
        <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
          <span>Simbología</span>
          <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
        </div>

        {!isCollapsed && (
          <div
            style={{ padding: "10px", maxHeight: "300px", overflowY: "auto" }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "12px",
              }}
            >
              {layerTitles[currentLayer] || currentLayer}
            </div>
            {sortedEntries.map(([range, color]) => (
              <div
                key={range}
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
                    backgroundColor: color,
                    marginRight: "8px",
                    border: "1px solid #999",
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ lineHeight: "1.2" }}>{range}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

// Control de dragging (igual que en Localizacion.jsx)
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

// Control de coordenadas en la esquina inferior izquierda
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
    coordinateDiv.style.fontFamily = "Inter, sans-serif";
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

// Control de escala
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

// Control de capas agrupadas siguiendo el formato exacto de Localización
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  productividadData,
  onColorMapChange,
  onLegendVisibilityChange,
  onControlStateChange,
  onZoomToData,
  onDownloadData,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    agave: false,
    maiz: false,
    riego: false,
    temporal: false,
    sembrada: false,
  });
  const [activeBaseLayer, setActiveBaseLayer] = useState("Topográfico (OSM)");
  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    agave: 0.7,
    maiz: 0.7,
    riego: 0.7,
    temporal: 0.7,
    sembrada: 0.7,
  });

  // Refs para evitar recrear capas constantemente
  const layersRef = useRef({});
  const baseLayersRef = useRef(null);
  const lastActiveBaseLayerRef = useRef(activeBaseLayer);

  // Efecto para notificar cambios del estado del control
  useEffect(() => {
    if (onControlStateChange) {
      const width = isCollapsed ? 80 : 300; // Ancho aproximado cuando collapsed vs expanded
      onControlStateChange({
        isCollapsed,
        width,
      });
    }
  }, [isCollapsed, onControlStateChange]);

  useEffect(() => {
    if (!map) return;

    // Capas base - crear si no existen
    if (!baseLayersRef.current) {
      baseLayersRef.current = {
        "Topográfico (OSM)": L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }
        ),
        "Satélite (ESRI)": L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          }
        ),
      };
    }

    // Agregar capa base activa
    const activeBaseLayerObj = baseLayersRef.current[activeBaseLayer];
    if (activeBaseLayerObj && !map.hasLayer(activeBaseLayerObj)) {
      activeBaseLayerObj.addTo(map);
    }

    // Zona de Estudio - crear cuando los datos estén disponibles
    if (area && !layersRef.current.area) {
      layersRef.current.area = L.geoJSON(area, {
        style: { color: "black", weight: 6, fillOpacity: 0 },
      });
    }
    // Agregar al mapa si está activa
    if (
      layersRef.current.area &&
      activeLayers.area &&
      !map.hasLayer(layersRef.current.area)
    ) {
      layersRef.current.area.addTo(map);
    }

    if (paisajes && !layersRef.current.paisajes) {
      layersRef.current.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 4, fillOpacity: 0 },
      });
    }
    // Agregar al mapa si está activa
    if (
      layersRef.current.paisajes &&
      activeLayers.paisajes &&
      !map.hasLayer(layersRef.current.paisajes)
    ) {
      layersRef.current.paisajes.addTo(map);
    }

    if (municipios && !layersRef.current.municipios) {
      layersRef.current.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 2, fillOpacity: 0 },
      });
    }
    // Agregar al mapa si está activa
    if (
      layersRef.current.municipios &&
      activeLayers.municipios &&
      !map.hasLayer(layersRef.current.municipios)
    ) {
      layersRef.current.municipios.addTo(map);
    }

    // Capas de Productividad - crear cuando los datos estén disponibles
    if (productividadData) {
      const productivityLayers = [
        "agave",
        "maiz",
        "riego",
        "temporal",
        "sembrada",
      ];

      productivityLayers.forEach((layerType) => {
        if (!layersRef.current[layerType]) {
          const styles = generateProductivityStyles(
            productividadData,
            layerType
          );

          layersRef.current[layerType] = L.geoJSON(productividadData, {
            style: (feature) => {
              return styles.styleFunction(feature);
            },
            onEachFeature: (feature, layer) => {
              if (feature.properties) {
                const props = feature.properties;
                const config = styles.config;

                layer.bindPopup(`
                  <strong>Municipio:</strong> ${
                    props.NOMGEO || props.NOM_MUN || "N/A"
                  }<br>
                  <strong>${config.title}:</strong> ${
                  props[config.field] || "N/A"
                } ha
                `);
              }
            },
          });
        }

        // Agregar al mapa si está activa
        if (
          layersRef.current[layerType] &&
          activeLayers[layerType] &&
          !map.hasLayer(layersRef.current[layerType])
        ) {
          layersRef.current[layerType].addTo(map);
        }
      });

      // Actualizar colorMap solo si hay cambios en las capas activas
      const activeProductivityLayer = productivityLayers.find(
        (layer) => activeLayers[layer]
      );
      if (activeProductivityLayer && onColorMapChange) {
        const styles = generateProductivityStyles(
          productividadData,
          activeProductivityLayer
        );
        onColorMapChange(styles.colorMap, activeProductivityLayer);
      }
    }

    // Solo ejecutar limpieza cuando el componente se desmonte
    return () => {
      // Limpiar todas las capas al desmontar
      Object.values(layersRef.current).forEach((layer) => {
        if (layer && layer._leaflet_id && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      // Limpiar capas base
      if (baseLayersRef.current) {
        Object.values(baseLayersRef.current).forEach((layer) => {
          if (layer && layer._leaflet_id && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        });
      }
    };
  }, [
    map,
    area,
    paisajes,
    municipios,
    productividadData,
    activeLayers,
    activeBaseLayer,
    onColorMapChange,
  ]); // Agregar dependencias necesarias

  // useEffect separado para cambios de capa base
  useEffect(() => {
    if (!map || !baseLayersRef.current) return;

    // Remover capa base anterior
    if (lastActiveBaseLayerRef.current !== activeBaseLayer) {
      const oldLayer = baseLayersRef.current[lastActiveBaseLayerRef.current];
      if (oldLayer && map.hasLayer(oldLayer)) {
        map.removeLayer(oldLayer);
      }
    }

    // Agregar nueva capa base
    const newLayer = baseLayersRef.current[activeBaseLayer];
    if (newLayer && !map.hasLayer(newLayer)) {
      newLayer.addTo(map);
    }

    lastActiveBaseLayerRef.current = activeBaseLayer;
  }, [map, activeBaseLayer]);

  const toggleLayer = useCallback(
    (layerKey) => {
      const layer = layersRef.current[layerKey];
      if (!layer) return;

      setActiveLayers((prev) => {
        const newActiveLayers = { ...prev };
        newActiveLayers[layerKey] = !prev[layerKey];

        // Aplicar cambio inmediatamente en el mapa
        if (newActiveLayers[layerKey]) {
          if (!map.hasLayer(layer)) {
            layer.addTo(map);
          }
        } else {
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        }

        // Actualizar simbología para capas de productividad
        const productivityLayers = [
          "agave",
          "maiz",
          "riego",
          "temporal",
          "sembrada",
        ];
        if (productivityLayers.includes(layerKey)) {
          const activeProductivityLayer = productivityLayers.find(
            (layer) => newActiveLayers[layer]
          );

          if (
            activeProductivityLayer &&
            productividadData &&
            onColorMapChange
          ) {
            const styles = generateProductivityStyles(
              productividadData,
              activeProductivityLayer
            );
            onColorMapChange(styles.colorMap, activeProductivityLayer);
          } else if (!activeProductivityLayer && onColorMapChange) {
            onColorMapChange({}, null);
          }

          // Controlar visibilidad de la simbología
          if (onLegendVisibilityChange) {
            const hasActiveProductivityLayer = productivityLayers.some(
              (layer) => newActiveLayers[layer]
            );
            onLegendVisibilityChange(
              hasActiveProductivityLayer,
              activeProductivityLayer
            );
          }
        }

        return newActiveLayers;
      });
    },
    [map, productividadData, onColorMapChange, onLegendVisibilityChange]
  );

  const changeBaseLayer = useCallback((newBaseLayer) => {
    setActiveBaseLayer(newBaseLayer);
  }, []);

  const handleOpacityChange = useCallback(
    (layerKey, newOpacity) => {
      setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
      const layer = layersRef.current[layerKey];
      if (layer && map.hasLayer(layer)) {
        if (
          ["agave", "maiz", "riego", "temporal", "sembrada"].includes(layerKey)
        ) {
          // Para capas de productividad
          layer.setStyle({
            fillOpacity: newOpacity * 0.8,
            opacity: newOpacity,
          });
        } else {
          // Para otras capas
          layer.setStyle({
            fillOpacity: newOpacity * 0.7,
            opacity: newOpacity,
          });
        }
      }
    },
    [map]
  );

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
              borderRadius: "3px",
              cursor: "pointer",
              marginLeft: "4px",
              width: "32px",
              height: "24px",
            }}
            title={`Descargar ${title}`}
            onClick={() => downloadGeoJSON(data, title)}
          >
            <svg
              width="20"
              height="20"
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
                fontWeight: "600",
              }}
            >
              Capas Base
            </strong>
            <div style={{ marginLeft: "10px" }}>
              {baseLayersRef.current &&
                Object.keys(baseLayersRef.current).map((baseLayerName) => (
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
                fontWeight: "600",
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

          {/* Actividad Productiva */}
          <div>
            <strong
              style={{
                color: "white",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Actividad Productiva
            </strong>

            {productividadData && (
              <>
                <LayerItem
                  layerKey="agave"
                  title="Superficie Agave (ha)"
                  data={productividadData}
                  showOpacity={true}
                />
                <LayerItem
                  layerKey="maiz"
                  title="Superficie Maíz (ha)"
                  data={productividadData}
                  showOpacity={true}
                />
                <LayerItem
                  layerKey="riego"
                  title="Superficie Riego (ha)"
                  data={productividadData}
                  showOpacity={true}
                />
                <LayerItem
                  layerKey="temporal"
                  title="Superficie Temporal (ha)"
                  data={productividadData}
                  showOpacity={true}
                />
                <LayerItem
                  layerKey="sembrada"
                  title="Superficie Sembrada Total (ha)"
                  data={productividadData}
                  showOpacity={true}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const ActividadProductiva = () => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [productividadData, setProductividadData] = useState(null);

  // Estados para control de simbología
  const [colorMap, setColorMap] = useState({});
  const [isLegendVisible, setIsLegendVisible] = useState(true);
  const [layerControlState, setLayerControlState] = useState({
    isCollapsed: true,
    width: 80,
  });
  const [currentLegendLayer, setCurrentLegendLayer] = useState(null);

  // Ref para evitar cargas repetitivas de datos
  const dataLoadedRef = useRef({
    area: false,
    paisajes: false,
    municipios: false,
    productividad: false,
  });

  // Cargar datos optimizado - una sola vez
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar AREA solo una vez
        if (!dataLoadedRef.current.area) {
          const areaResponse = await fetch("/AREA.geojson");
          const areaData = await areaResponse.json();
          setArea(areaData);
          dataLoadedRef.current.area = true;
        }

        // Cargar PAISAJES solo una vez
        if (!dataLoadedRef.current.paisajes) {
          const paisajesResponse = await fetch("/PAISAJES.geojson");
          const paisajesData = await paisajesResponse.json();
          setPaisajes(paisajesData);
          dataLoadedRef.current.paisajes = true;
        }

        // Cargar MUNICIPIOS solo una vez
        if (!dataLoadedRef.current.municipios) {
          const municipiosResponse = await fetch("/MUNICIPIOS.geojson");
          const municipiosData = await municipiosResponse.json();
          setMunicipios(municipiosData);
          dataLoadedRef.current.municipios = true;
        }

        // Cargar PRODUCTIVIDAD solo una vez
        if (!dataLoadedRef.current.productividad) {
          const productividadResponse = await fetch("/Productividad.geojson");
          const productividadDataResponse = await productividadResponse.json();
          setProductividadData(productividadDataResponse);
          dataLoadedRef.current.productividad = true;
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    loadData();
  }, []); // Solo ejecutar una vez

  const handleColorMapChange = useCallback((newColorMap, layerType = null) => {
    setColorMap(newColorMap);
    if (layerType) {
      setCurrentLegendLayer(layerType);
    }
  }, []);

  const handleLegendVisibilityChange = useCallback(
    (isVisible, layerType = null) => {
      setIsLegendVisible(isVisible);
      if (layerType) {
        setCurrentLegendLayer(layerType);
      }
    },
    []
  );

  const handleZoomToData = useCallback(() => {
    if (productividadData) {
      // Implementar zoom a datos si es necesario
      console.log("Zoom a datos de productividad");
    }
  }, [productividadData]);

  const handleDownloadData = useCallback(() => {
    if (productividadData) {
      downloadGeoJSON(productividadData, "productividad_agricola");
    }
  }, [productividadData]);

  return (
    <MapContainer
      center={[16.67566, -95.96711]}
      zoom={10}
      scrollWheelZoom={true}
      dragging={false}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <DraggingControl />
      <GroupedLayerControl
        area={area}
        paisajes={paisajes}
        municipios={municipios}
        productividadData={productividadData}
        onColorMapChange={handleColorMapChange}
        onLegendVisibilityChange={handleLegendVisibilityChange}
        onControlStateChange={setLayerControlState}
        onZoomToData={handleZoomToData}
        onDownloadData={handleDownloadData}
      />
      <ColorLegend
        colorMap={colorMap}
        isVisible={isLegendVisible}
        currentLayer={currentLegendLayer}
        layerControlCollapsed={layerControlState.isCollapsed}
        layerControlWidth={layerControlState.width}
      />
      <CoordinateControl />
      <ScaleControl />
    </MapContainer>
  );
};

export default ActividadProductiva;
