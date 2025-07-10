import React, { useEffect, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import * as d3 from "d3-geo";

function ExtrudedContour({ features, scale = 1, geojson }) {
  // Fit projection to GeoJSON bounds
  const projection = useMemo(() => {
    const width = 800;
    const height = 800;
    const projection = d3.geoMercator().fitSize([width, height], geojson);
    return projection;
  }, [geojson]);

  const shapes = useMemo(() => {
    const shapeList = [];

    features.forEach((feature, idx) => {
      const elevation = feature.properties.ELEV || 0;
      const coords = feature.geometry.coordinates;
      const type = feature.geometry.type;

      const lines =
        type === "LineString"
          ? [coords]
          : type === "MultiLineString"
          ? coords
          : [];

      lines.forEach((line, i) => {
        const shape = new THREE.Shape();

        line.forEach(([lng, lat], j) => {
          const [x, y] = projection([lng, lat]);
          if (j === 0) shape.moveTo(x, -y);
          else shape.lineTo(x, -y);
        });

        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: elevation * scale,
          bevelEnabled: false,
        });

        // Centrado vertical
        geometry.translate(0, 0, -elevation * scale * 0.5);

        shapeList.push(
          <mesh
            key={`${idx}-${i}`}
            geometry={geometry}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#C19A6B" roughness={1} metalness={0} />
          </mesh>
        );
      });
    });

    return shapeList;
  }, [features, projection, scale]);

  return <group>{shapes}</group>;
}

export default function Contour3DViewer({ geojson, scale = 0.5 }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!geojson) return;

    fetch(geojson)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Error cargando GeoJSON:", err));
  }, [geojson]);

  if (!data) return <p>Cargando curvas de nivel...</p>;
  if (!data.features) return <p>GeoJSON inválido.</p>;

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 1000], fov: 60 }}
      style={{ background: "#fdf6e3", width: "100vw", height: "100vh" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[300, 300, 300]} intensity={1} castShadow />
      <OrbitControls />
      <ExtrudedContour features={data.features} geojson={data} scale={scale} />
    </Canvas>
  );
}
