import React, { useEffect, useState, useRef } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";
import RetractableMapControls from "./RetractableMapControls";
import RetractableMapControls from "./RetractableMapControls";

// Componente de comparación con slider
const RasterComparisonSlider = ({ 
  leftRaster, 
  rightRaster, 
  leftColorMap, 
  rightColorMap, 
  opacity = 0.7,
  setError,
  setLoading 
}) => {
  const map = useMap();
  const [sliderPosition, setSliderPosition] = useState(50);
  const leftLayerRef = useRef(null);
  const rightLayerRef = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Crear contenedor para el slider
    const sliderContainer = L.DomUtil.create('div', 'comparison-slider-container');
    sliderContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 400;
      pointer-events: none;
    `;

    // Crear el slider
    const slider = L.DomUtil.create('div', 'comparison-slider', sliderContainer);
    slider.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      left: ${sliderPosition}%;
      width: 4px;
      background: white;
      border: 2px solid #333;
      cursor: ew-resize;
      z-index: 401;
      pointer-events: auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    `;

    // Crear el handle del slider
    const handle = L.DomUtil.create('div', 'slider-handle', slider);
    handle.style.cssText = `
      position: absolute;
      top: 50%;
      left: -8px;
      width: 20px;
      height: 40px;
      background: white;
      border: 2px solid #333;
      border-radius: 10px;
      transform: translateY(-50%);
      cursor: ew-resize;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: #333;
    `;
    handle.innerHTML = '⋮⋮';

    // Agregar el contenedor al mapa
    map.getContainer().appendChild(sliderContainer);
    sliderRef.current = sliderContainer;

    // Función para actualizar la posición del clip
    const updateClip = () => {
      const mapContainer = map.getContainer();
      const rect = mapContainer.getBoundingClientRect();
      const clipX = (sliderPosition / 100) * rect.width;
      
      // Actualizar el clip de la capa derecha (cambio climático)
      const rightLayer = rightLayerRef.current;
      if (rightLayer && rightLayer._image) {
        rightLayer._image.style.clipPath = `inset(0 0 0 ${clipX}px)`;
      }
    };

    // Manejar el arrastre del slider
    let isDragging = false;

    const startDrag = (e) => {
      isDragging = true;
      e.preventDefault();
      L.DomEvent.disableTextSelection();
      L.DomEvent.disableImageDrag();
      map.dragging.disable();
    };

    const drag = (e) => {
      if (!isDragging) return;
      
      const mapContainer = map.getContainer();
      const rect = mapContainer.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100));
      
      setSliderPosition(newPosition);
      slider.style.left = `${newPosition}%`;
      updateClip();
    };

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      L.DomEvent.enableTextSelection();
      L.DomEvent.enableImageDrag();
      map.dragging.enable();
    };

    // Event listeners
    L.DomEvent.on(slider, 'mousedown', startDrag);
    L.DomEvent.on(slider, 'touchstart', startDrag);
    L.DomEvent.on(document, 'mousemove', drag);
    L.DomEvent.on(document, 'touchmove', drag);
    L.DomEvent.on(document, 'mouseup', stopDrag);
    L.DomEvent.on(document, 'touchend', stopDrag);

    // Actualizar clip cuando cambie el tamaño del mapa
    map.on('resize', updateClip);
    map.on('zoomend', updateClip);
    map.on('moveend', updateClip);

    // Cleanup
    return () => {
      if (sliderRef.current && map.getContainer().contains(sliderRef.current)) {
        map.getContainer().removeChild(sliderRef.current);
      }
      map.off('resize', updateClip);
      map.off('zoomend', updateClip);
      map.off('moveend', updateClip);
      L.DomEvent.off(slider, 'mousedown', startDrag);
      L.DomEvent.off(slider, 'touchstart', startDrag);
      L.DomEvent.off(document, 'mousemove', drag);
      L.DomEvent.off(document, 'touchmove', drag);
      L.DomEvent.off(document, 'mouseup', stopDrag);
      L.DomEvent.off(document, 'touchend', stopDrag);
    };
  }, [map, sliderPosition]);

  return (
    <>
      {/* Capa izquierda (Americana actual) - siempre visible */}
      <RasterOverlay
        fileName={leftRaster}
        colorMap={leftColorMap}
        baseUrl="/"
        continuous={true}
        setError={setError}
        setLoading={setLoading}
        onPixelValue={() => {}}
        overlayOpacity={opacity}
        pane="overlayPane"
      />
      
      {/* Capa derecha (Americana CC) - con clip */}
      <RasterOverlay
        fileName={rightRaster}
        colorMap={rightColorMap}
        baseUrl="/"
        continuous={true}
        setError={setError}
        setLoading={setLoading}
        onPixelValue={() => {}}
        overlayOpacity={opacity}
        pane="overlayPane"
        ref={rightLayerRef}
      />
    </>
  );
};
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

