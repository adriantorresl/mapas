import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, GeoJSON, TileLayer, LayersControl } from "react-leaflet";
import RetractableMapControls from "./RetractableMapControls";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-mouse-position";
import "leaflet-mouse-position/src/L.Control.MousePosition.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  schemeCategory10,
  schemeAccent,
  schemeDark2,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemePaired,
  schemePastel1,
  schemePastel2,
} from "d3-scale-chromatic";
import { scaleOrdinal } from "d3-scale";
import { useMapLayers } from "../hooks/useMapLayers";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const paletteOptions = {
  schemeCategory10,
  schemeAccent,
  schemeDark2,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemePaired,
  schemePastel1,
  schemePastel2,
};

const DELIMITATION_OPTIONS = [
  { value: "all", label: "Área de Estudio" },
  { value: "PAISAJE", label: "Paisaje" },
  { value: "RM", label: "Región" },
  { value: "NOMGEO", label: "Municipio" },
];

const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

function toRGBA(color, alpha = 1) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  const computed = ctx.fillStyle;
  const m = computed.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return computed;

  const [_, r, g, b] = m;
  return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(
    b,
    16
  )}, ${alpha})`;
}

const MapChart = ({
  geoJsonUrl,
  categoriaCol = "CLIMA",
  hectareasCol = "HECTARES",
  showDelimitationControl = true,
  showPaletteControl = true,
  showChart = true,
  showChartLabels = true,
  mapTitle,
}) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDelimitation, setSelectedDelimitation] = useState("all");
  const [selectedPaletteName, setSelectedPaletteName] =
    useState("schemeCategory10");
  const [highlightedAreas, setHighlightedAreas] = useState([]);
  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const controlsAddedRef = useRef({
    mousePosition: false,
    scale: false,
    easyPrint: false,
  });

  const selectedPalette = paletteOptions[selectedPaletteName];

  const colorScale = useMemo(() => {
    if (!geoData) return scaleOrdinal(selectedPalette);
    const categoriasUnicas = [
      ...new Set(geoData.features.map((feat) => feat.properties[categoriaCol])),
    ];
    return scaleOrdinal(selectedPalette).domain(categoriasUnicas);
  }, [geoData, categoriaCol, selectedPalette]);

  useEffect(() => {
    fetch(geoJsonUrl)
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
        if (mapInstance) {
          const bounds = L.geoJSON(data).getBounds();
          mapInstance.fitBounds(bounds);
        }
      })
      .catch((error) => {
        console.error("Error loading GeoJSON:", error);
      });
  }, [geoJsonUrl, mapInstance]);

  const layersConfig = [
    { key: "areaBorders", url: "AREA.geojson" },
    { key: "paisajeBorders", url: "PAISAJES.geojson" },
    { key: "municipiosBorders", url: "MARGINACION.geojson" },
  ];

  const { areaBorders, paisajeBorders, municipiosBorders } =
    useMapLayers(layersConfig);

  const groupedFeatures = useMemo(() => {
    if (!geoData || selectedDelimitation === "all") return null;

    const groups = {};
    geoData.features.forEach((feature) => {
      const groupKey = feature.properties[selectedDelimitation];
      if (!groups[groupKey]) {
        groups[groupKey] = {
          type: "FeatureCollection",
          features: [],
        };
      }
      groups[groupKey].features.push(feature);
    });

    return groups;
  }, [geoData, selectedDelimitation]);

  const getBaseStyle = () => ({
    weight: 0,
    opacity: 0.5,
    color: "red",
    fillOpacity: 0.5,
  });

  const getFeatureStyle = (feature) => {
    const baseStyle = getBaseStyle();

    if (selectedDelimitation === "all") {
      return {
        ...baseStyle,
        fillColor: colorScale(feature.properties[categoriaCol]),
      };
    }

    const areaValue = feature.properties[selectedDelimitation];

    if (selectedArea) {
      if (areaValue === selectedArea) {
        return {
          ...baseStyle,
          fillColor: colorScale(feature.properties[categoriaCol]),
          weight: 1,
          color: "#000",
        };
      }
      return {
        ...baseStyle,
        fillColor: "transparent",
        color: "#ccc",
        fillOpacity: 0,
      };
    }

    return {
      ...baseStyle,
      fillColor: colorScale(feature.properties[categoriaCol]),
    };
  };

  const onFeatureClick = (e) => {
    if (selectedDelimitation !== "all") {
      const clickedFeature = e.target.feature;
      const clickedArea = clickedFeature.properties[selectedDelimitation];
      setSelectedArea(clickedArea);

      if (groupedFeatures && groupedFeatures[clickedArea] && mapInstance) {
        const bounds = L.geoJSON(groupedFeatures[clickedArea]).getBounds();
        mapInstance.fitBounds(bounds);
      }
    }
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    let popupContent = `<b>${
      selectedDelimitation !== "all" ? props[selectedDelimitation] : ""
    }</b><br/>`;
    popupContent += Object.entries(props)
      .map(([k, v]) => `<b>${k}:</b> ${v}`)
      .join("<br/>");
    layer.bindPopup(popupContent);

    // Tooltip personalizado: categoriaCol, municipio y hectáreasCol (dinámico)
    const categoria = props[categoriaCol] ?? "Sin dato";
    const municipio = props.NOMGEO ?? "Sin municipio";
    const hectareas = props[hectareasCol]
      ? Number(props[hectareasCol]).toLocaleString("es-MX", {
          maximumFractionDigits: 2,
        })
      : "Sin dato";

    layer.bindTooltip(
      `<b>${categoriaCol}:</b> ${categoria}<br/><b>Municipio:</b> ${municipio}<br/><b>Hectáreas:</b> ${hectareas}`,
      {
        direction: "top",
        sticky: true,
        className: "mapchart-tooltip",
      }
    );

    layer.on({
      click: selectedDelimitation !== "all" ? onFeatureClick : undefined,
      mouseover: () => {
        layer.setStyle({
          weight: 3,
          color: "#000",
        });
        layer.bringToFront();
      },
      mouseout: () => {
        layer.setStyle(getFeatureStyle(feature));
      },
    });
  };

  const resetView = () => {
    setSelectedArea(null);
    setHighlightedAreas([]);
    if (geoData && mapInstance) {
      const bounds = L.geoJSON(geoData).getBounds();
      mapInstance.fitBounds(bounds);
    }
  };

  // Función para inicializar los controles del mapa
  const initializeMapControls = (map) => {
    if (!map || !map._container) {
      console.log("Mapa no disponible para agregar controles");
      return;
    }

    console.log("Inicializando controles del mapa...");

    try {
      // Control de posición del mouse
      if (!controlsAddedRef.current.mousePosition) {
        console.log("Agregando control de posición del mouse...");
        const mousePositionControl = L.control.mousePosition({
          position: "bottomleft",
          separator: " | ",
          emptyString: "Mueve el cursor sobre el mapa",
          lngFirst: false,
          numDigits: 5,
          lngFormatter: (lng) => `Lon: ${lng.toFixed(5)}°`,
          latFormatter: (lat) => `Lat: ${lat.toFixed(5)}°`,
        });

        mousePositionControl.addTo(map);
        controlsAddedRef.current.mousePosition = true;
        console.log("✅ Control de posición del mouse agregado");
      }

      // Control de escala
      if (!controlsAddedRef.current.scale) {
        console.log("Agregando control de escala...");
        const scaleControl = L.control.scale({
          position: "bottomright",
          metric: true,
          imperial: false,
          maxWidth: 150,
        });

        scaleControl.addTo(map);
        controlsAddedRef.current.scale = true;
        console.log("✅ Control de escala agregado");
      }
    } catch (error) {
      console.error("❌ Error al inicializar controles del mapa:", error);
    }
  };

  // Manejar cuando el mapa esté listo
  const handleMapCreated = (map) => {
    console.log("Mapa creado:", map);
    setMapInstance(map);
    mapRef.current = map;

    // Esperar un poco para que el mapa esté completamente inicializado
    setTimeout(() => {
      initializeMapControls(map);
    }, 100);
  };

  // Efecto para re-inicializar controles si el mapa cambia
  useEffect(() => {
    if (mapInstance && mapInstance._container) {
      initializeMapControls(mapInstance);
    }
  }, [mapInstance]);

  const chartData = useMemo(() => {
    if (!geoData) return null;

    let featuresToInclude = geoData.features;

    if (selectedArea && selectedDelimitation !== "all" && groupedFeatures) {
      featuresToInclude = groupedFeatures[selectedArea]?.features || [];
    }

    const summary = featuresToInclude.reduce((acc, feat) => {
      const categoria = feat.properties[categoriaCol];
      const hectareas = parseFloat(feat.properties[hectareasCol]) || 0;
      acc[categoria] = (acc[categoria] || 0) + hectareas;
      return acc;
    }, {});

    const labels = Object.keys(summary);
    return {
      labels,
      datasets: [
        {
          data: Object.values(summary),
          backgroundColor: labels.map((label) =>
            toRGBA(colorScale(label), 0.5)
          ),
        },
      ],
    };
  }, [
    geoData,
    selectedArea,
    selectedDelimitation,
    categoriaCol,
    hectareasCol,
    colorScale,
    groupedFeatures,
  ]);

  const chartOptions = {
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 12,
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            const valueMiles = Math.round(value / 1000);
            return `${label}: ${valueMiles.toLocaleString()} mil ha (${percentage}%)`;
          },
        },
      },
      datalabels: showChartLabels
        ? {
            color: "#000",
            font: {
              weight: "bold",
              size: 12,
            },
            formatter: (value, context) => {
              const total = context.chart.data.datasets[0].data.reduce(
                (a, b) => a + b,
                0
              );
              const percentage = Math.round((value / total) * 100);
              const valueMiles = Math.round(value / 1000);
              return `${valueMiles.toLocaleString()} mil\n(${percentage}%)`;
            },
          }
        : {
            display: false,
          },
    },
    maintainAspectRatio: false,
  };

  // 1. Agrega la función fuera del componente o dentro pero fuera de handleMapCreated
  const exportMapAsImage = async (mapInstance) => {
    if (!mapInstance) {
      alert("El mapa aún no está listo para exportar.");
      return;
    }
    try {
      const html2canvas = await import("html2canvas");
      const mapContainer = mapInstance.getContainer();

      // Opcional: Oculta controles antes de exportar
      const controls = mapContainer.querySelectorAll(
        ".leaflet-control-container"
      );
      controls.forEach((el) => (el.style.visibility = "hidden"));

      const canvas = await html2canvas.default(mapContainer, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        logging: false,
      });

      // Restaura controles
      controls.forEach((el) => (el.style.visibility = "visible"));

      const link = document.createElement("a");
      link.download = "mapa_completo.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Mapa exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar el mapa:", error);
      alert("Error al exportar el mapa. Intenta de nuevo.");
    }
  };

  // Nueva función para descargar el geoJsonUrl
  const downloadGeoJson = async () => {
    try {
      const response = await fetch(geoJsonUrl);
      if (!response.ok) throw new Error("No se pudo descargar el archivo.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Nombre sugerido: extrae el nombre del archivo de la url
      const fileName = geoJsonUrl.split("/").pop() || "datos.geojson";
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al descargar el archivo GeoJSON.");
      console.error(error);
    }
  };

  return (
    <div
      className="mapchart-responsive-container"
      style={{
        position: "relative",
        width: "100%",
        height: "70vh",
        minHeight: 400,
      }}
    >
      {mapTitle && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 600,
            zIndex: 1000,
            background: "rgba(255,248,230,0.95)",
            padding: "8px 16px",
            borderRadius: 8,
            fontFamily: "Roboto",
            fontWeight: 800,
            fontSize: 25,
            color: "#333",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            pointerEvents: "none",
          }}
        >
          {mapTitle}
        </div>
      )}

      {/* Controles siempre visibles */}
      <div className="mapchart-controls">
        {showDelimitationControl && (
          <div>
            <label htmlFor="delimitationSelect" style={styles.label}>
              Delimitar por:
            </label>
            <select
              id="delimitationSelect"
              value={selectedDelimitation}
              onChange={(e) => {
                setSelectedDelimitation(e.target.value);
                resetView();
              }}
              style={styles.select}
            >
              {DELIMITATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showPaletteControl && (
          <div>
            <label htmlFor="paletteSelect" style={styles.label}>
              Paleta de colores:
            </label>
            <select
              id="paletteSelect"
              value={selectedPaletteName}
              onChange={(e) => setSelectedPaletteName(e.target.value)}
              style={styles.select}
            >
              {Object.keys(paletteOptions).map((name) => (
                <option key={name} value={name}>
                  {name.replace("scheme", "")}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedArea && (
          <button onClick={resetView} style={styles.button}>
            Mostrar todo
          </button>
        )}

        {/* Botones de descarga/exportación movidos al panel retráctil */}
      </div>

      <div className="mapchart-maparea" style={{ position: "relative" }}>
        <RetractableMapControls
          panelTitle="Herramientas"
          position={{ bottom: 40, left: 14 }}
          buttons={[
            {
              label: "Descargar GeoJSON",
              icon: "⬇️",
              bg: "#e8f5e9",
              onClick: downloadGeoJson,
            },
            {
              label: "Exportar Mapa",
              icon: "📷",
              bg: "#e3f2fd",
              onClick: () => exportMapAsImage(mapInstance),
            },
          ]}
        />
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          whenCreated={handleMapCreated}
          ref={(mapRef) => {
            if (mapRef) {
              console.log("📍 MapContainer ref obtenido");
              handleMapCreated(mapRef);
            }
          }}
        >
          <LayersControl position="topleft">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite (ESRI)">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              />
            </LayersControl.BaseLayer>

            {areaBorders && (
              <LayersControl.Overlay checked name="Área de Estudio">
                <GeoJSON
                  data={areaBorders}
                  style={() => ({
                    color: "black",
                    weight: 5,
                    fillOpacity: 0,
                  })}
                />
              </LayersControl.Overlay>
            )}

            {paisajeBorders && (
              <LayersControl.Overlay checked name="Paisajes">
                <GeoJSON
                  data={paisajeBorders}
                  style={() => ({
                    color: "black",
                    weight: 4,
                    fillOpacity: 0,
                  })}
                />
              </LayersControl.Overlay>
            )}

            {municipiosBorders && (
              <LayersControl.Overlay checked name="Municipios">
                <GeoJSON
                  data={municipiosBorders}
                  style={() => ({
                    color: "white",
                    weight: 1,
                    fillOpacity: 0,
                  })}
                />
              </LayersControl.Overlay>
            )}

            {geoData && (
              <LayersControl.Overlay checked name="Datos principales">
                <GeoJSON
                  key={`${selectedDelimitation}-${selectedArea}`}
                  data={geoData}
                  style={getFeatureStyle}
                  onEachFeature={onEachFeature}
                  ref={geoJsonLayerRef}
                />
              </LayersControl.Overlay>
            )}
          </LayersControl>
        </MapContainer>
      </div>

      {showChart && chartData && (
        <div className="mapchart-chart">
          <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
            {selectedArea
              ? `Distribución de ${capitalizeFirstLetter(
                  categoriaCol
                )} en ${selectedArea} (ha)`
              : `Distribución de ${capitalizeFirstLetter(
                  categoriaCol
                )} en Área de Estudio`}
          </h3>
          <div style={{ height: "300px" }}>
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  label: {
    display: "block",
    marginBottom: "4px",
    fontWeight: 500,
    fontSize: "0.98em",
  },
  select: {
    minWidth: 120,
    maxWidth: 180,
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "0.98em",
    background: "#fafafa",
    marginBottom: 8,
  },
  button: {
    minWidth: 120,
    maxWidth: 180,
    padding: "6px 10px",
    backgroundColor: "#f5f5f5",
    color: "#1976d2",
    border: "1px solid #bdbdbd",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.98em",
    marginTop: 6,
    transition: "background 0.2s, color 0.2s",
  },
};

export default MapChart;
