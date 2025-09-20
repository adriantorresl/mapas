import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  useMap,
  GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import RetractableMapControls from "./RetractableMapControls";
import "../leaflet-tooltip-fix.css";
import "leaflet/dist/leaflet.css";
import * as GeoTIFF from "geotiff";
import chroma from "chroma-js";
import PropTypes from "prop-types";

// 🔹 Convierte string de colorMap a objeto o array
const parseColorMap = (input) => {
  if (!input) return {};
  // Si ya es un array, lo regresamos tal cual
  if (Array.isArray(input)) return input;
  // Si contiene ":" es formato valor:color
  if (typeof input === "string" && input.includes(":")) {
    const map = {};
    input.split(",").forEach((pair) => {
      const [val, color] = pair.split(":");
      if (val && color) {
        map[parseFloat(val.trim())] = color.trim().startsWith("#")
          ? color.trim()
          : `#${color.trim()}`;
      }
    });
    return map;
  }
  // Si no contiene ":" es solo una lista de colores
  if (typeof input === "string") {
    return input.split(",").map((color) => color.trim());
  }
  return input;
};

// 🔹 Convierte hex a RGBA
const hexToRgba = (hex) => {
  if (!hex) return [0, 0, 0, 0];
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const bigint = parseInt(c, 16);
  if (isNaN(bigint)) return [0, 0, 0, 0];
  if (c.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
  } else if (c.length === 8) {
    return [
      (bigint >> 24) & 255,
      (bigint >> 16) & 255,
      (bigint >> 8) & 255,
      bigint & 255,
    ];
  }
  return [0, 0, 0, 0];
};

