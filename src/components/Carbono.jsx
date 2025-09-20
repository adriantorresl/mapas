import React, { useEffect, useState } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RasterOverlay } from "./RasterViewer";

/**
 * Componente para visualizar datos de carbono con capas raster y vector
 * Muestra series temporales CO2 S1-S7, tendencia y proyección 2050
 * @param {Object} props - Propiedades del componente
 * @param {string} props.geojsonUrl - URL del archivo GeoJSON vector (default: '/CO2_CUENCA.geojson')
 * @param {string} props.rastersBasePath - Ruta base para archivos raster (default: '/data/rasters/carbono/')
 */

// Función para generar paleta de colores por cuantiles para vector
const generateQuantileColorPalette = (values) => {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return {};

  validValues.sort((a, b) => a - b);
  const n = validValues.length;
  
  const quantiles = [
    validValues[Math.floor(n * 0.2)],
    validValues[Math.floor(n * 0.4)],
    validValues[Math.floor(n * 0.6)],
    validValues[Math.floor(n * 0.8)],
    validValues[n - 1]
  ];

  // Colores verdes para carbono
  const colors = ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476'];
  
  return {
    quantiles,
    colors,
    getColor: (value) => {
      if (value === null || value === undefined || isNaN(value)) return '#CCCCCC';
      for (let i = 0; i < quantiles.length; i++) {
        if (value <= quantiles[i]) return colors[i];
      }
      return colors[colors.length - 1];
    }
  };
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

// Componente de leyenda para raster
const RasterLegend = ({ isVisible, currentRaster }) => {
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

  // Generar colores para carbono (escala verde)
  const generateCarbonoColors = () => {
    return ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c'];
  };

  const colors = generateCarbonoColors();

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>{currentRaster}</span>
        <span>{isCollapsed ? "+" : "-"}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "8px" }}>
          <div style={{ marginBottom: "5px", fontSize: "11px", fontWeight: "bold" }}>
            Carbono (Mg C/ha)
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
                {index === 0 ? 'Bajo' : index === colors.length - 1 ? 'Alto' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de leyenda para vector
const VectorLegend = ({ colorPalette, isVisible }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible || !colorPalette || !colorPalette.colors) {
    return null;
  }

  const legendStyle = {
    position: "absolute",
    bottom: "270px",
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

  return (
    <div style={legendStyle}>
      <div style={headerStyle} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span>Proyección CO2 2050</span>
        <span>{isCollapsed ? "+" : "-"}</span>
      </div>
      {!isCollapsed && (
        <div style={{ padding: "8px" }}>
          {colorPalette.colors.map((color, index) => (
            <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
              <div
                style={{
                  width: "20px",
                  height: "15px",
                  backgroundColor: color,
                  marginRight: "8px",
                  border: "1px solid #ccc",
                }}
              />
              <span style={{ fontSize: "11px" }}>
                {index === 0 
                  ? `≤ ${colorPalette.quantiles[index]?.toFixed(1) || 'N/A'}`
                  : index === colorPalette.colors.length - 1
                  ? `> ${colorPalette.quantiles[index-1]?.toFixed(1) || 'N/A'}`
                  : `${colorPalette.quantiles[index-1]?.toFixed(1) || 'N/A'} - ${colorPalette.quantiles[index]?.toFixed(1) || 'N/A'}`
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
      <h4 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>Carbono Almacenado</h4>
      <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
        Visualización de carbono almacenado por series temporales (S1-S7), 
        tendencia y proyección por cuenca para 2050.
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
  currentSerie,
  onSerieChange,
  showTendencia,
  onTendenciaToggle,
  showVector,
  onVectorToggle,
  rasterOpacity,
  onRasterOpacityChange,
  vectorOpacity,
  onVectorOpacityChange,
  onZoomToLayer,
  onDownloadRaster,
  onDownloadVector,
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

  const seriesOptions = [
    { value: 'S1', label: 'Serie S1' },
    { value: 'S2', label: 'Serie S2' },
    { value: 'S3', label: 'Serie S3' },
    { value: 'S4', label: 'Serie S4' },
    { value: 'S5', label: 'Serie S5' },
    { value: 'S6', label: 'Serie S6' },
    { value: 'S7', label: 'Serie S7' }
  ];

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

      {/* Series CO2 */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Series CO2</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "12px" }}>
            Serie temporal:
          </label>
          <select
            value={currentSerie}
            onChange={(e) => onSerieChange(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "5px", 
              marginBottom: "10px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "3px"
            }}
          >
            {seriesOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <label style={{ display: "block", marginBottom: "5px" }}>
            <input
              type="checkbox"
              checked={showTendencia}
              onChange={(e) => onTendenciaToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Mostrar Tendencia
          </label>
        </div>
      </div>

      {/* Capa Vector */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Proyección 2050</div>
        <div style={{ padding: "8px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            <input
              type="checkbox"
              checked={showVector}
              onChange={(e) => onVectorToggle(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            Proyección por cuenca
          </label>
        </div>
      </div>

      {/* Control de Opacidad Raster */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Opacidad Raster</div>
        <div style={{ padding: "8px" }}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={rasterOpacity}
            onChange={(e) => onRasterOpacityChange(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", fontSize: "11px", marginTop: "3px" }}>
            {Math.round(rasterOpacity * 100)}%
          </div>
        </div>
      </div>

      {/* Control de Opacidad Vector */}
      {showVector && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>Opacidad Vector</div>
          <div style={{ padding: "8px" }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={vectorOpacity}
              onChange={(e) => onVectorOpacityChange(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ textAlign: "center", fontSize: "11px", marginTop: "3px" }}>
              {Math.round(vectorOpacity * 100)}%
            </div>
          </div>
        </div>
      )}

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
          onClick={onDownloadRaster}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            flex: "1",
          }}
        >
          DL Raster
        </button>
        <button
          onClick={onDownloadVector}
          style={{
            padding: "5px 8px",
            fontSize: "10px",
            backgroundColor: "#17a2b8",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
            flex: "1",
          }}
        >
          DL Vector
        </button>
      </div>
    </div>
  );
};

// Componente principal
const Carbono = ({ 
  geojsonUrl = '/CO2_CUENCA.geojson',
  rastersBasePath = '/data/rasters/carbono/'
}) => {
  // Estados para datos
  const [area, setArea] = useState(null);
  const [paisajes, setPaisajes] = useState(null);
  const [municipios, setMunicipios] = useState(null);
  const [co2Cuenca, setCo2Cuenca] = useState(null);

  // Estados para controles
  const [currentSerie, setCurrentSerie] = useState('S1');
  const [showTendencia, setShowTendencia] = useState(false);
  const [showVector, setShowVector] = useState(true);
  const [rasterOpacity, setRasterOpacity] = useState(0.7);
  const [vectorOpacity, setVectorOpacity] = useState(0.6);
  const [vectorColorPalette, setVectorColorPalette] = useState(null);

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
    fetch(geojsonUrl)
      .then((res) => res.json())
      .then((data) => {
        setCo2Cuenca(data);
        // Generar paleta de colores para proyección 2050
        const values = data.features.map(f => f.properties.A_2050);
        const palette = generateQuantileColorPalette(values);
        setVectorColorPalette(palette);
      })
      .catch(console.error);
  }, [geojsonUrl]);

  // Funciones de control
  const handleZoomToLayer = () => {
    if (co2Cuenca && window.mapInstance) {
      const geojsonLayer = L.geoJSON(co2Cuenca);
      window.mapInstance.fitBounds(geojsonLayer.getBounds());
    }
  };

  const handleDownloadRaster = () => {
    const filename = showTendencia ? 'TEND_CO2.tif' : `CO2_${currentSerie}.tif`;
    const displayName = showTendencia ? 'Tendencia CO2' : `Carbono ${currentSerie}`;
    downloadFile(filename, displayName);
  };

  const handleDownloadVector = () => {
    if (co2Cuenca) {
      const dataStr = JSON.stringify(co2Cuenca, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "co2_cuenca.geojson";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Estilos para capa vector
  const getVectorStyle = (feature) => {
    if (!vectorColorPalette) {
      return {
        fillColor: '#CCCCCC',
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: vectorOpacity
      };
    }

    const value = feature.properties.A_2050;
    const color = vectorColorPalette.getColor(value);

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: vectorOpacity
    };
  };

  const onEachVectorFeature = (feature, layer) => {
    const value = feature.properties.A_2050;
    
    layer.bindTooltip(
      `<div>
        <strong>Cuenca: ${feature.properties.NOMBRE || 'Sin nombre'}</strong><br/>
        Proyección CO2 2050: ${value?.toFixed(1) || 'N/A'} Mg C/ha
      </div>`,
      { permanent: false, sticky: true }
    );

    layer.on('click', () => {
      if (window.mapInstance) {
        window.mapInstance.fitBounds(layer.getBounds());
        console.log('Datos de cuenca:', feature.properties);
      }
    });
  };

  // Obtener raster actual
  const getCurrentRaster = () => {
    if (showTendencia) {
      return 'TEND_CO2.tif';
    }
    return `CO2_${currentSerie}.tif`;
  };

  const getCurrentRasterName = () => {
    if (showTendencia) {
      return 'Tendencia de Carbono';
    }
    return `Carbono ${currentSerie}`;
  };

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

              // Agregar capa vector si está habilitada
              if (showVector && co2Cuenca) {
                L.geoJSON(co2Cuenca, {
                  style: getVectorStyle,
                  onEachFeature: onEachVectorFeature
                }).addTo(map);
              }
            }
            return null;
          })()}
        </div>

        {/* Raster Overlay */}
        {getCurrentRaster() && (
          <RasterOverlay
            rasterUrl={`/${getCurrentRaster()}`}
            opacity={rasterOpacity}
          />
        )}

        {/* Controles */}
        <InfoControl />
        <DraggingControl />
        <CoordinateControl />
        <ScaleControl />
        
        <GroupedLayerControl
          currentSerie={currentSerie}
          onSerieChange={setCurrentSerie}
          showTendencia={showTendencia}
          onTendenciaToggle={setShowTendencia}
          showVector={showVector}
          onVectorToggle={setShowVector}
          rasterOpacity={rasterOpacity}
          onRasterOpacityChange={setRasterOpacity}
          vectorOpacity={vectorOpacity}
          onVectorOpacityChange={setVectorOpacity}
          onZoomToLayer={handleZoomToLayer}
          onDownloadRaster={handleDownloadRaster}
          onDownloadVector={handleDownloadVector}
          area={area}
          paisajes={paisajes}
          municipios={municipios}
        />

        <RasterLegend
          isVisible={!!getCurrentRaster()}
          currentRaster={getCurrentRasterName()}
        />

        {showVector && (
          <VectorLegend
            colorPalette={vectorColorPalette}
            isVisible={showVector}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Carbono;

/**
 * Ejemplo de uso:
 * 
 * import Carbono from './components/Carbono';
 * 
 * function App() {
 *   return (
 *     <Carbono 
 *       geojsonUrl="/data/CO2_CUENCA.geojson"
 *       rastersBasePath="/data/rasters/carbono/"
 *     />
 *   );
 * }
 * 
 * Test manual sugerido:
 * 1. Cargar componente y verificar que muestra Serie S1 por defecto
 * 2. Usar dropdown para cambiar de S1 a S7, verificar cambio de raster
 * 3. Activar checkbox "Mostrar Tendencia" y verificar cambio a TEND_CO2.tif
 * 4. Activar/desactivar capa vector de proyección 2050
 * 5. Ajustar opacidades independientes de raster y vector
 * 6. Hacer hover sobre cuencas para ver valores de proyección 2050
 * 7. Hacer clic en cuencas para zoom y datos completos en consola
 * 8. Probar botones de descarga para raster y vector
 * 9. Verificar leyendas dinámicas con escalas de color apropiadas para carbono
 * 
 * Dependencias necesarias:
 * npm install react-leaflet leaflet geotiff
 */
