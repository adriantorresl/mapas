import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, LayersControl, GeoJSON } from "react-leaflet";
import RetractableMapControls from "./RetractableMapControls";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { RasterOverlay, GeoRasterLeaflet } from "./RasterViewer";
import chroma from "chroma-js";

const VECTOR_FILES = [
  { key: "area", url: "/AREA.geojson", label: "Área de Estudio" },
  { key: "municipios", url: "/MUNICIPIOS.geojson", label: "Municipios" },
  { key: "paisajes", url: "/PAISAJES.geojson", label: "Paisajes" },
  { key: "cuencas", url: "/CUENCAS.geojson", label: "Cuencas" },
  {
    key: "escurrimientos",
    url: "/ESCURRIMIENTOS.geojson",
    label: "Escurrimientos",
  },
];

const DEFAULT_PALETTES = {
  Viridis: ["#440154", "#3b528b", "#21918c", "#5ec962", "#fde725"],
  Inferno: ["#000004", "#420a68", "#932667", "#dd513a", "#fca50a"],
  Plasma: ["#0d0887", "#6a00a8", "#b12a90", "#e16462", "#fca636"],
  Magma: ["#000004", "#3b0f70", "#8c2981", "#de4968", "#fe9f6d"],
  YlOrRd: ["#ffffb2", "#fecc5c", "#fd8d3c", "#f03b20", "#bd0026"],
};

