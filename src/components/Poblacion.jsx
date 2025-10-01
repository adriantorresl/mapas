import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Función para generar colores específicos para aspectos demográficos usando valores numéricos
const generatePoblacionColorPalette = (values) => {
  if (!values || values.length === 0) return {};

  const numericValues = values
    .filter((v) => v != null && !isNaN(v))
    .map(Number);
  if (numericValues.length === 0) return {};

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  // Rampa de colores: rosado/magenta → azul → amarillo
  const colors = ["#FF69B4", "#9966CC", "#4169E1", "#00BFFF", "#FFFF00"];

  const result = {};
  numericValues.forEach((value) => {
    const normalizedValue = (value - min) / (max - min);
    const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
    result[value] =
      colors[Math.max(0, Math.min(colorIndex, colors.length - 1))];
  });

  // Agregar información de rango para la leyenda continua
  result._range = { min, max, colors };

  return result;
};

// Función para generar colores para pobreza usando valores numéricos con rangos de porcentaje
const generatePobrezaColorPalette = (values) => {
  if (!values || values.length === 0) return {};

  const numericValues = values
    .filter((v) => v != null && !isNaN(v))
    .map(Number);
  if (numericValues.length === 0) return {};

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  // Definir rangos de porcentaje para la leyenda y colores
  const percentageRanges = [
    { min: 0, max: 19.99, color: "#7FB069", label: "0 - 20%" },
    { min: 20, max: 39.99, color: "#C2E372", label: "20 - 40%" },
    { min: 40, max: 59.99, color: "#FFE066", label: "40 - 60%" },
    { min: 60, max: 79.99, color: "#FF9F40", label: "60 - 80%" },
    { min: 80, max: 100, color: "#FF6B6B", label: "80 - 100%" },
  ];

  const result = {};

  // Asignar colores basados en rangos de porcentaje específicos
  numericValues.forEach((value) => {
    // Encontrar el rango correspondiente para este valor
    const range = percentageRanges.find(
      (r) => value >= r.min && value <= r.max
    );

    if (range) {
      result[value] = range.color;
    } else {
      // Para valores fuera de rango, usar el color más apropiado
      if (value < 0) {
        result[value] = percentageRanges[0].color;
      } else if (value > 100) {
        result[value] = percentageRanges[percentageRanges.length - 1].color;
      } else {
        result[value] = "#CCCCCC"; // Color por defecto
      }
    }
  });

  // Agregar información de rango para la leyenda de porcentajes
  result._range = { min, max, percentageRanges, type: "percentage" };

  console.log("Generated pobreza color map:", result);

  return result;
};

