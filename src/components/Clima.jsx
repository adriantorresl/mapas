import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  GeoJSON,
  useMap,
} from "react-leaflet";
import { createLayerComponent } from "@react-leaflet/core";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-mouse-position";
import "leaflet-mouse-position/src/L.Control.MousePosition.css";
import RetractableMapControls from "./RetractableMapControls";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import chroma from "chroma-js";

// Nota: asumo que el archivo geojson disponible es `CLIMA.geojson` (en el repo está como CLIMA.geojson).
// Si realmente existe `CLIMAS.geojson` cambie las rutas por la versión exacta.

function MapExtraControls() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({
      position: "bottomright",
      metric: true,
      imperial: false,
    });
    scale.addTo(map);

    const mousePosition = L.control.mousePosition({
      position: "bottomleft",
      separator: " | ",
      emptyString: "Mueve el cursor sobre el mapa",
      lngFirst: false,
      numDigits: 5,
      lngFormatter: (lng) => `Lon: ${lng.toFixed(5)}°`,
      latFormatter: (lat) => `Lat: ${lat.toFixed(5)}°`,
    });
    mousePosition.addTo(map);

    return () => {
      scale.remove();
      mousePosition.remove();
    };
  }, [map]);
  return null;
}

// GeoRaster integrado con LayersControl mediante createLayerComponent
const GeoRasterLeaflet = createLayerComponent(
  (props, context) => {
    const {
      url,
      opacity = 0.8,
      name,
      onAdd = () => {},
      onRemove = () => {},
    } = props;
    const group = L.layerGroup();

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`No se pudo cargar raster ${url}`);
        const buffer = await res.arrayBuffer();
        const georaster = await parseGeoraster(buffer);

        // calcular percentiles (muestreo)
        let p2 = null;
        let p98 = null;
        try {
          const values = georaster.values && georaster.values[0];
          let arr = [];
          if (values && values.length) {
            const total = values.length;
            const maxSample = 100000;
            const stride = Math.max(1, Math.floor(total / maxSample));
            for (let i = 0; i < total; i += stride) {
              const v = values[i];
              if (
                v === georaster.noDataValue ||
                v === null ||
                v === undefined ||
                isNaN(v)
              )
                continue;
              arr.push(v);
            }
          }
          if (arr.length) {
            arr.sort((a, b) => a - b);
            const q = (a, q) => {
              const pos = (a.length - 1) * q;
              const base = Math.floor(pos);
              const rest = pos - base;
              if (a[base + 1] !== undefined)
                return a[base] + rest * (a[base + 1] - a[base]);
              return a[base];
            };
            p2 = q(arr, 0.02);
            p98 = q(arr, 0.98);
          } else {
            p2 = georaster.min ?? 0;
            p98 = georaster.max ?? p2 + 1;
          }
        } catch (e) {
          p2 = georaster.min ?? 0;
          p98 = georaster.max ?? p2 + 1;
        }

        if (!context.map.getPane("rasterPane")) {
          context.map.createPane("rasterPane");
          context.map.getPane("rasterPane").style.zIndex = 450;
        }

        const isTemp = /TEMP|temp/i.test(name);
        const isPrec = /PREC|prec|PRECIP/i.test(name);

        const colorFn = (v) => {
          if (v === null || v === undefined || isNaN(v)) return "rgba(0,0,0,0)";
          const min = p2;
          const max = p98;
          const t = (v - min) / (max - min || 1);
          const clamped = Math.min(1, Math.max(0, t));
          if (isTemp)
            return chroma
              .scale(["#fff5f0", "#fcae91", "#fb6a4a", "#de2d26", "#99000d"])
              .mode("lch")(clamped)
              .hex();
          if (isPrec)
            return chroma
              .scale(["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"])
              .mode("lch")(clamped)
              .hex();
          return chroma
            .scale(["#ffffcc", "#ffeda0", "#feb24c", "#fc4e2a", "#b10026"])
            .mode("lch")(clamped)
            .hex();
        };

        const gr = new GeoRasterLayer({
          georaster,
          pixelValuesToColorFn: (values) => colorFn(values && values[0]),
          resolution: 128,
          opacity,
          pane: "rasterPane",
        });
        group.addLayer(gr);
        onAdd({
          name,
          min: p2,
          max: p98,
          type: isTemp ? "temp" : isPrec ? "prec" : "other",
        });

        group.on("remove", () => {
          try {
            group.clearLayers();
            onRemove(name);
          } catch (e) {}
        });
      } catch (e) {
        console.error("Error creando georaster layer", name, e);
      }
    })();

    return group;
  },
  (layer, props, prevProps) => {
    try {
      layer.eachLayer((l) => {
        if (
          l &&
          typeof l.setOpacity === "function" &&
          props.opacity !== prevProps.opacity
        ) {
          l.setOpacity(props.opacity);
        }
      });
    } catch (e) {}
  }
);

