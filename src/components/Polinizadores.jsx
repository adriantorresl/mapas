import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

/**
 * Componente para visualizar datos de polinizadores por estaciones
 * Muestra rasters estacionales para Anoura geoffroyi y polinizadores genéricos
 * @param {Object} props - Propiedades del componente
 * @param {string} props.rastersBasePath - Ruta base para archivos raster (default: '/data/rasters/polinizadores/')
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

// Componente selector de estaciones
const SeasonSelector = ({ activeSeason, onSeasonChange }) => {
  const selectorStyle = {
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

  const seasonStyle = {
    padding: "10px 15px",
    cursor: "pointer",
    borderRight: "1px solid #ddd",
    fontSize: "13px",
    fontWeight: "bold",
    transition: "background-color 0.3s",
    minWidth: "80px",
    textAlign: "center",
  };

  const activeSeasonStyle = {
    ...seasonStyle,
    backgroundColor: "#28a745",
    color: "white",
  };

  const inactiveSeasonStyle = {
    ...seasonStyle,
    backgroundColor: "white",
    color: "#333",
  };

  const seasons = [
    { key: 'primavera', label: 'Primavera' },
    { key: 'verano', label: 'Verano' },
    { key: 'otono', label: 'Otoño' },
    { key: 'invierno', label: 'Invierno' }
  ];

  return (
    <div style={selectorStyle}>
      {seasons.map((season, index) => (
        <div
          key={season.key}
          style={{
            ...(activeSeason === season.key ? activeSeasonStyle : inactiveSeasonStyle),
            borderRight: index === seasons.length - 1 ? "none" : "1px solid #ddd",
          }}
          onClick={() => onSeasonChange(season.key)}
        >
          {season.label}
        </div>
      ))}
    </div>
  );
};

// Componente de leyenda para raster
const RasterLegend = ({ isVisible, currentRaster, speciesType }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !currentRaster) {
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

  // Generar colores para probabilidad (0-1) con escala de calor
  const generateProbabilityColors = () => {
    return ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026'];
  };

  const colors = generateProbabilityColors();

  // Generar valores de probabilidad del 0% al 100%
  const probabilityValues = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{currentRaster}</span>
        <span>{isCollapsed ? "+" : "-"}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "8px" }}>
          <div style={{ marginBottom: "5px", fontSize: "11px", fontWeight: "bold" }}>
            Probabilidad de Presencia
          </div>
          {colors.map((color, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
              <div
                style={{
                  width: "20px",
                  height: "8px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontSize: "10px" }}>
                {index === 0 
                  ? `${probabilityValues[index]}%` 
                  : index === colors.length - 1 
                  ? `${probabilityValues[index]}%`
                  : `${probabilityValues[index]}%`
                }
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

const InfoControl = ({ activeSeason }) => {
  const controlStyle = {
    position: "absolute",
    top: "80px",
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

  const getSeasonName = () => {
    const seasonNames = {
      'primavera': 'Primavera',
      'verano': 'Verano',
      'otono': 'Otoño',
      'invierno': 'Invierno'
    };
    return seasonNames[activeSeason] || activeSeason;
  };

  return (
    <div style={controlStyle}>
      <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
        Polinizadores - {getSeasonName()}
      </h4>
      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
        Visualización de probabilidad de presencia de polinizadores por estación. 
        Incluye Anoura geoffroyi y polinizadores genéricos.
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
  activeSeason,
  showAnoura,
  onAnouraToggle,
  showGeneric,
  onGenericToggle,
  anouraOpacity,
  onAnouraOpacityChange,
  genericOpacity,
  onGenericOpacityChange,
  onZoomToLayer,
  onDownloadAnoura,
  onDownloadGeneric,
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

      {/* Anoura geoffroyi */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Anoura geoffroyi</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={showAnoura}
              onChange={(e) => onAnouraToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Mostrar Anoura geoffroyi
          </label>
          
          {showAnoura && (
            <>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "11px" }}>
                Opacidad:
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={anouraOpacity}
                onChange={(e) => onAnouraOpacityChange(parseFloat(e.target.value))}
                style={{ width: "100%", marginBottom: "5px" }}
              />
              <div style={{ textAlign: "center", fontSize: "10px" }}>
                {Math.round(anouraOpacity * 100)}%
              </div>
            </>
          )}
        </div>
      </div>

      {/* Polinizadores Genéricos */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Polinizadores Genéricos</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={showGeneric}
              onChange={(e) => onGenericToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Mostrar Polinizadores
          </label>
          
          {showGeneric && (
            <>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "11px" }}>
                Opacidad:
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={genericOpacity}
                onChange={(e) => onGenericOpacityChange(parseFloat(e.target.value))}
                style={{ width: "100%", marginBottom: "5px" }}
              />
              <div style={{ textAlign: "center", fontSize: "10px" }}>
                {Math.round(genericOpacity * 100)}%
              </div>
            </>
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
          onClick={onDownloadAnoura}
          disabled={!showAnoura}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: showAnoura ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: showAnoura ? "pointer" : "not-allowed",
            flex: "1",
          }}
        >
          DL Anoura
        </button>
        <button
          onClick={onDownloadGeneric}
          disabled={!showGeneric}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: showGeneric ? "#17a2b8" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: showGeneric ? "pointer" : "not-allowed",
            flex: "1",
          }}
        >
          DL Polin
        </button>
      </div>
    </div>
  );
};

