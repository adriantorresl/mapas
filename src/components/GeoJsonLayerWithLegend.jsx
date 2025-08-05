import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMapLayers } from "../hooks/useMapLayers";

const layersConfig = [
  { key: "areaBorders", url: "AREA.geojson" },
  { key: "paisajeBorders", url: "PAISAJES.geojson" },
  { key: "municipiosBorders", url: "MARGINACION.geojson" }, // o MUNICIPIOS.geojson si lo tienes
];

const Legend = ({ colorMap, nombreCapa }) => (
  <div
    style={{
      position: "absolute",
      bottom: 30,
      right: 30,
      background: "white",
      padding: 12,
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      zIndex: 999,
      minWidth: 120,
      fontSize: 14,
    }}
  >
    <strong>{nombreCapa}</strong>
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {Object.entries(colorMap).map(([key, color]) => (
        <li
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 18,
              height: 18,
              background: color,
              marginRight: 8,
              border: "1px solid #ccc",
              borderRadius: 3,
            }}
          />
          <span>{key}</span>
        </li>
      ))}
    </ul>
  </div>
);

const GeoJsonLayerWithLegend = ({
  nombreCapa,
  atributoValor,
  coloresPorValor,
  nombreArchivo,
}) => {
  // ⬇️ Mueve aquí el hook
  const { areaBorders, paisajeBorders, municipiosBorders } =
    useMapLayers(layersConfig);

  const [geojsonData, setGeojsonData] = useState(null);
  const colorMap = JSON.parse(coloresPorValor);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/${nombreArchivo}`)
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error("Error cargando GeoJSON:", err));
  }, [nombreArchivo]);

  // Nuevo componente para centrar mapa al cargar la capa
  const FitBounds = ({ data }) => {
    const map = useMap();

    useEffect(() => {
      if (!data) return;
      const geojsonLayer = L.geoJSON(data);
      map.fitBounds(geojsonLayer.getBounds(), {
        maxZoom: 12,
        padding: [20, 20],
      });
    }, [map, data]);

    return null;
  };

  const getColor = (valor) => colorMap[valor] || "#cccccc";

  const style = (feature) => {
    const valor = feature.properties[atributoValor];
    return {
      fillColor: getColor(valor),
      weight: 1,
      color: "#333",
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature, layer) => {
    const valor = feature.properties[atributoValor];
    layer.bindPopup(
      `<strong>${nombreCapa}</strong><br/>${atributoValor}: ${valor}`
    );
  };

  return (
    <MapContainer
      center={[23.6345, -102.5528]} // Centro temporal
      zoom={5} // Zoom temporal
      style={{ height: "100vh", width: "100%" }}
      scrollWheelZoom={false}
    >
      <LayersControl position="topleft">
        <LayersControl.BaseLayer checked name="OpenTopoMap">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='Map data: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
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

        {areaBorders && (
          <LayersControl.Overlay checked name="Área de Estudio">
            <GeoJSON
              data={areaBorders}
              style={() => ({
                color: "black",
                weight: 4,
                fillOpacity: 0,
              })}
            />
          </LayersControl.Overlay>
        )}

        {paisajeBorders && (
          <LayersControl.Overlay checked name="Paisajes">
            <GeoJSON
              data={paisajeBorders}
              style={() => ({
                color: "black",
                weight: 3,
                fillOpacity: 0,
              })}
            />
          </LayersControl.Overlay>
        )}

        {municipiosBorders && (
          <LayersControl.Overlay checked name="Municipios">
            <GeoJSON
              data={municipiosBorders}
              style={() => ({
                color: "white",
                weight: 2,
                fillOpacity: 0,
              })}
            />
          </LayersControl.Overlay>
        )}
      </LayersControl>

      {geojsonData && (
        <>
          <GeoJSON
            data={geojsonData}
            style={style}
            onEachFeature={onEachFeature}
          />
          <FitBounds data={geojsonData} />
          <Legend colorMap={colorMap} nombreCapa={nombreCapa} />
        </>
      )}
    </MapContainer>
  );
};

export default GeoJsonLayerWithLegend;
