import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

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

// Componente de leyenda para Precipitación
const PrecipitacionLegend = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const legendStyle = {
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    marginBottom: "8px",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para precipitación (azules)
  const createColorRamp = () => {
    const colors = [
      "#ffffcc", // Amarillo muy claro (precipitación muy baja)
      "#c7e9b4", // Verde claro
      "#7fcdbb", // Verde azulado
      "#41b6c4", // Azul claro
      "#2c7fb8", // Azul
      "#253494", // Azul oscuro (precipitación muy alta)
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
          <span>Baja</span>
          <span>Alta</span>
        </div>
        <div
          style={{
            height: "20px",
            background: `linear-gradient(to right, ${colors.join(", ")})`,
            border: "1px solid #666",
            borderRadius: "2px",
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
          <span>Precipitación (mm/año)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Precipitación Total</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente de leyenda para Temperatura
const TemperaturaLegend = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const legendStyle = {
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    marginBottom: "8px",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para temperatura (cálidos)
  const createColorRamp = () => {
    const colors = [
      "#ffffcc", // Amarillo muy claro (temperatura muy baja)
      "#fed976", // Amarillo
      "#feb24c", // Naranja claro
      "#fd8d3c", // Naranja
      "#fc4e2a", // Rojo naranja
      "#e31a1c", // Rojo (temperatura muy alta)
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
          <span>Fría</span>
          <span>Cálida</span>
        </div>
        <div
          style={{
            height: "20px",
            background: `linear-gradient(to right, ${colors.join(", ")})`,
            border: "1px solid #666",
            borderRadius: "2px",
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
          <span>Temperatura (°C)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Temperatura Media</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente de leyenda para Elevación
const ElevacionLegend = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const legendStyle = {
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    marginBottom: "8px",
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para elevación (verdes-marrones)
  const createColorRamp = () => {
    const colors = [
      "#f7fcfd", // Azul muy claro (elevación muy baja)
      "#e5f5f9", // Azul claro
      "#ccece6", // Verde azulado claro
      "#99d8c9", // Verde claro
      "#66c2a4", // Verde
      "#2ca25f", // Verde oscuro (elevación muy alta)
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
          <span>Baja</span>
          <span>Alta</span>
        </div>
        <div
          style={{
            height: "20px",
            background: `linear-gradient(to right, ${colors.join(", ")})`,
            border: "1px solid #666",
            borderRadius: "2px",
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
          <span>Elevación (msnm)</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Elevación</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente para mostrar coordenadas
const CoordinateControl = () => {
  const map = useMap();
  useEffect(() => {
    // Crear el div de coordenadas con posicionamiento absoluto
    const coordinateDiv = L.DomUtil.create("div", "coordinate-control");
    coordinateDiv.style.position = "absolute";
    coordinateDiv.style.bottom = "10px";
    coordinateDiv.style.left = "10px"; // Lado izquierdo del mapa
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

// Componente para mostrar valor del pixel
const PixelValueControl = ({ pixelValue }) => {
  const map = useMap();

  useEffect(() => {
    // Crear el div para el valor del pixel
    const pixelDiv = L.DomUtil.create("div", "pixel-value-control");
    pixelDiv.style.position = "absolute";
    pixelDiv.style.bottom = "40px"; // Arriba de las coordenadas
    pixelDiv.style.left = "10px"; // Mismo lado izquierdo
    pixelDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    pixelDiv.style.padding = "5px";
    pixelDiv.style.border = "2px solid rgba(0,0,0,0.2)";
    pixelDiv.style.borderRadius = "0px";
    pixelDiv.style.font =
      '11px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif';
    pixelDiv.style.zIndex = "999";
    pixelDiv.innerHTML = "Valor: N/A";

    // Agregar directamente al contenedor del mapa
    map.getContainer().appendChild(pixelDiv);

    return () => {
      if (pixelDiv.parentNode) {
        pixelDiv.parentNode.removeChild(pixelDiv);
      }
    };
  }, [map]);

  useEffect(() => {
    const pixelDiv = map.getContainer().querySelector(".pixel-value-control");
    if (pixelDiv) {
      pixelDiv.innerHTML = `Valor: ${
        pixelValue !== null ? pixelValue.toFixed(2) : "N/A"
      }`;
    }
  }, [map, pixelValue]);

  return null;
};

// Componente para mostrar leyendas dentro del mapa
const LegendsControl = ({ activeLayers }) => {
  const map = useMap();

  useEffect(() => {
    // Crear el div para las leyendas
    const legendsDiv = L.DomUtil.create("div", "legends-control");
    legendsDiv.style.position = "absolute";
    legendsDiv.style.bottom = "50px";
    legendsDiv.style.right = "10px";
    legendsDiv.style.zIndex = "1000";
    legendsDiv.style.display = "flex";
    legendsDiv.style.flexDirection = "column";
    legendsDiv.style.gap = "8px";
    legendsDiv.style.pointerEvents = "auto"; // Permitir interacción

    // Agregar directamente al contenedor del mapa
    map.getContainer().appendChild(legendsDiv);

    return () => {
      if (legendsDiv.parentNode) {
        legendsDiv.parentNode.removeChild(legendsDiv);
      }
    };
  }, [map]);

  useEffect(() => {
    const legendsDiv = map.getContainer().querySelector(".legends-control");
    if (legendsDiv) {
      // Limpiar contenido anterior
      legendsDiv.innerHTML = "";

      // Crear leyendas según las capas activas
      if (activeLayers.rasterPT) {
        const ptLegend = document.createElement("div");
        ptLegend.innerHTML = `
          <div style="
            background-color: white;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 15px;
            min-width: 180px;
            max-width: 220px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            margin-bottom: 8px;
          ">
            <div style="
              font-weight: bold;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <span>Precipitación Total</span>
            </div>
            <div style="margin-top: 8px;">
              <div style="
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                margin-bottom: 4px;
              ">
                <span>Baja</span>
                <span>Alta</span>
              </div>
              <div style="
                height: 20px;
                background: linear-gradient(to right, #ffffcc, #c7e9b4, #7fcdbb, #41b6c4, #2c7fb8, #253494);
                border: 1px solid #666;
                border-radius: 2px;
              "></div>
              <div style="
                display: flex;
                justify-content: center;
                font-size: 10px;
                margin-top: 4px;
                font-style: italic;
              ">
                <span>Precipitación (mm/año)</span>
              </div>
            </div>
          </div>
        `;
        legendsDiv.appendChild(ptLegend);
      }

      if (activeLayers.rasterTEMP) {
        const tempLegend = document.createElement("div");
        tempLegend.innerHTML = `
          <div style="
            background-color: white;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 15px;
            min-width: 180px;
            max-width: 220px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            margin-bottom: 8px;
          ">
            <div style="
              font-weight: bold;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <span>Temperatura Media</span>
            </div>
            <div style="margin-top: 8px;">
              <div style="
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                margin-bottom: 4px;
              ">
                <span>Fría</span>
                <span>Cálida</span>
              </div>
              <div style="
                height: 20px;
                background: linear-gradient(to right, #ffffcc, #fed976, #feb24c, #fd8d3c, #fc4e2a, #e31a1c);
                border: 1px solid #666;
                border-radius: 2px;
              "></div>
              <div style="
                display: flex;
                justify-content: center;
                font-size: 10px;
                margin-top: 4px;
                font-style: italic;
              ">
                <span>Temperatura (°C)</span>
              </div>
            </div>
          </div>
        `;
        legendsDiv.appendChild(tempLegend);
      }

      if (activeLayers.rasterMDE) {
        const mdeLegend = document.createElement("div");
        mdeLegend.innerHTML = `
          <div style="
            background-color: white;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 15px;
            min-width: 180px;
            max-width: 220px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            margin-bottom: 8px;
          ">
            <div style="
              font-weight: bold;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <span>Elevación</span>
            </div>
            <div style="margin-top: 8px;">
              <div style="
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                margin-bottom: 4px;
              ">
                <span>Baja</span>
                <span>Alta</span>
              </div>
              <div style="
                height: 20px;
                background: linear-gradient(to right, #f7fcfd, #e5f5f9, #ccece6, #99d8c9, #66c2a4, #2ca25f);
                border: 1px solid #666;
                border-radius: 2px;
              "></div>
              <div style="
                display: flex;
                justify-content: center;
                font-size: 10px;
                margin-top: 4px;
                font-style: italic;
              ">
                <span>Elevación (msnm)</span>
              </div>
            </div>
          </div>
        `;
        legendsDiv.appendChild(mdeLegend);
      }
    }
  }, [map, activeLayers]);

  return null;
};

// Componente para el control de capas agrupadas
const GroupedLayerControl = ({
  area,
  paisajes,
  municipios,
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
    const baseLayers = {
      "Topográfico (OpenTopoMap)": L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution:
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ),
      "Satelital (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
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
  ]);

  const toggleLayer = (layerKey) => {
    const newActiveLayers = { ...activeLayers };
    newActiveLayers[layerKey] = !activeLayers[layerKey];
    setActiveLayers(newActiveLayers);

    // Para capas raster, el manejo se hace en el componente principal
    if (layerKey.startsWith("raster")) {
      return;
    }

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
    position: "absolute",
    top: "20px",
    right: "10px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "6px" : "8px",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    maxWidth: isCollapsed ? "auto" : "220px",
    minWidth: isCollapsed ? "auto" : "200px",
    width: isCollapsed ? "fit-content" : "auto",
    maxHeight: isCollapsed ? "auto" : "80vh",
    overflowY: isCollapsed ? "visible" : "auto",
    overflowX: "hidden",
  };

  const headerStyle = {
    padding: isCollapsed ? "8px 10px" : "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #eee",
    fontSize: isCollapsed ? "12px" : "13px",
    whiteSpace: "nowrap",
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
        marginBottom: "1px",
        padding: "0px",
        backgroundColor: "transparent",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "3px",
          gap: "6px",
        }}
      >
        <input
          type="checkbox"
          checked={activeLayers[layerKey] || false}
          onChange={() => toggleLayer(layerKey)}
        />
        <span style={{ fontWeight: "normal", flex: 1, fontSize: "11px" }}>
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
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={`Descargar ${title}`}
            onClick={() => downloadGeoJSON(data, title)}
          >
            <svg
              width="14"
              height="14"
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
          <div style={{ fontSize: "9px", color: "#666", marginBottom: "2px" }}>
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
              e.target.style.cursor = "grabbing";
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              map.dragging.enable();
              e.target.style.cursor = "grab";
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              map.dragging.enable();
              e.target.style.cursor = "grab";
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              e.stopPropagation();
              map.touchZoom.disable();
              map.dragging.disable();
              e.target.style.cursor = "grabbing";
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              map.touchZoom.enable();
              map.dragging.enable();
              e.target.style.cursor = "grab";
            }}
            style={{ width: "100%", marginBottom: "4px" }}
          />
        </>
      )}
    </div>
  );

  const RasterLayerItem = ({ layerKey, title, filename }) => (
    <div
      style={{
        marginBottom: "1px",
        padding: "0px",
        backgroundColor: "transparent",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "2px",
          gap: "6px",
        }}
      >
        <input
          type="checkbox"
          checked={activeLayers[layerKey] || false}
          onChange={() => toggleLayer(layerKey)}
        />
        <span style={{ fontWeight: "normal", flex: 1, fontSize: "11px" }}>
          {title}
        </span>
        <button
          style={{
            backgroundColor: "transparent",
            border: "none",
            padding: "0px",
            borderRadius: "3px",
            cursor: "pointer",
            marginLeft: "2px",
            width: "16px",
            height: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={`Descargar ${filename}`}
          onClick={() => downloadRaster(filename, title)}
        >
          <svg
            width="14"
            height="14"
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
            <rect x="3" y="13" width="10" height="1.5" rx="0.75" fill="#333" />
          </svg>
        </button>
      </div>
      <div style={{ fontSize: "9px", color: "#666", marginBottom: "2px" }}>
        Opacidad: {Math.round(opacity[layerKey] * 100)}%
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={opacity[layerKey]}
        onChange={(e) =>
          setOpacity((prev) => ({
            ...prev,
            [layerKey]: parseFloat(e.target.value),
          }))
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
          e.stopPropagation();
          map.dragging.enable();
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation();
          map.touchZoom.disable();
          map.dragging.disable();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          map.touchZoom.enable();
          map.dragging.enable();
        }}
        style={{ width: "100%", marginBottom: "4px" }}
      />
    </div>
  );

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{isCollapsed ? "Capas" : "Capas"}</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>

      {!isCollapsed && (
        <div
          style={{
            padding: "8px",
            maxHeight: "80vh",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Capas Base */}
          <div
            style={{
              marginBottom: "8px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "6px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
              Mapa Base
            </div>
            {["Topográfico (OpenTopoMap)", "Satelital (ESRI)"].map(
              (layerName) => (
                <div
                  key={layerName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "3px",
                  }}
                >
                  <input
                    type="radio"
                    name="baseLayer"
                    checked={activeBaseLayer === layerName}
                    onChange={() => changeBaseLayer(layerName)}
                  />
                  <span style={{ marginLeft: "8px", fontSize: "11px" }}>
                    {layerName}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Límites */}
          <div
            style={{
              marginBottom: "8px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "6px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
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
          </div>

          {/* Grupo de Datos Climáticos */}
          <div
            style={{
              marginBottom: "8px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "4px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
              Datos Climáticos
            </div>
            <RasterLayerItem
              layerKey="rasterPT"
              title="Precipitación Total"
              filename="PT.tif"
            />
            <RasterLayerItem
              layerKey="rasterTEMP"
              title="Temperatura Media"
              filename="TEMP.tif"
            />
          </div>

          {/* Grupo de Topografía */}
          <div style={{ marginBottom: "0px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              Topografía
            </div>
            <RasterLayerItem
              layerKey="rasterMDE"
              title="Elevación"
              filename="MDE.tif"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const EscenarioActual = () => {
  // Estados para las capas vectoriales
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estado para controlar el centro y zoom del mapa
  const [mapCenter, setMapCenter] = useState([19.5, -99.0]); // Coordenadas de México central
  const [mapZoom, setMapZoom] = useState(6);
  const [mapKey, setMapKey] = useState(0); // Para forzar re-render del mapa

  // Estado para las capas activas
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    rasterPT: true, // Precipitación activada por defecto
    rasterTEMP: false,
    rasterMDE: false,
  });

  // Estado para opacidad de las capas
  const [opacity, setOpacity] = useState({
    area: 0.8,
    paisajes: 0.8,
    municipios: 0.8,
    rasterPT: 0.7,
    rasterTEMP: 0.7,
    rasterMDE: 0.7,
  });

  // Estados para información del mapa
  const [pixelValue, setPixelValue] = useState(null);

  // Cargar datos vectoriales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar área de estudio
        const areaResponse = await fetch("/AREA.geojson");
        if (areaResponse.ok) {
          const areaData = await areaResponse.json();
          setArea(areaData);

          // Calcular centro del área para el mapa
          if (areaData.features && areaData.features.length > 0) {
            try {
              const geometry = areaData.features[0].geometry;
              if (
                geometry &&
                geometry.coordinates &&
                geometry.coordinates.length > 0
              ) {
                const coordinates = geometry.coordinates[0];
                if (coordinates && coordinates.length > 0) {
                  const lats = coordinates
                    .map((coord) => coord[1])
                    .filter((lat) => !isNaN(lat));
                  const lngs = coordinates
                    .map((coord) => coord[0])
                    .filter((lng) => !isNaN(lng));

                  if (lats.length > 0 && lngs.length > 0) {
                    const centerLat =
                      (Math.min(...lats) + Math.max(...lats)) / 2;
                    const centerLng =
                      (Math.min(...lngs) + Math.max(...lngs)) / 2;

                    if (!isNaN(centerLat) && !isNaN(centerLng)) {
                      setMapCenter([centerLat, centerLng]);
                      setMapZoom(15); // Zoom mucho mayor para escala ~5-10km
                      setMapKey((prev) => prev + 1); // Forzar re-render del mapa
                    }
                  }
                }
              }
            } catch (error) {
              console.warn("Error calculando centro del área:", error);
              // Mantener coordenadas por defecto
            }
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
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    loadData();
  }, []);

  return (
    <div style={{ position: "relative", height: "80vh", width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        key={`map-${mapKey}`}
      >
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
        />

        {/* Capas raster */}
        {activeLayers.rasterPT && (
          <RasterOverlay
            fileName="PT.tif"
            baseUrl="http://localhost:3000"
            overlayOpacity={opacity.rasterPT}
            colorMap={[
              "#f7fbff",
              "#deebf7",
              "#c6dbef",
              "#9ecae1",
              "#6baed6",
              "#4292c6",
              "#2171b5",
              "#08519c",
              "#08306b",
            ]}
            continuous={true}
            onPixelValue={setPixelValue}
          />
        )}

        {activeLayers.rasterTEMP && (
          <RasterOverlay
            fileName="TEMP.tif"
            baseUrl="http://localhost:3000"
            overlayOpacity={opacity.rasterTEMP}
            colorMap={[
              "#fff5f0",
              "#fee0d2",
              "#fcbba1",
              "#fc9272",
              "#fb6a4a",
              "#ef3b2c",
              "#cb181d",
              "#a50f15",
              "#67000d",
            ]}
            continuous={true}
            onPixelValue={setPixelValue}
          />
        )}

        {activeLayers.rasterMDE && (
          <RasterOverlay
            fileName="MDE.tif"
            baseUrl="http://localhost:3000"
            overlayOpacity={opacity.rasterMDE}
            colorMap={[
              "#f7fcfd",
              "#e5f5f9",
              "#ccece6",
              "#99d8c9",
              "#66c2a4",
              "#41ae76",
              "#238b45",
              "#006d2c",
              "#00441b",
            ]}
            continuous={true}
            onPixelValue={setPixelValue}
          />
        )}

        <CoordinateControl />
        <ScaleControl />
        <PixelValueControl pixelValue={pixelValue} />
        <LegendsControl activeLayers={activeLayers} />
      </MapContainer>
    </div>
  );
};

export default EscenarioActual;
