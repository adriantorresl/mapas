import React from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import MapChart from "./components/MapChart";
import Heatmap from "./components/Heatmap";
import TimeSeriesMapViewer from "./components/TimeSeriesMapViewer";
import RasterSlideCompare from "./components/RasterSlideCompare";
import GeoJsonLayerWithLegend from "./components/GeoJsonLayerWithLegend";
import FadeInBox from "./components/FadeInBox";
import CardsOverlay from "./components/CardsOverlay";
import "./App.css";

function StoryMapSection({ children, title, subtitle, id, cards = [] }) {
  const [ref, inView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });
  
  const [cardsCompleted, setCardsCompleted] = React.useState(false);
  const [cardsHidden, setCardsHidden] = React.useState(false);

  const handleAllCardsCompleted = React.useCallback(() => {
    setCardsCompleted(true);
  }, []);

  const handleCardsHidden = React.useCallback(() => {
    setCardsHidden(true);
  }, []);

  // Reset cuando la sección sale de vista o cuando cambia a una nueva sección con cards
  React.useEffect(() => {
    if (!inView && cards.length > 0) {
      setCardsCompleted(false);
      setCardsHidden(false); // Reset cuando sale de vista
    }
    // Cuando la sección entra en vista y tiene cards, asegurar que no estén marcadas como completadas
    if (inView && cards.length > 0 && cardsCompleted) {
      setCardsCompleted(false);
      setCardsHidden(false); // Reset cuando vuelve a entrar
    }
  }, [inView, cards.length, cardsCompleted]);

  // Si no hay cards, marcar como completado inmediatamente
  React.useEffect(() => {
    if (cards.length === 0) {
      setCardsCompleted(true);
    } else {
      setCardsCompleted(false);
      setCardsHidden(false);
    }
  }, [cards.length]);

  // Condición para mostrar cards: tiene cards + en vista + no completadas + no ocultas
  const shouldShowCards = cards.length > 0 && inView && !cardsCompleted && !cardsHidden;
  return (
    <section
      ref={ref}
      id={id}
      className="story-section"
      style={{ 
        minHeight: "100vh", 
        paddingTop: 40, 
        paddingBottom: 40
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8 }}
        className="section-content"
        style={{ 
          maxWidth: 1200, 
          margin: "0 auto",
          position: "relative",
        }}
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
        
        <div style={{ zIndex: shouldShowCards ? 1 : 11 }}>
          {children}
        </div>
          {shouldShowCards && (
            <CardsOverlay
              cards={cards}
              isCompleted={cardsCompleted}
              onAllCardsCompleted={handleAllCardsCompleted}
              onCardsHidden={handleCardsHidden}
            />
          )}
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

const cardsDistribucionPoblacional = [
  {
    title: "Contexto Demográfico",
    description: "La región presenta una distribución poblacional heterogénea, con concentraciones urbanas significativas contrastando con zonas rurales de baja densidad. Esta distribución influye directamente en los patrones de uso del suelo y la presión sobre los ecosistemas naturales.",
    metrics: [
      { value: "2.1M", label: "Habitantes" },
      { value: "45.2", label: "Hab/km²" }
    ]
  },
  {
    title: "Patrones de Concentración",
    description: "Las áreas urbanas concentran el 78% de la población total, mientras que las zonas rurales mantienen densidades bajas que permiten la conservación de corredores biológicos importantes para la fauna nativa.",
    metrics: [
      { value: "78%", label: "Población Urbana" },
      { value: "22%", label: "Población Rural" }
    ]
  },
  {
    title: "Impacto en el Paisaje",
    description: "La presión demográfica ha resultado en la transformación del 35% del paisaje original. Sin embargo, las políticas de ordenamiento territorial han logrado mantener corredores ecológicos funcionales.",
    metrics: [
      { value: "35%", label: "Área Transformada" },
      { value: "65%", label: "Área Conservada" }
    ]
  }
];

const cardsPobreza = [
  [
    {
      title: "Indicadores Socioeconómicos",
      description: "El análisis de pobreza revela disparidades significativas entre municipios urbanos y rurales. Los indicadores muestran que las zonas con mayor biodiversidad coinciden frecuentemente con áreas de mayor vulnerabilidad social.",
      metrics: [
        { value: "24.8%", label: "Pobreza Promedio" },
        { value: "8.2%", label: "Pobreza Extrema" }
      ]
    },
    {
      title: "Correlación Territorial",
      description: "Existe una correlación negativa entre acceso a servicios básicos y conservación del paisaje natural. Las comunidades rurales, aunque con menores ingresos, son custodias de los ecosistemas más diversos de la región.",
      metrics: [
        { value: "42%", label: "Municipios Rurales" },
        { value: "85%", label: "Cobertura Forestal" }
      ]
    }
  ]
]

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
      <StoryMapSection 
        id="poblacion" 
        title="Distribución de la Población"
        cards={cardsDistribucionPoblacional}
      >
        <Heatmap
          geojsonUrl="/POBREZA.geojson"
          valueColumn="POB_TOT"
          startColor="#ffffff"
          endColor="#ff0000"
          borderColor="#333"
          borderWidth={0.4}
        />
      </StoryMapSection>

      <StoryMapSection 
        id="pobreza" 
        title="Pobreza en el Área de Estudio"
        cards={cardsPobreza}
      >
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
