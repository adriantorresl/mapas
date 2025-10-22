import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

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
        <span style={labelStyle}>Fósforo:</span>
        <span style={valueNumberStyle}>{pixelValue.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Componente para la leyenda de Balance de Fósforo
const BalanceFosforoLegend = ({
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
    : "290px"; // Espacio suficiente para evitar superposición con el control expandido

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
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  // Rangos y colores del archivo NDR_P_S7_WS.sld
  const sldRanges = [
    { min: 0, max: 5000, color: "#0c5406", label: "0 - 5,000" },
    { min: 5001, max: 10000, color: "#85a503", label: "5,000 - 10,000" },
    { min: 10001, max: 20000, color: "#fff700", label: "10,000 - 20,000" },
    { min: 20001, max: 40000, color: "#e27c00", label: "20,000 - 40,000" },
    { min: 40001, max: 80607, color: "#c40000", label: "40,000 - 80,607" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "10px" }}>
          <div style={{ marginBottom: "10px", fontSize: "14px" }}>
            kg P/ha/año
          </div>
          {sldRanges.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "15px",
                  backgroundColor: item.color,
                  marginRight: "10px",
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontSize: "11px" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para la leyenda de Tendencia de Fósforo
const TendenciaFosforoLegend = ({
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
    : "290px"; // Espacio suficiente para evitar superposición con el control expandido

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
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  // Rangos y colores del archivo NDR_P_Tendencia_WS.sld
  const sldRanges = [
    { min: -74171, max: 5000, color: "#0c5406", label: "-74,171 - 5,000" },
    { min: 5001, max: 10000, color: "#8ed500", label: "5,000 - 10,000" },
    { min: 10001, max: 20000, color: "#fff700", label: "10,000 - 20,000" },
    { min: 20001, max: 40000, color: "#ff9f00", label: "20,000 - 40,000" },
    { min: 40001, max: 80455, color: "#c40000", label: "40,000 - 80,455" },
    { min: 80456, max: 106012, color: "#601c2a", label: "80,455 - 106,012" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "10px" }}>
          <div style={{ marginBottom: "10px", fontSize: "14px" }}>
            kg P/ha/año
          </div>
          {sldRanges.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "15px",
                  backgroundColor: item.color,
                  marginRight: "10px",
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontSize: "11px" }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente para la leyenda de Balance de Fósforo Raster
const BalanceFosforoRasterLegend = ({
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
    : "290px"; // Espacio suficiente para evitar superposición con el control expandido

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
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  // Gradiente basado en NDR_P_S7_px.sld (20 colores de verde a rojo)
  const gradientColors = [
    "#0c5406",
    "#266505",
    "#3f7605",
    "#598704",
    "#729903",
    "#8caa03",
    "#a5bb02",
    "#bfcc02",
    "#d9dd01",
    "#f2ee00",
    "#fcea00",
    "#f6d000",
    "#efb600",
    "#e99c00",
    "#e38200",
    "#dd6800",
    "#d74e00",
    "#d03400",
    "#ca1a00",
    "#c40000",
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "10px" }}>
          <div style={{ marginBottom: "10px", fontSize: "14px" }}>
            kg P/ha/año
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "160px",
                height: "20px",
                background: `linear-gradient(to right, ${gradientColors.join(
                  ", "
                )})`,
                marginRight: "10px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
            }}
          >
            <span>0.0</span>
            <span>43.7</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para la leyenda de Tendencia de Fósforo Raster
const TendenciaFosforoRasterLegend = ({
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
    : "290px"; // Espacio suficiente para evitar superposición con el control expandido

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
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  // Gradiente simplificado basado en NDR_P_Tendencia_px.sld (5 puntos clave)
  const gradientColors = [
    "#0c5406",
    "#175c10",
    "#fffee1",
    "#9b7b8d",
    "#3c003d",
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "10px" }}>
          <div style={{ marginBottom: "10px", fontSize: "14px" }}>
            kg P/ha/año
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "160px",
                height: "20px",
                background: `linear-gradient(to right, ${gradientColors.join(
                  ", "
                )})`,
                marginRight: "10px",
                border: "1px solid #ccc",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
            }}
          >
            <span>0.0</span>
            <span>28.3</span>
          </div>
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
  ndrPTendenciaWS,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  onControlStateChange,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState("Hillshade (ESRI)");

  // Notificar cambios en el estado del control para posicionamiento dinámico
  useEffect(() => {
    if (onControlStateChange) {
      const width = isCollapsed ? 90 : 300; // Ancho colapsado vs expandido
      onControlStateChange(isCollapsed, width);
    }
  }, [isCollapsed, onControlStateChange]);

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

    setLayers(newLayers);

    return () => {
      Object.values(newLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
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
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
    activeLayers.balanceFosforo2018,
    activeLayers.tendenciaFosforo2100,
  ]);

  useEffect(() => {
    // Manejo de capas GeoJSON de fósforo
    if (ndrPTendenciaWS) {
      // Balance de Fósforo (2018) - GeoJSON
      if (activeLayers.balanceFosforo2018) {
        const balanceFosforo2018Layer = L.geoJSON(ndrPTendenciaWS, {
          style: (feature) => {
            const value = feature.properties.S7;
            let color = "#0c5406"; // Color por defecto

            // Aplicar colores según los rangos del SLD NDR_P_S7_WS.sld
            if (value >= 0 && value <= 5000) {
              color = "#0c5406";
            } else if (value > 5000 && value <= 10000) {
              color = "#85a503";
            } else if (value > 10000 && value <= 20000) {
              color = "#fff700";
            } else if (value > 20000 && value <= 40000) {
              color = "#e27c00";
            } else if (value > 40000 && value <= 80607) {
              color = "#c40000";
            }

            return {
              color: "#232323",
              weight: 1,
              fillColor: color,
              fillOpacity: opacity.balanceFosforo2018,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              let popupContent =
                "<strong>Balance de Fósforo (2018)</strong><br>";
              popupContent += `<strong>Valor S7:</strong> ${
                feature.properties.S7 || "N/A"
              } kg P/ha/año<br>`;
              Object.keys(feature.properties).forEach((key) => {
                if (
                  key !== "S7" &&
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

        if (!layers.balanceFosforo2018) {
          setLayers((prev) => ({
            ...prev,
            balanceFosforo2018: balanceFosforo2018Layer,
          }));
          balanceFosforo2018Layer.addTo(map);
        }
      } else if (layers.balanceFosforo2018) {
        map.removeLayer(layers.balanceFosforo2018);
        setLayers((prev) => {
          const newLayers = { ...prev };
          delete newLayers.balanceFosforo2018;
          return newLayers;
        });
      }

      // Tendencia de Fósforo (2100) - GeoJSON
      if (activeLayers.tendenciaFosforo2100) {
        const tendenciaFosforo2100Layer = L.geoJSON(ndrPTendenciaWS, {
          style: (feature) => {
            const value = feature.properties.A_2100;
            let color = "#0c5406"; // Color por defecto

            // Aplicar colores según los rangos del SLD NDR_P_Tendencia_WS.sld
            if (value >= -74171 && value <= 5000) {
              color = "#0c5406";
            } else if (value > 5000 && value <= 10000) {
              color = "#8ed500";
            } else if (value > 10000 && value <= 20000) {
              color = "#fff700";
            } else if (value > 20000 && value <= 40000) {
              color = "#ff9f00";
            } else if (value > 40000 && value <= 80455) {
              color = "#c40000";
            } else if (value > 80455 && value <= 106012) {
              color = "#601c2a";
            }

            return {
              color: "#232323",
              weight: 1,
              fillColor: color,
              fillOpacity: opacity.tendenciaFosforo2100,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties) {
              let popupContent =
                "<strong>Tendencia de Fósforo (2100)</strong><br>";
              popupContent += `<strong>Valor A_2100:</strong> ${
                feature.properties.A_2100 || "N/A"
              } kg P/ha/año<br>`;
              Object.keys(feature.properties).forEach((key) => {
                if (
                  key !== "A_2100" &&
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

        if (!layers.tendenciaFosforo2100) {
          setLayers((prev) => ({
            ...prev,
            tendenciaFosforo2100: tendenciaFosforo2100Layer,
          }));
          tendenciaFosforo2100Layer.addTo(map);
        }
      } else if (layers.tendenciaFosforo2100) {
        map.removeLayer(layers.tendenciaFosforo2100);
        setLayers((prev) => {
          const newLayers = { ...prev };
          delete newLayers.tendenciaFosforo2100;
          return newLayers;
        });
      }
    }
  }, [
    map,
    ndrPTendenciaWS,
    activeLayers.balanceFosforo2018,
    activeLayers.tendenciaFosforo2100,
    opacity.balanceFosforo2018,
    opacity.tendenciaFosforo2100,
    layers.balanceFosforo2018,
    layers.tendenciaFosforo2100,
  ]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };
    newActiveLayers[layerKey] = !activeLayers[layerKey];
    setActiveLayers(newActiveLayers);

    const layer = layers[layerKey];
    if (layer) {
      if (newActiveLayers[layerKey]) {
        layer.addTo(map);
      } else {
        map.removeLayer(layer);
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
              }}
            >
              Capas Base
            </strong>
            <div style={{ marginLeft: "10px" }}>
              {[
                "Hillshade (ESRI)",
                "Satelital (ESRI)",
                "Calles (OpenStreetMap)",
              ].map((layerName) => (
                <div key={layerName} style={{ marginBottom: "5px" }}>
                  <input
                    type="radio"
                    name="baseLayer"
                    checked={activeBaseLayer === layerName}
                    onChange={() => changeBaseLayer(layerName)}
                  />
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "12px",
                      fontWeight: "normal",
                    }}
                  >
                    {layerName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Límites */}
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
              }}
            >
              Límites
            </strong>
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
          </div>

          {/* Grupo de Fósforo */}
          <div style={{ marginBottom: "10px" }}>
            <strong
              style={{
                color: "white",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Fósforo
            </strong>

            {/* Nivel Cuenca */}
            <div style={{ marginBottom: "15px" }}>
              <div
                style={{
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  marginLeft: "10px",
                }}
              >
                Nivel Cuenca
              </div>

              {/* Balance de Fósforo (2018) - GeoJSON */}
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
                    marginBottom: "2px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activeLayers.balanceFosforo2018 || false}
                    onChange={() => toggleLayer("balanceFosforo2018")}
                  />
                  <span
                    style={{
                      fontWeight: "normal",
                      flex: 1,
                      fontSize: "12px",
                    }}
                  >
                    Balance de fósforo (2018)
                  </span>
                  {ndrPTendenciaWS && (
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
                      title="Descargar Balance de Fósforo (2018)"
                      onClick={() =>
                        downloadGeoJSON(ndrPTendenciaWS, "Balance_Fosforo_2018")
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: "white",
                      minWidth: "55px",
                    }}
                  >
                    Opacidad: {Math.round(opacity.balanceFosforo2018 * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.max(
                        0,
                        opacity.balanceFosforo2018 - 0.1
                      );
                      handleOpacityChange("balanceFosforo2018", newOpacity);
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
                    disabled={opacity.balanceFosforo2018 <= 0}
                  >
                    -
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.min(
                        1,
                        opacity.balanceFosforo2018 + 0.1
                      );
                      handleOpacityChange("balanceFosforo2018", newOpacity);
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
                    disabled={opacity.balanceFosforo2018 >= 1}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Tendencia de Fósforo (2100) - GeoJSON */}
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
                    marginBottom: "2px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activeLayers.tendenciaFosforo2100 || false}
                    onChange={() => toggleLayer("tendenciaFosforo2100")}
                  />
                  <span
                    style={{
                      fontWeight: "normal",
                      flex: 1,
                      fontSize: "12px",
                    }}
                  >
                    Tendencia de fósforo (2100)
                  </span>
                  {ndrPTendenciaWS && (
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
                      title="Descargar Tendencia de Fósforo (2100)"
                      onClick={() =>
                        downloadGeoJSON(
                          ndrPTendenciaWS,
                          "Tendencia_Fosforo_2100"
                        )
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      color: "white",
                      minWidth: "55px",
                    }}
                  >
                    Opacidad: {Math.round(opacity.tendenciaFosforo2100 * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.max(
                        0,
                        opacity.tendenciaFosforo2100 - 0.1
                      );
                      handleOpacityChange("tendenciaFosforo2100", newOpacity);
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
                    disabled={opacity.tendenciaFosforo2100 <= 0}
                  >
                    -
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.min(
                        1,
                        opacity.tendenciaFosforo2100 + 0.1
                      );
                      handleOpacityChange("tendenciaFosforo2100", newOpacity);
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
                    disabled={opacity.tendenciaFosforo2100 >= 1}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Nivel Pixel */}
            <div style={{ marginBottom: "10px" }}>
              <div
                style={{
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  marginLeft: "10px",
                }}
              >
                Nivel Pixel
              </div>

              {/* Balance de Fósforo (2018) - Raster */}
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
                    marginBottom: "2px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activeLayers.balanceFosforoRaster || false}
                    onChange={() => toggleLayer("balanceFosforoRaster")}
                  />
                  <span
                    style={{
                      fontWeight: "normal",
                      flex: 1,
                      fontSize: "12px",
                    }}
                  >
                    Balance de fósforo (2018)
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
                    title="Descargar Balance de Fósforo Raster (2018)"
                    onClick={() =>
                      downloadRaster("NDR_p_S7.tif", "Balance Fósforo 2018")
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
                    style={{
                      fontSize: "9px",
                      color: "white",
                      minWidth: "55px",
                    }}
                  >
                    Opacidad: {Math.round(opacity.balanceFosforoRaster * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.max(
                        0,
                        opacity.balanceFosforoRaster - 0.1
                      );
                      handleOpacityChange("balanceFosforoRaster", newOpacity);
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
                    disabled={opacity.balanceFosforoRaster <= 0}
                  >
                    -
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.min(
                        1,
                        opacity.balanceFosforoRaster + 0.1
                      );
                      handleOpacityChange("balanceFosforoRaster", newOpacity);
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
                    disabled={opacity.balanceFosforoRaster >= 1}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Tendencia de Fósforo (2100) - Raster */}
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
                    marginBottom: "2px",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activeLayers.tendenciaFosforoRaster || false}
                    onChange={() => toggleLayer("tendenciaFosforoRaster")}
                  />
                  <span
                    style={{
                      fontWeight: "normal",
                      flex: 1,
                      fontSize: "12px",
                    }}
                  >
                    Tendencia de fósforo (2100)
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
                    title="Descargar Tendencia de Fósforo Raster (2100)"
                    onClick={() =>
                      downloadRaster("NDR_p_2100.tif", "Tendencia Fósforo 2100")
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
                    style={{
                      fontSize: "9px",
                      color: "white",
                      minWidth: "55px",
                    }}
                  >
                    Opacidad: {Math.round(opacity.tendenciaFosforoRaster * 100)}
                    %
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.max(
                        0,
                        opacity.tendenciaFosforoRaster - 0.1
                      );
                      handleOpacityChange("tendenciaFosforoRaster", newOpacity);
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
                    disabled={opacity.tendenciaFosforoRaster <= 0}
                  >
                    -
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newOpacity = Math.min(
                        1,
                        opacity.tendenciaFosforoRaster + 0.1
                      );
                      handleOpacityChange("tendenciaFosforoRaster", newOpacity);
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
                    disabled={opacity.tendenciaFosforoRaster >= 1}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const Fosforo = () => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [ndrPTendenciaWS, setNdrPTendenciaWS] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    balanceFosforo2018: true,
    tendenciaFosforo2100: false,
    balanceFosforoRaster: false,
    tendenciaFosforoRaster: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    balanceFosforo2018: 0.6,
    tendenciaFosforo2100: 0.6,
    balanceFosforoRaster: 0.7,
    tendenciaFosforoRaster: 0.7,
  });

  // Estados para manejo de carga y errores del raster
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el valor del pixel
  const [pixelValue, setPixelValue] = useState(null);

  // Estados para leyendas
  const [balanceFosforoLegendVisible, setBalanceFosforoLegendVisible] =
    useState(false);
  const [tendenciaFosforoLegendVisible, setTendenciaFosforoLegendVisible] =
    useState(false);
  const [
    balanceFosforoRasterLegendVisible,
    setBalanceFosforoRasterLegendVisible,
  ] = useState(false);
  const [
    tendenciaFosforoRasterLegendVisible,
    setTendenciaFosforoRasterLegendVisible,
  ] = useState(false);

  // Estado para controlar la posición dinámica de la leyenda
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Función para manejar cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Estado para el centro del mapa
  const [mapCenter, setMapCenter] = useState([16.67566, -95.96711]);
  const [mapZoom, setMapZoom] = useState(10);

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

        // Cargar datos de fósforo
        const ndrPTendenciaWSResponse = await fetch(
          "/NDR_P_Tendencia_WS.geojson"
        );
        if (ndrPTendenciaWSResponse.ok) {
          const ndrPTendenciaWSData = await ndrPTendenciaWSResponse.json();
          setNdrPTendenciaWS(ndrPTendenciaWSData);
        }
      } catch (error) {
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, []);

  // Efecto para controlar la visibilidad de las leyendas
  useEffect(() => {
    // Lógica para mostrar leyendas basada en capas activas
    let balanceVisible = false;
    let tendenciaVisible = false;
    let balanceRasterVisible = false;
    let tendenciaRasterVisible = false;

    // Para capas de nivel cuenca
    if (activeLayers.balanceFosforo2018 && !activeLayers.balanceFosforoRaster) {
      balanceVisible = true;
    }
    if (
      activeLayers.tendenciaFosforo2100 &&
      !activeLayers.tendenciaFosforoRaster
    ) {
      tendenciaVisible = true;
    }

    // Para capas raster (nivel pixel) - tienen prioridad
    if (activeLayers.balanceFosforoRaster) {
      balanceRasterVisible = true;
      balanceVisible = false; // Ocultar leyenda de cuenca si hay raster
    }
    if (activeLayers.tendenciaFosforoRaster) {
      tendenciaRasterVisible = true;
      tendenciaVisible = false; // Ocultar leyenda de cuenca si hay raster
    }

    setBalanceFosforoLegendVisible(balanceVisible);
    setTendenciaFosforoLegendVisible(tendenciaVisible);
    setBalanceFosforoRasterLegendVisible(balanceRasterVisible);
    setTendenciaFosforoRasterLegendVisible(tendenciaRasterVisible);
  }, [
    activeLayers.balanceFosforo2018,
    activeLayers.tendenciaFosforo2100,
    activeLayers.balanceFosforoRaster,
    activeLayers.tendenciaFosforoRaster,
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
        {/* RasterOverlay para Balance de Fósforo (2018) */}
        {activeLayers.balanceFosforoRaster && (
          <RasterOverlay
            fileName="NDR_p_S7.tif"
            colorMap="0.0:#0c5406,2.3:#266505,4.6:#3f7605,6.9:#598704,9.2:#729903,11.5:#8caa03,13.8:#a5bb02,16.1:#bfcc02,18.4:#d9dd01,20.7:#f2ee00,23.0:#fcea00,25.3:#f6d000,27.6:#efb600,29.9:#e99c00,32.2:#e38200,34.5:#dd6800,36.8:#d74e00,39.1:#d03400,41.4:#ca1a00,43.7:#c40000"
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.balanceFosforoRaster}
          />
        )}

        {/* RasterOverlay para Tendencia de Fósforo (2100) */}
        {activeLayers.tendenciaFosforoRaster && (
          <RasterOverlay
            fileName="NDR_p_2100.tif"
            colorMap="0.0:#0c5406,7.0:#175c10,14.2:#fffee1,21.3:#9b7b8d,28.3:#3c003d"
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.tendenciaFosforoRaster}
          />
        )}

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          ndrPTendenciaWS={ndrPTendenciaWS}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          onControlStateChange={handleControlStateChange}
        />

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
              fontFamily: "Inter, sans-serif",
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
              fontFamily: "Inter, sans-serif",
            }}
          >
            Error: {error}
          </div>
        )}

        {/* Leyendas */}
        <BalanceFosforoLegend
          isVisible={balanceFosforoLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />
        <TendenciaFosforoLegend
          isVisible={tendenciaFosforoLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />
        <BalanceFosforoRasterLegend
          isVisible={balanceFosforoRasterLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />
        <TendenciaFosforoRasterLegend
          isVisible={tendenciaFosforoRasterLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
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

export default Fosforo;
