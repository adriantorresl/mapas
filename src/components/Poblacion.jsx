import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

// Función para cargar archivos raster GeoTIFF
const loadGeoTIFF = async (url) => {
  try {
    // Para archivos TIFF, necesitamos usar una aproximación diferente
    // Por ahora, retornamos null para indicar que no se puede cargar
    console.warn(`GeoTIFF loading not implemented for ${url}`);
    return null;
  } catch (error) {
    console.error("Error loading GeoTIFF:", error);
    return null;
  }
};

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

// Componente de simbología retráctil en esquina superior derecha (formato Localización)
const ColorLegend = ({
  colorMap,
  isVisible,
  currentDataset,
  layerControlCollapsed,
  layerControlWidth,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado
    : "270px"; // Se mueve para evitar superposición

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

  const getDatasetTitle = () => {
    switch (currentDataset) {
      case "poblacion":
        return "Población Total";
      case "pobreza":
        return "Pobreza";
      case "pobrezaModerada":
        return "Pobreza Moderada";
      case "pobrezaExtrema":
        return "Pobreza Extrema";
      case "marginacion":
        return "Grado de Marginación";
      case "concentracionPoblacion":
        return "Concentración de Población";
      default:
        return "Valores";
    }
  };

  const renderLegendContent = () => {
    if (colorMap._range) {
      if (colorMap._range.type === "percentage") {
        // Leyenda de rangos de porcentaje (pobreza)
        const { percentageRanges } = colorMap._range;
        return (
          <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "12px",
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
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: range.color,
                    marginRight: "8px",
                    border: "1px solid #999",
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ lineHeight: "1.2" }}>{range.label}</span>
              </div>
            ))}
          </div>
        );
      } else if (colorMap._range.type === "categorical") {
        // Leyenda categórica (marginación)
        const { categories } = colorMap._range;
        return (
          <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "12px",
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
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: category.color,
                    marginRight: "8px",
                    border: "1px solid #999",
                    borderRadius: "2px",
                    flexShrink: 0,
                  }}
                />
                <span style={{ lineHeight: "1.2" }}>{category.label}</span>
              </div>
            ))}
          </div>
        );
      } else {
        // Leyenda de rampa continua (población)
        const { min, max, colors } = colorMap._range;
        const gradientColors = colors.join(", ");
        return (
          <div>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                fontSize: "12px",
              }}
            >
              {getDatasetTitle()}
            </div>
            <div
              style={{
                height: "20px",
                background: `linear-gradient(to right, ${gradientColors})`,
                border: "1px solid #999",
                borderRadius: "2px",
                margin: "8px 0",
              }}
            ></div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                color: "white",
                marginTop: "4px",
              }}
            >
              <span>{min.toLocaleString()}</span>
              <span>{max.toLocaleString()}</span>
            </div>
          </div>
        );
      }
    } else {
      // Leyenda por defecto (discreta)
      return (
        <div>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            {getDatasetTitle()}
          </div>
          {Object.entries(colorMap)
            .filter(([key]) => key !== "_range")
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
      );
    }
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "10px", maxHeight: "300px", overflowY: "auto" }}>
          {renderLegendContent()}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para concentración de población (raster)
const ConcentracionPoblacionLegend = ({
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
    ? "105px" // Posición normal cuando está colapsado
    : "270px"; // Se mueve para evitar superposición

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

  // Colores que corresponden al colorMap del RasterOverlay
  const colorGradient = ["#fef9ae", "#fd9242", "#ff0094", "#0602f2", "#040058"];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "10px" }}>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Concentración de Población
          </div>
          <div
            style={{
              height: "20px",
              background: `linear-gradient(to right, ${colorGradient.join(", ")})`,
              border: "1px solid #999",
              borderRadius: "2px",
              margin: "8px 0",
            }}
          ></div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "white",
              marginTop: "4px",
            }}
          >
            <span>Baja</span>
            <span>Alta</span>
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

