import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";
import { color } from "framer-motion";

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

// Componente de pestañas para periodos
const PeriodTabs = ({ activePeriod, onPeriodChange }) => {
  const tabsStyle = {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "white",
    borderRadius: "5px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    display: "flex",
    overflow: "hidden",
    border: "1px solid #ddd",
  };

  const tabStyle = {
    padding: "10px 15px",
    cursor: "pointer",
    borderRight: "1px solid #ddd",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "background-color 0.3s",
    minWidth: "90px",
    textAlign: "center",
  };

  const activeTabStyle = {
    ...tabStyle,
    backgroundColor: "#dc3545",
    color: "white",
  };

  const inactiveTabStyle = {
    ...tabStyle,
    backgroundColor: "white",
    color: "#333",
  };

  const periods = [
    { key: "2015-2039", label: "2015-2039" },
    { key: "2045-2069", label: "2045-2069" },
    { key: "2075-2099", label: "2075-2099" },
  ];

  return (
    <div style={tabsStyle}>
      {periods.map((period, index) => (
        <div
          key={period.key}
          style={{
            ...(activePeriod === period.key
              ? activeTabStyle
              : inactiveTabStyle),
            borderRight:
              index === periods.length - 1 ? "none" : "1px solid #ddd",
          }}
          onClick={() => onPeriodChange(period.key)}
        >
          {period.label}
        </div>
      ))}
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

// Componente para mostrar valor del pixel
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

// Componente para mostrar leyendas dentro del mapa
const LegendsControl = ({ activeLayers, activePeriod }) => {
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
          color: white;
            background-color: #1E3C20;
            padding: 15px;
            min-width: 180px;
            max-width: 220px;
            font-family: Inter, sans-serif;
            font-size: 12px;
            margin-bottom: 8px;
          ">
            <div style="
              font-weight: bold;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <span>Precipitación - ${activePeriod}</span>
            </div>
            <div style="margin-top: 8px;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #fffee3; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">≤ 400 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #deea51; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">400 - 600 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #ccf162; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">600 - 800 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #68d849; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">800 - 1000 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #2db242; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">1000 - 1200 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #3a8a79; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">1200 - 1400 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #5c6fd1; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">1400 - 1600 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #4843d4; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">1600 - 1800 mm</span>
              </div>
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 12px; height: 12px; background-color: #550056; margin-right: 6px; border: 1px solid white;"></div>
                <span style="font-size: 10px;">> 1800 mm</span>
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
          color: white;
            background-color: #1E3C20;
            padding: 15px;
            min-width: 180px;
            max-width: 220px;
            font-family: Inter, sans-serif;
            font-size: 12px;
            margin-bottom: 8px;
          ">
            <div style="
              font-weight: bold;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <span>Temperatura - ${activePeriod}</span>
            </div>
            <div style="margin-top: 8px;">
              <div style="
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                margin-bottom: 4px;
              ">
                <span>4°C</span>
                <span>36°C</span>
              </div>
              <div style="
                height: 20px;
                background: linear-gradient(to right, #7b39d4, #224988, #306190, #4a8e9f, #66bfaf, #73dc9a, #79f178, #a1fa7e, #defb9d, #fff099, #ffd76d, #ffbf41, #f99b20, #e4581f, #b73b1f, #8a1f1f, #4a2121);
              "></div>
              <div style="
                display: flex;
                justify-content: center;
                font-size: 10px;
                margin-top: 4px;
                font-style: italic;
              ">
                <span>Temperatura Media (°C)</span>
              </div>
            </div>
          </div>
        `;
        legendsDiv.appendChild(tempLegend);
      }
    }
  }, [map, activeLayers, activePeriod]);

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
  activePeriod,
}) => {
  const map = useMap();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [layers, setLayers] = useState({});
  const [activeBaseLayer, setActiveBaseLayer] = useState(
    "Hillshade (ESRI)"
  );

  // Mapeo de periodos a códigos de archivo
  const periodMap = {
    "2015-2039": "1539",
    "2045-2069": "4569",
    "2075-2099": "7599",
  };

  useEffect(() => {
    const baseLayers = {
      "Satelital (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri",
        }
      ),
      "Hillshade (ESRI)": L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
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
    color: "white",
    backgroundColor: "#1e3c20",
    position: "absolute",
    top: "20px",
    right: "10px",
    padding: isCollapsed ? "4px" : "4px",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
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
        <>
          <div
            style={{ fontSize: "9px", color: "#ffffffff", marginBottom: "2px" }}
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
      <div style={{ fontSize: "9px", color: "#ffffffff", marginBottom: "2px" }}>
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
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "" : ""}</span>
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
            {["Satelital (ESRI)", "Hillshade (ESRI)"].map(
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

          {/* Grupo de Datos Climáticos - Periodo Actual */}
          <div
            style={{
              marginBottom: "8px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "4px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
              Cambio Climático - {activePeriod}
            </div>
            <RasterLayerItem
              layerKey="rasterPT"
              title="Precipitación Total Anual"
              filename={`PT_${periodMap[activePeriod]}.tif`}
            />
            <RasterLayerItem
              layerKey="rasterTEMP"
              title="Temperatura Media"
              filename={`TEMP_${periodMap[activePeriod]}.tif`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const EscenarioCC = () => {
  // Estados para las capas vectoriales
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estado para controlar el centro y zoom del mapa
  const [mapCenter, setMapCenter] = useState([19.5, -99.0]); // Coordenadas de México central
  const [mapZoom, setMapZoom] = useState(6);
  const [mapKey, setMapKey] = useState(0); // Para forzar re-render del mapa

  // Estado para el periodo activo
  const [activePeriod, setActivePeriod] = useState("2015-2039");

  // Estado para las capas activas
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    rasterPT: true, // Precipitación activada por defecto
    rasterTEMP: false,
  });

  // Estado para opacidad de las capas
  const [opacity, setOpacity] = useState({
    area: 0.8,
    paisajes: 0.8,
    municipios: 0.8,
    rasterPT: 0.7,
    rasterTEMP: 0.7,
  });

  // Estados para información del mapa
  const [pixelValue, setPixelValue] = useState(null);

  // Mapeo de periodos a códigos de archivo
  const periodMap = {
    "2015-2039": "1539",
    "2045-2069": "4569",
    "2075-2099": "7599",
  };

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
        <PeriodTabs
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />

        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
          activePeriod={activePeriod}
        />

        {/* Capas raster */}
        {activeLayers.rasterPT && (
          <RasterOverlay
            fileName={`PT_${periodMap[activePeriod]}.tif`}
            baseUrl="http://localhost:3000"
            overlayOpacity={opacity.rasterPT}
            colorMap={[
              "#fffee3", // Valores bajos (≤ 400)
              "#deea51", // 400 - 600
              "#ccf162", // 600 - 800
              "#68d849", // 800 - 1000
              "#2db242", // 1000 - 1200
              "#3a8a79", // 1200 - 1400
              "#5c6fd1", // 1400 - 1600
              "#4843d4", // 1600 - 1800
              "#550056", // Valores altos (> 1800)
            ]}
            continuous={true}
            onPixelValue={setPixelValue}
          />
        )}

        {activeLayers.rasterTEMP && (
          <RasterOverlay
            fileName={`TEMP_${periodMap[activePeriod]}.tif`}
            baseUrl="http://localhost:3000"
            overlayOpacity={opacity.rasterTEMP}
            colorMap={[
              "#7b39d4", // 4°C
              "#224988", // 6°C
              "#306190", // 8°C
              "#4a8e9f", // 10°C
              "#66bfaf", // 12°C
              "#73dc9a", // 14°C
              "#79f178", // 16°C
              "#a1fa7e", // 18°C
              "#defb9d", // 20°C
              "#fff099", // 22°C
              "#ffd76d", // 24°C
              "#ffbf41", // 26°C
              "#f99b20", // 28°C
              "#e4581f", // 30°C
              "#b73b1f", // 32°C
              "#8a1f1f", // 34°C
              "#4a2121", // 36°C
            ]}
            continuous={true}
            onPixelValue={setPixelValue}
          />
        )}

        <CoordinateControl />
        <ScaleControl />
        <PixelValueDisplay pixelValue={pixelValue} />
        <LegendsControl
          activeLayers={activeLayers}
          activePeriod={activePeriod}
        />
      </MapContainer>
    </div>
  );
};

export default EscenarioCC;
