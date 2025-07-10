import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-side-by-side";
import { useMap } from "react-leaflet";

const GeoLayerCompare = ({ layers, categoryColumn }) => {
  const [geojsonLayers, setGeojsonLayers] = useState([]);
  const [selectedLayers, setSelectedLayers] = useState([]);

  useEffect(() => {
    const fetchLayers = async () => {
      const fetched = await Promise.all(
        layers.map(async (url, index) => {
          const res = await fetch(url);
          const data = await res.json();
          const layer = L.geoJSON(data, {
            style: (feature) => ({
              color: getColor(feature.properties[categoryColumn]),
              weight: 1,
              fillOpacity: 0.5,
            }),
          });
          return { name: `Capa ${index + 1}`, layer };
        })
      );
      setGeojsonLayers(fetched);
    };

    fetchLayers();
  }, [layers, categoryColumn]);

  const getColor = (value) => {
    const palette = ["red", "blue", "green", "orange", "purple"];
    return palette[value?.length % palette.length] || "gray";
  };

  const handleSelect = (name) => {
    setSelectedLayers((prev) => {
      const already = prev.includes(name);
      if (already) return prev.filter((n) => n !== name);
      if (prev.length < 2) return [...prev, name];
      return prev;
    });
  };

  const selected = geojsonLayers.filter((l) => selectedLayers.includes(l.name));
  const [left, right] = selected;

  return (
    <div>
      <div style={{ padding: "10px" }}>
        {geojsonLayers.map(({ name }) => (
          <label key={name} style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              value={name}
              checked={selectedLayers.includes(name)}
              onChange={() => handleSelect(name)}
              disabled={
                selectedLayers.length === 2 && !selectedLayers.includes(name)
              }
            />
            {name}
          </label>
        ))}
      </div>
      <MapContainer center={[20, -100]} zoom={6} style={{ height: "500px" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {left && right && (
          <SideBySideControl left={left.layer} right={right.layer} />
        )}
      </MapContainer>
    </div>
  );
};

const SideBySideControl = ({ left, right }) => {
  const map = useMap();

  useEffect(() => {
    left.addTo(map);
    right.addTo(map);
    const control = L.control.sideBySide(left, right).addTo(map);

    return () => {
      control.remove();
      map.removeLayer(left);
      map.removeLayer(right);
    };
  }, [left, right, map]);

  return null;
};

export default GeoLayerCompare;