// Componente removido - popups ahora funcionan por defecto con clic

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
  concentracionPoblacion,
  onColorMapChange,
  onLegendVisibilityChange,
  onControlStateChange,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Topográfico (OSM)");

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

            // Configurar popup al hacer clic
            layer.bindPopup(
              `
              <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
              <strong>Población Total:</strong> ${props.POB_TOT || "N/A"}
              `,
              {
                className: "custom-popup",
              }
            );
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
            layer.bindPopup(
              `
              <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
              <strong>Pobreza 2020:</strong> ${props.POBR20 || "N/A"}
              `,
              {
                className: "custom-popup",
              }
            );
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
            layer.bindPopup(
              `
              <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
              <strong>Pobreza Moderada 2020:</strong> ${props.POB_M20 || "N/A"}
              `,
              {
                className: "custom-popup",
              }
            );
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
            layer.bindPopup(
              `
              <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
              <strong>Pobreza Extrema 2020:</strong> ${props.POB_E20 || "N/A"}
              `,
              {
                className: "custom-popup",
              }
            );
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
            layer.bindPopup(
              `
              <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
              <strong>Grado de Marginación 2020:</strong> ${
                props.GM_2020 || "N/A"
              }
              `,
              {
                className: "custom-popup",
              }
            );
          }
        },
      });

      if (activeLayers.marginacion) {
        newLayers.marginacion.addTo(map);
      }
    }

    // Capa Raster - Concentración de Población
    // Ahora manejamos los archivos TIFF usando RasterOverlay especializado
    // La lógica de creación se maneja en el componente RasterOverlay

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
    concentracionPoblacion,
    activeLayers,
    activeBaseLayer,
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
      "concentracionPoblacion",
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

  // Quitar el useEffect para actualizar tooltips ya que ahora solo usamos popups
  // que funcionan por defecto al hacer clic

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
      "concentracionPoblacion",
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
          case "concentracionPoblacion":
            // Para capas raster, no mostramos leyenda de datos
            onColorMapChange({});
            onLegendVisibilityChange(false);
            return;
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
    if (layer) {
      if (layer.setStyle) {
        // Para capas vectoriales
        layer.setStyle({ fillOpacity: newOpacity });
      } else if (layer.setOpacity) {
        // Para capas raster
        layer.setOpacity(newOpacity);
      }
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
              marginBottom: "15px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
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
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
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
            {concentracionPoblacion && (
              <LayerItem
                layerKey="concentracionPoblacion"
                title="Concentración de población"
                data={null}
                showDownload={false}
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
    // Habilitar dragging por defecto después de que se monte el mapa
    setTimeout(() => {
      map.dragging.enable();
    }, 100);
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
  const [concentracionPoblacion, setConcentracionPoblacion] = useState(null);
  const [colorMap, setColorMap] = useState({});
  const [showLegend, setShowLegend] = useState(true); // Activar leyenda por defecto
  const [layerControlState, setLayerControlState] = useState({
    isCollapsed: true,
    width: 80,
  });
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false); // Mantenemos para compatibilidad pero no se usa
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    municipios: true,
    paisajes: true,
    poblacion: true,
    pobreza: false,
    pobrezaModerada: false,
    pobrezaExtrema: false,
    marginacion: false,
    concentracionPoblacion: false,
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
    concentracionPoblacion: 0.7,
  });

  const toggleTooltips = () => {
    // Función removida - ya no es necesaria
  };

  // Activar automáticamente la leyenda cuando hay datos válidos
  useEffect(() => {
    if (colorMap && Object.keys(colorMap).length > 0 && colorMap._range) {
      setShowLegend(true);
    }
  }, [colorMap]);

  // Determinar el dataset actual para la leyenda
  const getCurrentDataset = () => {
    if (activeLayers.pobrezaExtrema) return "pobrezaExtrema";
    if (activeLayers.pobrezaModerada) return "pobrezaModerada";
    if (activeLayers.pobreza) return "pobreza";
    if (activeLayers.marginacion) return "marginacion";
    if (activeLayers.concentracionPoblacion) return "concentracionPoblacion";
    if (activeLayers.poblacion) return "poblacion";
    return "poblacion";
  };

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
    
    // Habilitar archivo raster de concentración de población
    // RasterOverlay maneja la verificación y carga del archivo
    setConcentracionPoblacion("ConcentracionPoblacion.tif");
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
        poblacion={poblacion}
        pobreza={pobreza}
        pobrezaModerada={pobrezaModerada}
        pobrezaExtrema={pobrezaExtrema}
        marginacion={marginacion}
        concentracionPoblacion={concentracionPoblacion}
        onColorMapChange={setColorMap}
        onLegendVisibilityChange={setShowLegend}
        onControlStateChange={setLayerControlState}
        activeLayers={activeLayers}
        setActiveLayers={setActiveLayers}
        opacity={opacity}
        setOpacity={setOpacity}
      />
      <RasterOverlay
        fileName="ConcentracionPoblacion.tif"
        colorMap={["#fef9ae", "#fd9242", "#ff0094", "#0602f2", "#040058"]}
        baseUrl="/"
        continuous={true}
        setError={() => {}}
        setLoading={() => {}}
        onPixelValue={() => {}}
        overlayOpacity={opacity.concentracionPoblacion}
        visible={activeLayers.concentracionPoblacion}
      />
      <ColorLegend
        colorMap={colorMap}
        isVisible={showLegend && !activeLayers.concentracionPoblacion}
        currentDataset={getCurrentDataset()}
        layerControlCollapsed={layerControlState.isCollapsed}
        layerControlWidth={layerControlState.width}
      />
      <ConcentracionPoblacionLegend
        isVisible={activeLayers.concentracionPoblacion}
        layerControlCollapsed={layerControlState.isCollapsed}
        layerControlWidth={layerControlState.width}
      />
      <CoordinateControl />
      <ScaleControl />
    </MapContainer>
  );
};

export default Poblacion;
