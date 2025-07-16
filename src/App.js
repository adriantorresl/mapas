import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import MapChart from "./components/MapChart";
import Heatmap from "./components/Heatmap";
import TimeSeriesMapViewer from "./components/TimeSeriesMapViewer";
import RasterSlideCompare from "./components/RasterSlideCompare";
import GeoJsonLayerWithLegend from "./components/GeoJsonLayerWithLegend";
import FadeInBox from "./components/FadeInBox";
import RasterViewer from "./components/RasterViewer";
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

function Header({ onNavigate }) {
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
              <a href="#" onClick={() => onNavigate("caracterizacion")}>
                <span className="menu-stack">
                  Tierra de Agaves
                  <br />
                  Monitoreo
                </span>
              </a>
            </li>
            <li>
              <a href="#" onClick={() => onNavigate("caracterizacion")}>
                Caracterización del área de estudio
              </a>
            </li>
            <li>
              <a href="#" onClick={() => onNavigate("degradacion")}>
                Degradación funcional del paisaje
              </a>
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
      <StoryMapSection id="bioclimaticos" title="Área de estudio">
        <MapChart
          geoJsonUrl="/CLIMA.geojson"
          categoriaCol="PAISAJE"
          hectareasCol="HECTARES"
          showDelimitationControl={false}
          showPaletteControl={true}
        />
      </StoryMapSection>

      <StoryMapSection id="poblacion" title="Distribución de la Población">
        <Heatmap
          geojsonUrl="/POBREZA.geojson"
          valueColumn="POB_TOT"
          startColor="#ffffff"
          endColor="#ff0000"
          borderColor="#333"
          borderWidth={0.4}
        />
      </StoryMapSection>

      <StoryMapSection id="pobreza" title="Pobreza en el Área de Estudio">
        <Heatmap
          geojsonUrl="/POBREZA.geojson"
          valueColumn="POBR20"
          legendTitle="Índice de Pobreza (%)"
          valueUnit="%"
          colorRamp={[
            "#03fc20",
            "#fcf403",
            "#fcb503",
            "#fc7703",
            "#fc1c03",
            "#8c0606",
          ]}
          borderColor="#333"
          borderWidth={0.4}
        />
      </StoryMapSection>

      <StoryMapSection id="marginacion" title="Marginación">
        <GeoJsonLayerWithLegend
          nombreCapa="Grado de Marginación"
          atributoValor="GM_2020"
          nombreArchivo="MARGINACION.geojson"
          coloresPorValor={`{
            "Muy bajo": "#038a24",
            "Bajo": "#1bde4b",
            "Medio": "#f3fc44",
            "Alto": "#fcaa44",
            "Muy alto": "#d11919"
          }`}
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

function DegradacionSeccion() {
  return (
    <>
      <StoryMapSection id="erosion" title="Pérdida de Suelo por Erosión">
        <RasterViewer
          fileName="reprojected_USLE_Tendencia.tif"
          colorMap="0:#004a13,1:#41b963,2:#fff200,3:#dc0b00"
          legendItems={[
            { label: "Muy baja", color: "#004a13" },
            { label: "Media", color: "#41b963" },
            { label: "Alta", color: "#fff200" },
            { label: "Muy Alta", color: "#dc0b00" },
          ]}
        />
      </StoryMapSection>

      <StoryMapSection
        id="nutrientes"
        title="Disponibilidad de Nutrientes"
      ></StoryMapSection>

      <StoryMapSection
        id="carbono"
        title="Almacenamiento de Carbono"
      ></StoryMapSection>

      <StoryMapSection
        id="polinizadores"
        title="Hábitat para Polinizadores"
      ></StoryMapSection>

      <StoryMapSection
        id="climas-degradacion"
        title="Distribución Climática"
      ></StoryMapSection>

      <StoryMapSection
        id="suelos-degradacion"
        title="Edafología del Sitio"
      ></StoryMapSection>

      <StoryMapSection
        id="humedad-degradacion"
        title="Humedad"
      ></StoryMapSection>
    </>
  );
}

function App() {
  const [seccionActiva, setSeccionActiva] = useState("caracterizacion");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [seccionActiva]);

  return (
    <div className="App">
      <Header onNavigate={setSeccionActiva} />
      <AnimatePresence>
        {seccionActiva === "caracterizacion" && <CaracterizacionSeccion />}
        {seccionActiva === "degradacion" && <DegradacionSeccion />}
      </AnimatePresence>
    </div>
  );
}

export default App;
