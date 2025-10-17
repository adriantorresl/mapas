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

// Componente para el control de información (tooltips)
const InfoControl = ({ onToggleTooltips, tooltipsEnabled }) => {
  const controlStyle = {
    position: "absolute",
    top: "120px", // Debajo del control de capas
    left: "10px",
    backgroundColor: "white",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 999,
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
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

// Componente de leyenda para Balance de Nitrógeno
const NitrogenoLegend = ({
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
    : "250px"; // Espacio suficiente para evitar superposición con el control expandido

  const legendStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: rightPosition,
    backgroundColor: "#1E3C20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "200px",
    maxWidth: "250px",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const categories = [
    { name: "0 - 300", color: "#0c5406" },
    { name: "301 - 900", color: "#8ed500" },
    { name: "901 - 1,500", color: "#fff700" },
    { name: "1,501 - 2,100", color: "#ff9f00" },
    { name: "2,101 - 3,202", color: "#c40000" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Balance de Nitrógeno (Ton/Nitrógeno)</span>
      </div>
      {!isCollapsed && (
        <div>
          {categories.map((category) => (
            <div
              key={category.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: category.color,
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              />
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para Balance de Fósforo
const FosforoLegend = ({
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
    : "250px"; // Espacio suficiente para evitar superposición con el control expandido

  const legendStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: rightPosition,
    backgroundColor: "#1E3C20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "200px",
    maxWidth: "250px",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#1E3C20",
  };

  const categories = [
    { name: "0 - 5,000", color: "#0c5406" },
    { name: "5,001 - 10,000", color: "#85a503" },
    { name: "10,001 - 20,000", color: "#fff700" },
    { name: "20,001 - 40,000", color: "#e27c00" },
    { name: "40,001 - 80,607", color: "#c40000" },
  ];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Balance de Fósforo (Ton/Fósforo)</span>
      </div>
      {!isCollapsed && (
        <div>
          {categories.map((category) => (
            <div
              key={category.name}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <div
                style={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: category.color,
                  marginRight: "8px",
                  flexShrink: 0,
                }}
              />
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para raster de Tendencia de Nitrógeno
const TendenciaNitrogenoLegend = ({
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
    : "250px"; // Espacio suficiente para evitar superposición con el control expandido

  const legendStyle = {
    position: "absolute",
    top: "10px",
    right: rightPosition,
    backgroundColor: "#1E3C20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    color: "white",
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para tendencia de nitrógeno - usando la paleta de NDR_N_Tendencia.sld
  const createColorRamp = () => {
    const colors = [
      "#0c5406", // Verde oscuro (valor bajo)
      "#fffee1", // Amarillo muy claro (valor medio)
      "#3c003d", // Púrpura oscuro (valor alto)
    ];

    return (
      <div style={{ marginTop: "8px" }}>
        <div
          style={{
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          <span>Muy baja</span>
          <span>Muy alta</span>
        </div>
        <div
          style={{
            height: "20px",
            background: `linear-gradient(to right, ${colors.join(", ")})`,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: "10px",
            marginTop: "4px",
            fontStyle: "italic",
          }}
        >
          <span>Tendencia de Nitrógeno (kg/ha/año)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente de leyenda para raster de Tendencia de Fósforo
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
    : "250px"; // Espacio suficiente para evitar superposición con el control expandido

  const legendStyle = {
    color: "white",
    position: "absolute",
    top: "10px",
    right: rightPosition,
    backgroundColor: "#1E3C20",
    border: "1px solid white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    transition: "right 0.3s ease",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para tendencia de fósforo - usando la paleta de NDR_P_Tendencia.sld
  const createColorRamp = () => {
    const colors = [
      "#0c5406", // Verde oscuro (valor bajo)
      "#3c003d", // Púrpura oscuro (valor alto)
    ];

    return (
      <div style={{ marginTop: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            marginBottom: "4px",
          }}
        >
          <span>Muy baja</span>
          <span>Muy alta</span>
        </div>
        <div
          style={{
            height: "20px",
            background: `linear-gradient(to right, ${colors.join(", ")})`,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: "10px",
            marginTop: "4px",
            fontStyle: "italic",
          }}
        >
          <span>Tendencia de Fósforo (kg/ha/año)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Simbología</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente para el control de capas agrupadas
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
  expNutr,
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

    // Exportación de Nutrientes - Nitrógeno
    if (expNutr) {
      const fieldN = "S7_N";
      const colorCategoriesN = {
        "0 - 300": "#0c5406",
        "301 - 900": "#8ed500",
        "901 - 1,500": "#fff700",
        "1,501 - 2,100": "#ff9f00",
        "2,101 - 3,202": "#c40000",
      };

      newLayers.expNutrN = L.geoJSON(expNutr, {
        style: (feature) => {
          const value = feature.properties[fieldN];
          let color = "#666666";
          let fillColor = "#999999";

          // Clasificar valores en categorías según rangos de Nitrógeno
          if (value >= 0 && value <= 300) {
            color = colorCategoriesN["0 - 300"];
            fillColor = colorCategoriesN["0 - 300"];
          } else if (value >= 301 && value <= 900) {
            color = colorCategoriesN["301 - 900"];
            fillColor = colorCategoriesN["301 - 900"];
          } else if (value >= 901 && value <= 1500) {
            color = colorCategoriesN["901 - 1,500"];
            fillColor = colorCategoriesN["901 - 1,500"];
          } else if (value >= 1501 && value <= 2100) {
            color = colorCategoriesN["1,501 - 2,100"];
            fillColor = colorCategoriesN["1,501 - 2,100"];
          } else if (value >= 2101 && value <= 3202) {
            color = colorCategoriesN["2,101 - 3,202"];
            fillColor = colorCategoriesN["2,101 - 3,202"];
          }

          return {
            color: color,
            weight: 2,
            fillOpacity: 0.6,
            fillColor: fillColor,
          };
        },
      });
      if (activeLayers.expNutrN) {
        newLayers.expNutrN.addTo(map);
      }
    }

    // Exportación de Nutrientes - Fósforo
    if (expNutr) {
      const fieldP = "S7_P";
      const colorCategoriesP = {
        "0 - 5000": "#0c5406",
        "5001 - 10000": "#85a503",
        "10001 - 20000": "#fff700",
        "20001 - 40000": "#e27c00",
        "40001 - 80607": "#c40000",
      };

      newLayers.expNutrP = L.geoJSON(expNutr, {
        style: (feature) => {
          const value = feature.properties[fieldP];
          let color = "#666666";
          let fillColor = "#999999";

          // Clasificar valores en categorías según rangos de Fósforo
          if (value >= 0 && value <= 5000) {
            color = colorCategoriesP["0 - 5000"];
            fillColor = colorCategoriesP["0 - 5000"];
          } else if (value >= 5001 && value <= 10000) {
            color = colorCategoriesP["5001 - 10000"];
            fillColor = colorCategoriesP["5001 - 10000"];
          } else if (value >= 10001 && value <= 20000) {
            color = colorCategoriesP["10001 - 20000"];
            fillColor = colorCategoriesP["10001 - 20000"];
          } else if (value >= 20001 && value <= 40000) {
            color = colorCategoriesP["20001 - 40000"];
            fillColor = colorCategoriesP["20001 - 40000"];
          } else if (value >= 40001 && value <= 80607) {
            color = colorCategoriesP["40001 - 80607"];
            fillColor = colorCategoriesP["40001 - 80607"];
          }

          return {
            color: color,
            weight: 2,
            fillOpacity: 0.6,
            fillColor: fillColor,
          };
        },
      });
      if (activeLayers.expNutrP) {
        newLayers.expNutrP.addTo(map);
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
    expNutr,
    activeBaseLayer,
    activeLayers.area,
    activeLayers.paisajes,
    activeLayers.municipios,
    activeLayers.expNutrN,
    activeLayers.expNutrP,
  ]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };

    if (layerKey === "rasterN" || layerKey === "rasterP") {
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

          {/* Grupo de Nitrógeno */}
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
              Nitrógeno
            </strong>
            <LayerItem
              layerKey="expNutrN"
              title="Balance de Nitrógeno"
              data={expNutr}
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
                  checked={activeLayers.rasterN || false}
                  onChange={() => toggleLayer("rasterN")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Tendencia de Nitrógeno
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
                  title="Descargar TEND_N.tif"
                  onClick={() =>
                    downloadRaster("TEND_N.tif", "Tendencia Nitrógeno")
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
                  Opacidad: {Math.round(opacity.rasterN * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.rasterN - 0.1);
                    handleOpacityChange("rasterN", newOpacity);
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
                  disabled={opacity.rasterN <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.rasterN + 0.1);
                    handleOpacityChange("rasterN", newOpacity);
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
                  disabled={opacity.rasterN >= 1}
                >
                  +
                </button>
              </div>
            </div>
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
            <LayerItem
              layerKey="expNutrP"
              title="Balance de Fósforo"
              data={expNutr}
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
                  checked={activeLayers.rasterP || false}
                  onChange={() => toggleLayer("rasterP")}
                />
                <span
                  style={{ fontWeight: "normal", flex: 1, fontSize: "12px" }}
                >
                  Tendencia de Fósforo
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
                  title="Descargar TEND_P.tif"
                  onClick={() =>
                    downloadRaster("TEND_P.tif", "Tendencia Fósforo")
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
                  Opacidad: {Math.round(opacity.rasterP * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.max(0, opacity.rasterP - 0.1);
                    handleOpacityChange("rasterP", newOpacity);
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
                  disabled={opacity.rasterP <= 0}
                >
                  -
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpacity = Math.min(1, opacity.rasterP + 0.1);
                    handleOpacityChange("rasterP", newOpacity);
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
                  disabled={opacity.rasterP >= 1}
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
const Nutrientes = ({
  rastersBasePath = "/data/rasters/nutrientes/",
  geojsonUrl = "/EXP_NUTR.geojson",
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [expNutr, setExpNutr] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    expNutrN: false,
    expNutrP: false,
    rasterN: false,
    rasterP: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    expNutrN: 0.6,
    expNutrP: 0.6,
    rasterN: 0.7,
    rasterP: 0.7,
  });

  // Estados para leyendas
  const [nitrogenoLegendVisible, setNitrogenoLegendVisible] = useState(false);
  const [fosforoLegendVisible, setFosforoLegendVisible] = useState(false);
  const [tendenciaNitrogenoLegendVisible, setTendenciaNitrogenoLegendVisible] =
    useState(true);
  const [tendenciaFosforoLegendVisible, setTendenciaFosforoLegendVisible] =
    useState(false);

  // Estados para manejo de carga y errores del raster
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el valor del pixel
  const [pixelValue, setPixelValue] = useState(null);

  // Estado para tooltips
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false);

  // Estado para controlar la posición dinámica de la leyenda
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [layerControlWidth, setLayerControlWidth] = useState(300);

  // Función para toggle de tooltips
  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  // Función para manejar cambios en el estado del control de capas
  const handleControlStateChange = (collapsed, width) => {
    setLayerControlCollapsed(collapsed);
    setLayerControlWidth(width);
  };

  // Estado para el centro del mapa
  const [mapCenter, setMapCenter] = useState([19.5, -99.0]);
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
          if (areaData && areaData.features && areaData.features.length > 0) {
            const bounds = L.geoJSON(areaData).getBounds();
            const center = bounds.getCenter();
            setMapCenter([center.lat, center.lng]);

            // Calcular zoom apropiado basado en el tamaño del área
            const latDiff = bounds.getNorth() - bounds.getSouth();
            const lngDiff = bounds.getEast() - bounds.getWest();
            const maxDiff = Math.max(latDiff, lngDiff);

            // Ajustar zoom basado en el tamaño del área
            let zoom = 10;
            if (maxDiff > 2) zoom = 8;
            else if (maxDiff > 1) zoom = 9;
            else if (maxDiff > 0.5) zoom = 10;
            else if (maxDiff > 0.2) zoom = 11;
            else zoom = 12;

            setMapZoom(zoom);
          }
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

        // Cargar exportación de nutrientes
        const expNutrResponse = await fetch(geojsonUrl);
        if (expNutrResponse.ok) {
          const expNutrData = await expNutrResponse.json();
          setExpNutr(expNutrData);
        }
      } catch (error) {
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, [geojsonUrl]);

  // Efecto para controlar la visibilidad de las leyendas
  useEffect(() => {
    // Mostrar leyenda de nitrógeno
    if (activeLayers.expNutrN && !activeLayers.rasterN) {
      setNitrogenoLegendVisible(true);
      setTendenciaNitrogenoLegendVisible(false);
    } else if (activeLayers.rasterN && !activeLayers.expNutrN) {
      setNitrogenoLegendVisible(false);
      setTendenciaNitrogenoLegendVisible(true);
    } else if (activeLayers.rasterN && activeLayers.expNutrN) {
      // Si ambos están activos, priorizar raster
      setNitrogenoLegendVisible(false);
      setTendenciaNitrogenoLegendVisible(true);
    } else {
      setNitrogenoLegendVisible(false);
      setTendenciaNitrogenoLegendVisible(false);
    }

    // Mostrar leyenda de fósforo
    if (activeLayers.expNutrP && !activeLayers.rasterP) {
      setFosforoLegendVisible(true);
      setTendenciaFosforoLegendVisible(false);
    } else if (activeLayers.rasterP && !activeLayers.expNutrP) {
      setFosforoLegendVisible(false);
      setTendenciaFosforoLegendVisible(true);
    } else if (activeLayers.rasterP && activeLayers.expNutrP) {
      // Si ambos están activos, priorizar raster
      setFosforoLegendVisible(false);
      setTendenciaFosforoLegendVisible(true);
    } else {
      setFosforoLegendVisible(false);
      setTendenciaFosforoLegendVisible(false);
    }
  }, [
    activeLayers.expNutrN,
    activeLayers.expNutrP,
    activeLayers.rasterN,
    activeLayers.rasterP,
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
        {/* RasterOverlay para tendencias */}
        {activeLayers.rasterN && (
          <RasterOverlay
            fileName="TEND_N.tif"
            colorMap={["#0c5406", "#fffee1", "#3c003d"]}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterN}
          />
        )}

        {activeLayers.rasterP && (
          <RasterOverlay
            fileName="TEND_P.tif"
            colorMap={["#0c5406", "#3c003d"]}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterP}
          />
        )}

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          expNutr={expNutr}
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
        <NitrogenoLegend
          isVisible={nitrogenoLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />
        <FosforoLegend
          isVisible={fosforoLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />
        <TendenciaNitrogenoLegend
          isVisible={tendenciaNitrogenoLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />
        <TendenciaFosforoLegend
          isVisible={tendenciaFosforoLegendVisible}
          layerControlCollapsed={layerControlCollapsed}
          layerControlWidth={layerControlWidth}
        />

        {/* Controles de coordenadas y escala */}
        <CoordinateControl />
        <ScaleControl />

        {/* Componente para mostrar el valor del pixel */}
        <PixelValueDisplay pixelValue={pixelValue} />

        {/* Control de información (tooltips) */}
        <InfoControl
          onToggleTooltips={toggleTooltips}
          tooltipsEnabled={tooltipsEnabled}
        />
      </MapContainer>
    </div>
  );
};

export default Nutrientes;
