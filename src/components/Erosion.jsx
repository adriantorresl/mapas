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

// Componente para mostrar la escala
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

// Componente para mostrar el valor del pixel
const PixelValueDisplay = ({ pixelValue }) => {
  if (!pixelValue) return null;

  const displayStyle = {
    position: "absolute",
    bottom: "18px",
    left: "10px",
    backgroundColor: "#1E3C20",
    color: "white",
    padding: "8px 12px",
    borderRadius: "0px",
    fontSize: "12px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "bold",
    zIndex: 1000,
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    minWidth: "120px",
  };

  return (
    <div style={displayStyle}>
      <div style={{ fontSize: "10px", marginBottom: "2px", opacity: 0.8 }}>
        Valor del pixel:
      </div>
      <div>{pixelValue.toFixed(2)}</div>
    </div>
  );
};

// Componente de leyenda para Tendencia de Erosión
const TendenciaErosionLegend = ({
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
    : "320px"; // Espacio suficiente para evitar superposición con el control expandido

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

  // Rangos y colores del archivo USLE_Tendencia_WS.sld
  const sldRanges = [
    { min: 0, max: 750000, color: "#0c5406", label: "0 - 750,000" },
    {
      min: 750001,
      max: 1500000,
      color: "#8ed500",
      label: "750,000 - 1,500,000",
    },
    {
      min: 1500001,
      max: 3000000,
      color: "#fff700",
      label: "1,500,000 - 3,000,000",
    },
    {
      min: 3000001,
      max: 4500000,
      color: "#ff9f00",
      label: "3,000,000 - 4,500,000",
    },
    {
      min: 4500001,
      max: 9000000,
      color: "#c40000",
      label: "4,500,000 - 9,000,000",
    },
    {
      min: 9000001,
      max: 21000000,
      color: "#601c2a",
      label: "9,000,000 - 21,000,000",
    },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>
      {!isCollapsed && (
        <div
          style={{
            padding: "10px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Tendencia de exportación de sedimentos (2100)
          </div>
          {sldRanges.map((range, index) => (
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
      )}
    </div>
  );
};

// Componente de leyenda para Tendencia de Erosión (Raster)
const TendenciaErosionRasterLegend = ({
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
    : "320px"; // Espacio suficiente para evitar superposición con el control expandido

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

  // Colores extraídos del archivo USLE_Tendencia_px.sld (simplificado para la leyenda)
  const colorGradient = [
    "#457428", // Verde oscuro (valores más negativos)
    "#8cab18", // Verde medio
    "#c0d20d", // Verde claro
    "#f9fe00", // Amarillo (valores cerca de cero)
    "#f1c812", // Naranja claro
    "#e57f29", // Naranja
    "#dc443c", // Rojo (valores más positivos)
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>
      {!isCollapsed && (
        <div
          style={{
            padding: "10px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Tendencia de exportación de sedimentos (2100)
          </div>
          <div
            style={{
              height: "20px",
              background: `linear-gradient(to right, ${colorGradient.join(
                ", "
              )})`,
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
            <span>-0.0028</span>
            <span>0.0028</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "10px",
              marginTop: "4px",
              fontStyle: "italic",
            }}
          >
            <span>Pendiente de erosión</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para Erosión Serie VII (Raster)
const ErosionSerieVIIRasterLegend = ({
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
    : "320px"; // Espacio suficiente para evitar superposición con el control expandido

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

  // Colores extraídos del archivo USLE_S7_px.sld (simplificado para la leyenda)
  const colorGradient = [
    "#035800", // Verde muy oscuro (valores bajos)
    "#669900", // Verde medio
    "#fafa00", // Amarillo (valores medios)
    "#e1b304", // Naranja
    "#c46d08", // Naranja rojizo
    "#fd041dff", // Rojo muy oscuro (valores altos)
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>
      {!isCollapsed && (
        <div
          style={{
            padding: "10px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Exportación de sedimentos (2018)
          </div>
          <div
            style={{
              height: "20px",
              background: `linear-gradient(to right, ${colorGradient.join(
                ", "
              )})`,
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
            <span>0</span>
            <span>1000</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "10px",
              marginTop: "4px",
              fontStyle: "italic",
            }}
          >
            <span>Erosión (t/ha/año)</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para Erosión Serie VII
const ErosionSerieVIILegend = ({
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
    : "320px"; // Espacio suficiente para evitar superposición con el control expandido

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

  // Rangos y colores del archivo USLE_S7_WS.sld
  const sldRanges = [
    { min: 0, max: 750000, color: "#0c5406", label: "0 - 750,000" },
    {
      min: 750001,
      max: 1500000,
      color: "#8ed500",
      label: "750,000 - 1,500,000",
    },
    {
      min: 1500001,
      max: 3000000,
      color: "#fff700",
      label: "1,500,000 - 3,000,000",
    },
    {
      min: 3000001,
      max: 4500000,
      color: "#ff9f00",
      label: "3,000,000 - 4,500,000",
    },
    {
      min: 4500001,
      max: 9000000,
      color: "#c40000",
      label: "4,500,000 - 9,000,000",
    },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
      </div>
      {!isCollapsed && (
        <div
          style={{
            padding: "10px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "12px",
            }}
          >
            Exportación de sedimentos (2018)
          </div>
          {sldRanges.map((range, index) => (
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
      )}
    </div>
  );
};

// Componente para el control de capas agrupadas
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  usleData,
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
    const newLayers = {};

    // Capas base
    const baseLayers = {
      "Hillshade (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
          maxZoom: 17,
        }
      ),
      "Satélite (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
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

    // Paisajes
    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 4, fillOpacity: 0 },
      });
      if (activeLayers.paisajes) {
        newLayers.paisajes.addTo(map);
      }
    }

    // Municipios
    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 2, fillOpacity: 0 },
      });
      if (activeLayers.municipios) {
        newLayers.municipios.addTo(map);
      }
    }

    // Tendencia de Erosión
    if (usleData) {
      newLayers.tendenciaErosion = L.geoJSON(usleData, {
        style: (feature) => {
          const ten100 = feature.properties.TEN_100;
          let fillColor = "#666666"; // Color por defecto

          // Asignar colores según los rangos del archivo USLE_Tendencia_WS.sld
          if (ten100 >= 0 && ten100 <= 750000) {
            fillColor = "#0c5406";
          } else if (ten100 > 750000 && ten100 <= 1500000) {
            fillColor = "#8ed500";
          } else if (ten100 > 1500000 && ten100 <= 3000000) {
            fillColor = "#fff700";
          } else if (ten100 > 3000000 && ten100 <= 4500000) {
            fillColor = "#ff9f00";
          } else if (ten100 > 4500000 && ten100 <= 9000000) {
            fillColor = "#c40000";
          } else if (ten100 > 9000000 && ten100 <= 21000000) {
            fillColor = "#601c2a";
          }

          return {
            color: "#ffffff",
            weight: 1,
            fillOpacity: 0.7,
            fillColor: fillColor,
          };
        },
        onEachFeature: (feature, layer) => {
          const tenValue = feature.properties.TEN_100 || "N/A";
          layer.bindPopup(
            `<div style="font-family: Arial, sans-serif; font-size: 12px;">
              <strong>Tendencia de exportación de sedimentos (2100):</strong><br/>
              <strong>TEN_100:</strong> ${tenValue}
            </div>`
          );
        },
      });
      if (activeLayers.tendenciaErosion) {
        newLayers.tendenciaErosion.addTo(map);
      }
    }

    // Erosión Serie VII
    if (usleData) {
      newLayers.erosionSerieVII = L.geoJSON(usleData, {
        style: (feature) => {
          const sdrS7 = feature.properties.SDR_S7;
          let fillColor = "#666666"; // Color por defecto

          // Asignar colores según los rangos del archivo USLE_S7_WS.sld
          if (sdrS7 >= 0 && sdrS7 <= 750000) {
            fillColor = "#0c5406";
          } else if (sdrS7 > 750000 && sdrS7 <= 1500000) {
            fillColor = "#8ed500";
          } else if (sdrS7 > 1500000 && sdrS7 <= 3000000) {
            fillColor = "#fff700";
          } else if (sdrS7 > 3000000 && sdrS7 <= 4500000) {
            fillColor = "#ff9f00";
          } else if (sdrS7 > 4500000 && sdrS7 <= 9000000) {
            fillColor = "#c40000";
          }

          return {
            color: "#ffffff",
            weight: 1,
            fillOpacity: 0.7,
            fillColor: fillColor,
          };
        },
        onEachFeature: (feature, layer) => {
          const sdrValue = feature.properties.SDR_S7 || "N/A";
          layer.bindPopup(
            `<div style="font-family: Arial, sans-serif; font-size: 12px;">
              <strong>Exportación de sedimentos (2018):</strong><br/>
              <strong>SDR_S7:</strong> ${sdrValue}
            </div>`
          );
        },
      });
      if (activeLayers.erosionSerieVII) {
        newLayers.erosionSerieVII.addTo(map);
      }
    }

    setLayers({ ...newLayers, baseLayers });

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
    usleData,
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
    activeLayers.tendenciaErosion,
    activeLayers.erosionSerieVII,
  ]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };

    if (
      layerKey === "erosionSerieVIIRaster" ||
      layerKey === "tendenciaErosionRaster"
    ) {
      // Manejo especial para las capas raster
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
        if (
          layerKey !== "area" &&
          layerKey !== "paisajes" &&
          layerKey !== "municipios"
        ) {
          layer.setStyle({ fillOpacity: opacity[layerKey] || 0.6 });
        }
      } else {
        map.removeLayer(layer);
      }
    }
  };

  const changeBaseLayer = (baseLayerName) => {
    if (layers.baseLayers) {
      // Remover la capa base anterior
      Object.values(layers.baseLayers).forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      // Agregar la nueva capa base
      layers.baseLayers[baseLayerName].addTo(map);
      setActiveBaseLayer(baseLayerName);
    }
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));

    // Para capas raster, la opacidad se maneja automáticamente a través del estado
    if (
      layerKey === "erosionSerieVIIRaster" ||
      layerKey === "tendenciaErosionRaster"
    ) {
      return;
    }

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
              {layers.baseLayers &&
                Object.keys(layers.baseLayers).map((baseLayerName) => (
                  <div key={baseLayerName} style={{ marginBottom: "5px" }}>
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
              Erosión en cuencas
            </strong>
            {usleData && (
              <LayerItem
                layerKey="tendenciaErosion"
                title="Tendencia de exportación de sedimentos (2100)"
                data={usleData}
                showOpacity={true}
              />
            )}
            {usleData && (
              <LayerItem
                layerKey="erosionSerieVII"
                title="Exportación de sedimentos (2018)"
                data={usleData}
                showOpacity={true}
              />
            )}
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
                  checked={activeLayers.tendenciaErosionRaster || false}
                  onChange={() => toggleLayer("tendenciaErosionRaster")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Tendencia de exportación de sedimentos (2100)
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
                  title="Descargar Tendencia de erosión (Raster)"
                  onClick={() =>
                    downloadRaster(
                      "USLE_pendiente.tif",
                      "Tendencia de erosión (Raster)"
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
                  Opacidad: {Math.round(opacity.tendenciaErosionRaster * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(
                      0,
                      opacity.tendenciaErosionRaster - 0.1
                    );
                    setOpacity((prev) => ({
                      ...prev,
                      tendenciaErosionRaster: newOpacity,
                    }));
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
                  disabled={opacity.tendenciaErosionRaster <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(
                      1,
                      opacity.tendenciaErosionRaster + 0.1
                    );
                    setOpacity((prev) => ({
                      ...prev,
                      tendenciaErosionRaster: newOpacity,
                    }));
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
                  disabled={opacity.tendenciaErosionRaster >= 1}
                >
                  +
                </button>
              </div>
            </div>
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
                  checked={activeLayers.erosionSerieVIIRaster || false}
                  onChange={() => toggleLayer("erosionSerieVIIRaster")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Exportación de sedimentos (2018)
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
                  title="Descargar Erosión Serie VII (Raster)"
                  onClick={() =>
                    downloadRaster(
                      "USLE_S7_simple.tif",
                      "Erosión Serie VII (Raster)"
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
                  Opacidad: {Math.round(opacity.erosionSerieVIIRaster * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(
                      0,
                      opacity.erosionSerieVIIRaster - 0.1
                    );
                    setOpacity((prev) => ({
                      ...prev,
                      erosionSerieVIIRaster: newOpacity,
                    }));
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
                  disabled={opacity.erosionSerieVIIRaster <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(
                      1,
                      opacity.erosionSerieVIIRaster + 0.1
                    );
                    setOpacity((prev) => ({
                      ...prev,
                      erosionSerieVIIRaster: newOpacity,
                    }));
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
                  disabled={opacity.erosionSerieVIIRaster >= 1}
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
const Erosion = () => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [usleData, setUsleData] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    tendenciaErosion: true,
    erosionSerieVII: false,
    erosionSerieVIIRaster: false,
    tendenciaErosionRaster: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    tendenciaErosion: 0.7,
    erosionSerieVII: 0.7,
    erosionSerieVIIRaster: 0.7,
    tendenciaErosionRaster: 0.7,
  });

  // Estados para leyendas
  const [tendenciaLegendVisible, setTendenciaLegendVisible] = useState(true);
  const [erosionSerieVIILegendVisible, setErosionSerieVIILegendVisible] =
    useState(false);
  const [
    erosionSerieVIIRasterLegendVisible,
    setErosionSerieVIIRasterLegendVisible,
  ] = useState(false);
  const [
    tendenciaErosionRasterLegendVisible,
    setTendenciaErosionRasterLegendVisible,
  ] = useState(false);

  // Estado para controlar la posición dinámica de la leyenda
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Estados para manejo de carga y errores del raster
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el valor del pixel
  const [pixelValue, setPixelValue] = useState(null);

  // Función para manejar cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Cargar datos GeoJSON al montar el componente
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        // Cargar área de estudio
        const areaResponse = await fetch("/AREA.geojson");
        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          setArea(areaData);
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

        // Cargar datos USLE
        const usleResponse = await fetch("/USLE_tendencia_WS.geojson");
        if (usleResponse.ok) {
          const usleData = await usleResponse.json();
          setUsleData(usleData);
        }
      } catch (error) {
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, []);

  // Efecto para controlar la visibilidad de las leyendas (solo una a la vez)
  useEffect(() => {
    let activeCount = 0;
    let lastActive = null;

    // Contar capas activas y encontrar la última activa
    if (activeLayers.tendenciaErosion) {
      activeCount++;
      lastActive = "tendencia";
    }
    if (activeLayers.erosionSerieVII) {
      activeCount++;
      lastActive = "erosionVector";
    }
    if (activeLayers.erosionSerieVIIRaster) {
      activeCount++;
      lastActive = "erosionRaster";
    }
    if (activeLayers.tendenciaErosionRaster) {
      activeCount++;
      lastActive = "tendenciaRaster";
    }

    // Ocultar todas las leyendas primero
    setTendenciaLegendVisible(false);
    setErosionSerieVIILegendVisible(false);
    setErosionSerieVIIRasterLegendVisible(false);
    setTendenciaErosionRasterLegendVisible(false);

    // Mostrar solo la leyenda de la última capa activada
    if (lastActive === "tendencia") {
      setTendenciaLegendVisible(true);
    } else if (lastActive === "erosionVector") {
      setErosionSerieVIILegendVisible(true);
    } else if (lastActive === "erosionRaster") {
      setErosionSerieVIIRasterLegendVisible(true);
    } else if (lastActive === "tendenciaRaster") {
      setTendenciaErosionRasterLegendVisible(true);
    }
  }, [
    activeLayers.tendenciaErosion,
    activeLayers.erosionSerieVII,
    activeLayers.erosionSerieVIIRaster,
    activeLayers.tendenciaErosionRaster,
  ]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={[16.67566, -95.96711]}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* RasterOverlay para Tendencia de erosión */}
        {activeLayers.tendenciaErosionRaster && (
          <RasterOverlay
            fileName="USLE_pendiente.tif"
            colorMap="-0.0028143113013357002:#457428,-0.00270385287039895:#4a7827,-0.00259339387612297:#4e7b26,-0.0024829354451862198:#537f25,-0.0023724764509102398:#588324,-0.0022620180199734901:#5d8623,-0.0021515595890367499:#618a22,-0.00204110003142152:#668d21,-0.0019306404738062999:#6b9120,-0.0018201809161910801:#70951f,-0.00170972699196823:#74981e,-0.0015992674343530101:#799c1c,-0.00148880787673779:#7ea01b,-0.0013783483191225699:#83a31a,-0.00126788876150735:#87a719,-0.0011574292038921299:#8cab18,-0.00104697527966928:#91ae17,-0.00093651572205405702:#95b216,-0.00082605616443883595:#9ab515,-0.000715596606823615:#9fb914,-0.00060513704920839404:#a4bd13,-0.00049467749159317297:#a8c012,-0.00038421793397795201:#adc411,-0.00027376400975510299:#b2c810,-0.000163304452139881:#b7cb0f,-5.2844894524660302e-05:#bbcf0e,5.7614663090560902e-05:#c0d20d,0.00016807422070578201:#c5d60c,0.00027853377832100202:#c9da0b,0.00038898770254385201:#cedd0a,0.00049944726015907297:#d3e109,0.00060990681777429404:#d8e508,0.000720366375389515:#dce807,0.00083082593300473704:#e1ec05,0.00094128549061995703:#e6f004,0.0010517450482351799:#ebf303,0.00116219897245803:#eff702,0.0012726585300732499:#f4fa01,0.00138311808768847:#f9fe00,0.0014935776453036901:#f8f404,0.00160403720291891:#f6e508,0.0017144967605341301:#f4d70d,0.0018249506847569799:#f1c812,0.0019354102423722:#efba16,0.0020458697999874201:#ecab1b,0.00215632935760265:#ea9c20,0.0022667889152178699:#e88e24,0.0023772484728330902:#e57f29,0.0024877023970559398:#e3702e,0.0025981619546711601:#e16233,0.00270862151228638:#de5337,0.0028190810699015999:#dc443c"
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.tendenciaErosionRaster}
            visible={true}
            pane="overlayPane"
          />
        )}

        {/* RasterOverlay para Erosión Serie VII */}
        {/* Line 1324 omitted */}
        {activeLayers.erosionSerieVIIRaster && (
          <RasterOverlay
            fileName="USLE_S7_simple.tif"
            colorMap="0:#035800,19.607800000000001:#0d5e00,39.215699999999998:#176500,58.823500000000003:#216b00,78.431399999999996:#2b7200,98.039200000000008:#357800,117.64700000000001:#3f7f00,137.255:#488500,156.863:#528c00,176.47099999999998:#5c9200,196.078:#669900,215.68599999999998:#709f00,235.29400000000001:#7aa600,254.90200000000002:#84ac00,274.50999999999999:#8db300,294.11799999999999:#97b900,313.72499999999997:#a1c000,333.33299999999997:#abc600,352.94100000000003:#b5cd00,372.54900000000004:#bfd300,392.15699999999998:#c9da00,411.76499999999999:#d3e000,431.37299999999999:#dce700,450.98000000000002:#e6ed00,470.58800000000002:#f0f400,490.19600000000003:#fafa00,509.80400000000003:#fdf900,529.41200000000003:#f9ef01,549.01999999999998:#f5e501,568.62699999999995:#f1db02,588.2349999999999:#edd102,607.84300000000007:#e9c703,627.45100000000002:#e5bd03,647.05900000000008:#e1b304,666.66700000000003:#dda905,686.27499999999998:#d99f05,705.88200000000006:#d49506,725.49000000000001:#d08b06,745.09800000000007:#cc8107,764.70600000000002:#c87707,784.31399999999996:#c46d08,803.92200000000003:#c06308,823.529:#bc5909,843.13700000000006:#b85009,862.745:#b4460a,882.35300000000007:#b03c0a,901.96100000000001:#ac320b,921.56899999999996:#a8280c,941.17600000000004:#a41e0c,960.78399999999999:#a0140d,980.39200000000005:#9c0a0d,1000:#98000e"
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.erosionSerieVIIRaster}
            visible={true}
            pane="overlayPane"
          />
        )}

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          usleData={usleData}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          onControlStateChange={handleControlStateChange}
        />

        {/* Leyenda de Tendencia de Erosión */}
        <TendenciaErosionLegend
          isVisible={tendenciaLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />

        {/* Leyenda de Erosión Serie VII */}
        <ErosionSerieVIILegend
          isVisible={erosionSerieVIILegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />

        {/* Leyenda de Tendencia de erosión (Raster) */}
        <TendenciaErosionRasterLegend
          isVisible={tendenciaErosionRasterLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />

        {/* Leyenda de Erosión Serie VII (Raster) */}
        <ErosionSerieVIIRasterLegend
          isVisible={erosionSerieVIIRasterLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
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

        {/* Controles de coordenadas y escala */}
        <CoordinateControl />
        <ScaleControl />

        {/* Componente para mostrar el valor del pixel */}
        <PixelValueDisplay pixelValue={pixelValue} />
      </MapContainer>
    </div>
  );
};

export default Erosion;
