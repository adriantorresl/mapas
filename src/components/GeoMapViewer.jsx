import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LayersControl, ScaleControl } from "react-leaflet";
import {
  Eye,
  EyeOff,
  Download,
  Search,
  BarChart3,
  Layers,
  MousePointer,
} from "lucide-react";
import * as d3 from "d3";
import "leaflet/dist/leaflet.css";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import proj4 from "proj4";

// Componente para manejar capas raster (TIF)
const RasterLayer = ({ url, name, opacity = 1, visible = true }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    const loadRaster = async () => {
      try {
        console.log(`[RasterLayer] Loading raster: ${name} from ${url}`);

        // Fetch raster file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log(
          `[RasterLayer] Fetched ${arrayBuffer.byteLength} bytes for ${name}`
        );

        // Parse georaster with proj4 support
        const georaster = await parseGeoraster(arrayBuffer, { proj4 });
        console.log(`[RasterLayer] Parsed georaster:`, {
          width: georaster.width,
          height: georaster.height,
          numberOfRasters: georaster.numberOfRasters,
          mins: georaster.mins,
          maxs: georaster.maxs,
          projection: georaster.projection,
          xmin: georaster.xmin,
          xmax: georaster.xmax,
          ymin: georaster.ymin,
          ymax: georaster.ymax,
          noDataValue: georaster.noDataValue,
        });

        // Remove existing layer
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        // Get value range for normalization - be more careful with the values
        let minValue = 0;
        let maxValue = 255;

        if (
          georaster.mins &&
          georaster.maxs &&
          georaster.mins.length > 0 &&
          georaster.maxs.length > 0
        ) {
          minValue = georaster.mins[0];
          maxValue = georaster.maxs[0];

          // Ensure we have valid values
          if (
            !isFinite(minValue) ||
            !isFinite(maxValue) ||
            minValue === maxValue
          ) {
            console.warn(`[RasterLayer] Invalid value range, using defaults`);
            minValue = 0;
            maxValue = 255;
          }
        }

        console.log(
          `[RasterLayer] Value range for ${name}: ${minValue} - ${maxValue}`
        );

        // Create raster layer with better configuration
        const geoRasterLayer = new GeoRasterLayer({
          georaster: georaster,
          opacity: opacity,
          pixelValuesToColorFn: (pixelValues) => {
            const pixelValue = pixelValues[0];

            // Skip no-data values
            if (pixelValue === null || pixelValue === undefined) {
              return null;
            }

            // Skip actual no-data values from the raster
            if (
              georaster.noDataValue !== null &&
              georaster.noDataValue !== undefined &&
              pixelValue === georaster.noDataValue
            ) {
              return null;
            }

            // Normalize pixel value
            const normalized = (pixelValue - minValue) / (maxValue - minValue);
            const clampedNormalized = Math.max(0, Math.min(1, normalized));

            // Simple elevation color scheme: blue (low) to red (high)
            const red = Math.round(255 * clampedNormalized);
            const blue = Math.round(255 * (1 - clampedNormalized));
            const green = Math.round(
              128 * Math.sin(clampedNormalized * Math.PI)
            );

            return `rgba(${red}, ${green}, ${blue}, 0.7)`;
          },
          resolution: 512, // Increased resolution for better quality
        });

        // Add to map
        geoRasterLayer.addTo(map);
        layerRef.current = geoRasterLayer;

        console.log(`[RasterLayer] Successfully added ${name} to map`);

        // Force map to refresh
        map.invalidateSize();
      } catch (error) {
        console.error(`[RasterLayer] Error loading ${name}:`, error);
        console.error(`[RasterLayer] Stack trace:`, error.stack);
      }
    };

    loadRaster();

    // Cleanup
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, url, name, visible]);

  // Handle opacity changes
  useEffect(() => {
    if (layerRef.current && visible) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity, visible]);

  return null;
};

// Componente para mostrar coordenadas del cursor
const CoordinateDisplay = () => {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useMapEvents({
    mousemove: (e) => {
      setCoordinates({
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6),
      });
    },
  });

  return (
    <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm text-xs z-1000">
      {coordinates.lat}, {coordinates.lng}
    </div>
  );
};

// Componente para el minimapa - TEMPORALMENTE DESHABILITADO
const MiniMap = () => {
  // Componente deshabilitado para evitar conflictos con Leaflet
  return null;
};

