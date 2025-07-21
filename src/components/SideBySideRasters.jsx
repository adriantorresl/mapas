import React, { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import * as GeoTIFF from "geotiff";
import chroma from "chroma-js";
import "leaflet/dist/leaflet.css";

// Componente interno para cargar y mostrar el raster
const RasterLayer = ({ fileName, startColor, endColor, onStatsUpdate }) => {
  const map = useMap();
  const rasterRef = useRef(null);
  const statsRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const updateStats = (stats) => {
      if (onStatsUpdate) {
        onStatsUpdate(stats);
      }
    };

    const loadRaster = async () => {
      if (loadingRef.current || !fileName || !map) return;
      loadingRef.current = true;

      try {
        // Limpiar raster anterior
        if (rasterRef.current) {
          map.removeLayer(rasterRef.current);
          rasterRef.current = null;
        }

        // Cargar archivo - intentar desde public y desde la raíz
        let response;
        let actualUrl;

        const urlsToTry = [
          `${process.env.PUBLIC_URL || ""}/${fileName}`,
          `/public/${fileName}`,
          `/${fileName}`,
          fileName,
        ];

        for (const url of urlsToTry) {
          try {
            console.log(`Intentando cargar desde: ${url}`);
            response = await fetch(url);
            if (response.ok) {
              actualUrl = url;
              break;
            }
          } catch (err) {
            console.log(`Falló cargar desde ${url}:`, err.message);
            continue;
          }
        }

        if (!response || !response.ok) {
          throw new Error(
            `No se pudo cargar el archivo desde ninguna ubicación. Último error: ${response?.status}`
          );
        }

        console.log(`Archivo cargado exitosamente desde: ${actualUrl}`);

        // Verificar que el contenido sea válido
        const arrayBuffer = await response.arrayBuffer();

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error(
            "El archivo está vacío o no se pudo leer correctamente"
          );
        }

        console.log(`Tamaño del archivo: ${arrayBuffer.byteLength} bytes`);

        // Verificar que sea un archivo TIFF válido (magic numbers)
        const view = new DataView(arrayBuffer);
        const magic1 = view.getUint16(0, true); // little endian
        const magic2 = view.getUint16(0, false); // big endian

        if (
          magic1 !== 0x4949 &&
          magic1 !== 0x4d4d &&
          magic2 !== 0x4949 &&
          magic2 !== 0x4d4d
        ) {
          throw new Error("El archivo no parece ser un TIFF válido");
        }

        // Cargar GeoTIFF
        let tiff;
        try {
          tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
        } catch (err) {
          throw new Error(`Error al parsear GeoTIFF: ${err.message}`);
        }

        let image;
        try {
          image = await tiff.getImage();
        } catch (err) {
          throw new Error(
            `Error al obtener imagen del GeoTIFF: ${err.message}`
          );
        }
        // Leer datos del raster
        let rasters;
        try {
          rasters = await image.readRasters();
        } catch (err) {
          throw new Error(`Error al leer datos del raster: ${err.message}`);
        }

        if (!rasters || rasters.length === 0) {
          throw new Error("No se encontraron datos en el raster");
        }

        const data = rasters[0];
        if (!data || data.length === 0) {
          throw new Error("Los datos del raster están vacíos");
        }

        const width = image.getWidth();
        const height = image.getHeight();

        console.log(
          `Dimensiones del raster: ${width}x${height}, total pixels: ${data.length}`
        );

        // Obtener bounds del GeoTIFF
        let bbox;
        try {
          bbox = image.getBoundingBox();
        } catch (err) {
          throw new Error(
            `Error al obtener bounds del GeoTIFF: ${err.message}`
          );
        }

        const [minX, minY, maxX, maxY] = bbox;
        console.log(
          `Bounds: minX=${minX}, minY=${minY}, maxX=${maxX}, maxY=${maxY}`
        );

        // Validar bounds
        if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) {
          throw new Error("Los bounds del GeoTIFF no son válidos");
        }

        // Filtrar datos válidos de manera más eficiente
        const validData = [];
        const invalidValues = new Set();
        let minVal = Infinity;
        let maxVal = -Infinity;

        // Procesar en chunks para evitar stack overflow
        const chunkSize = 100000; // Procesar 100k valores a la vez

        for (let start = 0; start < data.length; start += chunkSize) {
          const end = Math.min(start + chunkSize, data.length);

          for (let i = start; i < end; i++) {
            const val = data[i];

            // Verificar diferentes tipos de valores inválidos (ahora incluye ceros como válidos)
            if (
              val !== null &&
              val !== undefined &&
              !isNaN(val) &&
              isFinite(val) &&
              val !== -9999 && // NoData común
              val !== -32768 && // NoData común
              val !== 32767 && // NoData común
              val !== 0xffff && // NoData común
              val >= 0
            ) {
              // Incluir ceros y valores positivos

              validData.push(val);
              minVal = Math.min(minVal, val);
              maxVal = Math.max(maxVal, val);
            } else {
              if (invalidValues.size < 10) {
                // Limitar el tamaño del Set
                invalidValues.add(val);
              }
            }
          }

          // Dar un respiro al navegador
          if (start % (chunkSize * 10) === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        console.log(
          `Valores inválidos encontrados:`,
          Array.from(invalidValues)
        );

        if (validData.length === 0) {
          throw new Error(
            `No hay datos válidos en el raster. Valores encontrados: ${Array.from(
              invalidValues
            ).join(", ")}`
          );
        }

        const validPercent = ((validData.length / data.length) * 100).toFixed(
          1
        );
        console.log(
          `Datos válidos: ${validData.length}/${data.length} (${validPercent}%)`
        );

        // Para archivos muy grandes, usar muestreo para calcular min/max
        let min, max;

        if (data.length > 1000000) {
          // Si hay más de 1M de píxeles
          console.log(
            "Archivo grande detectado, usando muestreo para calcular estadísticas"
          );

          const sampleSize = Math.min(10000, Math.floor(data.length / 100));
          const sampleStep = Math.floor(data.length / sampleSize);
          const sampleData = [];

          for (let i = 0; i < data.length; i += sampleStep) {
            const val = data[i];
            if (
              val !== null &&
              val !== undefined &&
              !isNaN(val) &&
              isFinite(val) &&
              val !== -9999 &&
              val !== -32768 &&
              val !== 32767 &&
              val !== 0xffff &&
              val >= 0
            ) {
              // Incluir ceros y valores positivos
              sampleData.push(val);
            }
          }

          if (sampleData.length === 0) {
            throw new Error("No se encontraron datos válidos en la muestra");
          }

          min = Math.min(...sampleData);
          max = Math.max(...sampleData);

          console.log(
            `Estadísticas de muestra (${sampleData.length} valores): min=${min}, max=${max}`
          );
        } else {
          // Para archivos pequeños, usar el método anterior
          min = minVal;
          max = maxVal;
        }

        // Asegurar que el mínimo sea 0 si hay valores válidos
        if (min > 0) {
          min = 0;
          console.log(`Mínimo ajustado a 0 para la escala de colores`);
        }

        if (min === max) {
          throw new Error(`El raster tiene valores constantes (${min})`);
        }

        console.log(`Rango de valores: ${min} a ${max}`);

        // Crear escala de colores
        const scale = chroma.scale([startColor, endColor]).domain([min, max]);

        // Crear canvas con mejor manejo de errores
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("No se pudo crear el contexto del canvas");
        }

        const imageData = ctx.createImageData(width, height);
        if (!imageData) {
          throw new Error("No se pudo crear ImageData");
        }

        // Llenar imageData con colores de manera más eficiente
        for (let i = 0; i < data.length; i++) {
          const val = data[i];
          const pixelIndex = i * 4;

          // Verificar que el índice esté dentro del rango
          if (pixelIndex + 3 >= imageData.data.length) {
            console.warn(
              `Índice fuera de rango: ${pixelIndex} >= ${imageData.data.length}`
            );
            break;
          }

          if (
            val !== null &&
            val !== undefined &&
            !isNaN(val) &&
            isFinite(val) &&
            val !== -9999 &&
            val !== -32768 &&
            val !== 32767 &&
            val !== 0xffff &&
            val >= 0
          ) {
            // Incluir ceros y valores positivos

            try {
              const [r, g, b] = scale(val).rgb();
              imageData.data[pixelIndex] = Math.round(
                Math.max(0, Math.min(255, r))
              );
              imageData.data[pixelIndex + 1] = Math.round(
                Math.max(0, Math.min(255, g))
              );
              imageData.data[pixelIndex + 2] = Math.round(
                Math.max(0, Math.min(255, b))
              );
              imageData.data[pixelIndex + 3] = 255; // Alpha
            } catch (colorErr) {
              console.warn(
                `Error al colorear pixel ${i} con valor ${val}:`,
                colorErr
              );
              // Usar color por defecto en caso de error
              imageData.data[pixelIndex] = 128;
              imageData.data[pixelIndex + 1] = 128;
              imageData.data[pixelIndex + 2] = 128;
              imageData.data[pixelIndex + 3] = 255;
            }
          } else {
            // Valor inválido - transparente
            imageData.data[pixelIndex] = 0;
            imageData.data[pixelIndex + 1] = 0;
            imageData.data[pixelIndex + 2] = 0;
            imageData.data[pixelIndex + 3] = 0;
          }

          // Dar un respiro al navegador cada cierto número de píxeles
          if (i > 0 && i % 50000 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }

        try {
          ctx.putImageData(imageData, 0, 0);
        } catch (err) {
          throw new Error(`Error al dibujar en canvas: ${err.message}`);
        }

        const rasterUrl = canvas.toDataURL();
        if (!rasterUrl) {
          throw new Error("No se pudo generar la URL del raster");
        }

        // Crear bounds para Leaflet (invertir coordenadas Y)
        const imageBounds = [
          [minY, minX], // Southwest
          [maxY, maxX], // Northeast
        ];

        console.log("Image bounds:", imageBounds);

        // Crear overlay
        rasterRef.current = L.imageOverlay(rasterUrl, imageBounds, {
          opacity: 0.8,
          interactive: false,
        });

        rasterRef.current.addTo(map);

        // Ajustar vista al raster
        map.fitBounds(imageBounds, { padding: [20, 20] });

        // Actualizar estadísticas
        const stats = {
          min,
          max,
          validCount: validData.length,
          totalCount: data.length,
        };
        statsRef.current = stats;
        updateStats(stats);
      } catch (err) {
        console.error("Error cargando raster:", err);
        const errorStats = { error: err.message };
        statsRef.current = errorStats;
        updateStats(errorStats);
      } finally {
        loadingRef.current = false;
      }
    };

    loadRaster();

    return () => {
      if (rasterRef.current && map) {
        map.removeLayer(rasterRef.current);
        rasterRef.current = null;
      }
      loadingRef.current = false;
    };
  }, [fileName, startColor, endColor, map, onStatsUpdate]);

  return null;
};