// Componente principal
const Polinizadores = ({ 
  rastersBasePath = '/data/rasters/polinizadores/'
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);

  // Estados para controles
  const [activeSeason, setActiveSeason] = useState('primavera');
  const [showAnoura, setShowAnoura] = useState(true);
  const [showGeneric, setShowGeneric] = useState(false);
  const [anouraOpacity, setAnouraOpacity] = useState(0.7);
  const [genericOpacity, setGenericOpacity] = useState(0.7);

  // Mapeo de estaciones a códigos de archivo
  const seasonMap = {
    'primavera': 'PRI',
    'verano': 'VER',
    'otono': 'OTO',
    'invierno': 'INV'
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

  const handleDownloadAnoura = () => {
    const seasonCode = seasonMap[activeSeason];
    const filename = `AG_${seasonCode}.tif`;
    const displayName = `Anoura geoffroyi ${activeSeason}`;
    downloadFile(filename, displayName);
  };

  const handleDownloadGeneric = () => {
    const seasonCode = seasonMap[activeSeason];
    const filename = `POLIN_${seasonCode}.tif`;
    const displayName = `Polinizadores ${activeSeason}`;
    downloadFile(filename, displayName);
  };

  // Obtener archivos raster actuales
  const getAnouraRaster = () => {
    const seasonCode = seasonMap[activeSeason];
    return `AG_${seasonCode}.tif`;
  };

  const getGenericRaster = () => {
    const seasonCode = seasonMap[activeSeason];
    // Solo primavera y verano para polinizadores genéricos
    if (activeSeason === 'primavera' || activeSeason === 'verano') {
      return `POLIN_${seasonCode}.tif`;
    }
    return null;
  };

  const getAnouraRasterName = () => {
    const seasonNames = {
      'primavera': 'Primavera',
      'verano': 'Verano',
      'otono': 'Otoño',
      'invierno': 'Invierno'
    };
    return `Anoura geoffroyi - ${seasonNames[activeSeason]}`;
  };

  const getGenericRasterName = () => {
    const seasonNames = {
      'primavera': 'Primavera',
      'verano': 'Verano'
    };
    return `Polinizadores - ${seasonNames[activeSeason]}`;
  };

  // Verificar si los rasters genéricos están disponibles
  const isGenericAvailable = activeSeason === 'primavera' || activeSeason === 'verano';

  // Ocultar polinizadores genéricos si no están disponibles
  useEffect(() => {
    if (!isGenericAvailable) {
      setShowGeneric(false);
    }
  }, [isGenericAvailable]);

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

        {/* Raster Overlays */}
        {showAnoura && getAnouraRaster() && (
          <RasterOverlay
            rasterUrl={`/${getAnouraRaster()}`}
            opacity={anouraOpacity}
          />
        )}

        {showGeneric && getGenericRaster() && (
          <RasterOverlay
            rasterUrl={`/${getGenericRaster()}`}
            opacity={genericOpacity}
          />
        )}

        {/* Controles */}
        <SeasonSelector
          activeSeason={activeSeason}
          onSeasonChange={setActiveSeason}
        />
        <InfoControl activeSeason={activeSeason} />
        <DraggingControl />
        <CoordinateControl />
        <ScaleControl />
        
        <GroupedLayerControl
          activeSeason={activeSeason}
          showAnoura={showAnoura}
          onAnouraToggle={setShowAnoura}
          showGeneric={showGeneric && isGenericAvailable}
          onGenericToggle={setShowGeneric}
          anouraOpacity={anouraOpacity}
          onAnouraOpacityChange={setAnouraOpacity}
          genericOpacity={genericOpacity}
          onGenericOpacityChange={setGenericOpacity}
          onZoomToLayer={handleZoomToArea}
          onDownloadAnoura={handleDownloadAnoura}
          onDownloadGeneric={handleDownloadGeneric}
          area={area}
          paisajes={paisajes}
          municipios={municipios}
        />

        {/* Leyendas */}
        {showAnoura && (
          <RasterLegend
            isVisible={showAnoura}
            currentRaster={getAnouraRasterName()}
            speciesType="anoura"
          />
        )}

        {showGeneric && getGenericRaster() && (
          <div style={{ position: "relative" }}>
            <RasterLegend
              isVisible={showGeneric}
              currentRaster={getGenericRasterName()}
              speciesType="generic"
            />
          </div>
        )}

        {/* Mensaje para estaciones sin datos de polinizadores genéricos */}
        {!isGenericAvailable && (
          <div style={{
            position: "absolute",
            bottom: "270px",
            right: "10px",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
            zIndex: 1000,
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            maxWidth: "200px",
            border: "1px solid #ffc107",
            backgroundColor: "#fff3cd",
          }}>
            <div style={{ fontWeight: "bold", color: "#856404", marginBottom: "5px" }}>
              ⚠️ Información
            </div>
            <div style={{ color: "#856404" }}>
              Datos de polinizadores genéricos solo disponibles para primavera y verano.
            </div>
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default Polinizadores;

/**
 * Ejemplo de uso:
 * 
 * import Polinizadores from './components/Polinizadores';
 * 
 * function App() {
 *   return (
 *     <Polinizadores 
 *       rastersBasePath="/data/rasters/polinizadores/"
 *     />
 *   );
 * }
 * 
 * Test manual sugerido:
 * 1. Cargar componente y verificar que muestra primavera por defecto
 * 2. Cambiar entre estaciones usando el selector superior
 * 3. Verificar que Anoura geoffroyi está disponible en todas las estaciones
 * 4. Verificar que polinizadores genéricos solo aparecen en primavera/verano
 * 5. Activar/desactivar cada especie independientemente
 * 6. Ajustar opacidades de cada capa por separado
 * 7. Probar descargas (botón deshabilitado cuando capa no visible)
 * 8. Verificar leyendas con escala de probabilidad 0-100%
 * 9. Observar mensaje informativo en otoño/invierno para genéricos
 * 
 * Dependencias necesarias:
 * npm install react-leaflet leaflet geotiff
 */
