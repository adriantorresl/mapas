import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  mapTitle, // ✅ NUEVA PROP
}) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDelimitation, setSelectedDelimitation] = useState("all");
  const [selectedPaletteName, setSelectedPaletteName] =
    useState("schemeCategory10");
  const [highlightedAreas, setHighlightedAreas] = useState([]);
  const [areaBorders, setAreaBorders] = useState(null);
  const [paisajeBorders, setPaisajeBorders] = useState(null);

  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);

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
        if (mapRef.current) {
          const bounds = L.geoJSON(data).getBounds();
          mapRef.current.fitBounds(bounds);
        }
      });
  }, [geoJsonUrl]);

  useEffect(() => {
    fetch("AREA.geojson")
      .then((res) => res.json())
      .then(setAreaBorders);

    fetch("PAISAJES.geojson")
      .then((res) => res.json())
      .then(setPaisajeBorders);
  }, []);

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
    weight: 0.5,
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

      if (groupedFeatures && groupedFeatures[clickedArea]) {
        const bounds = L.geoJSON(groupedFeatures[clickedArea]).getBounds();
        mapRef.current.fitBounds(bounds);
      }
    }
  };

  const onEachFeature = (feature, layer) => {
    if (selectedDelimitation !== "all") {
      layer.on({
        click: onFeatureClick,
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
    }
  };

  const resetView = () => {
    setSelectedArea(null);
    setHighlightedAreas([]);
    if (geoData && mapRef.current) {
      const bounds = L.geoJSON(geoData).getBounds();
      mapRef.current.fitBounds(bounds);
    }
  };

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
            return `${label}: ${value.toLocaleString()} ha (${percentage}%)`;
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
              return `${value.toLocaleString()} ha\n(${percentage}%)`;
            },
          }
        : {
            display: false, // This explicitly disables the datalabels plugin
          },
    },
    maintainAspectRatio: false,
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
            padding: "auto auto",
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
      </div>

      <div className="mapchart-maparea">
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
          />

          {areaBorders && (
            <GeoJSON
              data={areaBorders}
              style={() => ({
                color: "black",
                weight: 3,
                fillOpacity: 0,
              })}
            />
          )}

          {paisajeBorders && selectedDelimitation === "PAISAJE" && (
            <GeoJSON
              data={paisajeBorders}
              style={() => ({
                color: "black",
                weight: 3,
                fillOpacity: 0,
              })}
            />
          )}

          {geoData && (
            <GeoJSON
              key={`${selectedDelimitation}-${selectedArea}`}
              data={geoData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
              ref={geoJsonLayerRef}
            />
          )}
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
                )} en Área de Estudio (ha)`}
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