// 🔹 Carga el raster y lo monta como imagen sobre Leaflet
export const RasterOverlay = React.memo(({
  fileName,
  colorMap,
  baseUrl,
  setError = () => {},
  setLoading = () => {},
  continuous = false,
  onPixelValue = () => {},
  overlayOpacity = 0.8,
  pane = "overlayPane",
}) => {
  // Validación defensiva
  const safeSetError = typeof setError === 'function' ? setError : () => {};
  const safeSetLoading = typeof setLoading === 'function' ? setLoading : () => {};
  
  const map = useMap();
  const overlayRef = useRef(null);
  const loadedRef = useRef(false);
  const imageRef = useRef(null);
  const onPixelValueRef = useRef(onPixelValue);
  const imageDataRef = useRef({
    data: null,
    width: 0,
    height: 0,
    bounds: null,
  });

  // Actualizar la ref cuando cambie la función
  useEffect(() => {
    onPixelValueRef.current = onPixelValue;
  }, [onPixelValue]);

  // Memorizar el colorMap parseado para evitar re-renders innecesarios
  const parsedColorMap = useMemo(() => parseColorMap(colorMap), [colorMap]);

  useEffect(() => {
    let isMounted = true;
    loadedRef.current = false;

    const loadRaster = async () => {
      try {
        if (!isMounted) return;

        const fullUrl = `${baseUrl.replace(/\/$/, "")}/${fileName.replace(
          /^\//,
          ""
        )}`;
        const tiff = await GeoTIFF.fromUrl(fullUrl);
        if (!isMounted) return;
        const image = await tiff.getImage();
        if (!isMounted) return;
        const rasters = await image.readRasters();
        if (!isMounted) return;
        const data = rasters[0];
        const width = image.getWidth();
        const height = image.getHeight();
        const bounds = image.getBoundingBox();

        imageDataRef.current = { data, width, height, bounds };

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        const imgData = ctx.createImageData(width, height);

        let scale;
        // hoist nodata/min/max para que estén disponibles fuera del bloque
        let nodata = null;
        let min = Infinity;
        let max = -Infinity;
        if (continuous) {
          // Diagnóstico: log tipo y tamaño de data
          console.log(
            "[RasterViewer] data type:",
            Object.prototype.toString.call(data),
            "length:",
            data.length
          );

          // Intentar obtener nodata del TIFF (si está disponible)
          try {
            if (typeof image.getGDALNoData === "function") {
              const nd = image.getGDALNoData();
              if (nd != null) nodata = Number(nd);
            }
            if (nodata == null && typeof image.getNoDataValue === "function") {
              const nd2 = image.getNoDataValue();
              if (nd2 != null) nodata = Number(nd2);
            }
          } catch (e) {
            // ignore
          }

          // Calcular min y max ignorando NaN y valores nodata o extremadamente grandes
          for (let i = 0; i < data.length; i++) {
            const v = data[i];
            if (v === null || v === undefined) continue;
            if (Number.isNaN(v)) continue;
            // ignorar valores idénticos a nodata
            if (nodata != null && v === nodata) continue;
            // ignorar valores absurdos (posible relleno)
            if (!isFinite(v) || Math.abs(v) > 1e9) continue;
            if (v < min) min = v;
            if (v > max) max = v;
          }
          const colors = Array.isArray(parsedColorMap)
            ? parsedColorMap
            : Object.values(parsedColorMap);
          console.log("[RasterViewer] colors:", colors);
          console.log(
            `[RasterViewer] min: ${min}, max: ${max}, nodata: ${nodata}`
          );
          if (!colors || colors.length < 2) {
            safeSetError("colorMap debe tener al menos dos colores");
            safeSetLoading(false);
            return;
          }
          if (!isFinite(min) || !isFinite(max)) {
            safeSetError("No se pudo calcular el rango de valores del raster");
            safeSetLoading(false);
            return;
          }
          if (min === max) {
            safeSetError(
              `El raster tiene un solo valor (${min}), no se puede generar escala de color.`
            );
            safeSetLoading(false);
            return;
          }
          scale = chroma.scale(colors).domain([min, max]);
        }

        for (let i = 0; i < data.length; i++) {
          const value = data[i];
          let color = "#00000000"; // default transparent

          if (continuous) {
            // Excluir nodata / invalid
            if (value == null || Number.isNaN(value)) {
              color = "#00000000";
            } else if (
              typeof nodata !== "undefined" &&
              nodata !== null &&
              value === nodata
            ) {
              color = "#00000000";
            } else if (!isFinite(value)) {
              color = "#00000000";
            } else {
              // Clamp to domain to avoid chroma errors
              const v = Math.max(min, Math.min(max, value));
              try {
                color = scale(v).hex();
              } catch (e) {
                color = "#00000000";
              }
            }
          } else {
            if (Array.isArray(parsedColorMap)) {
              const index = Math.round(value);
              color = parsedColorMap[index] || "#00000000";
            } else if (parsedColorMap && typeof parsedColorMap === "object") {
              color = parsedColorMap[Math.round(value)] || "#00000000";
            }
          }

          const [r, g, b, a = 255] = hexToRgba(color);
          imgData.data[i * 4] = r;
          imgData.data[i * 4 + 1] = g;
          imgData.data[i * 4 + 2] = b;
          imgData.data[i * 4 + 3] = a;
        }

        if (!isMounted) return;

        try {
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.error("[RasterViewer] putImageData failed:", e);
        }
        const imageUrl = canvas.toDataURL();
        console.log("[RasterViewer] imageUrl length:", imageUrl.length);

        const southWest = L.latLng(bounds[1], bounds[0]);
        const northEast = L.latLng(bounds[3], bounds[2]);
        const rasterBounds = L.latLngBounds(southWest, northEast);
        // Log bounds para depuración
        console.log(
          "[RasterViewer] bounds:",
          bounds,
          "rasterBounds:",
          rasterBounds
        );

        if (overlayRef.current && map.hasLayer(overlayRef.current)) {
          map.removeLayer(overlayRef.current);
        }

        let overlay;
        try {
          overlay = L.imageOverlay(imageUrl, rasterBounds, {
            opacity: 1.0, // Usar opacidad fija inicial
            pane: pane, // Usar el pane especificado
          });
          overlay.addTo(map);
          // Asegurar visibilidad y zIndex
          try {
            if (typeof overlay.setOpacity === "function")
              overlay.setOpacity(overlayOpacity);
            // No establecer zIndex manualmente si estamos usando panes
            if (typeof overlay.bringToFront === "function")
              overlay.bringToFront();
          } catch (err) {
            /* ignore */
          }
          console.log("[RasterViewer] overlay addedTo map:", !!overlay);
        } catch (e) {
          console.error("[RasterViewer] Failed to create/add overlay:", e);
        }
        // Usar panes en lugar de zIndex manual para mejor control
        overlayRef.current = overlay;
        imageRef.current = image;

        // Solo hacer fitBounds si los bounds son válidos
        if (
          isFinite(bounds[0]) &&
          isFinite(bounds[1]) &&
          isFinite(bounds[2]) &&
          isFinite(bounds[3]) &&
          bounds[0] !== bounds[2] &&
          bounds[1] !== bounds[3]
        ) {
          map.fitBounds(rasterBounds);
        } else {
          console.warn("[RasterViewer] Bounds inválidos, no se hace fitBounds");
        }

        if (isMounted && !loadedRef.current) {
          loadedRef.current = true;
          safeSetLoading(false);
          safeSetError(null);
        }
      } catch (err) {
        console.error("❌ Error cargando raster:", err);
        if (isMounted && !loadedRef.current) {
          loadedRef.current = true;
          safeSetLoading(false);
          safeSetError(err.message || "Error al cargar el raster");
        }
      }
    };

    safeSetLoading(true);
    safeSetError(null);
    loadRaster();

    // Evento para mostrar valor del pixel con throttling
    let lastUpdate = 0;
    const throttleDelay = 50; // ms

    function onMapMouseMove(e) {
      const now = Date.now();
      if (now - lastUpdate < throttleDelay) {
        return; // Skip update si es muy reciente
      }
      lastUpdate = now;

      const { data, width, height, bounds } = imageDataRef.current;
      if (!data || !bounds) {
        onPixelValueRef.current(null);
        return;
      }
      const [minX, minY, maxX, maxY] = bounds;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (lng < minX || lng > maxX || lat < minY || lat > maxY) {
        onPixelValueRef.current(null);
        return;
      }
      // Convertir lat/lng a pixel
      const x = Math.floor(((lng - minX) / (maxX - minX)) * (width - 1));
      const y = Math.floor((1 - (lat - minY) / (maxY - minY)) * (height - 1));
      const idx = y * width + x;
      const value = data[idx];
      onPixelValueRef.current(value);
    }

    map.on("mousemove", onMapMouseMove);
    map.on("mouseout", () => onPixelValueRef.current(null));

    return () => {
      isMounted = false;
      if (overlayRef.current && map.hasLayer(overlayRef.current)) {
        map.removeLayer(overlayRef.current);
      }
      map.off("mousemove", onMapMouseMove);
      map.off("mouseout");
    };
  }, [
    fileName,
    parsedColorMap,
    baseUrl,
    continuous,
    map,
    setError,
    setLoading,
  ]);

  // useEffect separado para manejar solo cambios de opacidad sin recrear el overlay
  useEffect(() => {
    if (
      overlayRef.current &&
      typeof overlayRef.current.setOpacity === "function"
    ) {
      overlayRef.current.setOpacity(overlayOpacity);
    }
  }, [overlayOpacity]);

  return null;
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian props críticas para el overlay
  return (
    prevProps.fileName === nextProps.fileName &&
    prevProps.overlayOpacity === nextProps.overlayOpacity &&
    prevProps.pane === nextProps.pane &&
    JSON.stringify(prevProps.colorMap) === JSON.stringify(nextProps.colorMap) &&
    prevProps.continuous === nextProps.continuous &&
    prevProps.baseUrl === nextProps.baseUrl
  );
});

