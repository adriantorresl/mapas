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
import "../leaflet-tooltip-fix.css";
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
      top: 30,
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

  // Crear un mapa de identificadores a nombres de municipio si existen municipiosBorders
  const municipioNameLookup = React.useMemo(() => {
    if (!municipiosBorders || !municipiosBorders.features) return {};
    // Usar Cve_Mun o id o cualquier campo único, aquí se asume que hay un campo 'CVEGEO' o 'id'
    const lookup = {};
    municipiosBorders.features.forEach((feat) => {
      // Intenta usar CVEGEO, id, o NOMGEO como clave
      const key =
        feat.properties.CVEGEO || feat.properties.id || feat.properties.NOMGEO;
      lookup[key] = feat.properties.NOMGEO;
    });
    return lookup;
  }, [municipiosBorders]);

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
      fillOpacity: 0.7, // Aumenta la opacidad para facilitar el hover
    };
  };

  const onEachFeature = (feature, layer) => {
    const valor = feature.properties[atributoValor];
    // Buscar nombre del municipio usando CVEGEO, id, o NOMGEO
    let municipio = "Municipio";
    // Intenta buscar por CVEGEO, id, o NOMGEO
    const key =
      feature.properties.CVEGEO ||
      feature.properties.id ||
      feature.properties.NOMGEO;
    if (municipioNameLookup[key]) {
      municipio = municipioNameLookup[key];
    } else if (feature.properties.NOMGEO) {
      municipio = feature.properties.NOMGEO;
    }
    layer.bindTooltip(`<strong>${municipio}</strong>`, {
      permanent: false,
      direction: "top",
      sticky: true,
      className: "heatmap-tooltip",
    });
    layer.bindPopup(
      `<strong>${nombreCapa}</strong><br/>${atributoValor}: ${valor}`
    );
  };

  // --- Control de escala y coordenadas ---
  function MapExtraControls() {
    const map = useMap();
    useEffect(() => {
      // Control de escala
      const scale = L.control.scale({
        position: "bottomright",
        metric: true,
        imperial: false,
      });
      scale.addTo(map);

      // Control de posición del mouse
      if (L.control.mousePosition) {
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
      } else {
        return () => {
          scale.remove();
        };
      }
    }, [map]);
    return null;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div
        className="geojson-controls"
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1200,
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => {
            // Descargar el geojson principal
            const blob = new Blob([JSON.stringify(geojsonData)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = nombreArchivo || "datos.geojson";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          style={{
            background: "#388e3c",
            color: "#fff",
            borderRadius: 6,
            padding: "6px 12px",
            border: "none",
            cursor: "pointer",
          }}
          title="Descargar archivo GeoJSON"
        >
          ⬇️ Descargar GeoJSON
        </button>
        <button
          onClick={() => {
            window.print();
          }}
          style={{
            background: "#1976d2",
            color: "#fff",
            borderRadius: 6,
            padding: "6px 12px",
            border: "none",
            cursor: "pointer",
          }}
          title="Exportar mapa como imagen"
        >
          📷 Exportar mapa
        </button>
      </div>
      <MapContainer
        center={[23.6345, -102.5528]}
        zoom={5}
        style={{ height: "100vh", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
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

          {areaBorders && (
            <LayersControl.Overlay checked name="Área de Estudio">
              <GeoJSON
                data={areaBorders}
                style={() => ({
                  color: "black",
                  weight: 4,
                  fillOpacity: 0,
                })}
                interactive={false}
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
                interactive={false}
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
                interactive={false}
              />
            </LayersControl.Overlay>
          )}

          {geojsonData && (
            <LayersControl.Overlay
              checked
              name={nombreCapa || "Capa principal"}
            >
              <GeoJSON
                data={geojsonData}
                style={style}
                onEachFeature={onEachFeature}
              />
            </LayersControl.Overlay>
          )}
        </LayersControl>
        {geojsonData && (
          <>
            <FitBounds data={geojsonData} />
            <Legend colorMap={colorMap} nombreCapa={nombreCapa} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default GeoJsonLayerWithLegend;
