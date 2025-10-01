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

// Componente de leyenda para Marmorata
const MarmorataLegend = ({ isVisible, layerType }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    color: "white",
    position: "absolute",
    bottom: "60px", // Subido un poco más arriba
    right: "20px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "180px",
    maxWidth: "220px",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
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

  const createColorRamp = () => {
    if (layerType === "impacto") {
      // Leyenda para impacto
      const items = [
        { color: "#90EE90", label: "Sin cambio" },
        { color: "#87CEEB", label: "Incremento" },
        { color: "#D3D3D3", label: "No apto" },
        { color: "#F08080", label: "Pérdida" },
      ];

      return (
        <div style={{ marginTop: "8px" }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "4px",
                fontSize: "10px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: item.color,
                  border: "1px solid #666",
                  borderRadius: "2px",
                  marginRight: "6px",
                }}
              />
              <span>{item.label}</span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "10px",
              marginTop: "6px",
              fontStyle: "italic",
            }}
          >
            <span>Impacto del Cambio Climático</span>
          </div>
        </div>
      );
    } else {
      // Leyenda para idoneidad
      const items = [
        { color: "#90EE90", label: "75 ton/ha", range: "Óptimo" },
        { color: "#FFFF00", label: "53 ton/ha", range: "Medio" },
        { color: "#FFA500", label: "21 ton/ha", range: "Bajo" },
        { color: "#000000", label: "10 ton/ha", range: "No apto/marginal" },
      ];

      return (
        <div style={{ marginTop: "8px" }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "4px",
                fontSize: "10px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: item.color,
                  border: "1px solid #666",
                  borderRadius: "2px",
                  marginRight: "6px",
                }}
              />
              <span style={{ fontWeight: "bold", marginRight: "6px" }}>
                {item.range}:
              </span>
              <span>{item.label}</span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "10px",
              marginTop: "6px",
              fontStyle: "italic",
            }}
          >
            <span>Idoneidad Agave Marmorata</span>
          </div>
        </div>
      );
    }
  };

  const getTitle = () => {
    if (layerType === "impacto") return "Impacto";
    return "Idoneidad";
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{getTitle()}</span>
        <span style={{ fontSize: "12px" }}>{isCollapsed ? " " : " "}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente para mostrar coordenadas del mouse
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

// Componente para mostrar la escala del mapa
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

// Componente de control de capas agrupadas
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
            'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
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
  };

  const controlStyle = {
    color: "white",
    position: "absolute",
    top: "20px",
    right: "10px",
    backgroundColor: "#1E3C20",
    borderRadius: "0px",
    padding: isCollapsed ? "6px" : "8px",
    zIndex: 1000,
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    maxWidth: isCollapsed ? "auto" : "220px",
    minWidth: isCollapsed ? "auto" : "200px",
    width: isCollapsed ? "fit-content" : "auto",
    maxHeight: isCollapsed ? "auto" : "85vh",
    overflowY: isCollapsed ? "visible" : "auto",
    overflowX: "hidden",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
  };

  const headerStyle = {
    padding: isCollapsed ? "8px 10px" : "10px 15px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: isCollapsed ? "none" : "1px solid #e0e0e0",
    fontSize: isCollapsed ? "12px" : "13px",
    whiteSpace: "nowrap",
    backgroundColor: "#1E3C20",
  };

  const LayerItem = ({ layerKey, title, data, showOpacity = true }) => (
    <div style={{ marginBottom: "4px" }}>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}
      >
        <input
          type="checkbox"
          checked={activeLayers[layerKey] || false}
          onChange={() => toggleLayer(layerKey)}
          disabled={!data}
        />
        <span style={{ marginLeft: "8px", fontSize: "11px" }}>{title}</span>
      </div>
      {showOpacity && activeLayers[layerKey] && (
        <div style={{ marginLeft: "16px", marginTop: "2px" }}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity[layerKey] ?? 0.7}
            onChange={(e) =>
              handleOpacityChange(layerKey, parseFloat(e.target.value))
            }
            style={{ width: "100%", marginBottom: "4px" }}
          />
        </div>
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
      {activeLayers[layerKey] && (
        <div style={{ marginLeft: "16px", marginTop: "2px" }}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity[layerKey] ?? 0.7}
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
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "6px",
                color: "white",
              }}
            >
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
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "6px",
                color: "white",
              }}
            >
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

          {/* Grupo de Agave Marmorata */}
          <div style={{ marginBottom: "0px" }}>
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "6px",
                color: "white",
              }}
            >
              Agave Marmorata
            </div>
            <RasterLayerItem
              layerKey="rasterMarmorata"
              title="Idoneidad Actual"
              filename="MARMORATA.tif"
            />
            <RasterLayerItem
              layerKey="rasterMarmorataCC"
              title="Idoneidad Cambio Climático"
              filename="MARMORATA_CC.tif"
            />
            <RasterLayerItem
              layerKey="rasterImpacto"
              title="Impacto del Cambio Climático"
              filename="IMP_MAR.tif"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal
