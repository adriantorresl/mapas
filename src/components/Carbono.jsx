import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";
import { color } from "framer-motion";

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
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error(`Error descargando ${displayName}:`, error);
    alert(`Error al descargar ${displayName}`);
  }
};

// Componente para crear pane personalizado para raster
const CustomPaneCreator = ({ paneName }) => {
  const map = useMap();

  useEffect(() => {
    // Crear pane personalizado si no existe
    if (!map.getPane(paneName)) {
      const rasterPane = map.createPane(paneName);
      rasterPane.style.zIndex = 450; // Mayor que overlayPane (400) pero menor que popupPane (600)
      console.log(`Created custom pane: ${paneName} with zIndex 450`);
    }
  }, [map, paneName]);

  return null;
};

// Componente para mostrar coordenadas
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
    coordinateDiv.style.fontFamily = "Inter, sans-serif"; // Inter como pediste
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

// Componente para mostrar la escala
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

// Componente para mostrar el valor del pixel
const PixelValueDisplay = ({ pixelValue }) => {
  if (!pixelValue) return null;

  const displayStyle = {
    color: "white",
    position: "absolute",
    bottom: "45px", // Arriba de la escala y coordenadas
    left: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    padding: "8px 12px",
    minWidth: "180px",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: "6px",
    fontSize: "12px",
    color: "white",
  };

  const valueStyle = {
    marginBottom: "3px",
    display: "flex",
    justifyContent: "space-between",
  };

  const labelStyle = {
    color: "white",
  };

  const valueNumberStyle = {
    fontWeight: "bold",
    color: "white",
  };

  return (
    <div style={displayStyle}>
      <div style={headerStyle}>Valor del pixel</div>
      <div style={valueStyle}>
        <span style={labelStyle}>Carbono:</span>
        <span style={valueNumberStyle}>{pixelValue.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Componente de leyenda para Balance de Carbono (2018)
const Carbono2018Legend = ({ isVisible, layerControlCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado
    : "280px"; // Espacio suficiente para evitar superposición con el control expandido

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
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    padding: "10px 15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Categorías basadas en CO2_Tendencia_2018.sld
  const categories = [
    { name: "70,000 - 350,000", color: "#fde725" },
    { name: "350,000 - 700,000", color: "#5dc963" },
    { name: "700,000 - 1,050,000", color: "#21908d" },
    { name: "1,050,000 - 1,500,000", color: "#3b528b" },
    { name: "1,500,000 - 2,000,000", color: "#440154" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "10px 15px", paddingTop: "0" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            Balance (Ton CO₂/ha)
          </div>
          {categories.map((category) => (
            <div
              key={category.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: category.color,
                    border: "1px solid white",
                    marginRight: "8px",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                  {category.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para raster de Tendencia de CO2
const TendenciaCarbonoLegend = ({ isVisible, layerControlCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado
    : "280px"; // Espacio suficiente para evitar superposición con el control expandido

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
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    padding: "10px 15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Categorías discretas para tendencia de CO2 basada en Tendencia_CO2.sld
  const categories = [
    { value: 1, color: "#bf1007", label: "Alta" },
    { value: 2, color: "#000000", label: "Muy alta" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "10px 15px", paddingTop: "0" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            Tendencia CO₂
          </div>
          {categories.map((category) => (
            <div
              key={category.value}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: category.color,
                    border: "1px solid white",
                    marginRight: "8px",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                  {category.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para Tendencia de CO2 (2100)
const TendenciaCarbono2100Legend = ({ isVisible, layerControlCollapsed }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  // Calcular posición dinámica basada en el estado del control de capas
  const rightPosition = layerControlCollapsed
    ? "105px" // Posición normal cuando está colapsado
    : "280px"; // Espacio suficiente para evitar superposición con el control expandido

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
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    padding: "10px 15px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Categorías basadas en CO2_Tendencia_2100.sld
  const categories = [
    { name: "60,000 - 70,000", color: "#e80809" },
    { name: "70,000 - 350,000", color: "#fde725" },
    { name: "350,000 - 700,000", color: "#5dc963" },
    { name: "700,000 - 1,050,000", color: "#21908d" },
    { name: "1,050,000 - 1,500,000", color: "#3b528b" },
    { name: "1,500,000 - 2,250,000", color: "#440154" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "10px 15px", paddingTop: "0" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            Tendencia (2100)
          </div>
          {categories.map((category) => (
            <div
              key={category.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: category.color,
                    border: "1px solid white",
                    marginRight: "8px",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: "12px", lineHeight: "1.2" }}>
                  {category.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para el control de capas agrupadas
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  cuencas,
  co2Cuenca,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  isCollapsed,
  setIsCollapsed,
}) => {
  const map = useMap();
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Hillshade (ESRI)");

  useEffect(() => {
    const baseLayers = {
      "Hillshade (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
        }
      ),
      "Satelital (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
        }
      ),
      "Calles (OpenStreetMap)": L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ),
    };

    // Agregar capa base activa
    const currentBaseLayer = baseLayers[activeBaseLayer];
    if (currentBaseLayer && !map.hasLayer(currentBaseLayer)) {
      // Remover otras capas base
      Object.values(baseLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      currentBaseLayer.addTo(map);
    }

    const newLayers = {};

    // Área de estudio
    if (area) {
      newLayers.area = L.geoJSON(area, {
        style: { color: "black", weight: 6, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = "<strong>Área de estudio</strong><br>";
            Object.keys(feature.properties).forEach((key) => {
              if (
                feature.properties[key] !== null &&
                feature.properties[key] !== undefined
              ) {
                popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
              }
            });
            layer.bindPopup(popupContent);
          }
        },
      });
      if (activeLayers.area) {
        newLayers.area.addTo(map);
      }
    }

    // Paisajes
    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 4, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = "<strong>Paisajes bioculturales</strong><br>";
            Object.keys(feature.properties).forEach((key) => {
              if (
                feature.properties[key] !== null &&
                feature.properties[key] !== undefined
              ) {
                popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
              }
            });
            layer.bindPopup(popupContent);
          }
        },
      });
      if (activeLayers.paisajes) {
        newLayers.paisajes.addTo(map);
      }
    }

    // Municipios
    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 2, fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = "<strong>Municipios</strong><br>";
            Object.keys(feature.properties).forEach((key) => {
              if (
                feature.properties[key] !== null &&
                feature.properties[key] !== undefined
              ) {
                popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
              }
            });
            layer.bindPopup(popupContent);
          }
        },
      });
      if (activeLayers.municipios) {
        newLayers.municipios.addTo(map);
      }
    }

    // Cuencas
    if (cuencas) {
      newLayers.cuencas = L.geoJSON(cuencas, {
        style: {
          color: "#0f42b4", // Borde azul según SLD
          weight: 2,
          fillOpacity: 0, // Transparente según SLD
          fillColor: "#729b6f", // Color de relleno (aunque transparente)
        },
        onEachFeature: (feature, layer) => {
          // Agregar etiquetas con ID_WS según el SLD
          const idWs = feature.properties.ID_WS || "N/A";
          if (idWs !== "N/A") {
            const center = layer.getBounds().getCenter();
            const label = L.marker(center, {
              icon: L.divIcon({
                className: "cuenca-label",
                html: `<div style="
                  font-family: 'Open Sans', sans-serif;
                  font-size: 13px;
                  color: #323232;
                  text-shadow: 3.5px 3.5px 3.5px #fffdfd, -3.5px -3.5px 3.5px #fffdfd, 3.5px -3.5px 3.5px #fffdfd, -3.5px 3.5px 3.5px #fffdfd;
                  font-weight: normal;
                  text-align: center;
                ">${idWs}</div>`,
                iconSize: [50, 20],
                iconAnchor: [25, 10],
              }),
            });

            // Guardar la referencia de la etiqueta en la capa
            layer.cuencaLabel = label;
          }

          // Popup con información
          layer.bindPopup(
            `<div style="font-family: Arial, sans-serif; font-size: 12px;">
              <strong>Cuenca:</strong><br/>
              <strong>ID:</strong> ${idWs}
            </div>`
          );
        },
      });

      // Solo agregar al mapa si la capa está activa
      if (activeLayers.cuencas) {
        newLayers.cuencas.addTo(map);
        // Agregar las etiquetas también
        newLayers.cuencas.eachLayer((sublayer) => {
          if (sublayer.cuencaLabel) {
            sublayer.cuencaLabel.addTo(map);
          }
        });
      }
    }

    // Balance de Carbono (2018) - CO2_CUENCA.geojson con campo S7
    if (co2Cuenca) {
      // Debug: mostrar todos los campos disponibles
      if (co2Cuenca.features && co2Cuenca.features[0]) {
        console.log(
          "Campos disponibles en CO2_CUENCA:",
          Object.keys(co2Cuenca.features[0].properties)
        );
      }

      const field = "S7";
      const colorCategories = {
        "70,000 - 350,000": "#fde725",
        "350,000 - 700,000": "#5dc963",
        "700,000 - 1,050,000": "#21908d",
        "1,050,000 - 1,500,000": "#3b528b",
        "1,500,000 - 2,000,000": "#440154",
      };

      newLayers.co2Cuenca = L.geoJSON(co2Cuenca, {
        style: (feature) => {
          const value = feature.properties[field];
          console.log(
            `Balance Carbono (2018) - Campo ${field}:`,
            value,
            typeof value
          );
          let color = "#666666";
          let fillColor = "#999999";

          // Convertir a número si es string
          const numValue = parseFloat(value);

          // Clasificar valores en categorías según rangos de CO2_Tendencia_2018.sld
          if (!isNaN(numValue)) {
            if (numValue <= 350000) {
              color = colorCategories["70,000 - 350,000"];
              fillColor = colorCategories["70,000 - 350,000"];
            } else if (numValue <= 700000) {
              color = colorCategories["350,000 - 700,000"];
              fillColor = colorCategories["350,000 - 700,000"];
            } else if (numValue <= 1050000) {
              color = colorCategories["700,000 - 1,050,000"];
              fillColor = colorCategories["700,000 - 1,050,000"];
            } else if (numValue <= 1500000) {
              color = colorCategories["1,050,000 - 1,500,000"];
              fillColor = colorCategories["1,050,000 - 1,500,000"];
            } else {
              color = colorCategories["1,500,000 - 2,000,000"];
              fillColor = colorCategories["1,500,000 - 2,000,000"];
            }
          } else {
            console.log(`Valor inválido para ${field}:`, value);
          }

          return {
            color: color,
            weight: 2,
            fillOpacity: 0.6,
            fillColor: fillColor,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = "<strong>Balance de Carbono (2018)</strong><br>";
            popupContent += `<strong>Valor S7:</strong> ${
              feature.properties[field] || "N/A"
            } Ton CO₂/ha<br>`;
            Object.keys(feature.properties).forEach((key) => {
              if (
                key !== field &&
                feature.properties[key] !== null &&
                feature.properties[key] !== undefined
              ) {
                popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
              }
            });
            layer.bindPopup(popupContent);
          }
        },
      });
      if (activeLayers.co2Cuenca) {
        newLayers.co2Cuenca.addTo(map);
      }
    }

    // Tendencia de CO2 (2100) - CO2_CUENCA.geojson con campo diferente
    if (co2Cuenca) {
      const field2100 = "A_2100";
      const colorCategories2100 = {
        "60,000 - 70,000": "#e80809",
        "70,000 - 350,000": "#fde725",
        "350,000 - 700,000": "#5dc963",
        "700,000 - 1,050,000": "#21908d",
        "1,050,000 - 1,500,000": "#3b528b",
        "1,500,000 - 2,250,000": "#440154",
      };

      newLayers.co2Cuenca2100 = L.geoJSON(co2Cuenca, {
        style: (feature) => {
          const value = feature.properties[field2100];
          console.log(
            `Tendencia CO2 (2100) - Campo ${field2100}:`,
            value,
            typeof value
          );
          let color = "#666666";
          let fillColor = "#999999";

          // Convertir a número si es string
          const numValue = parseFloat(value);

          // Clasificar valores en categorías según rangos de CO2_Tendencia_2100.sld
          if (!isNaN(numValue)) {
            if (numValue <= 70000) {
              color = colorCategories2100["60,000 - 70,000"];
              fillColor = colorCategories2100["60,000 - 70,000"];
            } else if (numValue <= 350000) {
              color = colorCategories2100["70,000 - 350,000"];
              fillColor = colorCategories2100["70,000 - 350,000"];
            } else if (numValue <= 700000) {
              color = colorCategories2100["350,000 - 700,000"];
              fillColor = colorCategories2100["350,000 - 700,000"];
            } else if (numValue <= 1050000) {
              color = colorCategories2100["700,000 - 1,050,000"];
              fillColor = colorCategories2100["700,000 - 1,050,000"];
            } else if (numValue <= 1500000) {
              color = colorCategories2100["1,050,000 - 1,500,000"];
              fillColor = colorCategories2100["1,050,000 - 1,500,000"];
            } else {
              color = colorCategories2100["1,500,000 - 2,250,000"];
              fillColor = colorCategories2100["1,500,000 - 2,250,000"];
            }
          } else {
            console.log(`Valor inválido para ${field2100}:`, value);
          }

          return {
            color: color,
            weight: 2,
            fillOpacity: 0.6,
            fillColor: fillColor,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = "<strong>Balance de Carbono (2100)</strong><br>";
            popupContent += `<strong>Valor A_2100:</strong> ${
              feature.properties[field2100] || "N/A"
            } Ton CO₂/ha<br>`;
            Object.keys(feature.properties).forEach((key) => {
              if (
                key !== field2100 &&
                feature.properties[key] !== null &&
                feature.properties[key] !== undefined
              ) {
                popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
              }
            });
            layer.bindPopup(popupContent);
          }
        },
      });
      if (activeLayers.co2Cuenca2100) {
        newLayers.co2Cuenca2100.addTo(map);
      }
    }

    setLayers(newLayers);

    return () => {
      Object.values(newLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
        // Limpiar etiquetas de cuencas
        if (layer.eachLayer) {
          layer.eachLayer((sublayer) => {
            if (sublayer.cuencaLabel && map.hasLayer(sublayer.cuencaLabel)) {
              map.removeLayer(sublayer.cuencaLabel);
            }
          });
        }
      });
      Object.values(baseLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [
    map,
    area,
    paisajes,
    municipios,
    cuencas,
    co2Cuenca,
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
    activeLayers.cuencas,
    activeLayers.co2Cuenca,
    activeLayers.co2Cuenca2100,
  ]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };

    if (layerKey === "rasterCO2") {
      // Manejo especial para la capa raster
      newActiveLayers[layerKey] = !activeLayers[layerKey];
      setActiveLayers(newActiveLayers);
      return;
    }

    newActiveLayers[layerKey] = !activeLayers[layerKey];
    setActiveLayers(newActiveLayers);

    const layer = layers[layerKey];
    if (layer) {
      if (newActiveLayers[layerKey]) {
        layer.addTo(map);

        // Agregar etiquetas especiales para cuencas
        if (layerKey === "cuencas") {
          layer.eachLayer((sublayer) => {
            if (sublayer.cuencaLabel) {
              sublayer.cuencaLabel.addTo(map);
            }
          });
        }
      } else {
        map.removeLayer(layer);

        // Remover etiquetas especiales para cuencas
        if (layerKey === "cuencas") {
          layer.eachLayer((sublayer) => {
            if (sublayer.cuencaLabel && map.hasLayer(sublayer.cuencaLabel)) {
              map.removeLayer(sublayer.cuencaLabel);
            }
          });
        }
      }
    }
  };

  const changeBaseLayer = (baseLayerName) => {
    setActiveBaseLayer(baseLayerName);
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
    const layer = layers[layerKey];
    if (layer && activeLayers[layerKey]) {
      layer.setStyle({ fillOpacity: newOpacity });
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
        padding: "2px 10px",
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
            onClick={() => downloadGeoJSON(data, title)}
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
                stroke="#ffffffff"
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
                fill="#ffffffff"
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
        <span>{isCollapsed ? "Capas" : "Capas"}</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "15px" }}>
          {/* Capas Base */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "15px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Mapa Base
            </div>
            {[
              "Hillshade (ESRI)",
              "Satelital (ESRI)",
              "Calles (OpenStreetMap)",
            ].map((layerName) => (
              <div
                key={layerName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "5px",
                }}
              >
                <input
                  type="radio"
                  name="baseLayer"
                  checked={activeBaseLayer === layerName}
                  onChange={() => changeBaseLayer(layerName)}
                />
                <span style={{ marginLeft: "8px", fontSize: "12px" }}>
                  {layerName}
                </span>
              </div>
            ))}
          </div>

          {/* Límites */}
          <div
            style={{
              marginBottom: "20px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "15px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Límites
            </div>
            <LayerItem
              layerKey="area"
              title="Área de estudio"
              data={area}
              showOpacity={false}
            />
            <LayerItem
              layerKey="paisajes"
              title="Paisajes bioculturales"
              data={paisajes}
              showOpacity={false}
            />
            <LayerItem
              layerKey="municipios"
              title="Municipios"
              data={municipios}
              showOpacity={false}
            />
            <LayerItem
              layerKey="cuencas"
              title="Cuencas"
              data={cuencas}
              showOpacity={false}
            />
          </div>

          {/* Grupo de Carbono */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>
              Carbono en cuencas
            </div>
            <LayerItem
              layerKey="co2Cuenca"
              title="Balance de carbono (2018)"
              data={co2Cuenca}
              showOpacity={true}
            />
            <LayerItem
              layerKey="co2Cuenca2100"
              title="Balance de carbono (2100)"
              data={co2Cuenca}
              showOpacity={true}
            />
            <div
              style={{
                marginBottom: "2px",
                padding: "2px 10px",
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
                  checked={activeLayers.rasterCO2 || false}
                  onChange={() => toggleLayer("rasterCO2")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Tendencia de carbono
                </span>
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
                  title="Descargar TEND_CO2.tif"
                  onClick={() =>
                    downloadRaster("TEND_CO2.tif", "Tendencia CO₂")
                  }
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
                      stroke="#ffffffff"
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
                      fill="#ffffffff"
                    />
                  </svg>
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "2px",
                }}
              >
                <span
                  style={{ fontSize: "9px", color: "white", minWidth: "55px" }}
                >
                  Opacidad: {Math.round(opacity.rasterCO2 * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.rasterCO2 - 0.1);
                    handleOpacityChange("rasterCO2", newOpacity);
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
                  disabled={opacity.rasterCO2 <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.rasterCO2 + 0.1);
                    handleOpacityChange("rasterCO2", newOpacity);
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
                  disabled={opacity.rasterCO2 >= 1}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const Carbono = ({
  rastersBasePath = "/data/rasters/carbono/",
  geojsonUrl = "/CO2_CUENCA.geojson",
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [cuencas, setCuencas] = useState(null);
  const [co2Cuenca, setCo2Cuenca] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    cuencas: false,
    co2Cuenca: true,
    co2Cuenca2100: false,
    rasterCO2: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    co2Cuenca: 0.6,
    co2Cuenca2100: 0.6,
    rasterCO2: 0.7,
  });

  // Estados para leyendas
  const [carbono2018LegendVisible, setCarbono2018LegendVisible] =
    useState(false);
  const [carbono2100LegendVisible, setCarbono2100LegendVisible] =
    useState(false);
  const [tendenciaCarbonoLegendVisible, setTendenciaCarbonoLegendVisible] =
    useState(false);

  // Estados para manejo de carga y errores del raster
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el valor del pixel
  const [pixelValue, setPixelValue] = useState(null);

  // Estado para el control de capas colapsado
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Estado para el centro del mapa
  const [mapCenter, setMapCenter] = useState([16.67566, -95.96711]);
  const [mapZoom, setMapZoom] = useState(10);

  // Crear pane personalizado para raster con zIndex alto
  const [rasterPaneName] = useState("rasterTopPane");

  // Cargar datos GeoJSON al montar el componente
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        // Cargar área de estudio
        const areaResponse = await fetch("/AREA.geojson");
        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          setArea(areaData);

          // Calcular el centro y zoom basado en el área de estudio
          // Comentado para mantener el centro fijo en [16.67566, -95.96711]
          // if (areaData && areaData.features && areaData.features.length > 0) {
          //   const bounds = L.geoJSON(areaData).getBounds();
          //   const center = bounds.getCenter();
          //   setMapCenter([center.lat, center.lng]);

          //   // Calcular zoom apropiado basado en el tamaño del área
          //   const latDiff = bounds.getNorth() - bounds.getSouth();
          //   const lngDiff = bounds.getEast() - bounds.getWest();
          //   const maxDiff = Math.max(latDiff, lngDiff);

          //   // Ajustar zoom basado en el tamaño del área
          //   let zoom = 10;
          //   if (maxDiff > 2) zoom = 8;
          //   else if (maxDiff > 1) zoom = 9;
          //   else if (maxDiff > 0.5) zoom = 10;
          //   else if (maxDiff > 0.2) zoom = 11;
          //   else zoom = 12;

          //   setMapZoom(zoom);
          // }
        }

        // Cargar paisajes
        const paisajesResponse = await fetch("/PAISAJES.geojson");
        if (paisajesResponse.ok) {
          const paisajesData = await paisajesResponse.json();
          setPaisajes(paisajesData);
        }

        // Cargar municipios
        const municipiosResponse = await fetch("/MUNICIPIOS.geojson");
        if (municipiosResponse.ok) {
          const municipiosData = await municipiosResponse.json();
          setMunicipios(municipiosData);
        }

        // Cargar cuencas
        const cuencasResponse = await fetch("/CUENCAS.geojson");
        if (cuencasResponse.ok) {
          const cuencasData = await cuencasResponse.json();
          setCuencas(cuencasData);
        }

        // Cargar datos de CO2
        const co2Response = await fetch(geojsonUrl);
        if (co2Response.ok) {
          const co2Data = await co2Response.json();
          setCo2Cuenca(co2Data);
        }
      } catch (error) {
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, [geojsonUrl]);

  // Efecto para controlar la visibilidad de las leyendas
  useEffect(() => {
    // Lógica de prioridad para mostrar leyendas:
    // 1. Si raster está activo, mostrar leyenda raster
    // 2. Si solo CO2 (2100) está activo, mostrar su leyenda
    // 3. Si solo CO2 (2018) está activo, mostrar su leyenda
    // 4. Si ambas capas vectoriales están activas, mostrar CO2 (2100)

    if (activeLayers.rasterCO2) {
      setCarbono2018LegendVisible(false);
      setCarbono2100LegendVisible(false);
      setTendenciaCarbonoLegendVisible(true);
    } else if (activeLayers.co2Cuenca2100 && !activeLayers.co2Cuenca) {
      setCarbono2018LegendVisible(false);
      setCarbono2100LegendVisible(true);
      setTendenciaCarbonoLegendVisible(false);
    } else if (activeLayers.co2Cuenca && !activeLayers.co2Cuenca2100) {
      setCarbono2018LegendVisible(true);
      setCarbono2100LegendVisible(false);
      setTendenciaCarbonoLegendVisible(false);
    } else if (activeLayers.co2Cuenca && activeLayers.co2Cuenca2100) {
      // Si ambas capas vectoriales están activas, priorizar 2100
      setCarbono2018LegendVisible(false);
      setCarbono2100LegendVisible(true);
      setTendenciaCarbonoLegendVisible(false);
    } else {
      setCarbono2018LegendVisible(false);
      setCarbono2100LegendVisible(false);
      setTendenciaCarbonoLegendVisible(false);
    }
  }, [
    activeLayers.co2Cuenca,
    activeLayers.co2Cuenca2100,
    activeLayers.rasterCO2,
  ]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
      >
        {/* Crear pane personalizado para raster */}
        <CustomPaneCreator paneName={rasterPaneName} />

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          cuencas={cuencas}
          co2Cuenca={co2Cuenca}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* RasterOverlay para tendencia de CO2 */}
        {activeLayers.rasterCO2 && (
          <RasterOverlay
            fileName="TEND_CO2.tif"
            colorMap="1:#bf1007,2:#000000"
            baseUrl="/"
            continuous={false}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterCO2}
            pane={rasterPaneName}
          />
        )}

        {/* Indicador de carga */}
        {loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "10px 20px",
              borderRadius: "5px",
              zIndex: 2000,
              fontFamily: "Arial, sans-serif",
            }}
          >
            Cargando raster...
          </div>
        )}

        {/* Indicador de error */}
        {error && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#ff4444",
              color: "white",
              padding: "10px 20px",
              borderRadius: "5px",
              zIndex: 2000,
              fontFamily: "Arial, sans-serif",
            }}
          >
            Error: {error}
          </div>
        )}

        {/* Leyendas */}
        <Carbono2018Legend
          isVisible={carbono2018LegendVisible}
          layerControlCollapsed={isCollapsed}
        />
        <TendenciaCarbono2100Legend
          isVisible={carbono2100LegendVisible}
          layerControlCollapsed={isCollapsed}
        />
        <TendenciaCarbonoLegend
          isVisible={tendenciaCarbonoLegendVisible}
          layerControlCollapsed={isCollapsed}
        />

        {/* Controles de coordenadas y escala */}
        <CoordinateControl />
        <ScaleControl />

        {/* Componente para mostrar el valor del pixel */}
        <PixelValueDisplay pixelValue={pixelValue} />
      </MapContainer>
    </div>
  );
};

export default Carbono;