// Componente de leyenda para Americana Actual
const AmericanaLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
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
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rangos específicos para Americana
  const createColorRamp = () => {
    const items = [
      { color: "#90EE90", label: "75 ton/ha", range: "Óptimo" },
      { color: "#FFFF00", label: "53 ton/ha", range: "Medio" },
      { color: "#FFA500", label: "21 ton/ha", range: "Bajo" },
      { color: "#000000", label: "10 ton/ha", range: "No apto/marginal" },
    ];

    return (
      <div style={{ marginTop: "8px" }}>
        {items.map((item, index) => (
          <div key={index} style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: "4px",
            fontSize: "10px"
          }}>
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
            <span style={{ fontWeight: "bold", marginRight: "6px" }}>{item.range}:</span>
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
          <span>Distribución Americana Actual</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Americana Actual</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente de leyenda para Americana Cambio Climático
const AmericanaCCLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "20px",
    left: "20px",
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
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rangos específicos para Americana CC
  const createColorRamp = () => {
    const items = [
      { color: "#90EE90", label: "75 ton/ha", range: "Óptimo" },
      { color: "#FFFF00", label: "53 ton/ha", range: "Medio" },
      { color: "#FFA500", label: "21 ton/ha", range: "Bajo" },
      { color: "#000000", label: "10 ton/ha", range: "No apto/marginal" },
    ];

    return (
      <div style={{ marginTop: "8px" }}>
        {items.map((item, index) => (
          <div key={index} style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: "4px",
            fontSize: "10px"
          }}>
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
            <span style={{ fontWeight: "bold", marginRight: "6px" }}>{item.range}:</span>
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
          <span>Americana - Cambio Climático</span>
        </div>
      </div>
    );
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Americana CC</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente de leyenda para Impacto Americana
const ImpactoLegend = ({ isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
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
  };

  const headerStyle = {
    fontWeight: "bold",
    marginBottom: isCollapsed ? "0" : "10px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  // Rampa de colores para impacto de cambio climático
  const createColorRamp = () => {
    const items = [
      { color: "#90EE90", label: "Sin cambio", range: "Sin cambio" },
      { color: "#87CEEB", label: "Incremento", range: "Incremento" },
      { color: "#D3D3D3", label: "No apto", range: "No apto" },
      { color: "#F08080", label: "Pérdida", range: "Pérdida" },
    ];

    return (
      <div style={{ marginTop: "8px" }}>
        {items.map((item, index) => (
          <div key={index} style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: "4px",
            fontSize: "10px"
          }}>
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
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Impacto Americana</span>
        <span style={{ fontSize: "10px" }}>{isCollapsed ? "▼" : "▲"}</span>
      </div>
      {!isCollapsed && createColorRamp()}
    </div>
  );
};

// Componente para alternar modo de visualización
const ViewModeControl = ({ viewMode, onViewModeChange }) => {
  const controlStyle = {
    position: "absolute",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: "8px 12px",
    zIndex: 1000,
    fontSize: "12px",
    fontWeight: "bold",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    display: "flex",
    gap: "10px",
  };

  const buttonStyle = {
    padding: "6px 12px",
    border: "1px solid #ddd",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "11px",
    backgroundColor: "white",
    transition: "background-color 0.3s",
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "white",
    borderColor: "#007bff",
  };

  return (
    <div style={controlStyle}>
      <button
        style={viewMode === "comparison" ? activeButtonStyle : buttonStyle}
        onClick={() => onViewModeChange("comparison")}
        title="Vista comparativa con slider"
      >
        📊 Comparación
      </button>
      <button
        style={viewMode === "impact" ? activeButtonStyle : buttonStyle}
        onClick={() => onViewModeChange("impact")}
        title="Vista de impacto"
      >
        🎯 Impacto
      </button>
    </div>
  );
};

// Componente principal
const Americana = () => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estados para visualización
  const [viewMode, setViewMode] = useState("comparison"); // "comparison" o "impact"
  const [activeLayers, setActiveLayers] = useState({
    area: true,
    paisajes: false,
    municipios: false,
    rasterAmericana: true,
    rasterAmericanaCC: true,
    rasterImpacto: false,
  });

  // Estado para opacidad de capas
  const [opacity, setOpacity] = useState({
    rasterAmericana: 0.7,
    rasterAmericanaCC: 0.7,
    rasterImpacto: 0.7,
  });

  // Estados para leyendas
  const [americanaLegendVisible, setAmericanaLegendVisible] = useState(true);
  const [americanaCCLegendVisible, setAmericanaCCLegendVisible] = useState(true);
  const [impactoLegendVisible, setImpactoLegendVisible] = useState(false);

  // Estados para manejo de carga y errores
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el centro del mapa
  const [mapCenter, setMapCenter] = useState([19.5, -99.0]);
  const [mapZoom, setMapZoom] = useState(10);

  // Colores personalizados basados en los rangos proporcionados
  const americanaColors = ["#000000", "#FFA500", "#FFFF00", "#90EE90"];
  
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

  // Efecto para controlar la visibilidad de las leyendas según el modo
  useEffect(() => {
    if (viewMode === "impact") {
      setAmericanaLegendVisible(false);
      setAmericanaCCLegendVisible(false);
      setImpactoLegendVisible(activeLayers.rasterImpacto);
    } else if (viewMode === "comparison") {
      setAmericanaLegendVisible(true);
      setAmericanaCCLegendVisible(false);
      setImpactoLegendVisible(false);
    }
  }, [viewMode, activeLayers]);

  // Efecto para cambiar las capas activas según el modo de visualización
  useEffect(() => {
    if (viewMode === "impact") {
      setActiveLayers(prev => ({
        ...prev,
        rasterAmericana: false,
        rasterAmericanaCC: false,
        rasterImpacto: true,
      }));
    } else if (viewMode === "comparison") {
      setActiveLayers(prev => ({
        ...prev,
        rasterAmericana: true,
        rasterAmericanaCC: true,
        rasterImpacto: false,
      }));
    }
  }, [viewMode]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {viewMode === "sideBySide" ? (
        // Vista lado a lado
        <div style={{ display: "flex", height: "100%" }}>
          {/* Mapa izquierdo - Americana Actual */}
          <div style={{ width: "50%", position: "relative" }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              {activeLayers.rasterAmericana && (
                <RasterOverlay
                  fileName="A_Americana_4326.tif"
                  colorMap={americanaColors}
                  baseUrl="/"
                  continuous={true}
                  setError={setError}
                  setLoading={setLoading}
                  onPixelValue={() => {}}
                  overlayOpacity={opacity.rasterAmericana}
                />
              )}

              {/* Leyenda de Americana Actual */}
              <AmericanaLegend isVisible={americanaLegendVisible} />
            </MapContainer>
          </div>

          {/* Mapa derecho - Americana CC */}
          <div style={{ width: "50%", position: "relative" }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              {activeLayers.rasterAmericanaCC && (
                <RasterOverlay
                  fileName="A_Americana_CC_4326.tif"
                  colorMap={americanaColors}
                  baseUrl="/"
                  continuous={true}
                  setError={setError}
                  setLoading={setLoading}
                  onPixelValue={() => {}}
                  overlayOpacity={opacity.rasterAmericanaCC}
                />
              )}

              {/* Leyenda de Americana CC */}
              <AmericanaCCLegend isVisible={americanaCCLegendVisible} />
            </MapContainer>
          </div>
        </div>
      ) : viewMode === "impact" ? (
        // Vista de impacto (mapa único)
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          {activeLayers.rasterImpacto && (
            <RasterOverlay
              fileName="IMP_AME.tif"
              colorMap={impactoColors}
              baseUrl="/"
              continuous={true}
              setError={setError}
              setLoading={setLoading}
              onPixelValue={() => {}}
              overlayOpacity={opacity.rasterImpacto}
            />
          )}

          {/* Leyenda de Impacto */}
          <ImpactoLegend isVisible={impactoLegendVisible} />
        </MapContainer>
      ) : (
        // Vista de comparación con slider
        <div style={{ height: "100vh", width: "auto", position: "relative" }}>
          {/* Título de comparación */}
          <div
            style={{
              position: "absolute",
              top: "60px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              padding: "6px 16px",
              borderRadius: "8px",
              fontWeight: "bold",
              zIndex: 999,
              pointerEvents: "none",
              gap: "16px",
            }}
          >
            <div style={{ textAlign: "right" }}>Idoneidad Actual</div>
            <div style={{ textAlign: "center" }}>•</div>
            <div style={{ textAlign: "left" }}>Idoneidad con Cambio Climático</div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            {/* Aquí iría el componente de comparación con slider */}
            {/* Por ahora usamos RasterOverlay simple */}
            {activeLayers.rasterAmericana && (
              <RasterOverlay
                fileName="A_Americana_4326.tif"
                colorMap={americanaColors}
                baseUrl="/"
                continuous={true}
                setError={setError}
                setLoading={setLoading}
                onPixelValue={() => {}}
                overlayOpacity={opacity.rasterAmericana}
              />
            )}

            {/* Leyenda para comparación */}
            <AmericanaLegend isVisible={americanaLegendVisible} />
          </MapContainer>
        </div>
      )}

      {/* Control de modo de visualización */}
      <ViewModeControl
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
    </div>
  );
};

export default Americana;
