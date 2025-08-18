import React, { useEffect, useRef, useState } from "react";
import RetractableMapControls from "./RetractableMapControls";
import { MapContainer, TileLayer, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

// Fallback estático (si no se pudieron calcular stats)
const fallbackColorRamp = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "rgba(0,0,0,0)";
  if (value <= 10) return "#aaaaaa";
  if (value <= 21) return "#ffff00";
  if (value <= 53) return "#00cc00";
  return "#006400"; // incluye >75
};

const RasterComparison = ({ species }) => {
  const map = useMap();
  const sideBySideRef = useRef(null);
  const layersRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRasters = async () => {
      setLoading(true);
      setError(null);
      layersRef.current.forEach((layer) => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      });

      const [buffer1, buffer2] = await Promise.all([
        fetch(`/${species}_4326.tif`).then((res) => {
          if (!res.ok) throw new Error("No se pudo cargar raster base");
          return res.arrayBuffer();
        }),
        fetch(`/${species}_CC_4326.tif`).then((res) => {
          if (!res.ok) throw new Error("No se pudo cargar raster CC");
          return res.arrayBuffer();
        }),
      ]);

      let r1, r2;
      try {
        [r1, r2] = await Promise.all([
          parseGeoraster(buffer1),
          parseGeoraster(buffer2),
        ]);
      } catch (e) {
        console.error("Error parseando GeoTIFF:", e);
        setError("Error parseando GeoTIFF");
        setLoading(false);
        return;
      }

      // Obtener stats (mins/maxs) seguras
      const getBounds = (gr) => {
        const min = gr.mins ? gr.mins[0] : gr.min ?? 0;
        const max = gr.maxs ? gr.maxs[0] : gr.max ?? 0;
        // si min==max tratar de expandir un poco
        if (min === max) return [min, min + 1];
        return [min, max];
      };
      const [min1, max1] = getBounds(r1);
      const [min2, max2] = getBounds(r2);
      const globalMin = Math.min(min1, min2);
      const globalMax = Math.max(max1, max2);
      const range = globalMax - globalMin || 1;
      const t1 = globalMin + range * 0.25;
      const t2 = globalMin + range * 0.5;
      const t3 = globalMin + range * 0.75;

      const dynamicRamp = (value) => {
        if (value === null || value === undefined || isNaN(value)) return "rgba(0,0,0,0)";
        if (value === r1.noDataValue || value === r2.noDataValue) return "rgba(0,0,0,0)";
        if (value <= t1) return "#aaaaaa";
        if (value <= t2) return "#ffff00";
        if (value <= t3) return "#00cc00";
        return "#006400";
      };

      console.log("Stats raster", { globalMin, globalMax, thresholds: [t1, t2, t3] });

      // Crear pane para asegurar visibilidad
      if (!map.getPane("rasterPane")) {
        map.createPane("rasterPane");
        map.getPane("rasterPane").style.zIndex = 450;
      }

      const makeLayer = (gr) =>
        new GeoRasterLayer({
          georaster: gr,
          pixelValuesToColorFn: ([val]) =>
            (globalMax ? dynamicRamp(val) : fallbackColorRamp(val)),
          resolution: 256, // reducir para performance y asegurarse de mostrar
          opacity: 1,
          pane: "rasterPane",
        });

      const layer1 = makeLayer(r1);
      const layer2 = makeLayer(r2);

      layersRef.current = [layer1, layer2];

      layer1.addTo(map);
      layer2.addTo(map);

      await Promise.all([
        new Promise((res) => layer1.on("load", res)),
        new Promise((res) => layer2.on("load", res)),
      ]);

      try {
        const b = layer1.getBounds();
        if (b && b.isValid()) map.fitBounds(b);
      } catch (e) {
        console.warn("No se pudo ajustar bounds del raster", e);
      }

      if (sideBySideRef.current) sideBySideRef.current.remove();
      sideBySideRef.current = L.control.sideBySide(layer1, layer2).addTo(map);

      setTimeout(() => {
        document
          .querySelectorAll(".leaflet-sbs-range")
          .forEach((el) => (el.style.pointerEvents = "auto"));
      }, 500);

      setLoading(false);
    };

    loadRasters().catch((e) => {
      console.error("Error general cargando rasters", e);
      setError("Error cargando rasters");
      setLoading(false);
    });
  }, [map, species]);

  return (
    <>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1200,
            background: "rgba(255,255,255,0.9)",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          Cargando rasters...
        </div>
      )}
      {error && (
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 10,
            zIndex: 1200,
            background: "rgba(255,230,230,0.95)",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            color: "#b71c1c",
            maxWidth: 180,
          }}
        >
          {error}
        </div>
      )}
    </>
  );
};

const LegendItem = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div
      style={{
        width: "16px",
        height: "16px",
        backgroundColor: color,
        border: "1px solid #555",
        borderRadius: "2px",
      }}
    ></div>
    <span>{label}</span>
  </div>
);

const RasterSlideCompare = () => {
  const [selectedSpecies, setSelectedSpecies] = useState("A_Americana");

  const speciesOptions = [
    { value: "A_Americana", label: "Agave americana" },
    { value: "A_Angustifolia", label: "Agave angustifolia" },
    { value: "A_Iyoba", label: "Agave iyobaa" },
    { value: "A_Karswinskii", label: "Agave karswinskii" },
    { value: "A_Marmorata", label: "Agave marmorata" },
  ];

  return (
    <div style={{ height: "70vh", width: "auto", position: "relative" }}>
      {/* Título de comparación */}
      <div
        style={{
          position: "absolute",
          top: "10px",
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
        <div style={{ textAlign: "right" }}>Escenario actual</div>
        <div style={{ textAlign: "center" }}>•</div>
        <div style={{ textAlign: "left" }}>Escenario cambio climático</div>
      </div>

      {/* Selector y leyenda a la izquierda, centrados verticalmente */}
      <div
        style={{
          position: "absolute",
          left: 10,
          top: "75%",
          transform: "translateY(-50%)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "12px",
          backgroundColor: "#fff8e6",
          padding: "12px",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
          maxWidth: "250px",
        }}
      >
        {/* Selector estilizado */}
        <label style={{ fontWeight: "bold", fontSize: "14px", width: "100%" }}>
          Especie de agave:
          <select
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            style={{
              marginTop: "6px",
              width: "100%",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
              backgroundColor: "#f0e6d6",
            }}
          >
            {speciesOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {/* Leyenda de colores */}
        <div>
          <div style={{ marginBottom: 4, fontWeight: "bold" }}>
            Potencial productivo (ton/ha)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <LegendItem color="#aaaaaa" label="0 – 10" />
            <LegendItem color="#ffff00" label="11 – 21" />
            <LegendItem color="#00cc00" label="22 – 53" />
            <LegendItem color="#006400" label="54 – 75" />
          </div>
        </div>
      </div>

      <MapContainer
        center={[23, -102]}
        zoom={5}
        style={{ height: "auto", width: "auto" }}
        zoomControl={false}
      >
        <RetractableMapControls
          panelTitle="Herramientas"
          position={{ bottom: 140, left: 14 }}
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
        <LayersControl position="topleft">
          <LayersControl.BaseLayer name="World Topo (ESRI)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite (ESRI)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            />
          </LayersControl.BaseLayer>
          {/* Nota: las dos capas raster se gestionan mediante el control side-by-side, por lo que se agrupan en un overlay lógico */}
          <LayersControl.Overlay checked name="Rasters (Comparación)">
            {/* El componente RasterComparison añade internamente las dos capas y el control side-by-side */}
            <RasterComparison species={selectedSpecies} />
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default RasterSlideCompare;
