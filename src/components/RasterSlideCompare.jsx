import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

const getColorRamp = (value) => {
  if (value === null || value === undefined || isNaN(value) || value < 0)
    return "rgba(0,0,0,0)";
  if (value >= 0 && value <= 10) return "#aaaaaa";
  if (value >= 11 && value <= 21) return "#ffff00";
  if (value >= 22 && value <= 53) return "#00cc00";
  if (value >= 54 && value <= 75) return "#006400";
  return "rgba(0,0,0,0)";
};

const RasterComparison = ({ species }) => {
  const map = useMap();
  const sideBySideRef = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    const loadRasters = async () => {
      layersRef.current.forEach((layer) => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      });

      const [buffer1, buffer2] = await Promise.all([
        fetch(`/${species}_4326.tif`).then((res) => res.arrayBuffer()),
        fetch(`/${species}_CC_4326.tif`).then((res) => res.arrayBuffer()),
      ]);

      const [r1, r2] = await Promise.all([
        parseGeoraster(buffer1),
        parseGeoraster(buffer2),
      ]);

      const layer1 = new GeoRasterLayer({
        georaster: r1,
        pixelValuesToColorFn: ([val]) => getColorRamp(val),
        opacity: 1,
      });

      const layer2 = new GeoRasterLayer({
        georaster: r2,
        pixelValuesToColorFn: ([val]) => getColorRamp(val),
        opacity: 1,
      });

      layersRef.current = [layer1, layer2];

      layer1.addTo(map);
      layer2.addTo(map);

      await Promise.all([
        new Promise((res) => layer1.on("load", res)),
        new Promise((res) => layer2.on("load", res)),
      ]);

      map.fitBounds(layer1.getBounds());

      if (sideBySideRef.current) sideBySideRef.current.remove();
      sideBySideRef.current = L.control.sideBySide(layer1, layer2).addTo(map);

      setTimeout(() => {
        document
          .querySelectorAll(".leaflet-sbs-range")
          .forEach((el) => (el.style.pointerEvents = "auto"));
      }, 500);
    };

    loadRasters();
  }, [map, species]);

  return null;
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
    <div style={{ height: "auto", width: "auto", position: "relative" }}>
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
          zIndex: 1001,
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
        dragging={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <RasterComparison species={selectedSpecies} />
      </MapContainer>
    </div>
  );
};

export default RasterSlideCompare;
