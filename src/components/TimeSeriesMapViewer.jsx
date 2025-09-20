import React, { useEffect, useState, useMemo, useCallback } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Constants for the 14 CUS classifications (matching the provided color guide)
const CUS_CLASSIFICATIONS = {
  "A-A-A-A-A-A-A": "#8B5A3C", // Dark brown
  "A-A-A-A-A-A": "#A0654E", // Medium-dark brown
  "A-A-A-A-A": "#B57160", // Medium brown
  "A-A-A-A": "#F28B82", // Light coral/salmon
  "A-A-A": "#FFB3BA", // Light pink
  "A-A": "#FFCCCB", // Very light pink
  A: "#F5E6E8", // Very pale pink
  V: "#E8F5E8", // Very pale green
  "V-V": "#D4F1D4", // Light pale green
  "V-V-V": "#B8E6B8", // Light green
  "V-V-V-V": "#E6D73A", // Yellow-green
  "V-V-V-V-V": "#7CB342", // Medium green
  "V-V-V-V-V-V": "#558B2F", // Dark green
  "V-V-V-V-V-V-V": "#33691E", // Very dark green
};

// Utility function to get consecutive classification
// Improved consecutive classification function
const getConsecutiveClassification = (cusValue) => {
  if (!cusValue || typeof cusValue !== "string") {
    console.warn("Valor CUS inválido:", cusValue);
    return "A"; // valor por defecto
  }
  
  // Convert to uppercase and clean
  const cleanValue = cusValue.toString().toUpperCase().trim();
  
  if (cleanValue.length === 0) {
    console.warn("Valor CUS vacío después de limpiar:", cusValue);
    return "A";
  }

  const firstChar = cleanValue.charAt(0);
  if (firstChar !== "A" && firstChar !== "V") {
    console.warn("Valor CUS no empieza con A o V:", cusValue, "primer caracter:", firstChar);
    return "A"; // valor por defecto
  }

  let consecutiveCount = 1;
  for (let i = 1; i < cleanValue.length; i++) {
    if (cleanValue.charAt(i) === firstChar) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  // Limitar a máximo 7 caracteres consecutivos
  consecutiveCount = Math.min(consecutiveCount, 7);
  consecutiveCount = Math.max(consecutiveCount, 1);

  const result = Array(consecutiveCount).fill(firstChar).join("-");
  console.log("CUS:", cusValue, "→ clasificación:", result);
  return result;
};

// Get color for CUS value
const getColorForCUSValue = (cusValue) => {
  if (!cusValue) {
    console.warn("Valor CUS vacío o undefined:", cusValue);
    return "#CCCCCC";
  }
  
  const classification = getConsecutiveClassification(cusValue);
  const color = CUS_CLASSIFICATIONS[classification];
  
  if (!color) {
    console.warn("Sin color para CUS:", cusValue, "clasificación:", classification);
    return "#CCCCCC";
  }
  
  return color;
};

// Optimized Color Legend Component
const ColorLegend = React.memo(({ colorMap, isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Order of classifications as shown in the image (A classes first, then V classes)
  const orderedClassifications = [
    "A-A-A-A-A-A-A",
    "A-A-A-A-A-A",
    "A-A-A-A-A",
    "A-A-A-A",
    "A-A-A",
    "A-A",
    "A",
    "V",
    "V-V",
    "V-V-V",
    "V-V-V-V",
    "V-V-V-V-V",
    "V-V-V-V-V-V",
    "V-V-V-V-V-V-V",
  ];

  if (!isVisible) {
    return null;
  }

  // Create ordered color map based on predefined order
  const orderedColorMap = orderedClassifications.reduce(
    (acc, classification) => {
      if (CUS_CLASSIFICATIONS[classification]) {
        acc[classification] = CUS_CLASSIFICATIONS[classification];
      }
      return acc;
    },
    {}
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: "60px",
        right: "10px",
        backgroundColor: "white",
        borderRadius: "0px",
        boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
        zIndex: 1000,
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        maxWidth: "200px",
      }}
    >
      {/* Header del control */}
      <div
        style={{
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
        <span>Leyenda CUS</span>
        <span>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "10px 15px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {Object.entries(orderedColorMap).map(([value, color]) => (
            <div
              key={value}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "12px",
                  backgroundColor: color,
                  border: "1px solid #ccc",
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "11px", color: "#333" }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Optimized Layer Management Component
const LayerManager = React.memo(
  ({
    area,
    paisajes,
    municipios,
    cusData,
    activeLayers,
    layerOpacity,
    onColorMapChange,
  }) => {
    const map = useMap();
    const [layers, setLayers] = useState({});

    // Generate CUS color palette (only 14 classifications)
    const cusColorMap = useMemo(() => {
      if (!cusData?.features) return {};

      const foundClassifications = new Set();

      cusData.features.forEach((feature) => {
        const cusValue = feature.properties?.CUS;
        if (cusValue) {
          const classification = getConsecutiveClassification(cusValue);
          foundClassifications.add(classification);
        }
      });

      const result = {};
      foundClassifications.forEach((classification) => {
        if (CUS_CLASSIFICATIONS[classification]) {
          result[classification] = CUS_CLASSIFICATIONS[classification];
        }
      });

      console.log("Clasificaciones únicas encontradas:", Object.keys(result));
      console.log("Total de clases en leyenda:", Object.keys(result).length);

      return result;
    }, [cusData]);

    // Update color map for legend
    useEffect(() => {
      if (onColorMapChange) {
        onColorMapChange(cusColorMap);
      }
    }, [cusColorMap, onColorMapChange]);

    // Base layers configuration
    const baseLayers = useMemo(
      () => ({
        "Topográfico (OSM)": L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "© OpenStreetMap contributors" }
        ),
        "Satélite (Esri)": L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "© Esri" }
        ),
      }),
      []
    );

    // Layer creation functions
    const createGeoJSONLayer = useCallback((data, layerName, style = {}) => {
      if (!data) return null;

      const defaultStyle = {
        fillColor: "#3388ff",
        weight: 2,
        opacity: 1,
        color: "white",
        fillOpacity: 0.7,
        ...style,
      };

      return L.geoJSON(data, {
        style: () => defaultStyle,
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const popup = Object.entries(feature.properties)
              .map(([key, value]) => `<b>${key}:</b> ${value}`)
              .join("<br>");
            layer.bindPopup(popup);
          }
        },
      });
    }, []);

    const createCUSLayer = useCallback(() => {
      if (!cusData) return null;

      return L.geoJSON(cusData, {
        style: (feature) => {
          const cusValue = feature.properties?.CUS;
          const color = getColorForCUSValue(cusValue);

          return {
            fillColor: color,
            weight: 1,
            opacity: 1,
            color: "#333333",
            fillOpacity: Math.max(layerOpacity.cus, 0.6),
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties?.CUS) {
            const classification = getConsecutiveClassification(
              feature.properties.CUS
            );
            layer.bindPopup(`
            <b>CUS:</b> ${feature.properties.CUS}<br>
            <b>Clasificación:</b> ${classification}
          `);
          }
        },
      });
    }, [cusData, layerOpacity.cus]);

    // Update layers when data or settings change
    useEffect(() => {
      if (!map) return;

      const newLayers = { ...layers };

      // Remove existing layers
      Object.values(newLayers).forEach((layer) => {
        if (layer && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      // Add base layer
      const baseLayer = baseLayers["Topográfico (OSM)"];
      if (!map.hasLayer(baseLayer)) {
        map.addLayer(baseLayer);
      }

      // Create and add layers based on active state
      if (activeLayers.area && area) {
        newLayers.area = createGeoJSONLayer(area, "area", {
          fillColor: "transparent",
          color: "#ff0000",
          weight: 2,
          opacity: layerOpacity.area,
          fillOpacity: 0,
        });
        map.addLayer(newLayers.area);
      }

      if (activeLayers.paisajes && paisajes) {
        newLayers.paisajes = createGeoJSONLayer(paisajes, "paisajes", {
          fillColor: "transparent",
          color: "#00ff00",
          weight: 2,
          opacity: layerOpacity.paisajes,
          fillOpacity: 0,
        });
        map.addLayer(newLayers.paisajes);
      }

      if (activeLayers.municipios && municipios) {
        newLayers.municipios = createGeoJSONLayer(municipios, "municipios", {
          fillColor: "transparent",
          color: "#0000ff",
          weight: 2,
          opacity: layerOpacity.municipios,
          fillOpacity: 0,
        });
        map.addLayer(newLayers.municipios);
      }

      if (activeLayers.cus && cusData) {
        newLayers.cus = createCUSLayer();
        if (newLayers.cus) {
          map.addLayer(newLayers.cus);
        }
      }

      setLayers(newLayers);
    }, [
      map,
      area,
      paisajes,
      municipios,
      cusData,
      activeLayers,
      layerOpacity,
      baseLayers,
      createGeoJSONLayer,
      createCUSLayer,
    ]);

    return null;
  }
);

// Coordinate Display Component
const CoordinateControl = React.memo(() => {
  const map = useMap();
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoordinates({
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6),
      });
    };

    map.on("mousemove", handleMouseMove);
    return () => map.off("mousemove", handleMouseMove);
  }, [map]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        left: "10px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: "5px 10px",
        borderRadius: "3px",
        fontSize: "12px",
        zIndex: 1000,
      }}
    >
      Lat: {coordinates.lat}, Lng: {coordinates.lng}
    </div>
  );
});

