import React, { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import MapChart from "./components/MapChart";
import Heatmap from "./components/Heatmap";
import TimeSeriesMapViewer from "./components/TimeSeriesMapViewer";
import RasterSlideCompare from "./components/RasterSlideCompare";
import GeoJsonLayerWithLegend from "./components/GeoJsonLayerWithLegend";
import TextOverlay from "./components/TextOverlay";
import RasterViewer from "./components/RasterViewer";
import SideBySideRasters from "./components/SideBySideRasters";
import logo from "./assets/logo.png";
import "./App.css";

function StoryMapSection({ children, title, content, id, tables, images, blocks }) {
  const [ref, inView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  return (
    <section
      ref={ref}
      id={id}
      className="story-section"
      style={{
        minHeight: "100vh",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8 }}
        className="section-content"
        style={{
          maxWidth: "100%",
          margin: "0 0",
          position: "relative",
        }}
      >
        <div
          className="content-container"
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            minHeight: "70vh",
            height: "calc(100vh - 88px) !important",
          }}
        >
          {/* Contenedor para CardsOverlay con ancho fijo responsivo */}
          {(tables?.length || content?.length || blocks?.length) > 0 && (
            <div
              style={{
                flexShrink: 0,
                zIndex: 10,
                height: "100%",
              }}
            >
              <TextOverlay
                title={title}
                content={content}
                tables={tables}
                images={images}
                blocks={blocks}
              />
            </div>
          )}

          {/* Contenedor para el mapa que ocupa el resto del espacio */}
          <div
            style={{
              flex: 1,
              height: "100%",
              minWidth: 0, // Permite que el contenedor se encoja si es necesario
            }}
          >
            {children}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Header({ onNavigate }) {
  return (
    <header className="header-pronatura">
      <div className="header-container">
        <img
          src={logo}
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
              <a href="#" onClick={() => onNavigate("cambio-climatico")}>
                Cambio Climático
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
const contextoGeografico = [
  "El área de trabajo se integra por 59 municipios. 11 municipios de la Sierra de Yautepec. 48 municipios en Valles centrales",
];
const tables = [
  {
    title: "Población por Región y Género",
    header: ["Región", "Mujeres", "Hombres"],
    body: [
      ["Sierra de Yautepec", "19,908", "18,936"],
      ["  Región 3", "11,475", "10,877"],
      ["  Región 4", "8,433", "8,059"],
      ["Valles centrales", "140,042", "127,363"],
      ["  Región 1", "82,970", "74,634"],
      ["  Región 2", "57,072", "52,729"],
      ["Población Total", "159,950", "146,299"]
    ]
  }
];
const contextoDemografico = [
      "De acuerdo al censo de población y vivienda 2020, en la zona de estudio radican",
      "146 249 hombres",
      "159 893 mujeres"
];
const contextoPobreza = [
  "El análisis de pobreza revela disparidades significativas entre municipios urbanos y rurales. Los indicadores muestran que las zonas con mayor biodiversidad coinciden frecuentemente con áreas de mayor vulnerabilidad social.",
  "24.8% de pobreza promedio",
  "8.2% de pobreza extrema",
  "",
  "Existe una correlación negativa entre acceso a servicios básicos y conservación del paisaje natural. Las comunidades rurales, aunque con menores ingresos, son custodias de los ecosistemas más diversos de la región.",
  "42% de los municipios son rurales",
  "85% de la cobertura forestal se encuentra en áreas rurales",
];

const contextoEdafologia = [
      "Oaxaca presenta una gran diversidad de suelos, resultado de su variada geografía, topografía y clima. Los suelos incluyen formaciones volcánicas, aluviales y sedimentarias distribuidas en el estado según sus características geográficas (INEGI, 2014).",
];

const contextoHumedad = [
      "La húmedad de los suelos se representa por los meses en los que los suelos reciben lluvias. En la zona de estudio, la duración de la humedad en los suelos varía de dos a doce meses por año, predominando las zonas con seis meses de humedad en suelos.",
];
const contextoImagen = [
  {
    image: logo,
  }
];

const blocks=[
  { type: 'text', content: 'El área de trabajo se integra por 59 municipios. 11 municipios de la Sierra de Yautepec. 48 municipios en Valles centrales' },
  { type: 'image', src: logo, title: 'Logo', caption: 'Descripción' },
  { type: 'heading', content: 'Subtítulo' },
  { type: 'table', title: 'Población', header: ["Región", "Mujeres", "Hombres"], body: [["Sierra de Yautepec", "19,908", "18,936"], ["  Región 3", "11,475", "10,877"], ["  Región 4", "8,433", "8,059"], ["Valles centrales", "140,042", "127,363"], ["  Región 1", "82,970", "74,634"], ["  Región 2", "57,072", "52,729"], ["Población Total", "159,950", "146,299"]] },
  { type: 'divider' },
  { type: 'text', content: 'De acuerdo al censo de población y vivienda 2020, en la zona de estudio radican 146 249 hombres y 159 893 mujeres' }
];

function CaracterizacionSeccion() {
  return (
    <>
      <StoryMapSection id="bioclimaticos" title="Caracterización del Área de Estudio" blocks={blocks} images={contextoImagen}>
        <MapChart
          geoJsonUrl="/MARGINACION.geojson"
          categoriaCol="PAISAJE"
          hectareasCol="HAS_POLY"
          showDelimitationControl={false}
          showPaletteControl={false}
          showChartLabels={true}
        />
      </StoryMapSection>

      <StoryMapSection id="poblacion" title="Contexto Demográfico y Patrones de Concentración" content={contextoDemografico}>
        <Heatmap
          geojsonUrl="/POBREZA.geojson"
          valueColumn="POB_TOT"
          startColor="#ffffff"
          endColor="#ff0000"
          borderColor="#333"
          borderWidth={0.4}
        />
      </StoryMapSection>

      <StoryMapSection id="pobreza" title="Indicadores Socioeconómicos y Correlación Territorial" content={contextoPobreza} cards={[]}>
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

      <StoryMapSection id="marginacion">
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
      <StoryMapSection id="suelos" title="Edafología del Sitio" content={contextoEdafologia} cards={[]}>
        <MapChart
          geoJsonUrl="/EDAFOLOGIA.geojson"
          categoriaCol="SUELO"
          hectareasCol="HAS_SUELO"
          showChartLabels={false}
        />
      </StoryMapSection>

      <StoryMapSection id="humedad" title="Humedad de los Suelos" content={contextoHumedad} cards={[]}>
        <MapChart
          geoJsonUrl="/HUMEDAD.geojson"
          categoriaCol="HUMEDAD"
          hectareasCol="HAS_SUELO"
          showChartLabels={false}
        />
      </StoryMapSection>

      <StoryMapSection id="climas">
        <MapChart
          geoJsonUrl="/CLIMA.geojson"
          categoriaCol="CLIMA"
          hectareasCol="HECTARES"
          showChartLabels={false}
        />
      </StoryMapSection>

      <StoryMapSection id="series-tiempo">
        <TimeSeriesMapViewer
          initialCenter={[23.6345, -102.5528]}
          initialZoom={6}
        />
      </StoryMapSection>
    </>
  );
}
function NutrientesSection() {
  const [capaActiva, setCapaActiva] = useState("N");

  return (
    <StoryMapSection id="nutrientes">
      <div
        style={{
          display: "inline-flex",
          width: "auto",
          justifyContent: "left",
          marginBottom: 10,
        }}
      >
        <button
          onClick={() => setCapaActiva("N")}
          style={{
            marginRight: 10,
            padding: "6px 12px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            textAlign: "center",
            boxSizing: "border-box",
            width: "auto",
          }}
        >
          Nitrógeno
        </button>
        <button
          onClick={() => setCapaActiva("P")}
          style={{
            marginRight: 10,
            padding: "6px 12px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            textAlign: "center",
            boxSizing: "border-box",
            width: "auto",
          }}
        >
          Fósforo
        </button>
      </div>

      {capaActiva === "N" && (
        <RasterViewer
          fileName="reprojected_Tend_N.tif"
          colorMap="0:#004a13,1:#fff200,2:#41b963,3:#dc0b00"
          legendItems={[
            { label: "Muy baja", color: "#004a13" },
            { label: "Media", color: "#fff200" },
            { label: "Alta", color: "#dc0b00" },
          ]}
        />
      )}

      {capaActiva === "P" && (
        <RasterViewer
          fileName="reprojected_tend_P.tif"
          colorMap="0:#004a13,1:#fff200,2:#dc0b00"
          legendItems={[
            { label: "Baja", color: "#004a13" },
            { label: "Media", color: "#fff200" },
            { label: "Alta", color: "#dc0b00" },
          ]}
        />
      )}
    </StoryMapSection>
  );
}

function NavigationTabs({ activeSection, onSectionChange }) {
  const sections = [
    {
      id: "erosion",
      label: "Erosión",
      icon: "🌊",
    },
    {
      id: "nutrientes",
      label: "Nutrientes",
      icon: "🌱",
    },
    {
      id: "carbono",
      label: "Carbono",
      icon: "🌍",
    },
    {
      id: "polinizadores",
      label: "Polinizadores",
      icon: "🦋",
    },
  ];

  return (
    <div className="navigation-tabs">
      <div className="tabs-container">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-tab-button ${
              activeSection === section.id ? "active" : ""
            }`}
            onClick={() => onSectionChange(section.id)}
          >
            <span className="nav-tab-icon">{section.icon}</span>
            <span className="nav-tab-label">{section.label}</span>
            {activeSection === section.id && (
              <div className="nav-tab-indicator" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function DegradacionSeccion() {
  const [activeSection, setActiveSection] = useState("erosion");

  return (
    <>
      <NavigationTabs
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {activeSection === "erosion" && (
        <StoryMapSection id="erosion">
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
      )}

      {activeSection === "nutrientes" && <NutrientesSection />}

      {activeSection === "carbono" && (
        <StoryMapSection id="carbono">
          <RasterViewer
            fileName="reprojected_tend_co2.tif"
            colorMap="0:#004a13,1:#fff200,2:#dc0b00"
            legendItems={[
              { label: "Bajo", color: "#004a13" },
              { label: "Medio", color: "#fff200" },
              { label: "Alto", color: "#dc0b00" },
            ]}
          />
        </StoryMapSection>
      )}

      {activeSection === "polinizadores" && (
        <StoryMapSection id="polinizadores">
          <SideBySideRasters
            leftFileName="reprojected_abundance_total_primavera.tif"
            rightFileName="reprojected_abundance_total_verano.tif"
            startColor="#ffffff"
            endColor="#004a13"
          />
        </StoryMapSection>
      )}
    </>
  );
}

function PotencialSection() {
  return (
    <>
      <StoryMapSection id="raster-compare">
        <RasterSlideCompare />
      </StoryMapSection>
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
        {seccionActiva === "cambio-climatico" && <PotencialSection />}
      </AnimatePresence>
    </div>
  );
}

export default App;
