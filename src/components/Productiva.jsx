import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Función para generar colores específicos para datos de población productiva usando valores numéricos
const generateProductivaColorPalette = (values, fieldName) => {
  if (!values || values.length === 0) return {};

  const numericValues = values
    .filter((v) => v != null && !isNaN(v))
    .map(Number);
  if (numericValues.length === 0) return {};

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);

  // Paletas de colores específicas por campo
  const colorPalettes = {
    PEA: ["#FFF5F0", "#FEE0D2", "#FCBBA1", "#FC9272", "#FB6A4A"], // Rojos para PEA
    PE_INAC: ["#F7FBFF", "#DEEBF7", "#C6DBEF", "#9ECAE1", "#6BAED6"], // Azules para PE_INAC
    POCUPADA: ["#F7FCF5", "#E5F5E0", "#C7E9C0", "#A1D99B", "#74C476"], // Verdes para POCUPADA
    PDESOCUP: ["#FCFBFD", "#EFEDF5", "#DADAEB", "#BCBDDC", "#9E9AC8"], // Púrpuras para PDESOCUP
  };

  const colors = colorPalettes[fieldName] || colorPalettes["PEA"];

  const result = {};
  numericValues.forEach((value) => {
    const normalizedValue = (value - min) / (max - min);
    const colorIndex = Math.floor(normalizedValue * (colors.length - 1));
    result[value] =
      colors[Math.max(0, Math.min(colorIndex, colors.length - 1))];
  });

  // Agregar información de rango para la leyenda continua
  result._range = { min, max, colors, fieldName };

  return result;
};

// Componente de leyenda con rampa continua para población productiva
const ColorRampLegend = ({ colorMap, isVisible, currentField }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorMap || !colorMap._range) {
    return null;
  }

  const { min, max, colors, fieldName } = colorMap._range;

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: "10px",
    backgroundColor: "white",
    borderRadius: "0px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
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
    color: "#666",
    marginTop: "4px",
  };

  const fieldLabels = {
    PEA: "Población económicamente activa",
    PE_INAC: "Población económicamente inactiva",
    POCUPADA: "Población ocupada",
    PDESOCUP: "Población desocupada",
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
            border: "1px solid #ddd",
            backgroundColor: "#fafafa",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              fontSize: "11px",
            }}
          >
            {fieldLabels[fieldName] || "Valores"}
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

