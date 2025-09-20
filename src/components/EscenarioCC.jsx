import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

/**
 * Componente para visualizar escenarios de cambio climático
 * Muestra rasters por periodos temporales con modo de comparación
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.allowCompare - Permitir comparación lado a lado (default: true)
 * @param {string} props.rastersBasePath - Ruta base para archivos raster (default: '/data/rasters/clima/')
 */

// Función para descargar archivos
const downloadFile = async (filename, displayName) => {
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
    console.error("Error descargando archivo:", error);
    alert(`Error al descargar ${displayName}`);
  }
};

// Componente de pestañas para periodos
const PeriodTabs = ({ activePeriod, onPeriodChange, compareMode }) => {
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
    { key: '2015-2039', label: '2015-2039' },
    { key: '2045-2069', label: '2045-2069' },
    { key: '2075-2099', label: '2075-2099' }
  ];

  if (compareMode) {
    return (
      <div style={{ ...tabsStyle, flexDirection: "column", minWidth: "180px" }}>
        <div style={{ 
          padding: "8px", 
          backgroundColor: "#f8f9fa", 
          borderBottom: "1px solid #ddd",
          fontSize: "11px",
          fontWeight: "bold",
          textAlign: "center"
        }}>
          Modo Comparación
        </div>
        {periods.map((period, index) => (
          <div
            key={period.key}
            style={{
              ...(activePeriod === period.key ? activeTabStyle : inactiveTabStyle),
              borderRight: "none",
              borderBottom: index === periods.length - 1 ? "none" : "1px solid #ddd",
            }}
            onClick={() => onPeriodChange(period.key)}
          >
            {period.label}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={tabsStyle}>
      {periods.map((period, index) => (
        <div
          key={period.key}
          style={{
            ...(activePeriod === period.key ? activeTabStyle : inactiveTabStyle),
            borderRight: index === periods.length - 1 ? "none" : "1px solid #ddd",
          }}
          onClick={() => onPeriodChange(period.key)}
        >
          {period.label}
        </div>
      ))}
    </div>
  );
};

// Componente de leyenda para raster climático
const ClimateRasterLegend = ({ isVisible, rasterType, periodName, compareMode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !rasterType) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "50px",
    right: compareMode ? "calc(50% + 10px)" : "10px",
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
    backgroundColor: "#f8f9fa",
    borderBottom: isCollapsed ? "none" : "1px solid #dee2e6",
  };

  // Generar colores específicos por tipo climático
  const getColorsByType = (type) => {
    switch (type) {
      case 'PT':
        return ['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404']; // naranjas (más seco)
      case 'TEMP':
        return ['#ffffcc', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026']; // rojos (más caliente)
      default:
        return ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8'];
    }
  };

  const colors = getColorsByType(rasterType);

  const getLabels = (type) => {
    switch (type) {
      case 'PT':
        return ['< 400mm', '400-600mm', '600-800mm', '800-1000mm', '> 1000mm'];
      case 'TEMP':
        return ['< 15°C', '15-18°C', '18-21°C', '21-24°C', '24-27°C', '> 27°C'];
      default:
        return colors.map((_, i) => `Clase ${i + 1}`);
    }
  };

  const labels = getLabels(rasterType);

  const getVariableName = (type) => {
    switch (type) {
      case 'PT':
        return 'Precipitación';
      case 'TEMP':
        return 'Temperatura';
      default:
        return 'Variable';
    }
  };

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{getVariableName(rasterType)} - {periodName}</span>
        <span>{isCollapsed ? "+" : "-"}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "8px" }}>
          {colors.map((color, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "3px" }}>
              <div
                style={{
                  width: "20px",
                  height: "12px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontSize: "11px" }}>
                {labels[index] || `Clase ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Control de modo comparación
const CompareControl = ({ compareMode, onCompareModeToggle, allowCompare }) => {
  if (!allowCompare) return null;

  const controlStyle = {
    position: "absolute",
    top: "70px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: "8px 12px",
    cursor: "pointer",
    zIndex: 1000,
    fontSize: "12px",
    fontWeight: "bold",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
  };

  const activeStyle = {
    ...controlStyle,
    backgroundColor: "#28a745",
    color: "white",
  };

  return (
    <div
      style={compareMode ? activeStyle : controlStyle}
      onClick={onCompareModeToggle}
      title="Activar/Desactivar modo comparación"
    >
      {compareMode ? "🔄 Comparación ON" : "🔄 Modo Comparación"}
    </div>
  );
};

// Controles estándar
const CoordinateControl = () => {
  const map = useMap();
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    };

    map.on("mousemove", handleMouseMove);
    return () => map.off("mousemove", handleMouseMove);
  }, [map]);

  const controlStyle = {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    backgroundColor: "white",
    padding: "5px 10px",
    borderRadius: "3px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "monospace",
    fontSize: "12px",
  };

  return (
    <div style={controlStyle}>
      Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
    </div>
  );
};

const ScaleControl = () => {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({ position: 'bottomleft' });
    scale.addTo(map);
    return () => map.removeControl(scale);
  }, [map]);

  return null;
};

const InfoControl = ({ activePeriod, compareMode }) => {
  const controlStyle = {
    position: "absolute",
    top: compareMode ? "120px" : "80px",
    left: "10px",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    maxWidth: "300px",
  };

  return (
    <div style={controlStyle}>
      <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
        Escenarios Cambio Climático
      </h4>
      <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>
        Proyecciones climáticas para tres periodos temporales.
        {compareMode && " Modo comparación activo."}
      </p>
      <div style={{ fontSize: "11px", color: "#007bff", fontWeight: "bold" }}>
        Periodo activo: {activePeriod}
      </div>
    </div>
  );
};

const DraggingControl = () => {
  const map = useMap();
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(true);

  const toggleDragging = () => {
    if (isDraggingEnabled) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
    setIsDraggingEnabled(!isDraggingEnabled);
  };

  const controlStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: "5px",
    cursor: "pointer",
    zIndex: 1000,
  };

  return (
    <div
      style={controlStyle}
      onClick={toggleDragging}
      title={isDraggingEnabled ? "Deshabilitar arrastre" : "Habilitar arrastre"}
    >
      <span style={{ fontSize: "18px" }}>{isDraggingEnabled ? "🔓" : "🔒"}</span>
    </div>
  );
};

// Control agrupado de capas
const GroupedLayerControl = ({ 
  activePeriod,
  showPT,
  onPTToggle,
  showTEMP,
  onTEMPToggle,
  ptOpacity,
  onPTOpacityChange,
  tempOpacity,
  onTEMPOpacityChange,
  compareMode,
  onZoomToLayer,
  onDownloadPT,
  onDownloadTEMP,
  area,
  paisajes,
  municipios
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const controlStyle = {
    position: "absolute",
    top: compareMode ? "120px" : "80px",
    right: "10px",
    backgroundColor: "white",
    border: "2px solid rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: isCollapsed ? "8px" : "15px",
    zIndex: 1000,
    minWidth: isCollapsed ? "auto" : "280px",
    maxWidth: "320px",
    fontFamily: "Arial, sans-serif",
    fontSize: "13px",
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

  const sectionStyle = {
    marginBottom: "15px",
    border: "1px solid #ddd",
    borderRadius: "3px",
  };

  const sectionHeaderStyle = {
    backgroundColor: "#f8f9fa",
    padding: "5px 8px",
    fontWeight: "bold",
    fontSize: "12px",
    borderBottom: "1px solid #ddd",
  };

  if (isCollapsed) {
    return (
      <div style={controlStyle}>
        <div style={headerStyle} onClick={() => setIsCollapsed(false)}>
          <span>☰</span>
        </div>
      </div>
    );
  }

  return (
    <div style={controlStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(true)}>
        <span>Control de Capas</span>
        <span>−</span>
      </div>

      {/* Capas Base */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Capas Base</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            <input type="checkbox" defaultChecked style={{ marginRight: "5px" }} />
            OpenStreetMap
          </label>
        </div>
      </div>

      {/* Límites */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Límites</div>
        <div style={{ padding: "8px" }}>
          {area && (
            <label style={{ display: "block", marginBottom: "5px" }}>
              <input type="checkbox" defaultChecked style={{ marginRight: "5px" }} />
              Área de estudio
            </label>
          )}
          {paisajes && (
            <label style={{ display: "block", marginBottom: "5px" }}>
              <input type="checkbox" style={{ marginRight: "5px" }} />
              Paisajes
            </label>
          )}
          {municipios && (
            <label style={{ display: "block", marginBottom: "5px" }}>
              <input type="checkbox" style={{ marginRight: "5px" }} />
              Municipios
            </label>
          )}
        </div>
      </div>

      {/* Variables Climáticas */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          Variables - {activePeriod}
        </div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            <input
              type="checkbox"
              checked={showPT}
              onChange={(e) => onPTToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Precipitación
          </label>
          
          {showPT && (
            <div style={{ marginLeft: "20px", marginBottom: "10px" }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={ptOpacity}
                onChange={(e) => onPTOpacityChange(parseFloat(e.target.value))}
                style={{ width: "100%", marginBottom: "3px" }}
              />
              <div style={{ textAlign: "center", fontSize: "10px" }}>
                {Math.round(ptOpacity * 100)}%
              </div>
            </div>
          )}

          <label style={{ display: "block", marginBottom: "8px" }}>
            <input
              type="checkbox"
              checked={showTEMP}
              onChange={(e) => onTEMPToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Temperatura
          </label>
          
          {showTEMP && (
            <div style={{ marginLeft: "20px", marginBottom: "8px" }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={tempOpacity}
                onChange={(e) => onTEMPOpacityChange(parseFloat(e.target.value))}
                style={{ width: "100%", marginBottom: "3px" }}
              />
              <div style={{ textAlign: "center", fontSize: "10px" }}>
                {Math.round(tempOpacity * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controles */}
      <div style={{ marginTop: "15px", display: "flex", gap: "5px", flexWrap: "wrap" }}>
        <button
          onClick={onZoomToLayer}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            flex: "1",
          }}
        >
          Zoom
        </button>
        <button
          onClick={onDownloadPT}
          disabled={!showPT}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: showPT ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: showPT ? "pointer" : "not-allowed",
            flex: "1",
          }}
        >
          DL PT
        </button>
        <button
          onClick={onDownloadTEMP}
          disabled={!showTEMP}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: showTEMP ? "#17a2b8" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: showTEMP ? "pointer" : "not-allowed",
            flex: "1",
          }}
        >
          DL TEMP
        </button>
      </div>
    </div>
  );
};

// Componente principal
const EscenarioCC = ({ 
  allowCompare = true,
  rastersBasePath = '/data/rasters/clima/'
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estados para controles
  const [activePeriod, setActivePeriod] = useState('2015-2039');
  const [compareMode, setCompareMode] = useState(false);
  const [showPT, setShowPT] = useState(true);
  const [showTEMP, setShowTEMP] = useState(false);
  const [ptOpacity, setPTOpacity] = useState(0.7);
  const [tempOpacity, setTEMPOpacity] = useState(0.7);

  // Mapeo de periodos a códigos de archivo
  const periodMap = {
    '2015-2039': '1539',
    '2045-2069': '4569',
    '2075-2099': '7599'
  };

  // Cargar datos
  useEffect(() => {
    fetch("/AREA.geojson")
      .then((res) => res.json())
      .then(setArea)
      .catch(console.error);
    fetch("/PAISAJES.geojson")
      .then((res) => res.json())
      .then(setPaisajes)
      .catch(console.error);
    fetch("/MUNICIPIOS.geojson")
      .then((res) => res.json())
      .then(setMunicipios)
      .catch(console.error);
  }, []);

  // Funciones de control
  const handleZoomToArea = () => {
    if (area && window.mapInstance) {
      const geojsonLayer = L.geoJSON(area);
      window.mapInstance.fitBounds(geojsonLayer.getBounds());
    }
  };

  const handleDownloadPT = () => {
    const periodCode = periodMap[activePeriod];
    const filename = `PT_${periodCode}.tif`;
    const displayName = `Precipitación ${activePeriod}`;
    downloadFile(filename, displayName);
  };

  const handleDownloadTEMP = () => {
    const periodCode = periodMap[activePeriod];
    const filename = `TEMP_${periodCode}.tif`;
    const displayName = `Temperatura ${activePeriod}`;
    downloadFile(filename, displayName);
  };

  // Obtener archivos raster actuales
  const getPTRaster = () => {
    const periodCode = periodMap[activePeriod];
    return `PT_${periodCode}.tif`;
  };

  const getTEMPRaster = () => {
    const periodCode = periodMap[activePeriod];
    return `TEMP_${periodCode}.tif`;
  };

  // Determinar capa activa para leyenda
  const getActiveLegend = () => {
    if (showPT) return { type: 'PT', name: activePeriod };
    if (showTEMP) return { type: 'TEMP', name: activePeriod };
    return null;
  };

  const activeLegend = getActiveLegend();

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={[19.5, -99.0]}
        zoom={8}
        style={{ 
          height: "100%", 
          width: compareMode ? "50%" : "100%",
          float: "left"
        }}
        ref={(mapInstance) => {
          if (mapInstance) {
            window.mapInstance = mapInstance;
          }
        }}
      >
        {/* Tile Layer Base */}
        <div style={{ height: "100%", width: "100%" }}>
          {(() => {
            const map = window.mapInstance;
            if (map) {
              // Limpiar capas anteriores (excepto base)
              map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer === false) {
                  map.removeLayer(layer);
                }
              });

              // Agregar tile layer base
              if (!map._baseLayer) {
                map._baseLayer = L.tileLayer(
                  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  {
                    attribution: '© OpenStreetMap contributors'
                  }
                ).addTo(map);
              }

              // Agregar límites base
              if (area) {
                L.geoJSON(area, {
                  style: {
                    color: '#ff7800',
                    weight: 3,
                    opacity: 0.8,
                    fillOpacity: 0
                  }
                }).addTo(map);
              }
            }
            return null;
          })()}
        </div>

        {/* Raster Overlays */}
        {showPT && (
          <RasterOverlay
            rasterUrl={`/${getPTRaster()}`}
            opacity={ptOpacity}
          />
        )}

        {showTEMP && (
          <RasterOverlay
            rasterUrl={`/${getTEMPRaster()}`}
            opacity={tempOpacity}
          />
        )}

        {/* Controles */}
        <PeriodTabs
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
          compareMode={compareMode}
        />
        
        <CompareControl
          compareMode={compareMode}
          onCompareModeToggle={() => setCompareMode(!compareMode)}
          allowCompare={allowCompare}
        />
        
        <InfoControl 
          activePeriod={activePeriod}
          compareMode={compareMode}
        />
        <DraggingControl />
        <CoordinateControl />
        <ScaleControl />
        
        <GroupedLayerControl
          activePeriod={activePeriod}
          showPT={showPT}
          onPTToggle={setShowPT}
          showTEMP={showTEMP}
          onTEMPToggle={setShowTEMP}
          ptOpacity={ptOpacity}
          onPTOpacityChange={setPTOpacity}
          tempOpacity={tempOpacity}
          onTEMPOpacityChange={setTEMPOpacity}
          compareMode={compareMode}
          onZoomToLayer={handleZoomToArea}
          onDownloadPT={handleDownloadPT}
          onDownloadTEMP={handleDownloadTEMP}
          area={area}
          paisajes={paisajes}
          municipios={municipios}
        />

        {/* Leyenda */}
        {activeLegend && (
          <ClimateRasterLegend
            isVisible={true}
            rasterType={activeLegend.type}
            periodName={activeLegend.name}
            compareMode={compareMode}
          />
        )}
      </MapContainer>

      {/* Segundo mapa para modo comparación */}
      {compareMode && (
        <div 
          style={{ 
            height: "100vh", 
            width: "50%", 
            float: "right",
            position: "relative"
          }}
        >
          {/* Placeholder para segundo mapa en modo comparación */}
          <div style={{
            height: "100%",
            width: "100%",
            backgroundColor: "#f8f9fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            color: "#666",
            flexDirection: "column"
          }}>
            <div style={{ marginBottom: "10px", fontSize: "18px" }}>🚧</div>
            <div style={{ textAlign: "center" }}>
              <strong>Modo Comparación</strong><br/>
              Próximamente: Vista lado a lado<br/>
              con diferentes periodos
            </div>
          </div>
          
          {/* Leyenda del segundo mapa */}
          {activeLegend && (
            <ClimateRasterLegend
              isVisible={true}
              rasterType={activeLegend.type}
              periodName="Comparación"
              compareMode={false}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EscenarioCC;

/**
 * Ejemplo de uso:
 * 
 * import EscenarioCC from './components/EscenarioCC';
 * 
 * function App() {
 *   return (
 *     <EscenarioCC 
 *       allowCompare={true}
 *       rastersBasePath="/data/rasters/clima/"
 *     />
 *   );
 * }
 * 
 * Test manual sugerido:
 * 1. Cargar componente y verificar que muestra periodo 2015-2039 por defecto
 * 2. Cambiar entre pestañas de periodos y verificar cambios de raster
 * 3. Activar/desactivar variables climáticas independientemente
 * 4. Ajustar opacidades de cada variable
 * 5. Activar modo comparación y verificar cambio de layout
 * 6. Verificar leyendas con colores específicos para clima (naranjas/rojos)
 * 7. Probar descargas de archivos por periodo
 * 8. Verificar que controles se adaptan al modo comparación
 * 9. Comprobar que PT muestra datos más secos y TEMP más cálidos
 * 10. Verificar mensajes informativos sobre proyecciones climáticas
 * 
 * Dependencias necesarias:
 * npm install react-leaflet leaflet geotiff
 */
