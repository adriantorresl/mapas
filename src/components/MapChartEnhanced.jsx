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

// Utilidades para operaciones geométricas con Turf.js-like functionality usando Leaflet
const GeometryUtils = {
  // Convierte feature de GeoJSON a Leaflet layer
  featureToLayer: (feature) => {
    return L.geoJSON(feature);
  },

  // Une múltiples features en una sola geometría
  unionFeatures: (features) => {
    if (!features || features.length === 0) return null;

    try {
      // Crear un grupo de capas de Leaflet
      let unionLayer = L.geoJSON(features[0]);

      // Para geometrías complejas, usamos una aproximación
      // basada en los bounds combinados y simplificación
      const allCoords = [];
      const allBounds = [];

      features.forEach((feature) => {
        if (feature.geometry) {
          const layer = L.geoJSON(feature);
          allBounds.push(layer.getBounds());

          // Extraer coordenadas exteriores
          if (feature.geometry.type === "Polygon") {
            // Tomar solo el anillo exterior (primer array)
            const exteriorRing = feature.geometry.coordinates[0];
            allCoords.push(
              ...exteriorRing.map((coord) => [coord[1], coord[0]])
            ); // lat, lng
          } else if (feature.geometry.type === "MultiPolygon") {
            // Para MultiPolygon, tomar el anillo exterior de cada polígono
            feature.geometry.coordinates.forEach((polygon) => {
              const exteriorRing = polygon[0]; // Primer anillo de cada polígono
              allCoords.push(
                ...exteriorRing.map((coord) => [coord[1], coord[0]])
              );
            });
          }
        }
      });

      if (allCoords.length === 0) return null;

      // Crear convex hull aproximado usando los puntos extremos
      const convexHull = GeometryUtils.createConvexHull(allCoords);

      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [convexHull.map((coord) => [coord[1], coord[0]])], // lng, lat para GeoJSON
        },
      };
    } catch (error) {
      console.warn("Error en unionFeatures:", error);
      return null;
    }
  },

  // Algoritmo simple para crear convex hull (envolvente convexa)
  createConvexHull: (points) => {
    if (points.length < 3) return points;

    // Algoritmo de Graham Scan simplificado
    // 1. Encontrar el punto más abajo (y más a la izquierda si hay empate)
    let start = points.reduce((min, p) => {
      if (p[0] < min[0] || (p[0] === min[0] && p[1] < min[1])) return p;
      return min;
    });

    // 2. Ordenar puntos por ángulo polar respecto al punto inicial
    const sortedPoints = points
      .filter((p) => p !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a[0] - start[0], a[1] - start[1]);
        const angleB = Math.atan2(b[0] - start[0], b[1] - start[1]);
        return angleA - angleB;
      });

    // 3. Construir el hull
    const hull = [start];

    for (const point of sortedPoints) {
      // Remover puntos que crean giros hacia la derecha
      while (
        hull.length > 1 &&
        GeometryUtils.crossProduct(
          hull[hull.length - 2],
          hull[hull.length - 1],
          point
        ) <= 0
      ) {
        hull.pop();
      }
      hull.push(point);
    }

    // Cerrar el polígono
    if (hull.length > 0) {
      hull.push(hull[0]);
    }

    return hull;
  },

  // Producto cruzado para determinar orientación
  crossProduct: (O, A, B) => {
    return (A[1] - O[1]) * (B[0] - O[0]) - (A[0] - O[0]) * (B[1] - O[1]);
  },

  // Crear un buffer aproximado alrededor de geometrías
  createBuffer: (features, bufferSize = 0.001) => {
    if (!features || features.length === 0) return null;

    try {
      const allCoords = [];

      features.forEach((feature) => {
        if (feature.geometry) {
          const coords = GeometryUtils.extractCoordinates(feature.geometry);
          allCoords.push(...coords);
        }
      });

      if (allCoords.length === 0) return null;

      // Crear un rectángulo que envuelve todos los puntos con buffer
      const bounds = {
        minLat: Math.min(...allCoords.map((c) => c[0])) - bufferSize,
        maxLat: Math.max(...allCoords.map((c) => c[0])) + bufferSize,
        minLng: Math.min(...allCoords.map((c) => c[1])) - bufferSize,
        maxLng: Math.max(...allCoords.map((c) => c[1])) + bufferSize,
      };

      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [bounds.minLng, bounds.minLat],
              [bounds.maxLng, bounds.minLat],
              [bounds.maxLng, bounds.maxLat],
              [bounds.minLng, bounds.maxLat],
              [bounds.minLng, bounds.minLat],
            ],
          ],
        },
      };
    } catch (error) {
      console.warn("Error en createBuffer:", error);
      return null;
    }
  },

  // Extraer coordenadas de geometría
  extractCoordinates: (geometry) => {
    const coords = [];
    if (geometry.type === "Polygon") {
      geometry.coordinates[0].forEach((coord) =>
        coords.push([coord[1], coord[0]])
      ); // lat, lng
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => {
        polygon[0].forEach((coord) => coords.push([coord[1], coord[0]]));
      });
    }
    return coords;
  },
};

