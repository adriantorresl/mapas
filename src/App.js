import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import MapChart from "./components/MapChart";
import Heatmap from "./components/Heatmap";
import TimeSeriesMapViewer from "./components/TimeSeriesMapViewer";
import RasterSlideCompare from "./components/RasterSlideCompare";
import GeoJsonLayerWithLegend from "./components/GeoJsonLayerWithLegend";
import RasterViewer from "./components/RasterViewer";
import SideBySideRasters from "./components/SideBySideRasters";
import MapChartEnhanced from "./components/MapChartEnhanced";
import StoryMapSection from "./components/StoryMapSection";
import "./App.css";
const contextoGeografico = [
  {
    title: "Caracterización del Área de Estudio",
    description:
      "El área de trabajo se integra por 59 municipios. 11 municipios de la Sierra de Yautepec. 48 municipios en Valles centrales",
    metrics: [{ value: "816,566.9", label: "hectáreas" }],
  }
];

const cardsDistribucionPoblacional = [
  {
    title: "Contexto Demográfico",
    description:
      "De acuerdo al censo de población y vivienda 2020, en la zona de estudio radican",
    metrics: [{ value: "306 142", label: "Habitantes" }],
  },
  {
    title: "Patrones de Concentración",
    metrics: [
      { value: "146 249", label: "Hombres" },
      { value: "159 893", label: "Mujeres" },
    ],
  },
];

const cardsPobreza = [
  {
    title: "Indicadores Socioeconómicos",
    description:
      "El análisis de pobreza revela disparidades significativas entre municipios urbanos y rurales. Los indicadores muestran que las zonas con mayor biodiversidad coinciden frecuentemente con áreas de mayor vulnerabilidad social.",
    metrics: [
      { value: "24.8%", label: "Pobreza Promedio" },
      { value: "8.2%", label: "Pobreza Extrema" },
    ],
  },
  {
    title: "Correlación Territorial",
    description:
      "Existe una correlación negativa entre acceso a servicios básicos y conservación del paisaje natural. Las comunidades rurales, aunque con menores ingresos, son custodias de los ecosistemas más diversos de la región.",
    metrics: [
      { value: "42%", label: "Municipios Rurales" },
      { value: "85%", label: "Cobertura Forestal" },
    ],
  },
];

const cardsEdafologia = [
  {
    title: "Edafología del Sitio",
    description:
      "Oaxaca presenta una gran diversidad de suelos, resultado de su variada geografía, topografía y clima. Los suelos incluyen formaciones volcánicas, aluviales y sedimentarias distribuidas en el estado según sus características geográficas (INEGI, 2014).",
  },
];

const cardsHumedad = [
  {
    title: "Humedad de los Suelos",
    description:
      "La húmedad de los suelos se representa por los meses en los que los suelos reciben lluvias. En la zona de estudio, la duración de la humedad en los suelos varía de dos a doce meses por año, predominando las zonas con seis meses de humedad en suelos.",
  },
];

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
              <button 
                onClick={() => onNavigate("caracterizacion")}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                <span className="menu-stack">
                  Tierra de Agaves
                  <br />
                  Monitoreo
                </span>
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate("caracterizacion")}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                Caracterización del área de estudio
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate("degradacion")}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                Degradación funcional del paisaje
              </button>
            </li>
            <li>
              <button 
                onClick={() => onNavigate("cambio-climatico")}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
              >
                Cambio Climático
              </button>
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
      <StoryMapSection
        id="bioclimaticos"
        cards={contextoGeografico}
      >
        <MapChart
          geoJsonUrl="/MARGINACION.geojson"
          categoriaCol="PAISAJE"
          hectareasCol="HAS_POLY"
          showDelimitationControl={false}
          showPaletteControl={false}
          showChartLabels={true}
        />
      </StoryMapSection>

      <StoryMapSection
        id="poblacion"
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
      <StoryMapSection
        id="suelos"
        cards={cardsEdafologia}
      >
        <MapChart
          geoJsonUrl="/EDAFOLOGIA.geojson"
          categoriaCol="SUELO"
          hectareasCol="HAS_SUELO"
          showChartLabels={false}
        />
      </StoryMapSection>

      <StoryMapSection id="humedad" cards={cardsHumedad}>
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

function DegradacionSeccion() {
  return (
    <>
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

      <NutrientesSection />

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

      <StoryMapSection id="polinizadores">
        <SideBySideRasters
          leftFileName="reprojected_abundance_total_primavera.tif"
          rightFileName="reprojected_abundance_total_verano.tif"
          startColor="#ffffff"
          endColor="#004a13"
        />
      </StoryMapSection>
    </>
  );
}

function PotencialSection() {
  return (
    <StoryMapSection id="raster-compare">
      <RasterSlideCompare />
    </StoryMapSection>
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
      <AnimatePresence mode="wait">
        {seccionActiva === "caracterizacion" && <CaracterizacionSeccion key="caracterizacion" />}
        {seccionActiva === "degradacion" && <DegradacionSeccion key="degradacion" />}
        {seccionActiva === "cambio-climatico" && <PotencialSection key="cambio-climatico" />}
      </AnimatePresence>
    </div>
  );
}

export default App;