// Componente para tooltip personalizado
const TooltipLayer = ({ layer, tooltipFields, showTooltip }) => {
  const map = useMap();

  useEffect(() => {
    if (layer && showTooltip && tooltipFields.length > 0) {
      layer.eachLayer((featureLayer) => {
        featureLayer.on("mouseover", (e) => {
          const feature = e.target.feature;
          if (feature && feature.properties) {
            const tooltipContent = tooltipFields
              .map(
                (field) =>
                  `<strong>${field}:</strong> ${
                    feature.properties[field] || "N/A"
                  }`
              )
              .join("<br>");

            featureLayer
              .bindTooltip(tooltipContent, {
                permanent: false,
                direction: "top",
              })
              .openTooltip();
          }
        });
      });
    }
  }, [layer, tooltipFields, showTooltip, map]);

  return null;
};

// Componente para las etiquetas - SIMPLIFICADO
const LabelsLayer = ({ layer, labelField, showLabels }) => {
  // Simplificado para evitar conflictos
  return null;
};

// Componente para la lupa - SIMPLIFICADO
const MagnifyingGlass = ({ enabled, onToggle }) => {
  // Simplificado para evitar conflictos
  return null;
};

// Componente principal
const GeoMapViewer = ({
  layers = [],
  showMiniMap = false,
  fieldMapping = {},
  symbology = {},
  tooltipFields = [],
  showTooltip = false,
  showLabels = false,
  labelField = "",
  enableLayerSwipe = false,
  swipeLayers = [],
  chartConfig = null,
  enableMagnifier = false,
  studyAreaLayers = [],
}) => {
  // Generar un ID único para cada instancia del componente
  const mapId = useMemo(
    () => `geo-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const [loadedLayers, setLoadedLayers] = useState({});
  const [layerOpacities, setLayerOpacities] = useState({});
  const [layerVisibilities, setLayerVisibilities] = useState({});
  const [studyAreaData, setStudyAreaData] = useState({});
  const [pixelValue, setPixelValue] = useState(null);
  const [magnifierEnabled, setMagnifierEnabled] = useState(enableMagnifier);
  const [chartData, setChartData] = useState(null);
  const [showChart, setShowChart] = useState(false);

  // Efecto de limpieza al desmontar
  useEffect(() => {
    return () => {
      // Limpiar cualquier referencia global que pueda estar interfiriendo
      if (window.L && window.L._mapInstances) {
        delete window.L._mapInstances[mapId];
      }
    };
  }, [mapId]);

  // Cargar capas desde archivos
  useEffect(() => {
    const loadLayers = async () => {
      console.log("[GeoMapViewer] Loading layers:", layers);
      console.log("[GeoMapViewer] Number of layers to load:", layers.length);

      for (const layerConfig of layers) {
        try {
          console.log("[GeoMapViewer] Processing layer:", layerConfig);

          if (layerConfig.url && layerConfig.url.endsWith(".geojson")) {
            console.log(`[GeoMapViewer] Loading GeoJSON: ${layerConfig.name}`);
            const response = await fetch(layerConfig.url);
            if (response.ok) {
              const data = await response.json();

              setLoadedLayers((prev) => ({
                ...prev,
                [layerConfig.name]: {
                  type: "geojson",
                  data,
                  config: layerConfig,
                },
              }));

              setLayerOpacities((prev) => ({ ...prev, [layerConfig.name]: 1 }));
              setLayerVisibilities((prev) => ({
                ...prev,
                [layerConfig.name]: true,
              }));
              console.log(
                `[GeoMapViewer] ✅ Successfully loaded GeoJSON: ${layerConfig.name}`
              );
            } else {
              console.error(
                `[GeoMapViewer] ❌ Failed to load GeoJSON: ${layerConfig.name} - ${response.status}`
              );
            }
          } else if (layerConfig.url && layerConfig.url.endsWith(".tif")) {
            console.log(
              `[GeoMapViewer] 🗺️ Registering raster: ${layerConfig.name} with URL: ${layerConfig.url}`
            );

            // Para archivos raster, solo registramos la configuración
            setLoadedLayers((prev) => {
              const updated = {
                ...prev,
                [layerConfig.name]: {
                  type: "raster",
                  url: layerConfig.url,
                  config: layerConfig,
                },
              };
              console.log(
                `[GeoMapViewer] Updated loadedLayers with raster:`,
                updated
              );
              return updated;
            });

            setLayerOpacities((prev) => ({ ...prev, [layerConfig.name]: 1 }));
            setLayerVisibilities((prev) => ({
              ...prev,
              [layerConfig.name]: true,
            }));
            console.log(
              `[GeoMapViewer] ✅ Successfully registered raster: ${layerConfig.name}`
            );
          } else {
            console.warn(
              `[GeoMapViewer] ⚠️ Unknown layer type for: ${layerConfig.name} - ${layerConfig.url}`
            );
          }
        } catch (error) {
          console.error(
            `[GeoMapViewer] ❌ Error loading layer ${layerConfig.name}:`,
            error
          );
        }
      }
    };

    if (layers.length > 0) {
      console.log("[GeoMapViewer] Starting to load layers...");
      loadLayers();
    } else {
      console.log("[GeoMapViewer] No layers to load");
    }
  }, [layers]);

  // Cargar capas de área de estudio
  useEffect(() => {
    const loadStudyAreaLayers = async () => {
      for (const layerConfig of studyAreaLayers) {
        try {
          if (layerConfig.url && layerConfig.url.endsWith(".geojson")) {
            const response = await fetch(layerConfig.url);
            if (response.ok) {
              const data = await response.json();
              setStudyAreaData((prev) => ({
                ...prev,
                [layerConfig.name]: data,
              }));
            }
          }
        } catch (error) {
          console.error(
            `Error loading study area layer ${layerConfig.name}:`,
            error
          );
        }
      }
    };

    if (studyAreaLayers.length > 0) {
      loadStudyAreaLayers();
    }
  }, [studyAreaLayers]);

  // Generar estilo basado en simbología
  const getFeatureStyle = (feature, layerName) => {
    const symbolConfig = symbology[layerName];
    if (!symbolConfig) return { color: "#3388ff", weight: 2 };

    const field = fieldMapping[layerName];
    if (!field || !feature.properties[field])
      return { color: "#3388ff", weight: 2 };

    const value = feature.properties[field];

    if (symbolConfig.type === "intervals") {
      const colorScale = d3
        .scaleQuantile()
        .domain(symbolConfig.domain || [0, 100])
        .range(
          symbolConfig.colors || [
            "#fee5d9",
            "#fcae91",
            "#fb6a4a",
            "#de2d26",
            "#a50f15",
          ]
        );

      return {
        color: colorScale(value),
        weight: 2,
        fillOpacity: 0.7,
      };
    } else if (symbolConfig.type === "discrete") {
      const colorMap = symbolConfig.colorMap || {};
      return {
        color: colorMap[value] || "#3388ff",
        weight: 2,
        fillOpacity: 0.7,
      };
    }

    return { color: "#3388ff", weight: 2 };
  };

  // Exportar capa
  const exportLayer = (layerName) => {
    const layer = loadedLayers[layerName];
    if (!layer) return;

    const dataStr = JSON.stringify(layer.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${layerName}.geojson`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // Generar datos para gráficas
  const generateChartData = (layerName) => {
    const layer = loadedLayers[layerName];
    if (!layer || !chartConfig) return;

    const { groupField, valueField } = chartConfig;
    const groupedData = {};

    layer.data.features.forEach((feature) => {
      const group = feature.properties[groupField];
      const value = parseFloat(feature.properties[valueField]) || 0;

      if (!groupedData[group]) {
        groupedData[group] = [];
      }
      groupedData[group].push(value);
    });

    const chartDataArray = Object.keys(groupedData).map((group) => ({
      name: group,
      value:
        groupedData[group].reduce((a, b) => a + b, 0) /
        groupedData[group].length,
    }));

    setChartData(chartDataArray);
    setShowChart(true);
  };

  return (
    <div className="relative w-full h-screen" key={mapId}>
      <MapContainer
        key={mapId}
        center={[17.0732, -96.7266]} // Centro de Oaxaca
        zoom={8}
        className="w-full h-full"
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        {/* Capas base */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satélite">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Relieve">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>

          {/* Capas de área de estudio */}
          {Object.entries(studyAreaData).map(([name, data]) => (
            <LayersControl.Overlay key={`study-${name}`} name={name} checked>
              <GeoJSON
                data={data}
                style={{ color: "red", weight: 2, fillOpacity: 0.1 }}
              />
            </LayersControl.Overlay>
          ))}

          {/* Capas cargadas - GeoJSON */}
          {Object.entries(loadedLayers).map(
            ([name, layer]) =>
              layerVisibilities[name] &&
              layer.type === "geojson" && (
                <LayersControl.Overlay key={name} name={name} checked>
                  <GeoJSON
                    data={layer.data}
                    style={(feature) => ({
                      ...getFeatureStyle(feature, name),
                      opacity: layerOpacities[name] || 1,
                    })}
                  />
                </LayersControl.Overlay>
              )
          )}
        </LayersControl>

        {/* Capas raster (TIF) - fuera del LayersControl para mejor manejo */}
        {(() => {
          console.log(
            "[GeoMapViewer] Rendering raster layers. LoadedLayers:",
            loadedLayers
          );
          const rasterLayers = Object.entries(loadedLayers).filter(
            ([name, layer]) => layer.type === "raster"
          );
          console.log("[GeoMapViewer] Found raster layers:", rasterLayers);

          return rasterLayers.map(([name, layer]) => {
            console.log(`[GeoMapViewer] 🎨 Rendering raster layer: ${name}`, {
              url: layer.url,
              opacity: layerOpacities[name] || 1,
              visible: layerVisibilities[name],
            });

            return (
              <RasterLayer
                key={`raster-${name}`}
                url={layer.url}
                name={name}
                opacity={layerOpacities[name] || 1}
                visible={layerVisibilities[name]}
              />
            );
          });
        })()}

        {/* Componentes adicionales */}
        <CoordinateDisplay />
        <ScaleControl position="bottomright" />

        {showMiniMap && <MiniMap />}
        {magnifierEnabled && <MagnifyingGlass enabled={magnifierEnabled} />}

        {/* Tooltips y etiquetas para cada capa */}
        {Object.entries(loadedLayers).map(([name, layer]) => (
          <div key={`layer-components-${name}`}>
            <TooltipLayer
              layer={layer}
              tooltipFields={tooltipFields}
              showTooltip={showTooltip}
            />
            <LabelsLayer
              layer={layer}
              labelField={labelField}
              showLabels={showLabels}
            />
          </div>
        ))}
      </MapContainer>

      {/* Panel de control de capas personalizado */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-1000">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Layers className="mr-2" size={20} />
          Control de Capas
        </h3>

        {Object.entries(loadedLayers).map(([name, layer]) => (
          <div key={name} className="mb-4 p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="font-medium">{name}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {layer.type === "geojson" ? "Vectorial" : "Raster"}
                  {layer.type === "raster" && " (.tif)"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setLayerVisibilities((prev) => ({
                      ...prev,
                      [name]: !prev[name],
                    }))
                  }
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Alternar visibilidad"
                >
                  {layerVisibilities[name] ? (
                    <Eye size={16} />
                  ) : (
                    <EyeOff size={16} />
                  )}
                </button>
                {layer.type === "geojson" && (
                  <button
                    onClick={() => exportLayer(name)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Exportar capa"
                  >
                    <Download size={16} />
                  </button>
                )}
                {chartConfig && layer.type === "geojson" && (
                  <button
                    onClick={() => generateChartData(name)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Generar gráfica"
                  >
                    <BarChart3 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm text-gray-600 mb-1 block">
                Opacidad: {Math.round((layerOpacities[name] || 1) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layerOpacities[name] || 1}
                onChange={(e) =>
                  setLayerOpacities((prev) => ({
                    ...prev,
                    [name]: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        ))}

        {/* Control de lupa */}
        <div className="mt-4 pt-3 border-t">
          <button
            onClick={() => setMagnifierEnabled(!magnifierEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              magnifierEnabled
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <Search size={16} />
            Lupa {magnifierEnabled ? "Activada" : "Desactivada"}
          </button>
        </div>
      </div>

      {/* Valor del pixel para raster */}
      {pixelValue && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded shadow-sm text-sm z-1000">
          <strong>Valor del pixel:</strong> {pixelValue}
        </div>
      )}

      {/* Modal de gráfica */}
      {showChart && chartData && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-2000">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Gráfica de Datos</h3>
              <button
                onClick={() => setShowChart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              {/* Aquí iría la implementación de la gráfica con D3 o Recharts */}
              <div className="text-gray-500">
                Gráfica generada con {chartData.length} grupos de datos
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeoMapViewer;
