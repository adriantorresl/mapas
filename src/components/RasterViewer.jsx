import React, {
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as GeoTIFF from "geotiff";
import PropTypes from "prop-types";

const parseColorMap = (str) => {
  if (!str) return {};
  const map = {};
  str.split(",").forEach((pair) => {
    const [val, color] = pair.split(":");
    if (val && color) {
      map[parseInt(val)] = color.startsWith("#") ? color : `#${color}`;
    }
  });
  return map;
};

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

// Componente auxiliar que monta el raster una vez cargado el mapa
const RasterOverlay = ({
  fileName,
  colorMap,
  baseUrl,
  parsedColorMap,
  onLoaded,
}) => {
  const map = useMap();
  const overlayRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadRaster = async () => {
      try {
        const fullUrl = `${baseUrl.replace(/\/$/, "")}/${fileName.replace(
          /^\//,
          ""
        )}`;
        const tiff = await GeoTIFF.fromUrl(fullUrl);
        const image = await tiff.getImage();
        const rasters = await image.readRasters();
        const data = rasters[0];

        const width = image.getWidth();
        const height = image.getHeight();
        const bounds = image.getBoundingBox();

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        const imgData = ctx.createImageData(width, height);

        for (let i = 0; i < data.length; i++) {
          const value = Math.round(data[i]);
          const color = parsedColorMap[value] || "#00000000";
          const [r, g, b, a = 255] = hexToRgba(color);
          imgData.data[i * 4] = r;
          imgData.data[i * 4 + 1] = g;
          imgData.data[i * 4 + 2] = b;
          imgData.data[i * 4 + 3] = a;
        }

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
        onLoaded(null); // clear error
      } catch (err) {
        console.error("❌ Error cargando raster:", err);
        onLoaded(err.message || "Error al cargar el raster");
      }
    };

    if (isMounted) {
      loadRaster();
    }

    return () => {
      if (overlayRef.current && map.hasLayer(overlayRef.current)) {
        map.removeLayer(overlayRef.current);
      }
    };
  }, [fileName, colorMap, baseUrl, parsedColorMap, map, onLoaded]);

  return null;
};

const RasterViewer = ({
  fileName,
  colorMap,
  legendItems = [],
  baseUrl = "/",
}) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const parsedColorMap = useMemo(() => parseColorMap(colorMap), [colorMap]);

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
        whenReady={() => setLoading(false)}
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
          parsedColorMap={parsedColorMap}
          onLoaded={(err) => {
            setLoading(false);
            setError(err);
          }}
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
};

RasterViewer.defaultProps = {
  baseUrl: "/",
  legendItems: [],
};

export default RasterViewer;