const MapChartEnhanced = ({
  geoJsonUrl,
  categoriaCol = "CLIMA",
  hectareasCol = "HECTARES",
  showDelimitationControl = true,
  showPaletteControl = true,
  showChart = true,
}) => {
  const [geoData, setGeoData] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDelimitation, setSelectedDelimitation] = useState("all");
  const [selectedPaletteName, setSelectedPaletteName] =
    useState("schemeCategory10");
  const [showExteriorBorder, setShowExteriorBorder] = useState(false);
  const [showGroupBorders, setShowGroupBorders] = useState(false);

  const mapRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const borderLayerRef = useRef(null);

  const selectedPalette = paletteOptions[selectedPaletteName];

  const colorScale = useMemo(() => {
    if (!geoData) return scaleOrdinal(selectedPalette);
    const categoriasUnicas = [
      ...new Set(geoData.features.map((feat) => feat.properties[categoriaCol])),
    ];
    return scaleOrdinal(selectedPalette).domain(categoriasUnicas);
  }, [geoData, categoriaCol, selectedPalette]);

  const delimitationColorScale = useMemo(() => {
    if (!geoData || selectedDelimitation === "all")
      return scaleOrdinal(selectedPalette);

    const delimitationValues = [
      ...new Set(
        geoData.features.map((feat) => feat.properties[selectedDelimitation])
      ),
    ];
    return scaleOrdinal(selectedPalette).domain(delimitationValues);
  }, [geoData, selectedDelimitation, selectedPalette]);

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

  // Agrupación de features por delimitación
  const groupedFeatures = useMemo(() => {
    if (!geoData || selectedDelimitation === "all") return null;

    const groups = {};
    geoData.features.forEach((feature, index) => {
      const groupKey = feature.properties[selectedDelimitation];
      if (!groups[groupKey]) {
        groups[groupKey] = {
          type: "FeatureCollection",
          features: [],
          indices: [],
        };
      }
      groups[groupKey].features.push(feature);
      groups[groupKey].indices.push(index);
    });

    return groups;
  }, [geoData, selectedDelimitation]);

  // Calcular geometrías de bordes usando unión de polígonos
  const borderGeometries = useMemo(() => {
    if (!geoData) return { exterior: null, groups: null };

    console.log("🎯 Calculando geometrías de bordes...");
    const startTime = performance.now();

    const result = {
      exterior: null,
      groups: {},
    };

    // 1. Crear borde exterior (unión de TODOS los polígonos)
    if (showExteriorBorder) {
      console.log("🌍 Creando borde exterior...");
      result.exterior = GeometryUtils.unionFeatures(geoData.features);

      if (result.exterior) {
        console.log("✅ Borde exterior creado exitosamente");
      } else {
        console.warn("⚠️ No se pudo crear el borde exterior");
      }
    }

    // 2. Crear bordes por grupos (unión de polígonos por cada grupo)
    if (showGroupBorders && groupedFeatures && selectedDelimitation !== "all") {
      console.log(`🏷️ Creando bordes por ${selectedDelimitation}...`);

      Object.entries(groupedFeatures).forEach(([groupKey, groupData]) => {
        const groupUnion = GeometryUtils.unionFeatures(groupData.features);
        if (groupUnion) {
          result.groups[groupKey] = groupUnion;
          console.log(`✅ Borde creado para ${groupKey}`);
        } else {
          console.warn(`⚠️ No se pudo crear borde para ${groupKey}`);
        }
      });

      console.log(
        `📊 Bordes de grupo creados: ${Object.keys(result.groups).length}`
      );
    }

    const endTime = performance.now();
    console.log(
      `⚡ Geometrías calculadas en ${(endTime - startTime).toFixed(2)}ms`
    );

    return result;
  }, [
    geoData,
    groupedFeatures,
    selectedDelimitation,
    showExteriorBorder,
    showGroupBorders,
  ]);

  // Función para obtener el estilo de las features normales
  const getFeatureStyle = (feature) => {
    const baseStyle = {
      fillOpacity: 0.7,
      weight: 0.5,
      color: "#ffffff",
      opacity: 0.3,
    };

    // Determinar el color de relleno
    let fillColor;
    if (selectedDelimitation === "all") {
      fillColor = colorScale(feature.properties[categoriaCol]);
    } else {
      const areaValue = feature.properties[selectedDelimitation];
      if (selectedArea) {
        if (areaValue === selectedArea) {
          fillColor = colorScale(feature.properties[categoriaCol]);
        } else {
          return {
            ...baseStyle,
            fillColor: "transparent",
            color: "#ccc",
            fillOpacity: 0,
            weight: 0.3,
            opacity: 0.5,
          };
        }
      } else {
        fillColor = colorScale(feature.properties[categoriaCol]);
      }
    }

    return {
      ...baseStyle,
      fillColor,
    };
  };

  // Función para obtener el estilo de los bordes
  const getBorderStyle = (type, groupKey = null) => {
    if (type === "exterior") {
      return {
        fillColor: "transparent",
        fillOpacity: 0,
        color: "#000000",
        weight: 4,
        opacity: 1,
        dashArray: null,
      };
    } else if (type === "group") {
      return {
        fillColor: "transparent",
        fillOpacity: 0,
        color: "#FF0000",
        weight: 3,
        opacity: 0.8,
        dashArray: "10, 5",
      };
    }
    return {};
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
    // Tooltip informativo
    let tooltipContent = `
      <strong>${feature.properties.NOMGEO || "Sin nombre"}</strong><br/>
      ${categoriaCol}: ${feature.properties[categoriaCol]}<br/>
      Hectáreas: ${parseFloat(
        feature.properties[hectareasCol] || 0
      ).toLocaleString()}
    `;

    if (selectedDelimitation !== "all") {
      tooltipContent += `<br/>${selectedDelimitation}: ${feature.properties[selectedDelimitation]}`;
    }

    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: "top",
      opacity: 0.9,
    });

    if (selectedDelimitation !== "all") {
      layer.on({
        click: onFeatureClick,
        mouseover: () => {
          layer.setStyle({
            weight: 2,
            color: "#FF6B35",
            fillOpacity: 0.9,
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
    if (geoData && mapRef.current) {
      const bounds = L.geoJSON(geoData).getBounds();
      mapRef.current.fitBounds(bounds);
    }
  };

  // Crear componentes de bordes
  const BorderLayers = () => {
    const layers = [];

    // Borde exterior
    if (borderGeometries.exterior && showExteriorBorder) {
      layers.push(
        <GeoJSON
          key="exterior-border"
          data={borderGeometries.exterior}
          style={getBorderStyle("exterior")}
          interactive={false}
        />
      );
    }

    // Bordes de grupos
    if (showGroupBorders && Object.keys(borderGeometries.groups).length > 0) {
      Object.entries(borderGeometries.groups).forEach(
        ([groupKey, geometry]) => {
          layers.push(
            <GeoJSON
              key={`group-border-${groupKey}`}
              data={geometry}
              style={getBorderStyle("group", groupKey)}
              interactive={false}
            />
          );
        }
      );
    }

    return layers;
  };

  const chartData = useMemo(() => {
    if (!geoData) return null;

    let summary = {};

    if (selectedDelimitation === "all") {
      geoData.features.forEach((feat) => {
        const categoria = feat.properties[categoriaCol];
        const hectareas = parseFloat(feat.properties[hectareasCol]) || 0;
        summary[categoria] = (summary[categoria] || 0) + hectareas;
      });
    } else {
      let featuresToInclude = geoData.features;

      if (selectedArea && groupedFeatures) {
        featuresToInclude = groupedFeatures[selectedArea]?.features || [];
        featuresToInclude.forEach((feat) => {
          const categoria = feat.properties[categoriaCol];
          const hectareas = parseFloat(feat.properties[hectareasCol]) || 0;
          summary[categoria] = (summary[categoria] || 0) + hectareas;
        });
      } else {
        featuresToInclude.forEach((feat) => {
          const delimitacionValue = feat.properties[selectedDelimitation];
          const hectareas = parseFloat(feat.properties[hectareasCol]) || 0;
          summary[delimitacionValue] =
            (summary[delimitacionValue] || 0) + hectareas;
        });
      }
    }

    const labels = Object.keys(summary);
    return {
      labels,
      datasets: [
        {
          data: Object.values(summary),
          backgroundColor: labels.map((label) =>
            selectedDelimitation === "all" || selectedArea
              ? colorScale(label)
              : delimitationColorScale(label)
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
    delimitationColorScale,
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

  const getChartTitle = () => {
    if (selectedArea) {
      return `Distribución de ${categoriaCol} en ${selectedArea} (ha)`;
    } else if (selectedDelimitation === "all") {
      return `Distribución de ${categoriaCol} en Área de Estudio (ha)`;
    } else {
      const delimLabel =
        DELIMITATION_OPTIONS.find((opt) => opt.value === selectedDelimitation)
          ?.label || selectedDelimitation;
      return `Distribución de Hectáreas por ${delimLabel} (ha)`;
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
      <div
        className="mapchart-controls"
        style={{
          marginBottom: "10px",
          display: "flex",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        {showDelimitationControl && (
          <div>
            <label htmlFor="delimitationSelect" style={{ ...styles.label }}>
              Delimitar por:
            </label>
            <select
              id="delimitationSelect"
              value={selectedDelimitation}
              onChange={(e) => {
                setSelectedDelimitation(e.target.value);
                resetView();
              }}
              style={{ ...styles.select }}
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
            <label htmlFor="paletteSelect" style={{ ...styles.label }}>
              Paleta de colores:
            </label>
            <select
              id="paletteSelect"
              value={selectedPaletteName}
              onChange={(e) => setSelectedPaletteName(e.target.value)}
              style={{ ...styles.select }}
            >
              {Object.keys(paletteOptions).map((name) => (
                <option key={name} value={name}>
                  {name.replace("scheme", "")}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={{ ...styles.label }}>
            <input
              type="checkbox"
              checked={showExteriorBorder}
              onChange={(e) => setShowExteriorBorder(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            🌍 Mostrar borde exterior
          </label>
        </div>

        {selectedDelimitation !== "all" && (
          <div>
            <label style={{ ...styles.label }}>
              <input
                type="checkbox"
                checked={showGroupBorders}
                onChange={(e) => setShowGroupBorders(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              🏷️ Mostrar bordes de{" "}
              {DELIMITATION_OPTIONS.find(
                (opt) => opt.value === selectedDelimitation
              )?.label.toLowerCase()}
            </label>
          </div>
        )}

        {selectedArea && (
          <button onClick={resetView} style={{ ...styles.button }}>
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
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
          />

          {/* Features principales */}
          {geoData && (
            <GeoJSON
              key={`${selectedDelimitation}-${selectedArea}`}
              data={geoData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
              ref={geoJsonLayerRef}
            />
          )}

          {/* Capas de bordes */}
          <BorderLayers />
        </MapContainer>
      </div>

      {showChart && chartData && (
        <div className="mapchart-chart">
          <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
            {getChartTitle()}
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

export default MapChartEnhanced;