const Marmorata = () => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estados para visualización
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    rasterMarmorata: false,
    rasterMarmorataCC: false,
    rasterImpacto: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    rasterMarmorata: 0.7,
    rasterMarmorataCC: 0.7,
    rasterImpacto: 0.7,
  });

  // Estados para leyendas
  const [marmorataLegendVisible, setMarmorataLegendVisible] = useState(false);
  const [marmorataLegendType, setMarmorataLegendType] = useState("idoneidad");

  // Estados para manejo de carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el centro del mapa
  const [mapCenter, setMapCenter] = useState([19.5, -99.0]);
  const [mapZoom, setMapZoom] = useState(10);

  // Estado para el valor del pixel
  const [pixelValue, setPixelValue] = useState(null);

  // Colores personalizados basados en los rangos proporcionados
  const marmorataColors = ["#000000", "#FFA500", "#FFFF00", "#90EE90"];

  // Colores para la capa de impacto del cambio climático
  const impactoColors = ["#F08080", "#D3D3D3", "#87CEEB", "#90EE90"];

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
      } catch (error) {
        console.error("Error cargando datos geográficos:", error);
      }
    };

    loadGeoData();
  }, []);

  // Efecto para controlar la visibilidad de las leyendas
  useEffect(() => {
    // Determinar qué leyenda mostrar basado en las capas activas
    const activeMarmorataLayers = Object.keys(activeLayers).filter(
      (key) => key.startsWith("rasterMarmorata") && activeLayers[key]
    );

    const activeImpactoLayers = Object.keys(activeLayers).filter(
      (key) => key.startsWith("rasterImpacto") && activeLayers[key]
    );

    // Mostrar leyenda de Marmorata si hay alguna capa de idoneidad activa
    if (activeMarmorataLayers.length > 0) {
      setMarmorataLegendVisible(true);
      setMarmorataLegendType("idoneidad");
    } else if (activeImpactoLayers.length > 0) {
      setMarmorataLegendVisible(true);
      setMarmorataLegendType("impacto");
    } else {
      setMarmorataLegendVisible(false);
    }
  }, [activeLayers]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
      >
        {/* RasterOverlays para Marmorata */}
        {activeLayers.rasterMarmorata && (
          <RasterOverlay
            fileName="MARMORATA.tif"
            colorMap={marmorataColors}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterMarmorata}
          />
        )}
        {activeLayers.rasterMarmorataCC && (
          <RasterOverlay
            fileName="MARMORATA_CC.tif"
            colorMap={marmorataColors}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterMarmorataCC}
          />
        )}
        {activeLayers.rasterImpacto && (
          <RasterOverlay
            fileName="IMP_MAR.tif"
            colorMap={impactoColors}
            baseUrl="/"
            continuous={true}
            setError={setError}
            setLoading={setLoading}
            onPixelValue={setPixelValue}
            overlayOpacity={opacity.rasterImpacto}
          />
        )}

        {/* Control de capas agrupadas */}
        <GroupedLayerControl
          area={area}
          paisajes={paisajes}
          municipios={municipios}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          opacity={opacity}
          setOpacity={setOpacity}
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

        {/* Leyenda */}
        <MarmorataLegend
          isVisible={marmorataLegendVisible}
          layerType={marmorataLegendType}
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

export default Marmorata;
