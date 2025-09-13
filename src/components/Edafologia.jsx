import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css";
import "leaflet-groupedlayercontrol";

// Función para generar colores específicos para humedad
const generateHumedadColorPalette = (values) => {
  const colorMap = {
    "2 meses": "#fee5b1", // beige claro
    "3 meses": "#ffffd7", // khaki claro
    "4 meses": "#e1ffa9", // verde amarillo claro
    "5 meses": "#98ff66", // verde lima
    "6 meses": "#65f0cb", // verde menta claro
    "7 meses": "#64cbb4", // turquesa oscuro
    "8 meses": "#aad1fe", // azul cielo
    "9 meses": "#67a9fe", // azul real
    "10 meses": "#6794cb", // azul pizarra oscuro
    "11 meses": "#8e94b8", // violeta medio
    "12 meses": "#a98eb7", // orquídea medio
  };

  // Crear mapa solo con los valores que existen en los datos
  const uniqueValues = [...new Set(values)];
  const result = {};
  uniqueValues.forEach((value) => {
    if (colorMap[value]) {
      result[value] = colorMap[value];
    } else {
      // Fallback color si no está en la guía
      result[value] = "#CCCCCC";
    }
  });

  return result;
};

// Función para generar colores específicos para tipos de suelo
const generateEdafologiaColorPalette = (values) => {
  const colorMap = {
    "Acrisol - Fina": "#F8BBE4",
    "Acrisol - Media": "#E555A1",
    "Cambisol - Fina": "#8E44AD",
    "Cambisol - Media": "#AED6F1",
    "Cambisol - Gruesa": "#5DADE2",
    "Calcisol - Media": "#7FB3D3",
    "Fluvisol - Media": "#A3E4D7",
    "Fluvisol - Gruesa": "#5DCCCC",
    "Kastanozem - Media": "#A0877C",
    "Leptosol - Fina": "#E8F5E8",
    "Leptosol - Media": "#A9DFBF",
    "Leptosol - Gruesa": "#76C776",
    "Luvisol - Fina": "#FFF2CC",
    "Luvisol - Media": "#F7DC6F",
    "Luvisol - Gruesa": "#B7950B",
    "Phaeozem - Fina": "#F9E79F",
    "Phaeozem - Media": "#F39C12",
    "Phaeozem - Gruesa": "#B7950B",
    "Regosol - Media": "#F1C0C0",
    "Regosol - Gruesa": "#EC7063",
    "Umbrisol - Fina": "#8D6E63",
    "Vertisol - Fina": "#85C1E9",
  };

  // Crear mapa solo con los valores que existen en los datos
  const uniqueValues = [...new Set(values)];
  const result = {};
  uniqueValues.forEach((value) => {
    if (colorMap[value]) {
      result[value] = colorMap[value];
    } else {
      // Fallback color si no está en la guía
      result[value] = "#CCCCCC";
    }
  });

  return result;
};

// Función para generar colores únicos basados en valores (para otros usos)
const generateColorPalette = (values) => {
  const uniqueValues = [...new Set(values)];
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
  ];

  const colorMap = {};
  uniqueValues.forEach((value, index) => {
    colorMap[value] = colors[index % colors.length];
  });

  return colorMap;
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