const CoordinateDisplay = () => {
  const map = useMap();
  useEffect(() => {
    // Crear el div de coordenadas con posicionamiento absoluto
    const coordinateDiv = L.DomUtil.create("div", "coordinate-control");
    coordinateDiv.style.position = "absolute";
    coordinateDiv.style.bottom = "10px";
    coordinateDiv.style.right = "80px"; // A la izquierda de donde está la escala
    coordinateDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    coordinateDiv.style.padding = "2px 6px";
    coordinateDiv.style.fontSize = "11px";
    coordinateDiv.style.borderRadius = "3px";
    coordinateDiv.style.border = "1px solid #ccc";
    coordinateDiv.style.fontFamily = "monospace";
    coordinateDiv.style.zIndex = "1000";
    coordinateDiv.innerHTML = "Lat: 0.00000, Lng: 0.00000";

    // Agregar al contenedor del mapa
    const mapContainer = map.getContainer();
    mapContainer.appendChild(coordinateDiv);

    // Función para actualizar coordenadas
    const updateCoordinates = (e) => {
      const { lat, lng } = e.latlng;
      coordinateDiv.innerHTML = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(
        5
      )}`;
    };

    // Agregar listener de mouse move
    map.on("mousemove", updateCoordinates);

    // Cleanup
    return () => {
      map.off("mousemove", updateCoordinates);
      if (coordinateDiv.parentNode) {
        coordinateDiv.parentNode.removeChild(coordinateDiv);
      }
    };
  }, [map]);

  return null;
};

const ScaleDisplay = () => {
  const map = useMap();
  useEffect(() => {
    const scaleControl = L.control.scale({
      position: "bottomright",
      metric: true,
      imperial: false,
    });

    scaleControl.addTo(map);

    return () => {
      map.removeControl(scaleControl);
    };
  }, [map]);

  return null;
};

// Componente para el control de información (tooltips)
const InfoBox = ({ onToggleTooltips, tooltipsEnabled }) => {
  const controlStyle = {
    position: "absolute",
    top: "80px",
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

// Función auxiliar para descargar datos
const downloadData = (data, filename) => {
  if (!data) return;

  const dataStr = JSON.stringify(data);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportFileDefaultName = `${filename}.geojson`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
};

// Control de capas agrupado para datos de población productiva
const GroupedLayerControl = ({
  productivaData,
  area,
  paisajes,
  municipios,
  onColorMapChange,
  onLegendVisibilityChange,
  tooltipsEnabled,
  activeLayers,
  setActiveLayers,
  opacity,
  setOpacity,
  currentField,
  setCurrentField,
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
    newLayers.baseLayers = baseLayers;

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

    // Capas de Interés - Población Productiva
    if (productivaData) {
      // Generar mapa de colores para el campo activo
      const productivaValues = productivaData.features
        .map((f) => f.properties[currentField])
        .filter((v) => v != null && !isNaN(v));

      console.log(
        "Productiva values for field",
        currentField,
        ":",
        productivaValues.slice(0, 10)
      );

      const newColorMap = generateProductivaColorPalette(
        productivaValues,
        currentField
      );

      console.log(
        "Generated color map:",
        Object.keys(newColorMap).length,
        "entries"
      );
      console.log(
        "Sample color map entries:",
        Object.entries(newColorMap).slice(0, 5)
      );

      newLayers[currentField] = L.geoJSON(productivaData, {
        pane: "vectorPane", // Asignar al pane vectorial
        pointToLayer: (feature, latlng) => {
          const value = feature.properties[currentField];
          const color = newColorMap[value] || "#CCCCCC";
          if (!newColorMap[value]) {
            console.log(
              "No color found for value:",
              value,
              "in field:",
              currentField
            );
          }
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: color,
            color: "white",
            weight: 1,
            opacity: 1,
            fillOpacity: opacity[currentField] || 0.7,
          });
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const props = feature.properties;

            // Configurar tooltip al hacer hover si está habilitado
            const bindTooltipIfEnabled = () => {
              if (tooltipsEnabled) {
                const fieldLabels = {
                  PEA: "PEA",
                  PE_INAC: "PE Inactiva",
                  POCUPADA: "Ocupada",
                  PDESOCUP: "Desocupada",
                };
                layer.bindTooltip(
                  `
                  <strong>Localidad:</strong> ${props.NOM_LOC || "N/A"}<br>
                  <strong>${fieldLabels[currentField]}:</strong> ${
                    props[currentField] || "N/A"
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

            // Reconfigurar tooltip cuando cambie el estado
            layer.bindTooltipIfEnabled = bindTooltipIfEnabled;

            // Popup con información detallada
            const fieldLabels = {
              PEA: "Población económicamente activa",
              PE_INAC: "Población económicamente inactiva",
              POCUPADA: "Población ocupada",
              PDESOCUP: "Población desocupada",
            };

            const popupContent = `
              <div style="font-family: Arial, sans-serif; font-size: 12px;">
                <strong>${props.NOM_LOC || "Sin nombre"}</strong><br/>
                <strong>Municipio:</strong> ${props.NOM_MUN || "N/A"}<br/>
                <strong>Población total:</strong> ${props.POBTOT || "N/A"}<br/>
                <hr style="margin: 5px 0;"/>
                <strong>PEA:</strong> ${props.PEA || "N/A"}<br/>
                <strong>PE Inactiva:</strong> ${props.PE_INAC || "N/A"}<br/>
                <strong>Ocupada:</strong> ${props.POCUPADA || "N/A"}<br/>
                <strong>Desocupada:</strong> ${props.PDESOCUP || "N/A"}
              </div>
            `;

            layer.bindPopup(popupContent);
          }
        },
      });

      // Solo agregar al mapa si está activa, pero siempre crear la capa para poder togglearla
      if (activeLayers[currentField]) {
        newLayers[currentField].addTo(map);
        if (onColorMapChange) {
          onColorMapChange(newColorMap);
        }
        if (onLegendVisibilityChange) {
          onLegendVisibilityChange(true);
        }
      }
    }

    setLayers(newLayers);

    return () => {
      Object.values(newLayers).forEach((layer) => {
        if (layer && layer !== newLayers.baseLayers && map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [
    map,
    productivaData,
    area,
    paisajes,
    municipios,
    activeLayers,
    opacity,
    tooltipsEnabled,
    currentField,
    onColorMapChange,
    onLegendVisibilityChange,
    activeBaseLayer,
  ]);

  // Controlar visibilidad de la leyenda basada en las capas demográficas activas
  useEffect(() => {
    const demograficLayers = ["PEA", "PE_INAC", "POCUPADA", "PDESOCUP"];
    const activeCount = demograficLayers.filter(
      (key) => activeLayers[key]
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

    // Hay al menos una capa demográfica activa, mostrar leyenda del campo actual
    if (
      productivaData &&
      productivaData.features &&
      onColorMapChange &&
      onLegendVisibilityChange
    ) {
      const values = productivaData.features
        .map((f) => f.properties[currentField])
        .filter((v) => v != null && !isNaN(v));
      const newColorMap = generateProductivaColorPalette(values, currentField);
      onColorMapChange(newColorMap);
      onLegendVisibilityChange(true);
    }
  }, [
    activeLayers,
    currentField,
    productivaData,
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
    const demograficLayers = ["PEA", "PE_INAC", "POCUPADA", "PDESOCUP"];
    if (
      demograficLayers.includes(layerKey) &&
      onLegendVisibilityChange &&
      onColorMapChange
    ) {
      const anyDemograficActive = demograficLayers.some(
        (key) => newActiveLayers[key]
      );

      if (anyDemograficActive) {
        // Al menos una capa demográfica activa, mostrar leyenda del campo actual
        if (productivaData && productivaData.features) {
          const values = productivaData.features
            .map((f) => f.properties[currentField])
            .filter((v) => v != null && !isNaN(v));
          const newColorMap = generateProductivaColorPalette(
            values,
            currentField
          );
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
    if (layer && layer.eachLayer) {
      layer.eachLayer((subLayer) => {
        if (subLayer.setStyle) {
          subLayer.setStyle({ fillOpacity: newOpacity });
        }
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
            onClick={() => downloadData(data, title.toLowerCase())}
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
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "3px" }}>
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

  const fieldLabels = {
    PEA: "Población económicamente activa",
    PE_INAC: "Población económicamente inactiva",
    POCUPADA: "Población ocupada",
    PDESOCUP: "Población desocupada",
  };

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Capas</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "12px" }}>
          {/* Selector de campo */}
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
              Campo a visualizar
            </strong>
            <div style={{ marginLeft: "10px" }}>
              {Object.entries(fieldLabels).map(([value, label]) => (
                <div key={value} style={{ marginBottom: "2px" }}>
                  <input
                    type="radio"
                    name="currentField"
                    checked={currentField === value}
                    onChange={() => setCurrentField(value)}
                  />
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "12px",
                      fontWeight: "normal",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

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
                color: "#2c3e50",
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
                title="Paisajes"
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

          {/* Datos de Población Productiva */}
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
              Población Productiva
            </strong>
            {productivaData && (
              <LayerItem
                layerKey={currentField}
                title={fieldLabels[currentField]}
                data={productivaData}
                showOpacity={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const Productiva = () => {
  const [productivaData, setProductivaData] = useState(null);
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [coordinatesEnabled, setCoordinatesEnabled] = useState(true);
  const [scaleEnabled, setScaleEnabled] = useState(true);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [infoBoxEnabled, setInfoBoxEnabled] = useState(true);
  const [activeLayers, setActiveLayers] = useState({
    PEA: true,
    PE_INAC: false,
    POCUPADA: false,
    PDESOCUP: false,
    area: true,
    paisajes: false,
    municipios: false,
  });
  const [opacity, setOpacity] = useState({
    PEA: 0.7,
    PE_INAC: 0.7,
    POCUPADA: 0.7,
    PDESOCUP: 0.7,
  });
  const [currentField, setCurrentField] = useState("PEA");
  const [legendVisible, setLegendVisible] = useState(true);
  const [colorMap, setColorMap] = useState({});

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        // Usar los mismos archivos que otros componentes
        const [
          productivaResponse,
          areaResponse,
          paisajesResponse,
          municipiosResponse,
        ] = await Promise.all([
          fetch("/ITER_2020.geojson"),
          fetch("/AREA.geojson"),
          fetch("/PAISAJES.geojson"),
          fetch("/MUNICIPIOS.geojson"),
        ]);

        if (productivaResponse.ok) {
          const data = await productivaResponse.json();
          setProductivaData(data);
        }
        if (areaResponse.ok) {
          const data = await areaResponse.json();
          setArea(data);
        }
        if (paisajesResponse.ok) {
          const data = await paisajesResponse.json();
          setPaisajes(data);
        }
        if (municipiosResponse.ok) {
          const data = await municipiosResponse.json();
          setMunicipios(data);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    };

    loadData();
  }, []);

  const handleColorMapChange = (newColorMap) => {
    setColorMap(newColorMap);
  };

  const handleLegendVisibilityChange = (visible) => {
    setLegendVisible(visible);
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <MapContainer
        center={[21.5, -102.5]}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        preferCanvas={true}
        attributionControl={false}
      >
        <GroupedLayerControl
          productivaData={productivaData}
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          onColorMapChange={handleColorMapChange}
          onLegendVisibilityChange={handleLegendVisibilityChange}
          tooltipsEnabled={tooltipsEnabled}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          currentField={currentField}
          setCurrentField={setCurrentField}
        />

        {/* Controles adicionales */}
        {coordinatesEnabled && <CoordinateDisplay />}
        {scaleEnabled && <ScaleDisplay />}
        {infoBoxEnabled && <InfoBox />}

        {/* Leyenda de colores */}
        {legendVisible && colorMap && Object.keys(colorMap).length > 0 && (
          <ColorRampLegend colorMap={colorMap} currentField={currentField} />
        )}
      </MapContainer>
    </div>
  );
};

export default Productiva;
