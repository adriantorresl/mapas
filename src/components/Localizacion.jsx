import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-minimap/dist/Control.MiniMap.min.css";
import "leaflet-minimap";
import "leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css";
import "leaflet-groupedlayercontrol";
import { CloudDownloadOutlined } from "@ant-design/icons";
import { Download } from "lucide-react";

// Función para generar colores únicos basados en valores
const generateColorPalette = (values) => {
  const uniqueValues = [...new Set(values)];
  const colors = [
    "#c8d79e",
    "#ffffbd",
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
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▲" : "▼"}</span>
      </div>

      {!isCollapsed && (
        <div style={{ padding: "10px", maxHeight: "300px", overflowY: "auto" }}>
          {Object.entries(colorMap).map(([paisaje, color]) => (
            <div
              key={paisaje}
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
              <span style={{ lineHeight: "1.2" }}>{paisaje}</span>
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
    top: "180px", // Debajo del botón de mediciones (ahora con 3 botones)
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
    paisajesBio: true,
  });
  const [activeBaseLayer, setActiveBaseLayer] = useState("Topográfico (OSM)");
  const [opacity, setOpacity] = useState({
    area: 1,
    paisajes: 1,
    municipios: 1,
    paisajesBio: 0.7,
  });
  const [colorMap, setColorMap] = useState({});

  useEffect(() => {
    const newLayers = {};

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
        style: { color: "red", weight: 1, fillOpacity: 0 },
      });
      newLayers.municipios.addTo(map); // Agregar por defecto
    }

    // Capas de Interés - Paisajes Bioculturales (usando municipios con colores por PAISAJE)
    if (municipios) {
      // Generar mapa de colores para el campo PAISAJE
      const paisajeValues = municipios.features
        .map((f) => f.properties.PAISAJE)
        .filter(Boolean);
      const newColorMap = generateColorPalette(paisajeValues);
      setColorMap(newColorMap);

      // Notificar al componente padre sobre el colorMap
      if (onColorMapChange) {
        onColorMapChange(newColorMap);
      }

      newLayers.paisajesBio = L.geoJSON(municipios, {
        style: (feature) => {
          const paisaje = feature.properties.PAISAJE;
          return {
            fillColor: newColorMap[paisaje] || "#gray",
            weight: 0,
            opacity: 0.7,
            color: "white",
            fillOpacity: 0.7,
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
                  <strong>Municipio:</strong> ${props.NOM_MUN || "N/A"}<br>
                  <strong>Paisaje:</strong> ${props.PAISAJE || "N/A"}<br>
                  <strong>Hectáreas:</strong> ${props.HAS_MUN || "N/A"} 
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
              <strong>Municipio:</strong> ${props.NOM_MUN || "N/A"}<br>
              <strong>Paisaje:</strong> ${props.PAISAJE || "N/A"}<br>
              <strong>Hectáreas:</strong> ${props.HAS_MUN || "N/A"} 
            `);

            // Configurar tooltip inicial
            bindTooltipIfEnabled();

            // Actualizar tooltip cuando cambie el estado
            layer.updateTooltip = bindTooltipIfEnabled;
          }
        },
      });
      newLayers.paisajesBio.addTo(map); // Agregar por defecto
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
  }, [map, area, paisajes, municipios, activeBaseLayer, tooltipsEnabled]);

  // Efecto para actualizar tooltips cuando cambie el estado
  useEffect(() => {
    if (layers.paisajesBio) {
      layers.paisajesBio.eachLayer((layer) => {
        if (layer.updateTooltip) {
          layer.updateTooltip();
        }
      });
    }
  }, [tooltipsEnabled, layers.paisajesBio]);

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

    // Controlar visibilidad de la leyenda para paisajes bioculturales
    if (layerKey === "paisajesBio" && onLegendVisibilityChange) {
      onLegendVisibilityChange(newActiveLayers[layerKey]);
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
    borderBottom: "1px solid #e0e0e0",
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
        marginBottom: "5px",
        padding: " 2px 10px",
        backgroundColor: "transparent",
        borderRadius: "4px",
        hover: {
          backgroundColor: "#f9f9f9",
        },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f9f9f9";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          alignContent: "center",
          marginBottom: "4px",
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
            <Download style={{ width: "20px", height: "20px" }} color="#000" />
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
                fontSize: "14px",
                fontWeight: "600",
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
                fontWeight: "600",
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
          <div>
            <strong
              style={{
                color: "#2c3e50",
                marginBottom: "10px",
                display: "block",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              Capas de Interés
            </strong>
            {municipios && (
              <LayerItem
                layerKey="paisajesBio"
                title="Paisajes bioculturales"
                data={municipios}
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

// Componente para el control de medición
const MeasureControl = () => {
  const map = useMap();

  useEffect(() => {
    // Configurar opciones del control de medición con mejor precisión
    const measureControl = new L.Control.Measure({
      position: "topleft",
      primaryLengthUnit: "meters",
      secondaryLengthUnit: "kilometers",
      primaryAreaUnit: "sqmeters",
      secondaryAreaUnit: "hectares",
      activeColor: "#4ECDC4",
      completedColor: "#96CEB4",
      decPoint: ".",
      thousandsSep: ",",

      // Configuración mejorada para posicionamiento preciso
      captureZIndex: 10000,
      keyboard: true,
      clearMeasurementsOnRestart: false,
      showBearings: false,
      showClearControl: true,
      showUnitControl: false,

      // Configuraciones adicionales para mejorar precisión
      clickTolerance: 3, // Tolerancia de clic más baja
      touchTolerance: 15, // Tolerancia táctil

      // Configuración específica para evitar offset de coordenadas
      interactive: true,
      bubblingMouseEvents: false,

      // Textos completamente en español
      measureDistanceTitle: "Medir distancia",
      measureAreaTitle: "Medir área",
      clearMeasurementsTitle: "Limpiar mediciones",

      // Configuración de popup mejorada
      popupOptions: {
        className: "leaflet-measure-resultpopup",
        autoPanPadding: [10, 10],
        closeButton: false,
        autoClose: false,
        offset: [0, 0], // Sin offset para evitar desplazamientos
      },

      // Unidades en español
      units: {
        meters: "m",
        kilometers: "km",
        feet: "pies",
        miles: "millas",
        acres: "acres",
        hectares: "ha",
        sqmeters: "m²",
        sqfeet: "pies²",
        sqmiles: "millas²",
      },

      // Configuración de formato para español
      formatDistance: function (distance, unit) {
        return L.Util.formatNum(distance, 2) + " " + this.options.units[unit];
      },

      formatArea: function (area, unit) {
        return L.Util.formatNum(area, 2) + " " + this.options.units[unit];
      },
    });

    map.addControl(measureControl);

    // Variables para controlar el estado de medición
    let isMeasuring = false;
    let measureToolActive = false;

    // Función para desactivar interacciones del mapa
    const disableMapInteractions = () => {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      map.getContainer().style.cursor = "crosshair";
    };

    // Función para reactivar interacciones del mapa
    const enableMapInteractions = () => {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      map.getContainer().style.cursor = "";
    };

    // Interceptar cuando se activa la herramienta de medición
    const measureButtons = map
      .getContainer()
      .querySelectorAll(".leaflet-control-measure .js-start");
    measureButtons.forEach((button) => {
      L.DomEvent.on(button, "click", function (e) {
        measureToolActive = true;
        disableMapInteractions();
        L.DomEvent.stopPropagation(e);
      });
    });

    // Eventos del control de medición
    map.on("measurestart", function (e) {
      isMeasuring = true;
      measureToolActive = true;
      disableMapInteractions();
    });

    map.on("measurefinish", function (e) {
      isMeasuring = false;
      measureToolActive = false;
      enableMapInteractions();
    });

    // Manejar la cancelación de medición
    map.on("measure:clear", function (e) {
      isMeasuring = false;
      measureToolActive = false;
      enableMapInteractions();
    });

    // Interceptar clics en el mapa cuando la herramienta está activa
    map.on("click", function (e) {
      if (measureToolActive && !isMeasuring) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
      }
    });

    return () => {
      map.removeControl(measureControl);
      map.off("measurestart");
      map.off("measurefinish");
      map.off("measure:clear");
      map.off("click");
    };
  }, [map]);

  return null;
};

// Control de medición personalizado mejorado
const SimpleMeasureControl = () => {
  const map = useMap();

  useEffect(() => {
    // Crear botones de medición
    const controlDiv = L.DomUtil.create(
      "div",
      "leaflet-control-measure leaflet-bar"
    );
    controlDiv.style.position = "absolute";
    controlDiv.style.top = "80px";
    controlDiv.style.left = "10px";
    controlDiv.style.zIndex = "1000";
    controlDiv.style.backgroundColor = "white";
    controlDiv.style.borderRadius = "5px";
    controlDiv.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";

    // Botón de distancia
    const distanceBtn = L.DomUtil.create("a", "", controlDiv);
    distanceBtn.innerHTML = "📏";
    distanceBtn.title = "Medir distancia";
    distanceBtn.style.display = "block";
    distanceBtn.style.width = "30px";
    distanceBtn.style.height = "30px";
    distanceBtn.style.lineHeight = "30px";
    distanceBtn.style.textAlign = "center";
    distanceBtn.style.textDecoration = "none";
    distanceBtn.style.cursor = "pointer";
    distanceBtn.href = "#";

    // Botón de área
    const areaBtn = L.DomUtil.create("a", "", controlDiv);
    areaBtn.innerHTML = "▭";
    areaBtn.title = "Medir área";
    areaBtn.style.display = "block";
    areaBtn.style.width = "30px";
    areaBtn.style.height = "30px";
    areaBtn.style.lineHeight = "30px";
    areaBtn.style.textAlign = "center";
    areaBtn.style.textDecoration = "none";
    areaBtn.style.cursor = "pointer";
    areaBtn.href = "#";

    // Botón de limpiar
    const clearBtn = L.DomUtil.create("a", "", controlDiv);
    clearBtn.innerHTML = "🗑️";
    clearBtn.title = "Limpiar mediciones";
    clearBtn.style.display = "block";
    clearBtn.style.width = "30px";
    clearBtn.style.height = "30px";
    clearBtn.style.lineHeight = "30px";
    clearBtn.style.textAlign = "center";
    clearBtn.style.textDecoration = "none";
    clearBtn.style.cursor = "pointer";
    clearBtn.href = "#";

    // Agregar al mapa
    map.getContainer().appendChild(controlDiv);

    // Variables de medición
    let measuring = false;
    let measureType = null;
    let points = [];
    let measureLayers = [];
    let currentPopup = null;

    // Función para limpiar todas las mediciones
    const clearAllMeasurements = () => {
      measureLayers.forEach((layer) => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
      measureLayers = [];
      if (currentPopup) {
        map.closePopup(currentPopup);
        currentPopup = null;
      }
    };

    // Función para iniciar medición
    const startMeasuring = (type) => {
      clearAllMeasurements();
      measuring = true;
      measureType = type;
      points = [];
      map.getContainer().style.cursor = "crosshair";
      map.dragging.disable();

      // Cambiar estilo del botón activo
      distanceBtn.style.backgroundColor =
        type === "distance" ? "#4ECDC4" : "white";
      areaBtn.style.backgroundColor = type === "area" ? "#4ECDC4" : "white";
    };

    // Función para finalizar medición
    const stopMeasuring = () => {
      measuring = false;
      measureType = null;
      points = [];
      map.getContainer().style.cursor = "";
      map.dragging.enable();

      // Restaurar estilo de botones
      distanceBtn.style.backgroundColor = "white";
      areaBtn.style.backgroundColor = "white";
    };

    // Función para calcular área usando fórmula de Shoelace
    const calculateArea = (latlngs) => {
      if (latlngs.length < 3) return 0;

      let area = 0;
      const earthRadius = 6371000; // Radio de la Tierra en metros

      // Convertir a radianes y usar fórmula de área esférica aproximada
      for (let i = 0; i < latlngs.length; i++) {
        const j = (i + 1) % latlngs.length;
        const lat1 = (latlngs[i].lat * Math.PI) / 180;
        const lng1 = (latlngs[i].lng * Math.PI) / 180;
        const lat2 = (latlngs[j].lat * Math.PI) / 180;
        const lng2 = (latlngs[j].lng * Math.PI) / 180;

        area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
      }

      area = Math.abs((area * earthRadius * earthRadius) / 2);
      return area;
    };

    // Eventos de botones
    L.DomEvent.on(distanceBtn, "click", function (e) {
      L.DomEvent.preventDefault(e);
      L.DomEvent.stopPropagation(e);
      if (measuring && measureType === "distance") {
        stopMeasuring();
      } else {
        startMeasuring("distance");
      }
    });

    L.DomEvent.on(areaBtn, "click", function (e) {
      L.DomEvent.preventDefault(e);
      L.DomEvent.stopPropagation(e);
      if (measuring && measureType === "area") {
        stopMeasuring();
      } else {
        startMeasuring("area");
      }
    });

    L.DomEvent.on(clearBtn, "click", function (e) {
      L.DomEvent.preventDefault(e);
      L.DomEvent.stopPropagation(e);
      clearAllMeasurements();
      stopMeasuring();
    });

    // Evento de clic en el mapa
    const onMapClick = (e) => {
      if (!measuring) return;

      L.DomEvent.stopPropagation(e);
      L.DomEvent.preventDefault(e);

      points.push(e.latlng);

      if (measureType === "distance") {
        // Agregar marcador
        const marker = L.circleMarker(e.latlng, {
          radius: 5,
          color: "#4ECDC4",
          fillColor: "#4ECDC4",
          fillOpacity: 1,
        }).addTo(map);
        measureLayers.push(marker);

        if (points.length > 1) {
          // Crear línea
          const line = L.polyline(points, {
            color: "#4ECDC4",
            weight: 3,
          }).addTo(map);
          measureLayers.push(line);

          // Calcular distancia total
          let totalDistance = 0;
          for (let i = 1; i < points.length; i++) {
            totalDistance += map.distance(points[i - 1], points[i]);
          }

          const distanceText =
            totalDistance > 1000
              ? `${(totalDistance / 1000).toFixed(2)} km`
              : `${totalDistance.toFixed(2)} m`;

          if (currentPopup) map.closePopup(currentPopup);
          currentPopup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`Distancia: ${distanceText}`)
            .openOn(map);
        }
      } else if (measureType === "area") {
        // Agregar marcador
        const marker = L.circleMarker(e.latlng, {
          radius: 5,
          color: "#FF6B6B",
          fillColor: "#FF6B6B",
          fillOpacity: 1,
        }).addTo(map);
        measureLayers.push(marker);

        if (points.length > 2) {
          // Crear polígono temporal
          const polygon = L.polygon(points, {
            color: "#FF6B6B",
            weight: 2,
            fillColor: "#FF6B6B",
            fillOpacity: 0.2,
          }).addTo(map);

          // Remover polígono anterior si existe
          const prevPolygon = measureLayers.find(
            (layer) => layer instanceof L.Polygon
          );
          if (prevPolygon) {
            map.removeLayer(prevPolygon);
            measureLayers = measureLayers.filter(
              (layer) => layer !== prevPolygon
            );
          }

          measureLayers.push(polygon);

          // Calcular área
          const area = calculateArea(points);
          const areaText =
            area > 10000
              ? `${(area / 10000).toFixed(2)} ha`
              : `${area.toFixed(2)} m²`;

          if (currentPopup) map.closePopup(currentPopup);
          currentPopup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`Área: ${areaText}`)
            .openOn(map);
        }
      }
    };

    // Evento de doble clic para finalizar
    const onMapDblClick = (e) => {
      if (measuring) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        stopMeasuring();
      }
    };

    map.on("click", onMapClick);
    map.on("dblclick", onMapDblClick);

    return () => {
      if (controlDiv.parentNode) {
        controlDiv.parentNode.removeChild(controlDiv);
      }
      map.off("click", onMapClick);
      map.off("dblclick", onMapDblClick);
      clearAllMeasurements();
      stopMeasuring();
    };
  }, [map]);

  return null;
};

//Componente para montar el minimapa
const MiniMapControl = () => {
  const map = useMap();
  useEffect(() => {
    const miniLayer = new L.TileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        minZoom: 0,
        maxZoom: 13,
      }
    );
    const miniMap = new L.Control.MiniMap(miniLayer, {
      toggleDisplay: false,
      minimized: false,
      position: "bottomleft",
    }).addTo(map);

    return () => {
      map.removeControl(miniMap);
    };
  }, [map]);

  return null;
};

const MapView = () => {
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
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
        onColorMapChange={setColorMap}
        onLegendVisibilityChange={setShowLegend}
        tooltipsEnabled={tooltipsEnabled}
      />
      <ColorLegend colorMap={colorMap} isVisible={showLegend} />
      <SimpleMeasureControl />
      <MiniMapControl />
      <CoordinateControl />
      <ScaleControl />
    </MapContainer>
  );
};

export default MapView;