// Scale Control Component
const ScaleControl = React.memo(() => {
  const map = useMap();

  useEffect(() => {
    const scaleControl = L.control.scale({ position: "bottomleft" });
    scaleControl.addTo(map);
    return () => map.removeControl(scaleControl);
  }, [map]);

  return null;
});

// Layer Control Panel
const LayerControlPanel = React.memo(
  ({ activeLayers, setActiveLayers, layerOpacity, setLayerOpacity }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const map = useMap();

    const handleLayerToggle = useCallback(
      (layerKey) => {
        setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
      },
      [setActiveLayers]
    );

    const handleOpacityChange = useCallback(
      (layerKey, value) => {
        setLayerOpacity((prev) => ({ ...prev, [layerKey]: value }));
      },
      [setLayerOpacity]
    );

    const layerConfigs = [
      {
        id: "area",
        name: "Área",
        color: "#ff0000",
        mandatory: true,
      },
      {
        id: "paisajes",
        name: "Paisajes",
        color: "#00ff00",
        mandatory: false,
      },
      {
        id: "municipios",
        name: "Municipios",
        color: "#0000ff",
        mandatory: false,
      },
      {
        id: "cus",
        name: "CUS",
        color: "#3388ff",
        mandatory: true,
      },
    ];

    return (
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "white",
          borderRadius: "0px",
          boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
          zIndex: 1000,
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          maxWidth: "300px",
        }}
      >
        {/* Header del control */}
        <div
          style={{
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
          <span>{isCollapsed ? "▼" : "▲"}</span>
        </div>

        {!isCollapsed && (
          <div style={{ padding: "15px" }}>
            {layerConfigs.map((layer) => (
              <div
                key={layer.id}
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
                    checked={activeLayers[layer.id] || false}
                    onChange={() => handleLayerToggle(layer.id)}
                  />
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      border: "2px solid #e5e7eb",
                      backgroundColor: layer.color,
                      marginRight: "2px",
                    }}
                  />
                  <span
                    style={{
                      fontWeight: "normal",
                      flex: 1,
                      fontSize: "12px",
                    }}
                  >
                    {layer.name}
                    {layer.mandatory && (
                      <span
                        style={{
                          marginLeft: "4px",
                          fontSize: "10px",
                          color: "#3b82f6",
                          fontWeight: "bold",
                        }}
                      >
                        (obligatoria)
                      </span>
                    )}
                  </span>
                  {/* Toggle visibilidad solo si no es obligatoria */}
                  {!layer.mandatory && (
                    <button
                      onClick={() => handleLayerToggle(layer.id)}
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
                      title={
                        activeLayers[layer.id]
                          ? "Ocultar capa"
                          : "Mostrar capa"
                      }
                    >
                      {activeLayers[layer.id] ? (
                        <span style={{ fontSize: "12px" }}>👁️</span>
                      ) : (
                        <span style={{ fontSize: "12px" }}>👁️‍🗨️</span>
                      )}
                    </button>
                  )}
                </div>

                {/* Control de opacidad solo si está visible */}
                {activeLayers[layer.id] && (
                  <>
                    <div style={{ fontSize: "10px", color: "#666", marginBottom: "5px" }}>
                      Opacidad: {Math.round(layerOpacity[layer.id] * 100)}%
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={layerOpacity[layer.id]}
                      onChange={(e) =>
                        handleOpacityChange(
                          layer.id,
                          parseFloat(e.target.value)
                        )
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
            ))}
          </div>
        )}

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `}</style>
      </div>
    );
  }
);

// Main Component
const TimeSeriesMapViewer = React.memo(() => {
  const [data, setData] = useState({
    area: null,
    paisajes: null,
    municipios: null,
    cusData: null,
  });
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState({});
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: true,
    cus: true,
  });
  const [layerOpacity, setLayerOpacity] = useState({
    area: 0.8,
    paisajes: 0.6,
    municipios: 1,
    cus: 0.8,
  });

  // Load data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [areaRes, paisajesRes, municipiosRes, cusRes] = await Promise.all(
          [
            fetch("/AREA.geojson"),
            fetch("/PAISAJES.geojson"),
            fetch("/MUNICIPIOS.geojson"),
            fetch("/CUS.geojson"),
          ]
        );

        const [areaData, paisajesData, municipiosData, cusData] =
          await Promise.all([
            areaRes.json(),
            paisajesRes.json(),
            municipiosRes.json(),
            cusRes.json(),
          ]);

        setData({
          area: areaData,
          paisajes: paisajesData,
          municipios: municipiosData,
          cusData: cusData,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
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
      <LayerManager
        {...data}
        activeLayers={activeLayers}
        layerOpacity={layerOpacity}
        onColorMapChange={setColorMap}
      />
      <LayerControlPanel
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        layerOpacity={layerOpacity}
        setLayerOpacity={setLayerOpacity}
      />
      <CoordinateControl />
      <ScaleControl />
      <ColorLegend colorMap={colorMap} isVisible={true} />
    </MapContainer>
  );
});

export default TimeSeriesMapViewer;
