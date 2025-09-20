import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

/**
 * Componente para visualizar escenario actual con datos base
 * Muestra rasters de precipitación, temperatura y elevación
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.showStats - Mostrar estadísticas básicas al cargar (default: true)
 * @param {string} props.rastersBasePath - Ruta base para archivos raster (default: '/data/rasters/actual/')
 */

// Función para calcular estadísticas básicas de un raster (simulado)
const calculateRasterStats = (rasterName) => {
  // En una implementación real, estas estadísticas se calcularían del archivo raster
  const statsMap = {
    'PT.tif': { min: 450, max: 1850, mean: 1120, unit: 'mm/año' },
    'TEMP.tif': { min: 8.5, max: 26.2, mean: 18.3, unit: '°C' },
    'MDE.tif': { min: 180, max: 4150, mean: 1890, unit: 'msnm' }
  };
  
  return statsMap[rasterName] || { min: 0, max: 100, mean: 50, unit: 'unidades' };
};

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

// Componente de estadísticas
const StatsPanel = ({ isVisible, stats, layerName }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !stats) {
    return null;
  }

  const statsStyle = {
    position: "absolute",
    bottom: "50px",
    left: "10px",
    backgroundColor: "white",
    borderRadius: "5px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
    zIndex: 1000,
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    minWidth: "200px",
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

  return (
    <div style={statsStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Estadísticas - {layerName}</span>
        <span>{isCollapsed ? "+" : "-"}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "12px" }}>
          <div style={{ marginBottom: "8px" }}>
            <strong>Mínimo:</strong> {stats.min} {stats.unit}
          </div>
          <div style={{ marginBottom: "8px" }}>
            <strong>Máximo:</strong> {stats.max} {stats.unit}
          </div>
          <div style={{ marginBottom: "0" }}>
            <strong>Promedio:</strong> {stats.mean} {stats.unit}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para cada tipo de raster
const RasterLegend = ({ isVisible, rasterType, layerName }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !rasterType) {
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

  // Generar colores específicos por tipo de raster
  const getColorsByType = (type) => {
    switch (type) {
      case 'precipitation':
        return ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8', '#253494']; // azules
      case 'temperature':
        return ['#ffffcc', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c']; // cálidos
      case 'elevation':
        return ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#2ca25f']; // verdes
      default:
        return ['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#2c7fb8'];
    }
  };

  const colors = getColorsByType(rasterType);

  const getLabels = (type) => {
    switch (type) {
      case 'precipitation':
        return ['< 600', '600-800', '800-1000', '1000-1200', '1200-1400', '> 1400'];
      case 'temperature':
        return ['< 12°C', '12-15°C', '15-18°C', '18-21°C', '21-24°C', '> 24°C'];
      case 'elevation':
        return ['< 500m', '500-1000m', '1000-1500m', '1500-2000m', '2500-3000m', '> 3000m'];
      default:
        return colors.map((_, i) => `Clase ${i + 1}`);
    }
  };

  const labels = getLabels(rasterType);

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{layerName}</span>
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

const InfoControl = () => {
  const controlStyle = {
    position: "absolute",
    top: "10px",
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
      <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>Escenario Actual</h4>
      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
        Datos base del área de estudio: precipitación total anual, 
        temperatura media anual y modelo digital de elevación.
      </p>
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
  showPT,
  onPTToggle,
  showTEMP,
  onTEMPToggle,
  showMDE,
  onMDEToggle,
  ptOpacity,
  onPTOpacityChange,
  tempOpacity,
  onTEMPOpacityChange,
  mdeOpacity,
  onMDEOpacityChange,
  onZoomToLayer,
  onDownloadPT,
  onDownloadTEMP,
  onDownloadMDE,
  area,
  paisajes,
  municipios
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const controlStyle = {
    position: "absolute",
    top: "80px",
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

      {/* Datos Climáticos */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Datos Climáticos</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            <input
              type="checkbox"
              checked={showPT}
              onChange={(e) => onPTToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Precipitación Total
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
            Temperatura Media
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

      {/* Topografía */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Topografía</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            <input
              type="checkbox"
              checked={showMDE}
              onChange={(e) => onMDEToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Elevación (MDE)
          </label>
          
          {showMDE && (
            <div style={{ marginLeft: "20px" }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={mdeOpacity}
                onChange={(e) => onMDEOpacityChange(parseFloat(e.target.value))}
                style={{ width: "100%", marginBottom: "3px" }}
              />
              <div style={{ textAlign: "center", fontSize: "10px" }}>
                {Math.round(mdeOpacity * 100)}%
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
            padding: "5px 6px",
            fontSize: "9px",
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
            padding: "5px 6px",
            fontSize: "9px",
            backgroundColor: showTEMP ? "#17a2b8" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: showTEMP ? "pointer" : "not-allowed",
            flex: "1",
          }}
        >
          DL T
        </button>
        <button
          onClick={onDownloadMDE}
          disabled={!showMDE}
          style={{
            padding: "5px 6px",
            fontSize: "9px",
            backgroundColor: showMDE ? "#6f42c1" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: showMDE ? "pointer" : "not-allowed",
            flex: "1",
          }}
        >
          DL MDE
        </button>
      </div>
    </div>
  );
};

// Componente principal
const EscenarioActual = ({ 
  showStats = true,
  rastersBasePath = '/data/rasters/actual/'
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estados para controles (PT y MDE activos por defecto, TEMP desactivado)
  const [showPT, setShowPT] = useState(true);
  const [showTEMP, setShowTEMP] = useState(false);
  const [showMDE, setShowMDE] = useState(true);
  const [ptOpacity, setPTOpacity] = useState(0.7);
  const [tempOpacity, setTEMPOpacity] = useState(0.7);
  const [mdeOpacity, setMDEOpacity] = useState(0.5);

  // Estados para estadísticas
  const [ptStats, setPTStats] = useState(null);
  const [tempStats, setTEMPStats] = useState(null);
  const [mdeStats, setMDEStats] = useState(null);

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

  // Cargar estadísticas cuando se activan las capas
  useEffect(() => {
    if (showStats) {
      if (showPT && !ptStats) {
        setPTStats(calculateRasterStats('PT.tif'));
      }
      if (showTEMP && !tempStats) {
        setTEMPStats(calculateRasterStats('TEMP.tif'));
      }
      if (showMDE && !mdeStats) {
        setMDEStats(calculateRasterStats('MDE.tif'));
      }
    }
  }, [showPT, showTEMP, showMDE, showStats, ptStats, tempStats, mdeStats]);

  // Funciones de control
  const handleZoomToArea = () => {
    if (area && window.mapInstance) {
      const geojsonLayer = L.geoJSON(area);
      window.mapInstance.fitBounds(geojsonLayer.getBounds());
    }
  };

  const handleDownloadPT = () => {
    downloadFile('PT.tif', 'Precipitación Total');
  };

  const handleDownloadTEMP = () => {
    downloadFile('TEMP.tif', 'Temperatura Media');
  };

  const handleDownloadMDE = () => {
    downloadFile('MDE.tif', 'Modelo Digital de Elevación');
  };

  // Determinar capa activa para leyenda (prioridad: PT > MDE > TEMP)
  const getActiveLegend = () => {
    if (showPT) return { type: 'precipitation', name: 'Precipitación Total' };
    if (showMDE) return { type: 'elevation', name: 'Elevación' };
    if (showTEMP) return { type: 'temperature', name: 'Temperatura Media' };
    return null;
  };

  const activeLegend = getActiveLegend();

  // Determinar estadísticas activas para mostrar
  const getActiveStats = () => {
    if (showPT) return { stats: ptStats, name: 'Precipitación' };
    if (showMDE) return { stats: mdeStats, name: 'Elevación' };
    if (showTEMP) return { stats: tempStats, name: 'Temperatura' };
    return null;
  };

  const activeStats = getActiveStats();

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer
        center={[19.5, -99.0]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
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

        {/* Raster Overlays - Orden: MDE (base), luego PT, luego TEMP */}
        {showMDE && (
          <RasterOverlay
            rasterUrl="/MDE.tif"
            opacity={mdeOpacity}
          />
        )}

        {showPT && (
          <RasterOverlay
            rasterUrl="/PT.tif"
            opacity={ptOpacity}
          />
        )}

        {showTEMP && (
          <RasterOverlay
            rasterUrl="/TEMP.tif"
            opacity={tempOpacity}
          />
        )}

        {/* Controles */}
        <InfoControl />
        <DraggingControl />
        <CoordinateControl />
        <ScaleControl />
        
        <GroupedLayerControl
          showPT={showPT}
          onPTToggle={setShowPT}
          showTEMP={showTEMP}
          onTEMPToggle={setShowTEMP}
          showMDE={showMDE}
          onMDEToggle={setShowMDE}
          ptOpacity={ptOpacity}
          onPTOpacityChange={setPTOpacity}
          tempOpacity={tempOpacity}
          onTEMPOpacityChange={setTEMPOpacity}
          mdeOpacity={mdeOpacity}
          onMDEOpacityChange={setMDEOpacity}
          onZoomToLayer={handleZoomToArea}
          onDownloadPT={handleDownloadPT}
          onDownloadTEMP={handleDownloadTEMP}
          onDownloadMDE={handleDownloadMDE}
          area={area}
          paisajes={paisajes}
          municipios={municipios}
        />

        {/* Leyenda */}
        {activeLegend && (
          <RasterLegend
            isVisible={true}
            rasterType={activeLegend.type}
            layerName={activeLegend.name}
          />
        )}

        {/* Panel de Estadísticas */}
        {showStats && activeStats && (
          <StatsPanel
            isVisible={true}
            stats={activeStats.stats}
            layerName={activeStats.name}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default EscenarioActual;

/**
 * Ejemplo de uso:
 * 
 * import EscenarioActual from './components/EscenarioActual';
 * 
 * function App() {
 *   return (
 *     <EscenarioActual 
 *       showStats={true}
 *       rastersBasePath="/data/rasters/actual/"
 *     />
 *   );
 * }
 * 
 * Test manual sugerido:
 * 1. Cargar componente y verificar que PT y MDE están activos por defecto
 * 2. Verificar que TEMP está desactivado inicialmente
 * 3. Activar/desactivar cada capa independientemente
 * 4. Ajustar opacidades de cada raster
 * 5. Verificar que se muestran estadísticas al activar capas
 * 6. Verificar leyendas dinámicas con colores apropiados por tipo
 * 7. Probar descargas (botones habilitados solo con capas activas)
 * 8. Verificar superposición correcta de capas (MDE base, PT encima, TEMP arriba)
 * 9. Comprobar que estadísticas cambian al cambiar capa activa
 * 
 * Dependencias necesarias:
 * npm install react-leaflet leaflet geotiff
 */
