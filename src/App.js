import React from "react";
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
        {title && (
          <h1
            style={{
              fontFamily: "Roboto, sans-serif",
              marginBottom: 8,
              color: "white",
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <h2
            style={{
              fontFamily: "Roboto, sans-serif",
              marginBottom: 24,
              fontWeight: 400,
              color: "white",
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
    <header className="header-pronatura">
      <div className="header-container">
        <img
          src="/logo.png"
          alt="Logo Tierra de Agaves"
          className="header-logo"
        />
        <nav className="header-nav">
          <ul className="header-menu">
            <li>
              <a href="#">
                <span className="menu-stack">
                  Tierra de Agaves
                  <br />
                  Monitoreo
                </span>
              </a>
            </li>
            <li>
              <a href="#">Caracterización del área de estudio</a>
            </li>
            <li>
              <a href="#">Degradación funcional del paisaje</a>
            </li>
            <li>
              <a href="#">Cambio Climático</a>
            </li>
            <li>
              <a href="#">Plan de manejo integral del paisaje</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function CaracterizacionSeccion() {
  return (
    <>
      <StoryMapSection id="poblacion" title="Población">
        <Heatmap
          geojsonUrl="/POBREZA.geojson"
          valueColumn="POB_TOT"
          startColor="#ffffff"
          endColor="#ff0000"
          borderColor="#333"
          borderWidth={0.4}
        />
      </StoryMapSection>

      <StoryMapSection id="pobreza" title="Pobreza">
        <Heatmap
          geojsonUrl="/POBREZA.geojson"
          valueColumn="POBR20"
          startColor="#ffffff"
          endColor="#ff0000"
          borderColor="#333"
          borderWidth={0.4}
        />
      </StoryMapSection>

      <StoryMapSection id="marginacion" title="Marginación">
        <MapChart
          geoJsonUrl="/MARGINACION.geojson"
          categoriaCol="GM_2020"
          hectareasCol="HAS_POLY"
        />
      </StoryMapSection>

      <StoryMapSection id="climas" title="Distribución Climática">
        <MapChart
          geoJsonUrl="/CLIMA.geojson"
          categoriaCol="CLIMA"
          hectareasCol="HECTARES"
        />
      </StoryMapSection>

      <StoryMapSection id="suelos" title="Edafología del Sitio">
        <MapChart
          geoJsonUrl="/EDAFOLOGIA.geojson"
          categoriaCol="SUELO"
          hectareasCol="HAS_SUELO"
        />
      </StoryMapSection>

      <StoryMapSection id="humedad" title="Humedad">
        <MapChart
          geoJsonUrl="/HUMEDAD.geojson"
          categoriaCol="HUMEDAD"
          hectareasCol="HAS_SUELO"
        />
      </StoryMapSection>

      <StoryMapSection id="series-tiempo" title="Cambios de Uso de Suelo">
        <TimeSeriesMapViewer
          initialCenter={[23.6345, -102.5528]}
          initialZoom={6}
        />
      </StoryMapSection>

      <StoryMapSection id="raster-compare" title="Potencial Productivo">
        <RasterSlideCompare />
      </StoryMapSection>
    </>
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