const Clima = ({ style = { height: "80vh", width: "100%" } }) => {
  const mapRef = useRef(null);
  const [climaData, setClimaData] = useState(null);
  const [areaData, setAreaData] = useState(null);
  const [climaCategories, setClimaCategories] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rasterOpacity, setRasterOpacity] = useState(0.8);
  const [legendMap, setLegendMap] = useState({}); // { name: {min,max,type} }

  useEffect(() => {
    let mounted = true;
    const fetchGeo = async () => {
      setLoading(true);
      try {
        const [cR, aR] = await Promise.all([
          fetch("/CLIMA.geojson"),
          fetch("/AREA.geojson"),
        ]);
        if (!cR.ok) throw new Error("No se pudo cargar CLIMA.geojson");
        if (!aR.ok) throw new Error("No se pudo cargar AREA.geojson");
        const cJson = await cR.json();
        const aJson = await aR.json();
        if (mounted) {
          setClimaData(cJson);
          setAreaData(aJson);

          // generar categorías y paleta dinámica basada en la propiedad CLIMA
          try {
            const cats = Array.from(
              new Set(
                cJson.features
                  .map((f) => f.properties && f.properties.CLIMA)
                  .filter((v) => v !== undefined && v !== null)
              )
            );
            if (cats.length) {
              // generar colores con chroma
              const palette = chroma
                .scale("Spectral")
                .mode("lch")
                .colors(cats.length);
              const mapping = {};
              cats.forEach((c, i) => (mapping[c] = palette[i]));
              setClimaCategories({ cats, mapping });
            }
          } catch (e) {
            console.warn("No se pudo generar paleta para CLIMA", e);
          }
        }
      } catch (e) {
        console.error("Error cargando geojsons:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchGeo();
    return () => (mounted = false);
  }, []);

  // Descarga genérica
  const downloadFile = async (path) => {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error("No se pudo descargar");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error descargando:", path, e);
      alert("Error al descargar el archivo: " + path);
    }
  };

  const exportMapAsImage = async () => {
    if (!mapRef.current) return alert("Mapa no listo");
    try {
      const html2canvas = await import("html2canvas");
      const container = mapRef.current.getContainer
        ? mapRef.current.getContainer()
        : mapRef.current._container;
      const controls = container.querySelectorAll(".leaflet-control-container");
      controls.forEach((el) => (el.style.visibility = "hidden"));
      const canvas = await html2canvas.default(container, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
      });
      controls.forEach((el) => (el.style.visibility = "visible"));
      const link = document.createElement("a");
      link.download = "mapa_climas.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      alert("Error exportando mapa");
    }
  };

  // handlers para registrar leyendas cuando RasterOverlay se monta/desmonta
  const handleRasterAdd = ({ name, min, max, type }) => {
    setLegendMap((m) => ({ ...m, [name]: { min, max, type } }));
  };
  const handleRasterRemove = (name) => {
    setLegendMap((m) => {
      const copy = { ...m };
      delete copy[name];
      return copy;
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <RetractableMapControls
        panelTitle="Herramientas"
        position={{ bottom: 40, left: 14 }}
        buttons={[
          {
            label: "Descargar CLIMA.geojson",
            icon: "⬇️",
            bg: "#fff3e0",
            onClick: () => downloadFile("/CLIMA.geojson"),
          },
          {
            label: "Descargar AREA.geojson",
            icon: "⬇️",
            bg: "#f1f8e9",
            onClick: () => downloadFile("/AREA.geojson"),
          },
          {
            label: "Descargar PREC_TOTAL_ANUAL.tif",
            icon: "⬇️",
            bg: "#e8f5e9",
            onClick: () => downloadFile("/PREC_TOTAL_ANUAL.tif"),
          },
          {
            label: "Descargar TEMP_MIN_ANUAL.tif",
            icon: "⬇️",
            bg: "#e8f5e9",
            onClick: () => downloadFile("/TEMP_MIN_ANUAL.tif"),
          },
          {
            label: "Descargar TEMP_MED_ANUAL.tif",
            icon: "⬇️",
            bg: "#e8f5e9",
            onClick: () => downloadFile("/TEMP_MED_ANUAL.tif"),
          },
          {
            label: "Descargar TEMP_MAX_ANUAL.tif",
            icon: "⬇️",
            bg: "#e8f5e9",
            onClick: () => downloadFile("/TEMP_MAX_ANUAL.tif"),
          },
          {
            label: "Exportar Mapa",
            icon: "📷",
            bg: "#e3f2fd",
            onClick: exportMapAsImage,
          },
        ]}
      />

      {/* Slider de opacidad para rasters en el panel de herramientas (Retractable) */}
      <div
        style={{ position: "absolute", bottom: 120, left: 14, zIndex: 1100 }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.95)",
            padding: 8,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
            Opacidad rasters
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={rasterOpacity}
            onChange={(e) => setRasterOpacity(parseFloat(e.target.value))}
          />
          <div style={{ fontSize: 12, marginTop: 6 }}>
            {Math.round(rasterOpacity * 100)}%
          </div>
        </div>
      </div>

      <MapContainer
        whenCreated={(m) => (mapRef.current = m)}
        center={[23.6345, -102.5528]}
        zoom={5}
        style={style}
        zoomControl={false}
      >
        <MapExtraControls />

        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay name="Área de Estudio">
            {areaData ? (
              <GeoJSON
                data={areaData}
                style={() => ({ color: "black", weight: 4, fillOpacity: 0 })}
              />
            ) : null}
          </LayersControl.Overlay>

          <LayersControl.Overlay name="CLIMA (GeoJSON)">
            {climaData ? (
              <GeoJSON
                data={climaData}
                style={(feature) => {
                  const key = feature.properties && feature.properties.CLIMA;
                  const color =
                    (climaCategories &&
                      climaCategories.mapping &&
                      climaCategories.mapping[key]) ||
                    "#2b83ba";
                  return {
                    color: color,
                    weight: 1,
                    fillColor: color,
                    fillOpacity: 0.5,
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const name =
                    feature.properties &&
                    (feature.properties.NOMGEO ||
                      feature.properties.NOMBRE ||
                      feature.properties.CLIMA);
                  const climaValue =
                    feature.properties && feature.properties.CLIMA;
                  layer.bindTooltip(
                    `<strong>${name}</strong><br/>CLIMA: ${climaValue}`,
                    { direction: "auto" }
                  );
                }}
              />
            ) : null}
          </LayersControl.Overlay>

          {/* Rasters: ahora cada overlay contiene RasterOverlay, de modo que LayersControl los enciende/apaga */}
          <LayersControl.Overlay name="PREC_TOTAL_ANUAL">
            <GeoRasterLeaflet
              url="/PREC_TOTAL_ANUAL.tif"
              name="PREC_TOTAL_ANUAL"
              opacity={rasterOpacity}
              onAdd={handleRasterAdd}
              onRemove={handleRasterRemove}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="TEMP_MIN_ANUAL">
            <GeoRasterLeaflet
              url="/TEMP_MIN_ANUAL.tif"
              name="TEMP_MIN_ANUAL"
              opacity={rasterOpacity}
              onAdd={handleRasterAdd}
              onRemove={handleRasterRemove}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="TEMP_MED_ANUAL">
            <GeoRasterLeaflet
              url="/TEMP_MED_ANUAL.tif"
              name="TEMP_MED_ANUAL"
              opacity={rasterOpacity}
              onAdd={handleRasterAdd}
              onRemove={handleRasterRemove}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay name="TEMP_MAX_ANUAL">
            <GeoRasterLeaflet
              url="/TEMP_MAX_ANUAL.tif"
              name="TEMP_MAX_ANUAL"
              opacity={rasterOpacity}
              onAdd={handleRasterAdd}
              onRemove={handleRasterRemove}
            />
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>

      {loading && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1200,
            background: "rgba(255,255,255,0.9)",
            padding: 8,
            borderRadius: 6,
          }}
        >
          Cargando capas...
        </div>
      )}

      {/* Leyenda de CLIMA */}
      {climaCategories && climaCategories.cats && (
        <div
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            padding: "12px 18px",
            zIndex: 999,
            minWidth: 160,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>Climas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {climaCategories.cats.map((c) => (
              <div
                key={c}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 18,
                    height: 14,
                    background: climaCategories.mapping[c],
                    border: "1px solid #444",
                  }}
                />
                <div>{c}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda continua para raster activo (mostrar la primera entrada de legendMap) */}
      {Object.keys(legendMap).length > 0 &&
        (() => {
          const firstKey = Object.keys(legendMap)[0];
          const info = legendMap[firstKey];
          const isTemp = info.type === "temp";
          const barColors = isTemp
            ? ["#fff5f0", "#fcae91", "#fb6a4a", "#de2d26", "#99000d"]
            : ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"];
          return (
            <div
              style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                zIndex: 999,
                background: "rgba(255,255,255,0.95)",
                padding: 12,
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                {firstKey}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12 }}>{info.min}</span>
                <div style={{ height: 12, flex: 1, display: "flex" }}>
                  {barColors.map((c, i) => (
                    <div key={i} style={{ background: c, flex: 1 }} />
                  ))}
                </div>
                <span style={{ fontSize: 12 }}>{info.max}</span>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default Clima;