// Componente de leyenda retráctil en esquina inferior derecha
const ColorLegend = ({ colorMap, isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || Object.keys(colorMap).length === 0) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "11px",
    maxWidth: "200px",
    border: "2px solid rgba(0,0,0,0.2)",
  };

  const headerStyle = {
    padding: "8px 12px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    backgroundColor: "#f8f9fa",
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Leyenda</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            maxHeight: "500px", // Altura máxima aumentada para mostrar todos los elementos
            overflowY: "auto", // Auto para que aparezca solo si es necesario
            border: "1px solid #ddd",
            backgroundColor: "#fafafa",
            scrollbarWidth: "thin", // Para Firefox
          }}
        >
          {Object.entries(colorMap)
            .sort(([a], [b]) => {
              // Si contiene "meses", ordenar numéricamente por el número de meses
              if (a.includes("meses") && b.includes("meses")) {
                const numA = parseInt(a.split(" ")[0]);
                const numB = parseInt(b.split(" ")[0]);
                return numA - numB;
              }
              // Si no son meses, ordenar alfabéticamente
              return a.localeCompare(b);
            })
            .map(([edafo, color]) => (
              <div
                key={edafo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "6px",
                  fontSize: "10px",
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
                <span style={{ lineHeight: "1.2" }}>{edafo}</span>
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
    coordinateDiv.style.bottom = "10px";
    coordinateDiv.style.right = "80px"; // A la izquierda de donde está la escala
    coordinateDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    coordinateDiv.style.padding = "5px";
    coordinateDiv.style.border = "2px solid rgba(0,0,0,0.2)";
    coordinateDiv.style.borderRadius = "0px";
    coordinateDiv.style.font =
      '11px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif';
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
  edafologia,
  humedad,
  onColorMapChange,
  onLegendVisibilityChange,
  tooltipsEnabled,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: true,
    municipios: true,
    edafologia: true,
    humedad: false,
  });
  const [activeBaseLayer, setActiveBaseLayer] = useState(
    "Topográfico (OpenTopoMap)"
  );
  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    edafologia: 1,
    humedad: 1,
  });
  const [colorMap, setColorMap] = useState({});

  useEffect(() => {
    const newLayers = {};

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
      newLayers.area.addTo(map); // Agregar por defecto
    }

    if (paisajes) {
      newLayers.paisajes = L.geoJSON(paisajes, {
        style: { color: "white", weight: 3, fillOpacity: 0 },
      });
      newLayers.paisajes.addTo(map); // Agregar por defecto
    }

    if (municipios) {
      newLayers.municipios = L.geoJSON(municipios, {
        style: { color: "black", weight: 1, fillOpacity: 0 },
      });
      newLayers.municipios.addTo(map); // Agregar por defecto
    }

    // Capas de Interés - Edafología (usando edafología con colores por EDAFO)
    if (edafologia) {
      // Generar mapa de colores para el campo EDAFO usando la guía específica
      const edafoValues = edafologia.features
        .map((f) => f.properties.Edafo)
        .filter(Boolean);
      const newColorMap = generateEdafologiaColorPalette(edafoValues);

      // Solo establecer colorMap si no hay uno ya establecido o si es la carga inicial
      if (Object.keys(colorMap).length === 0) {
        setColorMap(newColorMap);

        // Notificar al componente padre sobre el colorMap
        if (onColorMapChange) {
          onColorMapChange(newColorMap);
        }
      }

      newLayers.edafologia = L.geoJSON(edafologia, {
        style: (feature) => {
          const edafo = feature.properties.Edafo;
          return {
            fillColor: newColorMap[edafo] || "#gray",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: 1,
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
                  <strong>Paisaje:</strong> ${props.PAISAJE || "N/A"}<br>
                  <strong>Hectáreas:</strong> ${props.HAS_SUELO || "N/A"}<br> 
                  <strong>Edafología:</strong> ${props.Edafo || "N/A"}
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

            // Configurar popup al hacer clic (siempre disponible)
            layer.bindPopup(`
                <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
                <strong>Paisaje:</strong> ${props.PAISAJE || "N/A"}<br>
                <strong>Hectáreas:</strong> ${props.HAS_SUELO || "N/A"}<br> 
                <strong>Edafología:</strong> ${props.Edafo || "N/A"}
            `);

            // Configurar tooltip inicial
            bindTooltipIfEnabled();

            // Actualizar tooltip cuando cambie el estado
            layer.updateTooltip = bindTooltipIfEnabled;
          }
        },
      });
      newLayers.edafologia.addTo(map); // Agregar por defecto
    }

    // Capas de Interés - Humedad (usando humedad con colores por HUMEDAD)
    if (humedad) {
      // Generar mapa de colores para el campo HUMEDAD usando la guía específica
      const humedadValues = humedad.features
        .map((f) => f.properties.HUMEDAD)
        .filter(Boolean);
      const newHumedadColorMap = generateHumedadColorPalette(humedadValues);

      newLayers.humedad = L.geoJSON(humedad, {
        style: (feature) => {
          const humedadValue = feature.properties.HUMEDAD;
          return {
            fillColor: newHumedadColorMap[humedadValue] || "#gray",
            weight: 0,
            opacity: 1,
            color: "white",
            fillOpacity: 1,
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
                  <strong>Paisaje:</strong> ${props.PAISAJE || "N/A"}<br>
                  <strong>Hectáreas:</strong> ${props.HAS_SUELO || "N/A"}<br> 
                  <strong>Humedad:</strong> ${props.HUMEDAD || "N/A"}
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

            // Configurar popup al hacer clic (siempre disponible)
            layer.bindPopup(`
              <strong>Municipio:</strong> ${props.NOMGEO || "N/A"}<br>
              <strong>Paisaje:</strong> ${props.PAISAJE || "N/A"}<br>
              <strong>Hectáreas:</strong> ${props.HAS_SUELO || "N/A"}<br> 
              <strong>Humedad:</strong> ${props.HUMEDAD || "N/A"}
            `);

            // Configurar tooltip inicial
            bindTooltipIfEnabled();

            // Actualizar tooltip cuando cambie el estado
            layer.updateTooltip = bindTooltipIfEnabled;
          }
        },
      });
      // No agregar por defecto, estará desactivada inicialmente
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
  }, [map, area, paisajes, municipios, edafologia, humedad, activeBaseLayer]);

  // Efecto para actualizar tooltips cuando cambie el estado
  useEffect(() => {
    if (layers.edafologia) {
      layers.edafologia.eachLayer((layer) => {
        if (layer.updateTooltip) {
          layer.updateTooltip();
        }
      });
    }
  }, [tooltipsEnabled, layers.edafologia]);

  // Efecto para actualizar tooltips de humedad cuando cambie el estado
  useEffect(() => {
    if (layers.humedad) {
      layers.humedad.eachLayer((layer) => {
        if (layer.updateTooltip) {
          layer.updateTooltip();
        }
      });
    }
  }, [tooltipsEnabled, layers.humedad]);

  const toggleLayer = (layerKey) => {
    const layer = layers[layerKey];
    if (!layer) return;

    const newActiveLayers = { ...activeLayers };

    if (activeLayers[layerKey]) {
      map.removeLayer(layer);
      newActiveLayers[layerKey] = false;
    } else {
      layer.addTo(map);
      newActiveLayers[layerKey] = true;
    }

    setActiveLayers(newActiveLayers);

    // Controlar visibilidad de la leyenda y actualizar colorMap para edafología y humedad
    if (
      (layerKey === "edafologia" || layerKey === "humedad") &&
      onLegendVisibilityChange
    ) {
      // Mostrar leyenda si alguna de las capas está activa
      const showLegend = newActiveLayers.edafologia || newActiveLayers.humedad;
      onLegendVisibilityChange(showLegend);

      // Actualizar colorMap según qué capa esté activa
      if (
        newActiveLayers.edafologia &&
        !newActiveLayers.humedad &&
        edafologia
      ) {
        // Solo edafología activa
        const edafoValues = edafologia.features
          .map((f) => f.properties.Edafo)
          .filter(Boolean);
        const newColorMap = generateEdafologiaColorPalette(edafoValues);
        setColorMap(newColorMap);
        if (onColorMapChange) {
          onColorMapChange(newColorMap);
        }
      } else if (
        newActiveLayers.humedad &&
        !newActiveLayers.edafologia &&
        humedad
      ) {
        // Solo humedad activa
        const humedadValues = humedad.features
          .map((f) => f.properties.HUMEDAD)
          .filter(Boolean);
        const newHumedadColorMap = generateHumedadColorPalette(humedadValues);
        setColorMap(newHumedadColorMap);
        if (onColorMapChange) {
          onColorMapChange(newHumedadColorMap);
        }
      } else if (!newActiveLayers.edafologia && !newActiveLayers.humedad) {
        // Ninguna capa activa, limpiar colorMap
        setColorMap({});
        if (onColorMapChange) {
          onColorMapChange({});
        }
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
    }

    setActiveBaseLayer(newBaseLayer);
  };

  const handleOpacityChange = (layerKey, newOpacity) => {
    setOpacity((prev) => ({ ...prev, [layerKey]: newOpacity }));
    const layer = layers[layerKey];
    if (layer && map.hasLayer(layer)) {
      layer.setStyle({
        fillOpacity: newOpacity * 0.7,
        opacity: newOpacity,
      });
    }
  };

  const controlStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    maxWidth: "300px",
  };

  const headerStyle = {
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
        marginBottom: "6px",
        padding: "0px",
        backgroundColor: "transparent",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "8px",
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
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "5px" }}>
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
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
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
                color: "#2c3e50",
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
                color: "#2c3e50",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Límites{" "}
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
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "10px",
              marginBottom: "20px",
            }}
          >
            <strong
              style={{
                color: "#2c3e50",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
              }}
            >
              Edafología
            </strong>
            {edafologia && (
              <LayerItem
                layerKey="edafologia"
                title="Tipos de suelo"
                data={edafologia}
                showOpacity={true}
              />
            )}
            {humedad && (
              <LayerItem
                layerKey="humedad"
                title="Meses de humedad"
                data={humedad}
                showOpacity={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para manejar dragging
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

const MapView = () => {
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [edafologia, setEdafologia] = useState(null);
  const [humedad, setHumedad] = useState(null);
  const [colorMap, setColorMap] = useState({});
  const [showLegend, setShowLegend] = useState(true); // Mostrar leyenda por defecto
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false); // Tooltips desactivados por defecto

  const toggleTooltips = () => {
    setTooltipsEnabled(!tooltipsEnabled);
  };

  useEffect(() => {
    fetch("/AREA.geojson")
      .then((res) => res.json())
      .then(setArea);
    fetch("/PAISAJES.geojson")
      .then((res) => res.json())
      .then(setPaisajes);
    fetch("/MUNICIPIOS.geojson")
      .then((res) => res.json())
      .then(setMunicipios);
    fetch("/EDAFOLOGIA.geojson")
      .then((res) => res.json())
      .then(setEdafologia);
    fetch("/HUMEDAD.geojson")
      .then((res) => res.json())
      .then(setHumedad);
  }, []);

  return (
    <MapContainer
      center={[16.67566, -96.28311]}
      zoom={10}
      scrollWheelZoom={true}
      dragging={false}
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
        edafologia={edafologia}
        humedad={humedad}
        onColorMapChange={setColorMap}
        onLegendVisibilityChange={setShowLegend}
        tooltipsEnabled={tooltipsEnabled}
      />
      <ColorLegend colorMap={colorMap} isVisible={showLegend} />
      <CoordinateControl />
      <ScaleControl />
    </MapContainer>
  );
};

export default MapView;
