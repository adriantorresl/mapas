import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as GeoTIFF from "geotiff";
import chroma from "chroma-js";
import PropTypes from "prop-types";

// 🔹 Convierte string de colorMap a objeto o array
const parseColorMap = (str) => {
  if (!str) return {};

  // Si contiene ":" es formato valor:color
  if (str.includes(":")) {
    const map = {};
    str.split(",").forEach((pair) => {
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
  return str.split(",").map((color) => color.trim());
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
const RasterOverlay = ({
  fileName,
  colorMap,
  baseUrl,
  setError,
  setLoading,
  continuous = false,
}) => {
  const map = useMap();
  const overlayRef = useRef(null);
  const loadedRef = useRef(false);

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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        const imgData = ctx.createImageData(width, height);

        let scale;
        if (continuous) {
          const min = Math.min(...data);
          const max = Math.max(...data);

          // Si parsedColorMap es un array (lista de colores)
          const colors = Array.isArray(parsedColorMap)
            ? parsedColorMap
            : Object.values(parsedColorMap);

          scale = chroma.scale(colors).domain([min, max]);
        }

        for (let i = 0; i < data.length; i++) {
          const value = data[i];
          let color;

          if (continuous) {
            color = scale(value).hex();
          } else {
            // Para mapas discretos
            if (Array.isArray(parsedColorMap)) {
              // Si es array, usar el índice del valor
              const index = Math.round(value);
              color = parsedColorMap[index] || "#00000000";
            } else {
              // Si es objeto, usar el valor como clave
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

        ctx.putImageData(imgData, 0, 0);
        const imageUrl = canvas.toDataURL();

        const southWest = L.latLng(bounds[1], bounds[0]);
        const northEast = L.latLng(bounds[3], bounds[2]);
        const rasterBounds = L.latLngBounds(southWest, northEast);

        if (overlayRef.current && map.hasLayer(overlayRef.current)) {
          map.removeLayer(overlayRef.current);
        }

        const overlay = L.imageOverlay(imageUrl, rasterBounds, {
          opacity: 0.8,
        });
        overlay.addTo(map);
        overlayRef.current = overlay;

        map.fitBounds(rasterBounds);

        if (isMounted && !loadedRef.current) {
          loadedRef.current = true;
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error("❌ Error cargando raster:", err);
        if (isMounted && !loadedRef.current) {
          loadedRef.current = true;
          setLoading(false);
          setError(err.message || "Error al cargar el raster");
        }
      }
    };

    setLoading(true);
    setError(null);
    loadRaster();

    return () => {
      isMounted = false;
      if (overlayRef.current && map.hasLayer(overlayRef.current)) {
        map.removeLayer(overlayRef.current);
      }
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

  return null;
};

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

  // Crear funciones estables para evitar re-renders
  const stableSetError = useCallback((err) => setError(err), []);
  const stableSetLoading = useCallback(
    (isLoading) => setLoading(isLoading),
    []
  );

  return (
    <div
      className="raster-viewer-container"
      style={{ position: "relative", width: "100%" }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          Cargando raster...
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
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
          subdomains={["a", "b", "c"]}
        />
        <RasterOverlay
          fileName={fileName}
          colorMap={colorMap}
          baseUrl={baseUrl}
          continuous={continuous}
          setError={stableSetError}
          setLoading={stableSetLoading}
        />
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
  colorMap: PropTypes.string.isRequired,
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