// Componente para la leyenda
const Legend = ({ min, max, startColor, endColor, title }) => {
  const steps = 10;
  const scale = chroma.scale([startColor, endColor]).domain([min, max]);
  const colors = Array.from({ length: steps }, (_, i) =>
    scale(min + ((max - min) / (steps - 1)) * i).hex()
  );

  return (
    <div style={{ marginTop: 8, width: "100%" }}>
      {title && (
        <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
          {title}
        </div>
      )}
      <div style={{ display: "flex", height: 20, border: "1px solid #ccc" }}>
        {colors.map((color, i) => (
          <div key={i} style={{ backgroundColor: color, flex: 1 }} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginTop: 2,
        }}
      >
        <span>{min.toFixed(2)}</span>
        <span>{max.toFixed(2)}</span>
      </div>
    </div>
  );
};

// Componente principal con botón para cambiar capa
const SideBySideRasters = ({
  leftFileName,
  rightFileName,
  startColor = "#004a13",
  endColor = "#dc0b00",
  leftTitle = "Primavera",
  rightTitle = "Verano",
}) => {
  const [activeSide, setActiveSide] = useState("left");
  const [stats, setStats] = useState(null);

  const currentFileName = activeSide === "left" ? leftFileName : rightFileName;
  const currentTitle = activeSide === "left" ? leftTitle : rightTitle;

  const handleStatsUpdate = useCallback((newStats) => {
    setStats(newStats);
  }, []);

  return (
    <div
      style={{
        fontFamily: "Roboto, sans-serif",
        justifyContent: "left",
        alignItems: "left",
      }}
    >
      <div
        style={{
          marginBottom: 10,
          justifyContent: "left",
          display: "inline-flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => setActiveSide("left")}
          style={{
            padding: "6px 12px",
            backgroundColor: activeSide === "left" ? "#EDE0D6" : "#fff8e6",
            color: activeSide === "left" ? "#000" : "#000",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            textAlign: "center",
            boxSizing: "border-box",
            width: "auto",
          }}
        >
          {leftTitle}
        </button>
        <button
          onClick={() => setActiveSide("right")}
          style={{
            padding: "6px 12px",
            backgroundColor: activeSide === "right" ? "#EDE0D6" : "#fff8e6",
            color: activeSide === "right" ? "#000" : "#000",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            textAlign: "center",
            boxSizing: "border-box",
            width: "auto",
          }}
        >
          {rightTitle}
        </button>
      </div>

      <MapContainer
        style={{ height: "600px", width: "100%", border: "1px solid #ddd" }}
        center={[16.5, -96]}
        zoom={8}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={18}
        />
        {currentFileName && (
          <RasterLayer
            key={currentFileName} // Forzar re-mount cuando cambie el archivo
            fileName={currentFileName}
            startColor={startColor}
            endColor={endColor}
            onStatsUpdate={handleStatsUpdate}
          />
        )}
      </MapContainer>

      {stats && !stats.error && (
        <Legend
          min={stats.min}
          max={stats.max}
          startColor={startColor}
          endColor={endColor}
          title={`Abundancia de Polinizadores`}
        />
      )}

      {stats && stats.error && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            backgroundColor: "#ffebee",
            border: "1px solid #f44336",
            borderRadius: 4,
            fontSize: 12,
            color: "#d32f2f",
          }}
        >
          Error: {stats.error}
        </div>
      )}
    </div>
  );
};

export default SideBySideRasters;