// Función para generar colores para marginación
const generateMarginacionColorPalette = (values) => {
  if (!values || values.length === 0) return {};

  // Para marginación, usamos los valores categóricos con la nueva rampa de colores
  const colorMap = {
    "Muy bajo": "#7FB069", // Verde
    Bajo: "#C2E372", // Verde claro
    Medio: "#FFE066", // Amarillo
    Alto: "#FF9F40", // Naranja
    "Muy alto": "#FF6B6B", // Rojo
  };

  // Definir categorías para la leyenda
  const categories = [
    { value: "Muy bajo", color: "#7FB069", label: "Muy bajo" },
    { value: "Bajo", color: "#C2E372", label: "Bajo" },
    { value: "Medio", color: "#FFE066", label: "Medio" },
    { value: "Alto", color: "#FF9F40", label: "Alto" },
    { value: "Muy alto", color: "#FF6B6B", label: "Muy alto" },
  ];

  const uniqueValues = [...new Set(values)];
  const result = {};

  // Si hay valores categóricos, usarlos
  if (uniqueValues.some((v) => typeof v === "string" && colorMap[v])) {
    uniqueValues.forEach((value) => {
      if (colorMap[value]) {
        result[value] = colorMap[value];
      } else {
        result[value] = "#CCCCCC";
      }
    });
  } else {
    // Si son valores numéricos, usar escala con los mismos colores
    const numericValues = values
      .filter((v) => v != null && !isNaN(v))
      .map(Number);
    if (numericValues.length === 0) return {};

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const colors = ["#7FB069", "#C2E372", "#FFE066", "#FF9F40", "#FF6B6B"];

    numericValues.forEach((value) => {
      const normalizedValue = (value - min) / (max - min);
      const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
      result[value] =
        colors[Math.max(0, Math.min(colorIndex, colors.length - 1))];
    });
  }

  // Agregar información de categorías para la leyenda
  result._range = { categories, type: "categorical" };

  console.log("Generated marginacion color map:", result);

  return result;
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

// Componente de leyenda con rampa continua para población
const ColorRampLegend = ({ colorMap, isVisible, currentDataset }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || !colorMap._range) {
    return null;
  }

  const { min, max, colors } = colorMap._range;

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    border: "2px solid rgba(0,0,0,0.2)",
    color: "white",
  };

  const headerStyle = {
    padding: "8px 12px",
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
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            backgroundColor: "#1E3C20",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "11px",
              color: "white",
            }}
          >
            {currentDataset === "poblacion" ? "Población Total" : "Valores"}
          </div>
          <div style={rampStyle}></div>
          <div style={labelsStyle}>
            <span>{min.toLocaleString()}</span>
            <span>{max.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para rangos de porcentaje (pobreza)
const PercentageRangeLegend = ({ colorMap, isVisible, currentDataset }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log("PercentageRangeLegend called:", {
    colorMap,
    isVisible,
    currentDataset,
  });

  console.log("PercentageRangeLegend conditions:", {
    isVisible,
    colorMapExists: !!colorMap,
    hasRange: !!(colorMap && colorMap._range),
    rangeType: colorMap && colorMap._range && colorMap._range.type,
    isPercentageType:
      colorMap && colorMap._range && colorMap._range.type === "percentage",
  });

  if (
    !isVisible ||
    !colorMap ||
    !colorMap._range ||
    colorMap._range.type !== "percentage"
  ) {
    console.log("PercentageRangeLegend: Not rendering due to conditions");
    return null;
  }

  const { percentageRanges } = colorMap._range;

  console.log(
    "PercentageRangeLegend: About to render with ranges:",
    percentageRanges
  );

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    border: "2px solid rgba(0,0,0,0.2)",
    color: "white",
  };

  const headerStyle = {
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  const getDatasetTitle = () => {
    switch (currentDataset) {
      case "pobreza":
        return "Pobreza";
      case "pobrezaModerada":
        return "Pobreza Moderada";
      case "pobrezaExtrema":
        return "Pobreza Extrema";
      default:
        return "Porcentaje";
    }
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            backgroundColor: "#1E3C20",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "11px",
              color: "white",
            }}
          >
            {getDatasetTitle()}
          </div>
          {percentageRanges.map((range, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
                fontSize: "11px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "14px",
                  backgroundColor: range.color,
                  marginRight: "8px",
                  border: "1px solid #999",
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#333" }}>{range.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para categorías (marginación)
const CategoricalLegend = ({ colorMap, isVisible, currentDataset }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log("CategoricalLegend called:", {
    colorMap,
    isVisible,
    currentDataset,
  });

  if (
    !isVisible ||
    !colorMap ||
    !colorMap._range ||
    colorMap._range.type !== "categorical"
  ) {
    console.log("CategoricalLegend: Not rendering due to conditions");
    return null;
  }

  const { categories } = colorMap._range;

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    border: "2px solid rgba(0,0,0,0.2)",
    color: "white",
  };

  const headerStyle = {
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  const getDatasetTitle = () => {
    switch (currentDataset) {
      case "marginacion":
        return "Grado de Marginación";
      default:
        return "Categorías";
    }
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            border: "1px solid #ddd",
            backgroundColor: "#1E3C20",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "11px",
              color: "white",
            }}
          >
            {getDatasetTitle()}
          </div>
          {categories.map((category, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "6px",
                fontSize: "11px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "14px",
                  backgroundColor: category.color,
                  marginRight: "8px",
                  border: "1px solid #999",
                  borderRadius: "2px",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#333" }}>{category.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda retráctil en esquina inferior derecha (para otros datasets)
const ColorLegend = ({ colorMap, isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "200px",
    border: "2px solid rgba(0,0,0,0.2)",
    color: "white",
  };

  const headerStyle = {
    padding: "8px 12px",
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
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            maxHeight: "500px",
            overflowY: "auto",
            border: "1px solid #ddd",
            backgroundColor: "#1E3C20",
            scrollbarWidth: "thin",
          }}
        >
          {Object.entries(colorMap)
            .filter(([key]) => key !== "_range") // Excluir metadatos de rango
            .map(([item, color]) => (
              <div
                key={item}
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
                ></div>
                <span style={{ lineHeight: "1.2" }}>{item}</span>
              </div>
            ))}
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
    coordinateDiv.style.bottom = "18px";
    coordinateDiv.style.right = "80px"; // A la izquierda de donde está la escala
    coordinateDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    coordinateDiv.style.padding = "2px";
    coordinateDiv.style.border = "2px solid rgba(0, 0, 0, 0.26)";
    coordinateDiv.style.borderRadius = "0px";
    coordinateDiv.style.font = "10px, Inter, sans-serif";
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

// Componente para el control de capas agrupadas con funcionalidad extendida
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  poblacion,
  pobreza,
  pobrezaModerada,
  pobrezaExtrema,
  marginacion,
  onColorMapChange,
  onLegendVisibilityChange,
  tooltipsEnabled,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState(
    "Topográfico (OpenTopoMap)"
  );

  useEffect(() => {
    // Limpiar capas anteriores (excepto capas base)
    Object.entries(layers).forEach(([key, layer]) => {
      if (key !== "baseLayers" && layer && layer.remove) {
        try {
          map.removeLayer(layer);
        } catch (e) {
          // La capa podría no estar en el mapa, ignorar error
        }
      }
    });

    const newLayers = {};

    // Crear panes personalizados para controlar el orden de las capas
    if (!map.getPane("vectorPane")) {
      map.createPane("vectorPane");
      map.getPane("vectorPane").style.zIndex = 400; // Capas vectoriales debajo
    }

    if (!map.getPane("rasterPane")) {
      map.createPane("rasterPane");
      map.getPane("rasterPane").style.zIndex = 450; // Capas raster encima
    }

    // Capas base
    const baseLayers = {
      "Topográfico (OpenTopoMap)": L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
          maxZoom: 17,
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

    // Agregar capa base activa por defecto
    baseLayers[activeBaseLayer].addTo(map);

    // Zona de Estudio
    if (area) {
      newLayers.area = L.geoJSON(area, {
        style: { color: "black", weight: 6, fillOpacity: 0 },
      });
      if (activeLayers.area) {
        newLayers.area.addTo(map);
      }
    }

    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 3, fillOpacity: 0 },
      });
      if (activeLayers.paisajes) {
        newLayers.paisajes.addTo(map);
      }
    }

    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 1, fillOpacity: 0 },
      });
      if (activeLayers.municipios) {
        newLayers.municipios.addTo(map);
      }
    }

    // Capas de Interés - Población
    if (poblacion) {
      // Generar mapa de colores para el campo POB_TOT
      const poblacionValues = poblacion.features
        .map((f) => f.properties.POB_TOT)
        .filter((v) => v != null && !isNaN(v));
      const newColorMap = generatePoblacionColorPalette(poblacionValues);

      newLayers.poblacion = L.geoJSON(poblacion, {
        pane: "vectorPane", // Asignar al pane vectorial
        style: (feature) => {
          const poblacionValue = feature.properties.POB_TOT;
          return {
            fillColor: newColorMap[poblacionValue] || "#CCCCCC",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: opacity.poblacion || 1,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;

            // Configurar tooltip al hacer hover si está habilitado
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                layer.bindTooltip(
                  `
                  <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
                  <strong>Población Total:</strong> ${props.POB_TOT || "N/A"}
                  `,
                  {
                    permanent: false,
                    direction: "auto",
                    className: "custom-tooltip",
                  }
                );
              } else {
                layer.unbindTooltip();
              }
            };

            bindTooltipIfEnabled();

            // Reconfigurar tooltip cuando cambie el estado
            layer.bindTooltipIfEnabled = bindTooltipIfEnabled;
          }
        },
      });

      // Solo agregar al mapa si está activa, pero siempre crear la capa para poder togglearla
      if (activeLayers.poblacion) {
        newLayers.poblacion.addTo(map);
        if (onColorMapChange) {
          onColorMapChange(newColorMap);
        }
        if (onLegendVisibilityChange) {
          onLegendVisibilityChange(true);
        }
      }
    }

    // Capas de Interés - Pobreza
    if (pobreza) {
      const pobrezaValues = pobreza.features
        .map((f) => f.properties.POBR20)
        .filter((v) => v != null && !isNaN(v));
      const newColorMap = generatePobrezaColorPalette(pobrezaValues);

      newLayers.pobreza = L.geoJSON(pobreza, {
        pane: "vectorPane",
        style: (feature) => {
          const pobrezaValue = feature.properties.POBR20;
          return {
            fillColor: newColorMap[pobrezaValue] || "#CCCCCC",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: opacity.pobreza || 1,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                layer.bindTooltip(
                  `
                  <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
                  <strong>Pobreza 2020:</strong> ${props.POBR20 || "N/A"}
                  `,
                  {
                    permanent: false,
                    direction: "auto",
                    className: "custom-tooltip",
                  }
                );
              } else {
                layer.unbindTooltip();
              }
            };
            bindTooltipIfEnabled();
            layer.bindTooltipIfEnabled = bindTooltipIfEnabled;
          }
        },
      });

      if (activeLayers.pobreza) {
        newLayers.pobreza.addTo(map);
      }
    }

    // Capas de Interés - Pobreza Moderada
    if (pobrezaModerada) {
      const pobrezaModeradaValues = pobrezaModerada.features
        .map((f) => f.properties.POB_M20)
        .filter((v) => v != null && !isNaN(v));
      const newColorMap = generatePobrezaColorPalette(pobrezaModeradaValues);

      newLayers.pobrezaModerada = L.geoJSON(pobrezaModerada, {
        pane: "vectorPane",
        style: (feature) => {
          const pobrezaModeradaValue = feature.properties.POB_M20;
          return {
            fillColor: newColorMap[pobrezaModeradaValue] || "#CCCCCC",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: opacity.pobrezaModerada || 1,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                layer.bindTooltip(
                  `
                  <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
                  <strong>Pobreza Moderada 2020:</strong> ${
                    props.POB_M20 || "N/A"
                  }
                  `,
                  {
                    permanent: false,
                    direction: "auto",
                    className: "custom-tooltip",
                  }
                );
              } else {
                layer.unbindTooltip();
              }
            };
            bindTooltipIfEnabled();
            layer.bindTooltipIfEnabled = bindTooltipIfEnabled;
          }
        },
      });

      if (activeLayers.pobrezaModerada) {
        newLayers.pobrezaModerada.addTo(map);
      }
    }

    // Capas de Interés - Pobreza Extrema
    if (pobrezaExtrema) {
      const pobrezaExtremaValues = pobrezaExtrema.features
        .map((f) => f.properties.POB_E20)
        .filter((v) => v != null && !isNaN(v));
      const newColorMap = generatePobrezaColorPalette(pobrezaExtremaValues);

      newLayers.pobrezaExtrema = L.geoJSON(pobrezaExtrema, {
        pane: "vectorPane",
        style: (feature) => {
          const pobrezaExtremaValue = feature.properties.POB_E20;
          return {
            fillColor: newColorMap[pobrezaExtremaValue] || "#CCCCCC",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: opacity.pobrezaExtrema || 1,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                layer.bindTooltip(
                  `
                  <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
                  <strong>Pobreza Extrema 2020:</strong> ${
                    props.POB_E20 || "N/A"
                  }
                  `,
                  {
                    permanent: false,
                    direction: "auto",
                    className: "custom-tooltip",
                  }
                );
              } else {
                layer.unbindTooltip();
              }
            };
            bindTooltipIfEnabled();
            layer.bindTooltipIfEnabled = bindTooltipIfEnabled;
          }
        },
      });

      if (activeLayers.pobrezaExtrema) {
        newLayers.pobrezaExtrema.addTo(map);
      }
    }

    // Capas de Interés - Marginación
    if (marginacion) {
      const marginacionValues = marginacion.features
        .map((f) => f.properties.GM_2020)
        .filter((v) => v != null);
      const newColorMap = generateMarginacionColorPalette(marginacionValues);

      newLayers.marginacion = L.geoJSON(marginacion, {
        pane: "vectorPane",
        style: (feature) => {
          const marginacionValue = feature.properties.GM_2020;
          return {
            fillColor: newColorMap[marginacionValue] || "#CCCCCC",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: opacity.marginacion || 1,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                layer.bindTooltip(
                  `
                  <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
                  <strong>Grado de Marginación 2020:</strong> ${
                    props.GM_2020 || "N/A"
                  }
                  `,
                  {
                    permanent: false,
                    direction: "auto",
                    className: "custom-tooltip",
                  }
                );
              } else {
                layer.unbindTooltip();
              }
            };
            bindTooltipIfEnabled();
            layer.bindTooltipIfEnabled = bindTooltipIfEnabled;
          }
        },
      });

      if (activeLayers.marginacion) {
        newLayers.marginacion.addTo(map);
      }
    }

    newLayers.baseLayers = baseLayers;
    setLayers(newLayers);

    // Configurar el zoom inicial basado en el área
    if (area && area.features && area.features.length > 0) {
      const layer = L.geoJSON(area);
      map.fitBounds(layer.getBounds());
    }
  }, [
    map,
    area,
    paisajes,
    municipios,
    poblacion,
    pobreza,
    pobrezaModerada,
    pobrezaExtrema,
    marginacion,
    activeLayers,
    activeBaseLayer,
    tooltipsEnabled,
    opacity, // Agregamos opacity como dependencia
  ]);

  // useEffect separado para manejar las leyendas sin interferir con las capas
  useEffect(() => {
    const demograficLayers = [
      "poblacion",
      "pobreza",
      "pobrezaModerada",
      "pobrezaExtrema",
      "marginacion",
    ];

    const activeCount = demograficLayers.filter(
      (layer) => activeLayers[layer]
    ).length;

    if (activeCount === 0) {
      // No hay capas demográficas activas
      if (onColorMapChange) {
        onColorMapChange({});
      }
      if (onLegendVisibilityChange) {
        onLegendVisibilityChange(false);
      }
      return;
    }

    // Hay al menos una capa demográfica activa, encontrar la primera
    const firstActiveLayer = demograficLayers.find((key) => activeLayers[key]);

    let data, field, colorGenerator;
    switch (firstActiveLayer) {
      case "poblacion":
        data = poblacion;
        field = "POB_TOT";
        colorGenerator = generatePoblacionColorPalette;
        break;
      case "pobreza":
        data = pobreza;
        field = "POBR20";
        colorGenerator = generatePobrezaColorPalette;
        break;
      case "pobrezaModerada":
        data = pobrezaModerada;
        field = "POB_M20";
        colorGenerator = generatePobrezaColorPalette;
        break;
      case "pobrezaExtrema":
        data = pobrezaExtrema;
        field = "POB_E20";
        colorGenerator = generatePobrezaColorPalette;
        break;
      case "marginacion":
        data = marginacion;
        field = "GM_2020";
        colorGenerator = generateMarginacionColorPalette;
        break;
    }

    if (data && data.features && onColorMapChange && onLegendVisibilityChange) {
      const values = data.features
        .map((f) => f.properties[field])
        .filter((v) => v != null);
      const newColorMap = colorGenerator(values);
      onColorMapChange(newColorMap);
      onLegendVisibilityChange(true);
    }
  }, [
    activeLayers,
    poblacion,
    pobreza,
    pobrezaModerada,
    pobrezaExtrema,
    marginacion,
    onColorMapChange,
    onLegendVisibilityChange,
  ]);

  // Actualizar tooltips cuando cambie el estado
  useEffect(() => {
    Object.values(layers).forEach((layer) => {
      if (layer && layer.eachLayer) {
        layer.eachLayer((subLayer) => {
          if (subLayer.bindTooltipIfEnabled) {
            subLayer.bindTooltipIfEnabled();
          }
        });
      }
    });
  }, [tooltipsEnabled, layers]);

  const toggleLayer = (layerKey) => {
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

    // Controlar visibilidad de la leyenda para las capas demográficas
    const demograficLayers = [
      "poblacion",
      "pobreza",
      "pobrezaModerada",
      "pobrezaExtrema",
      "marginacion",
    ];
    if (
      demograficLayers.includes(layerKey) &&
      onLegendVisibilityChange &&
      onColorMapChange
    ) {
      const anyDemograficActive = demograficLayers.some(
        (key) => newActiveLayers[key]
      );

      if (anyDemograficActive) {
        // Al menos una capa demográfica activa, mostrar leyenda de la primera activa
        const firstActiveLayer = demograficLayers.find(
          (key) => newActiveLayers[key]
        );
        let data, field, colorGenerator;

        switch (firstActiveLayer) {
          case "poblacion":
            data = poblacion;
            field = "POB_TOT";
            colorGenerator = generatePoblacionColorPalette;
            break;
          case "pobreza":
            data = pobreza;
            field = "POBR20";
            colorGenerator = generatePobrezaColorPalette;
            break;
          case "pobrezaModerada":
            data = pobrezaModerada;
            field = "POB_M20";
            colorGenerator = generatePobrezaColorPalette;
            break;
          case "pobrezaExtrema":
            data = pobrezaExtrema;
            field = "POB_E20";
            colorGenerator = generatePobrezaColorPalette;
            break;
          case "marginacion":
            data = marginacion;
            field = "GM_2020";
            colorGenerator = generateMarginacionColorPalette;
            break;
        }

        if (data && data.features) {
          const values = data.features
            .map((f) => f.properties[field])
            .filter((v) => v != null);
          const newColorMap = colorGenerator(values);
          onColorMapChange(newColorMap);
          onLegendVisibilityChange(true);
        }
      } else {
        // Ninguna capa demográfica activa, ocultar leyenda
        onColorMapChange({});
        onLegendVisibilityChange(false);
      }
    }
  };

  const changeBaseLayer = (newBaseLayer) => {
    // Remover capa base actual
    if (layers.baseLayers && layers.baseLayers[activeBaseLayer]) {
      map.removeLayer(layers.baseLayers[activeBaseLayer]);
    }

    // Agregar nueva capa base
    if (layers.baseLayers && layers.baseLayers[newBaseLayer]) {
      layers.baseLayers[newBaseLayer].addTo(map);
      setActiveBaseLayer(newBaseLayer);
    }
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));

    const layer = layers[layerKey];
    if (layer && layer.setStyle) {
      layer.setStyle({ fillOpacity: newOpacity });
    }
  };

  const controlStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: "300px",
  };

  const headerStyle = {
    fontSize: "12px",
    padding: "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
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
          checked={activeLayers[layerKey] || false}
          onChange={() => toggleLayer(layerKey)}
        />
        <span style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}>
          {title}
        </span>
        {showDownload && (
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
            onClick={() => downloadGeoJSON(data, title.toLowerCase())}
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
            style={{ fontSize: "10px", color: "white", marginBottom: "3px" }}
          >
            Opacidad: {Math.round(opacity[layerKey] * 100)}%
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity[layerKey]}
            onChange={(e) =>
              handleOpacityChange(layerKey, parseFloat(e.target.value))
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
  );

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Capas</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "12px" }}>
          {/* Capas Base */}
          <div
            style={{
              marginBottom: "15px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
            }}
          >
            <strong
              style={{
                color: "white",
                marginBottom: "8px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Capas Base
            </strong>
            <div style={{ marginLeft: "10px" }}>
              {layers.baseLayers &&
                Object.keys(layers.baseLayers).map((baseLayerName) => (
                  <div key={baseLayerName} style={{ marginBottom: "2px" }}>
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
              marginBottom: "15px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
            }}
          >
            <strong
              style={{
                color: "#2c3e50",
                marginBottom: "8px",
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
              marginBottom: "15px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
            }}
          >
            <strong
              style={{
                color: "white",
                marginBottom: "8px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Aspectos demográficos
            </strong>
            {poblacion && (
              <LayerItem
                layerKey="poblacion"
                title="Población total"
                data={poblacion}
                showOpacity={true}
              />
            )}
            {pobreza && (
              <LayerItem
                layerKey="pobreza"
                title="Pobreza"
                data={pobreza}
                showOpacity={true}
              />
            )}
            {pobrezaModerada && (
              <LayerItem
                layerKey="pobrezaModerada"
                title="Pobreza moderada"
                data={pobrezaModerada}
                showOpacity={true}
              />
            )}
            {pobrezaExtrema && (
              <LayerItem
                layerKey="pobrezaExtrema"
                title="Pobreza extrema"
                data={pobrezaExtrema}
                showOpacity={true}
              />
            )}
            {marginacion && (
              <LayerItem
                layerKey="marginacion"
                title="Grado de marginación"
                data={marginacion}
                showOpacity={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para controlar el dragging del mapa
const DraggingControl = () => {
  const map = useMap();

  useEffect(() => {
    const enableDragging = () => {
      map.dragging.enable();
    };

    map.getContainer().addEventListener("mouseleave", enableDragging);

    return () => {
      map.getContainer().removeEventListener("mouseleave", enableDragging);
    };
  }, [map]);

  return null;
};

const Poblacion = () => {
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [poblacion, setPoblacion] = useState(null);
  const [pobreza, setPobreza] = useState(null);
  const [pobrezaModerada, setPobrezaModerada] = useState(null);
  const [pobrezaExtrema, setPobrezaExtrema] = useState(null);
  const [marginacion, setMarginacion] = useState(null);
  const [colorMap, setColorMap] = useState({});
  const [showLegend, setShowLegend] = useState(true); // Activar leyenda por defecto
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    municipios: true,
    paisajes: true,
    poblacion: true,
    pobreza: false,
    pobrezaModerada: false,
    pobrezaExtrema: false,
    marginacion: false,
  });
  const [opacity, setOpacity] = useState({
    area: 1,
    municipios: 1,
    paisajes: 1,
    poblacion: 1,
    pobreza: 1,
    pobrezaModerada: 1,
    pobrezaExtrema: 1,
    marginacion: 1,
  });

  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  // Activar automáticamente la leyenda cuando hay datos válidos
  useEffect(() => {
    if (colorMap && Object.keys(colorMap).length > 0 && colorMap._range) {
      setShowLegend(true);
    }
  }, [colorMap]);

  useEffect(() => {
    fetch("/AREA.geojson")
      .then((res) => res.json())
      .then(setArea)
      .catch(console.error);
    fetch("/PAISAJES.geojson")
      .then((res) => res.json())
      .then(setPaisajes)
      .catch(console.error);
    fetch("/MUNICIPIOS.geojson")
      .then((res) => res.json())
      .then(setMunicipios)
      .catch(console.error);
    fetch("/POBREZA.geojson")
      .then((res) => res.json())
      .then((data) => {
        setPoblacion(data);
        setPobreza(data);
        setPobrezaModerada(data);
        setPobrezaExtrema(data);
      })
      .catch(console.error);
    fetch("/MARGINACION.geojson")
      .then((res) => res.json())
      .then(setMarginacion)
      .catch(console.error);
  }, []);

  return (
    <MapContainer
      center={[16.67566, -96.28311]}
      zoom={10}
      scrollWheelZoom={true}
      dragging={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <InfoControl
        onToggleTooltips={toggleTooltips}
        tooltipsEnabled={tooltipsEnabled}
      />
      <DraggingControl />
      <GroupedLayerControl
        area={area}
        paisajes={paisajes}
        municipios={municipios}
        poblacion={poblacion}
        pobreza={pobreza}
        pobrezaModerada={pobrezaModerada}
        pobrezaExtrema={pobrezaExtrema}
        marginacion={marginacion}
        onColorMapChange={setColorMap}
        onLegendVisibilityChange={setShowLegend}
        tooltipsEnabled={tooltipsEnabled}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
      />
      <CoordinateControl />
      <ScaleControl />

      {/* Seleccionar el tipo de leyenda según la capa activa y el tipo de datos */}
      {(() => {
        console.log("Legend rendering check:", {
          showLegend,
          colorMapExists: !!colorMap,
          colorMapKeys: Object.keys(colorMap || {}),
          colorMapRange: colorMap?._range,
          activeLayers,
        });

        return showLegend && colorMap && Object.keys(colorMap).length > 0 ? (
          <>
            {(() => {
              // Detectar el tipo de leyenda basándose en el colorMap actual
              if (colorMap._range) {
                console.log("ColorMap range detected:", colorMap._range);

                if (colorMap._range.type === "percentage") {
                  // Leyenda de rangos de porcentaje (pobreza)
                  const currentDataset = activeLayers.pobrezaExtrema
                    ? "pobrezaExtrema"
                    : activeLayers.pobrezaModerada
                    ? "pobrezaModerada"
                    : activeLayers.pobreza
                    ? "pobreza"
                    : "pobreza";

                  console.log(
                    "Rendering PercentageRangeLegend for:",
                    currentDataset
                  );
                  return (
                    <PercentageRangeLegend
                      colorMap={colorMap}
                      isVisible={showLegend}
                      currentDataset={currentDataset}
                    />
                  );
                } else if (colorMap._range.type === "categorical") {
                  // Leyenda categórica (marginación)
                  console.log("Rendering CategoricalLegend");
                  return (
                    <CategoricalLegend
                      colorMap={colorMap}
                      isVisible={showLegend}
                      currentDataset="marginacion"
                    />
                  );
                } else {
                  // Leyenda de rampa continua (población)
                  console.log("Rendering ColorRampLegend");
                  return (
                    <ColorRampLegend
                      colorMap={colorMap}
                      isVisible={showLegend}
                      currentDataset="poblacion"
                    />
                  );
                }
              } else {
                // Leyenda por defecto (discreta)
                console.log("Rendering default ColorLegend");
                return (
                  <ColorLegend colorMap={colorMap} isVisible={showLegend} />
                );
              }
            })()}
          </>
        ) : null;
      })()}
    </MapContainer>
  );
};

export default Poblacion;