// Control de escala y coordenadas fuera del componente principal
function MapExtraControls() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({
      position: "bottomright",
      metric: true,
      imperial: false,
    });
    scale.addTo(map);
    let mousePosition;
    if (L.control.mousePosition) {
      mousePosition = L.control.mousePosition({
        position: "bottomleft",
        separator: " | ",
        emptyString: "Mueve el cursor sobre el mapa",
        lngFirst: false,
        numDigits: 5,
        lngFormatter: (lng) => `Lon: ${lng.toFixed(5)}°`,
        latFormatter: (lat) => `Lat: ${lat.toFixed(5)}°`,
      });
      mousePosition.addTo(map);
    }
    return () => {
      scale.remove();
      if (mousePosition) mousePosition.remove();
    };
  }, [map]);
  return null;
}

// 🔹 Componente principal
const RasterViewer = ({
  fileName,
  colorMap,
  legendItems = [],
  baseUrl = "/",
  continuous = false,
}) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pixelValue, setPixelValue] = useState(null);
  // Estados para overlays
  const [areaData, setAreaData] = useState(null);
  const [paisajeData, setPaisajeData] = useState(null);
  const [municipioData, setMunicipioData] = useState(null);

  useEffect(() => {
    fetch("/AREA.geojson")
      .then((r) => r.json())
      .then(setAreaData);
    fetch("/PAISAJES.geojson")
      .then((r) => r.json())
      .then(setPaisajeData);
    fetch("/MUNICIPIOS.geojson")
      .then((r) => r.json())
      .then(setMunicipioData);
  }, []);

  // Crear funciones estables para evitar re-renders
  const stableSetError = useCallback((err) => {
    if (typeof setError === 'function') {
      setError(err);
    }
  }, [setError]);
  const stableSetLoading = useCallback(
    (isLoading) => {
      if (typeof setLoading === 'function') {
        setLoading(isLoading);
      }
    },
    [setLoading]
  );

  return (
    <div
      className="raster-viewer-container"
      style={{ position: "relative", width: "100%" }}
    >
      {/* Controles superiores removidos: ahora en panel retráctil */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "10px",
            background: "#ffebee",
            color: "#c62828",
            zIndex: 1000,
            textAlign: "center",
          }}
        >
          Cargando capa raster...
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "10px",
            background: "#ffebee",
            color: "#c62828",
            zIndex: 1000,
            textAlign: "center",
          }}
        >
          Error: {error}
        </div>
      )}
      <MapContainer
        center={[23.5, -102.5]}
        zoom={5}
        style={{ height: "500px", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <RetractableMapControls
          panelTitle="Herramientas"
          position={{ bottom: 40, left: 14 }}
          buttons={[
            {
              label: "Exportar Mapa",
              icon: "📷",
              bg: "#e3f2fd",
              onClick: () => {
                window.print();
              },
            },
          ]}
        />
        <MapExtraControls />
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite (Esri)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay checked name="Capa Raster">
            <RasterOverlay
              fileName={fileName}
              colorMap={colorMap}
              baseUrl={baseUrl}
              continuous={continuous}
              setError={stableSetError}
              setLoading={stableSetLoading}
              onPixelValue={setPixelValue}
            />
          </LayersControl.Overlay>
          {/* Area de Estudio */}
          <LayersControl.Overlay name="Área de Estudio">
            {areaData && (
              <GeoJSON
                data={areaData}
                style={{ color: "#000000", weight: 6, fillOpacity: 0.0 }}
                interactive={false}
              />
            )}
          </LayersControl.Overlay>
          {/* Paisaje */}
          <LayersControl.Overlay name="Paisaje">
            {paisajeData && (
              <GeoJSON
                data={paisajeData}
                style={{ color: "#000000", weight: 4, fillOpacity: 0.0 }}
                interactive={false}
              />
            )}
          </LayersControl.Overlay>
          {/* Municipio */}
          <LayersControl.Overlay name="Municipio">
            {municipioData && (
              <GeoJSON
                data={municipioData}
                style={{ color: "#ffffff", weight: 1, fillOpacity: 0.0 }}
                interactive={false}
              />
            )}
          </LayersControl.Overlay>
        </LayersControl>
        {/* Valor del pixel en esquina fija */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "10px 18px",
            zIndex: 1200,
            minWidth: 120,
            fontSize: 15,
            fontWeight: 500,
            color: "#222",
          }}
        >
          Valor del píxel:{" "}
          {pixelValue === null ? (
            <span style={{ color: "#888" }}>N/A</span>
          ) : (
            pixelValue
          )}
        </div>
      </MapContainer>
      {legendItems.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 10,
            backgroundColor: "#fff8e6",
            padding: "8px 12px",
            borderRadius: 4,
            boxShadow: "0 0 5px rgba(0,0,0,0.3)",
            fontSize: 14,
            zIndex: 999,
            maxWidth: 200,
          }}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0 0" }}>
            {legendItems.map(({ label, color }, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: color,
                    marginRight: 8,
                  }}
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

RasterViewer.propTypes = {
  fileName: PropTypes.string.isRequired,
  colorMap: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  legendItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ),
  baseUrl: PropTypes.string,
  continuous: PropTypes.bool,
};

RasterViewer.defaultProps = {
  baseUrl: "/",
  legendItems: [],
  continuous: false,
};

export default RasterViewer;

// PropTypes para RasterOverlay
RasterOverlay.propTypes = {
  fileName: PropTypes.string.isRequired,
  colorMap: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  baseUrl: PropTypes.string,
  setError: PropTypes.func.isRequired,
  setLoading: PropTypes.func.isRequired,
  continuous: PropTypes.bool,
  onPixelValue: PropTypes.func.isRequired,
  overlayOpacity: PropTypes.number,
  pane: PropTypes.string,
};

RasterOverlay.defaultProps = {
  baseUrl: "/",
  continuous: false,
  overlayOpacity: 0.8,
  pane: "overlayPane",
};

// Compatibilidad: exportar RasterOverlay también como GeoRasterLeaflet
export const GeoRasterLeaflet = RasterOverlay;