const Topografia = ({
  baseUrl = "/",
  rasterFile = "PENDIENTE.tif",
  vectorFilesOverride = null,
  initialOpacities = {},
  initialRasterPalette = "Viridis",
}) => {
  const [vectors, setVectors] = useState({});
  const [opacities, setOpacities] = useState(initialOpacities || {});

  const [rasterPaletteName, setRasterPaletteName] = useState(
    initialRasterPalette || "Viridis"
  );
  const [rasterOpacity, setRasterOpacity] = useState(0.85);
  const [rasterLegend, setRasterLegend] = useState([]);

  // cargar vectores
  useEffect(() => {
    const files = Array.isArray(vectorFilesOverride)
      ? vectorFilesOverride
      : VECTOR_FILES;
    files.forEach((f) => {
      fetch(f.url)
        .then((r) => r.json())
        .then((data) => {
          console.log(
            `[Topografia] cargada ${f.key}: features=`,
            data.features?.length || 0
          );
          setVectors((prev) => ({ ...prev, [f.key]: data }));
          setOpacities((prev) => ({ ...prev, [f.key]: prev[f.key] ?? 1 }));
        })
        .catch((e) => {
          console.error("Error cargando:", f.url, e);
        });
    });
  }, [vectorFilesOverride]);

  // construir legend para raster (continuous) usando chroma
  useEffect(() => {
    const colors =
      DEFAULT_PALETTES[rasterPaletteName] || Object.values(DEFAULT_PALETTES)[0];
    // crear 5 stops de ejemplo
    const stops = 5;
    const scale = chroma.scale(colors).mode("lab").colors(stops);
    const items = scale.map((c, i) => ({ label: `v${i + 1}`, color: c }));
    setRasterLegend(items);
  }, [rasterPaletteName]);

  // La opacidad del raster se pasa como prop a RasterViewer (overlayOpacity)

  const downloadLayer = async (key) => {
    try {
      if (key === "raster") {
        // descargar el archivo tif desde public
        const url = `${baseUrl.replace(/\/$/, "")}/${rasterFile}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error("No se pudo descargar raster");
        const blob = await resp.blob();
        const u = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = u;
        a.download = rasterFile;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(u);
        return;
      }
      const data = vectors[key];
      if (!data) {
        alert("Capa no disponible aún");
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/geo+json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key}.geojson`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error descargando capa");
    }
  };

  const rasterColors = useMemo(
    () => DEFAULT_PALETTES[rasterPaletteName] || DEFAULT_PALETTES.Viridis,
    [rasterPaletteName]
  );

  // Estilos específicos por capa
  const getStyleForLayer = (key) => {
    const baseOpacity = opacities[key] ?? 1;
    switch (key) {
      case "area":
        return {
          color: "#000000",
          weight: 5,
          fillOpacity: 0,
          opacity: baseOpacity,
        };
      case "paisajes":
        return {
          color: "#000000",
          weight: 4,
          fillOpacity: 0,
          opacity: baseOpacity,
        };
      case "municipios":
        return {
          color: "#ffffff",
          weight: 2,
          fillOpacity: 0,
          opacity: baseOpacity,
        };
      case "cuencas":
        return {
          color: "#000000",
          weight: 2,
          fillOpacity: 0,
          opacity: baseOpacity,
        };
      case "escurrimientos":
        return {
          color: "#0000ff",
          weight: 3,
          fillOpacity: 0,
          opacity: baseOpacity,
        };
      default:
        return {
          color: "#444",
          weight: 1,
          fillOpacity: 0,
          opacity: baseOpacity,
        };
    }
  };

  // small component to add scale and mouse position controls
  function MapExtras() {
    const map = useMap();
    useEffect(() => {
      const scale = L.control.scale({
        position: "bottomright",
        metric: true,
        imperial: false,
      });
      scale.addTo(map);
      // simple coordinate control (no external plugin)
      const coordControl = L.control({ position: "bottomleft" });
      let moveHandler = null;
      coordControl.onAdd = function () {
        const el = L.DomUtil.create("div", "map-coords");
        el.style.background = "rgba(255,255,255,0.9)";
        el.style.padding = "6px 10px";
        el.style.borderRadius = "6px";
        el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
        el.style.fontSize = "13px";
        el.innerHTML = "Lon: -- | Lat: --";
        moveHandler = function (e) {
          el.innerHTML = `Lon: ${e.latlng.lng.toFixed(
            5
          )} | Lat: ${e.latlng.lat.toFixed(5)}`;
        };
        map.on("mousemove", moveHandler);
        return el;
      };
      coordControl.addTo(map);
      return () => {
        scale.remove();
        if (moveHandler) map.off("mousemove", moveHandler);
        try {
          coordControl.remove();
        } catch (e) {}
      };
    }, [map]);
    return null;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "80vh" }}>
      <MapContainer
        center={[23.5, -102.5]}
        zoom={6}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <RetractableMapControls
          panelTitle="Herramientas"
          position={{ bottom: 40, left: 14 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Topografía</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                Opacidad raster
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={rasterOpacity}
                onChange={(e) => setRasterOpacity(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                Opacidad capas vector
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexDirection: "column",
                  marginTop: 6,
                }}
              >
                {(vectorFilesOverride || VECTOR_FILES).map((vf) => (
                  <label key={vf.key} style={{ fontSize: 13 }}>
                    {vf.label}
                    <input
                      style={{ marginLeft: 8 }}
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={opacities[vf.key] ?? 1}
                      onChange={(e) =>
                        setOpacities((prev) => ({
                          ...prev,
                          [vf.key]: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => downloadLayer("raster")}
                style={{ padding: "6px 8px" }}
              >
                ⬇️ Raster
              </button>
              <button
                onClick={() => {
                  const k = prompt(
                    "Nombre de la capa a descargar (ej: area, municipios):"
                  );
                  if (k) downloadLayer(k);
                }}
                style={{ padding: "6px 8px" }}
              >
                ⬇️ Vector
              </button>
            </div>
          </div>
        </RetractableMapControls>

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        <MapExtras />

        <LayersControl position="topleft">
          {(vectorFilesOverride || VECTOR_FILES).map((vf) => (
            <LayersControl.Overlay key={vf.key} name={vf.label} checked>
              {vectors[vf.key] ? (
                <GeoJSON
                  data={vectors[vf.key]}
                  style={() => getStyleForLayer(vf.key)}
                  onEachFeature={(feature, layer) => {
                    const name =
                      feature.properties?.NOMGEO ||
                      feature.properties?.name ||
                      feature.properties?.NAME ||
                      vf.label;
                    layer.bindTooltip(String(name));
                  }}
                />
              ) : null}
            </LayersControl.Overlay>
          ))}

          <LayersControl.Overlay checked name="Pendiente (raster)">
            <RasterOverlay
              fileName={rasterFile}
              colorMap={rasterColors}
              baseUrl={baseUrl}
              continuous={true}
              setError={() => {}}
              setLoading={() => {}}
              onPixelValue={() => {}}
              overlayOpacity={rasterOpacity}
            />
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default Topografia;
