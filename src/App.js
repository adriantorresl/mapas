import React, { useState } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import MapChart from "./components/MapChart";
import Heatmap from "./components/Heatmap";
import TimeSeriesMapViewer from "./components/TimeSeriesMapViewer";
import RasterSlideCompare from "./components/RasterSlideCompare";
import "./App.css";

function StoryMapSection({ children, title, subtitle, id }) {
  const [ref, inView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  return (
    <section
      ref={ref}
      id={id}
      className="story-section"
      style={{ minHeight: "100vh", paddingTop: 40, paddingBottom: 40 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8 }}
        className="section-content"
        style={{ maxWidth: 1200, margin: "0 auto" }}
      >
        {title && <h1 style={{ marginBottom: 8 }}>{title}</h1>}
        {subtitle && (
          <h2
            style={{
              marginBottom: 24,
              fontWeight: 400,
              color: "#444",
            }}
          >
            {subtitle}
          </h2>
        )}
        {children}
      </motion.div>
    </section>
  );
}

function Header() {
  return (
    <header className="main-header">
      <div className="header-content">
        <img
          src="/logo.png" // Cambia por la ruta de tu logo
          alt="Logo Tierra de Agaves"
          className="logo"
        />
        <nav>
          <ul className="nav-list">
            <li>Tierra de agaves Monitoreo</li>
            <li className="active">Caracterización del área de estudio</li>
            <li>Degradación funcional del paisaje</li>
            <li>Cambio Climático</li>
            <li>Plan de manejo integral del paisaje</li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function CaracterizacionSeccion() {
  const [activeTab, setActiveTab] = useState("climas");
  const tabs = [
    { key: "climas", label: "Distribución Climática" },
    { key: "suelos", label: "Suelos" },
    { key: "humedad", label: "Humedad" },
    { key: "poblacion", label: "Población" },
    { key: "series-tiempo", label: "Cambios de Uso de Suelo" },
    { key: "raster-compare", label: "Potencial Productivo" },
  ];

  return (
    <StoryMapSection id="caracterizacion">
      {/* Submenú solo aquí */}
      <nav style={{ marginBottom: 24 }}>
        <ul className="tabs-submenu">
          {tabs.map((tab) => (
            <li
              key={tab.key}
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      </nav>
      {/* Renderiza el mapa/tab seleccionado */}
      {activeTab === "climas" && (
        <MapChart
          geoJsonUrl="/CLIMA.geojson"
          categoriaCol="CLIMA"
          hectareasCol="HECTARES"
        />
      )}
      {activeTab === "suelos" && (
        <MapChart
          geoJsonUrl="/EDAFOLOGIA.geojson"
          categoriaCol="SUELO"
          hectareasCol="HAS_SUELO"
        />
      )}
      {activeTab === "humedad" && (
        <MapChart
          geoJsonUrl="/HUMEDAD.geojson"
          categoriaCol="HUMEDAD"
          hectareasCol="HAS_SUELO"
        />
      )}
      {activeTab === "poblacion" && (
        <Heatmap
          geojsonUrl="/POBREZA.geojson"
          valueColumn="POB_TOT"
          startColor="#ffffff"
          endColor="#ff0000"
          borderColor="#333"
          borderWidth={0.4}
        />
      )}
      {activeTab === "series-tiempo" && (
        <TimeSeriesMapViewer
          initialCenter={[23.6345, -102.5528]}
          initialZoom={6}
        />
      )}
      {activeTab === "raster-compare" && <RasterSlideCompare />}
    </StoryMapSection>
  );
}

function App() {
  return (
    <div className="App">
      <Header />

      <AnimatePresence>
        <CaracterizacionSeccion />
      </AnimatePresence>
    </div>
  );
}

export default App;
