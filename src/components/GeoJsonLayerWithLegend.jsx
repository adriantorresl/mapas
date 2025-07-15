import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Componente leyenda react-leaflet
const Legend = ({ colorMap, nombreCapa }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.style.background = "white";
      div.style.padding = "10px";
      div.style.borderRadius = "6px";
      div.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
      div.style.textAlign = "left";
      div.innerHTML = `<strong>${nombreCapa}</strong><br/>`;
      for (const key in colorMap) {
        div.innerHTML +=
          `<i style="background:${colorMap[key]}; width:14px; height:14px; display:inline-block; margin-right:6px;"></i>` +
          key +
          "<br/>";
      }
      return div;
    };

    legend.addTo(map);

    // Limpieza al desmontar
    return () => {
      legend.remove();
    };
  }, [map, colorMap, nombreCapa]);

  return null; // Este componente no renderiza nada por React
};

const GeoJsonLayerWithLegend = ({
  nombreCapa,
  atributoValor,
  coloresPorValor,
  nombreArchivo,
}) => {
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
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

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
