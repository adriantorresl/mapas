import React, { useState } from "react";
import { Eye, EyeOff, Download, Map, Layers } from "lucide-react";

const LayerControl = () => {
  // Capas base obligatorias
  const BASE_LAYERS = [
    {
      id: "area",
      name: "Área",
      visible: true,
      opacity: 1,
      downloadUrl: "/AREA.geojson",
      color: "#000000",
      mandatory: true,
    },
    {
      id: "paisajes",
      name: "Paisajes",
      visible: true,
      opacity: 1,
      downloadUrl: "/PAISAJES.geojson",
      color: "#000000",
      mandatory: true,
    },
    {
      id: "municipios",
      name: "Municipios",
      visible: true,
      opacity: 1,
      downloadUrl: "/MUNICIPIOS.geojson",
      color: "#FFFFFF",
      mandatory: true,
    },
  ];

  // Capas adicionales (puedes personalizar estas)
  const [extraLayers, setExtraLayers] = useState([
    {
      id: "roads",
      name: "Carreteras",
      visible: false,
      opacity: 0.6,
      downloadUrl: "/data/carreteras.geojson",
      color: "#EF4444",
    },
    {
      id: "protected_areas",
      name: "Áreas Protegidas",
      visible: true,
      opacity: 0.7,
      downloadUrl: "/data/areas-protegidas.geojson",
      color: "#10B981",
    },
    {
      id: "water_bodies",
      name: "Cuerpos de Agua",
      visible: false,
      opacity: 0.9,
      downloadUrl: "/data/cuerpos-agua.geojson",
      color: "#06B6D4",
    },
  ]);

  // Todas las capas (base + extra)
  const layers = [...BASE_LAYERS, ...extraLayers];

  // Función para toggle de visibilidad
  const toggleLayerVisibility = (layerId) => {
    // Solo permite cambiar visibilidad de capas extra
    setExtraLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  // Función para cambiar opacidad
  const changeOpacity = (layerId, newOpacity) => {
    // Permite cambiar opacidad de cualquier capa
    if (BASE_LAYERS.some((layer) => layer.id === layerId)) {
      // No permite cambiar opacidad de base (si quieres permitir, usa useState)
      return;
    }
    setExtraLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === layerId ? { ...layer, opacity: newOpacity } : layer
      )
    );
  };

  // Función para descargar archivo
  const downloadLayer = (layer) => {
    // Simulación de descarga - en un caso real conectarías con tu API
    const link = document.createElement("a");
    link.href = layer.downloadUrl;
    link.download = `${layer.name.toLowerCase().replace(/\s+/g, "_")}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Mostrar mensaje de descarga
    alert(`Descargando: ${layer.name}`);
  };

  return (
    <div className="w-80 bg-white shadow-lg rounded-lg border border-gray-200 p-4">
      {/* Header del control */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
        <Layers className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Control de Capas</h3>
      </div>

      {/* Lista de capas */}
      <div className="space-y-4">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="bg-gray-50 rounded-lg p-3 border border-gray-100"
          >
            {/* Fila superior: nombre, toggle y descarga */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border-2"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="font-medium text-gray-700 text-sm">
                  {layer.name}
                  {layer.mandatory && (
                    <span className="ml-1 text-[10px] text-blue-500 font-bold">
                      (obligatoria)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Botón toggle visibilidad solo si no es obligatoria */}
                {!layer.mandatory && (
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className={`p-1.5 rounded transition-colors ${
                      layer.visible
                        ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                        : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                    }`}
                    title={layer.visible ? "Ocultar capa" : "Mostrar capa"}
                  >
                    {layer.visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Botón descarga */}
                <button
                  onClick={() => downloadLayer(layer)}
                  className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded transition-colors"
                  title="Descargar capa"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Control de opacidad solo si no es obligatoria y está visible */}
            {!layer.mandatory && layer.visible && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-600">Opacidad</label>
                  <span className="text-xs text-gray-500 font-mono">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) =>
                    changeOpacity(layer.id, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, ${
                      layer.color
                    }40 0%, ${layer.color}40 ${layer.opacity * 100}%, #e5e7eb ${
                      layer.opacity * 100
                    }%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer con estadísticas */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Map className="w-3 h-3" />
            {layers.filter((l) => l.visible).length} de {layers.length} capas
            visibles
          </span>
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Configurar
          </button>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default LayerControl;
