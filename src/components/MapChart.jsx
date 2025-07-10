import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
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

ChartJS.register(ArcElement, Tooltip, Legend);

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

const MapChart = ({
  geoJsonUrl,
  categoriaCol = "CLIMA",
  hectareasCol = "HECTARES",
}) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDelimitation, setSelectedDelimitation] = useState("all");
  const [selectedPaletteName, setSelectedPaletteName] =
    useState("schemeCategory10");
  const [highlightedAreas, setHighlightedAreas] = useState([]);

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

  // Agrupar features por la delimitación seleccionada
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

  // Estilo base para los polígonos
  const getBaseStyle = () => ({
    weight: 1,
    opacity: 1,
    color: "#333",
    fillOpacity: 0.7,
  });

  // Estilo para las features según selección
  const getFeatureStyle = (feature) => {
    const baseStyle = getBaseStyle();

    if (selectedDelimitation === "all") {
      return {
        ...baseStyle,
        fillColor: colorScale(feature.properties[categoriaCol]),
      };
    }

    const areaValue = feature.properties[selectedDelimitation];

    // Si hay un área seleccionada
    if (selectedArea) {
      // Si esta feature pertenece al área seleccionada
      if (areaValue === selectedArea) {
        return {
          ...baseStyle,
          fillColor: colorScale(feature.properties[categoriaCol]),
          weight: 3,
          color: "#000",
        };
      }
      // Otras features
      return {
        ...baseStyle,
        fillColor: "transparent",
        color: "#ccc",
        fillOpacity: 0,
      };
    }

    // Sin selección - mostrar todas con colores
    return {
      ...baseStyle,
      fillColor: colorScale(feature.properties[categoriaCol]),
    };
  };

  // Manejar clic en las features
  const onFeatureClick = (e) => {
    if (selectedDelimitation !== "all") {
      const clickedFeature = e.target.feature;
      const clickedArea = clickedFeature.properties[selectedDelimitation];
      setSelectedArea(clickedArea);

      // Zoom al grupo completo
      if (groupedFeatures && groupedFeatures[clickedArea]) {
        const bounds = L.geoJSON(groupedFeatures[clickedArea]).getBounds();
        mapRef.current.fitBounds(bounds);
      }
    }
  };

  // Añadir eventos a cada feature
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

  // Resetear vista
  const resetView = () => {
    setSelectedArea(null);
    setHighlightedAreas([]);
    if (geoData && mapRef.current) {
      const bounds = L.geoJSON(geoData).getBounds();
      mapRef.current.fitBounds(bounds);
    }
  };

  // Datos para el gráfico
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
          backgroundColor: labels.map((label) => colorScale(label)),
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
      {/* Controles */}
      <div className="mapchart-controls">
        <div>
          <label
            htmlFor="delimitationSelect"
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: 500,
              fontSize: "0.98em",
            }}
          >
            Delimitar por:
          </label>
          <select
            id="delimitationSelect"
            value={selectedDelimitation}
            onChange={(e) => {
              setSelectedDelimitation(e.target.value);
              resetView();
            }}
            style={{
              minWidth: 120,
              maxWidth: 180,
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "0.98em",
              background: "#fafafa",
              marginBottom: 8,
            }}
          >
            {DELIMITATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="paletteSelect"
            style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: 500,
              fontSize: "0.98em",
            }}
          >
            Paleta de colores:
          </label>
          <select
            id="paletteSelect"
            value={selectedPaletteName}
            onChange={(e) => setSelectedPaletteName(e.target.value)}
            style={{
              minWidth: 120,
              maxWidth: 180,
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "0.98em",
              background: "#fafafa",
              marginBottom: 8,
            }}
          >
            {Object.keys(paletteOptions).map((name) => (
              <option key={name} value={name}>
                {name.replace("scheme", "")}
              </option>
            ))}
          </select>
        </div>

        {selectedArea && (
          <button
            onClick={resetView}
            style={{
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
            }}
          >
            Mostrar todo
          </button>
        )}
      </div>

      {/* Mapa */}
      <div className="mapchart-maparea">
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
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

      {/* Gráfico */}
      {chartData && (
        <div className="mapchart-chart">
          <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
            {selectedArea
              ? `Distribución de ${categoriaCol} en ${selectedArea} (ha)`
              : `Distribución de ${categoriaCol} en Área de Estudio (ha)`}
          </h3>
          <div style={{ height: "300px" }}>
            <Pie data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapChart;
