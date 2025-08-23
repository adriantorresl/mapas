import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const SimpleGeoMapViewer = ({
  layers = [],
  studyAreaLayers = [],
  showMiniMap = false,
}) => {
  // ID único para cada instancia
  const mapId = useMemo(
    () =>
      `simple-geo-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const [geoJsonData, setGeoJsonData] = useState({});
  const [visibleLayers, setVisibleLayers] = useState({});

  // Cargar datos GeoJSON
  useEffect(() => {
    const loadData = async () => {
      const allLayers = [...layers, ...studyAreaLayers];
      const dataPromises = allLayers.map(async (layer) => {
        try {
          if (layer.url && layer.url.endsWith(".geojson")) {
            const response = await fetch(layer.url);
            if (response.ok) {
              const data = await response.json();
              return { name: layer.name || layer.url, data, url: layer.url };
            }
          }
        } catch (error) {
          console.warn(`Error cargando ${layer.url}:`, error);
        }
        return null;
      });

      const results = await Promise.all(dataPromises);
      const newData = {};
      const newVisibility = {};

      results.forEach((result) => {
        if (result) {
          newData[result.name] = result.data;
          newVisibility[result.name] = true;
        }
      });

      setGeoJsonData(newData);
      setVisibleLayers(newVisibility);
    };

    loadData();
  }, [layers, studyAreaLayers]);

  // Función para obtener estilo de capa
  const getLayerStyle = (layerName) => {
    // Estilos básicos por tipo de capa
    if (layerName.toLowerCase().includes("cuenca")) {
      return {
        fillColor: "#3388ff",
        weight: 2,
        opacity: 0.8,
        color: "#0066cc",
        fillOpacity: 0.3,
      };
    }

    if (layerName.toLowerCase().includes("escurrimiento")) {
      return {
        color: "#0066ff",
        weight: 3,
        opacity: 0.8,
      };
    }

    if (
      layerName.toLowerCase().includes("área") ||
      layerName.toLowerCase().includes("area")
    ) {
      return {
        fillColor: "#ff7800",
        weight: 3,
        opacity: 1,
        color: "#ff7800",
        fillOpacity: 0.1,
      };
    }

    if (layerName.toLowerCase().includes("paisaje")) {
      return {
        fillColor: "#22c55e",
        weight: 2,
        opacity: 0.8,
        color: "#16a34a",
        fillOpacity: 0.4,
      };
    }

    // Estilo por defecto
    return {
      fillColor: "#3388ff",
      weight: 2,
      opacity: 0.8,
      color: "#1976d2",
      fillOpacity: 0.3,
    };
  };

  // Función para manejar eventos de capa
  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      // Crear tooltip con propiedades
      const tooltipContent = Object.entries(feature.properties)
        .slice(0, 5) // Mostrar solo las primeras 5 propiedades
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join("<br>");

      layer.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
        offset: [0, -10],
      });
    }
  };

  // Función para alternar visibilidad de capa
  const toggleLayerVisibility = (layerName) => {
    setVisibleLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  return (
    <div className="relative w-full h-screen" key={mapId}>
      <MapContainer
        key={mapId}
        center={[17.0732, -96.7266]} // Centro de Oaxaca
        zoom={8}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Capa base */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Capas de datos */}
        {Object.entries(geoJsonData).map(
          ([layerName, data]) =>
            visibleLayers[layerName] && (
              <GeoJSON
                key={`${mapId}-${layerName}`}
                data={data}
                style={() => getLayerStyle(layerName)}
                onEachFeature={onEachFeature}
              />
            )
        )}
      </MapContainer>

      {/* Panel de control de capas */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-1000">
        <h3 className="text-lg font-semibold mb-3">Capas</h3>

        {Object.keys(geoJsonData).map((layerName) => (
          <div key={layerName} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`layer-${layerName}`}
              checked={visibleLayers[layerName] || false}
              onChange={() => toggleLayerVisibility(layerName)}
              className="mr-2"
            />
            <label
              htmlFor={`layer-${layerName}`}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {layerName}
            </label>
          </div>
        ))}

        {Object.keys(geoJsonData).length === 0 && (
          <div className="text-sm text-gray-500">Cargando capas...</div>
        )}
      </div>

      {/* Información de coordenadas */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded shadow-sm text-xs z-1000">
        <strong>Topografía:</strong> Cuencas, Escurrimientos y Relieve
      </div>
    </div>
  );
};

export default SimpleGeoMapViewer;
