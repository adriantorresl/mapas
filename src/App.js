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
import topografia from "./assets/Topografia.png";
import humedad from "./assets/humedad.png";
import "./App.css";

function StoryMapSection({
  children,
  title,
  content,
  id,
  tables,
  images,
  blocks,
}) {
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
        <img src={logo} alt="Logo Tierra de Agaves" className="header-logo" />
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
                Potencial Productivo
              </a>
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
        title="Paisajes Bioculturales"
        blocks={[
          {
            type: "text",
            content:
              "Los paisajes bioculturales son áreas geográficas que combinan elementos naturales y culturales, reflejando la interacción entre las comunidades humanas y su entorno. En Oaxaca, estos paisajes son fundamentales para la conservación de la biodiversidad y el patrimonio cultural.",
          },
          {
            type: "table",
            header: ["Paisaje", "Municipios", "Superficie"],
            body: [
              ["Sierra de Yautepec", "11", "401,208 has"],
              ["Valles centrales", "48", "415,358 has"],
              ["  TOTAL", "59", "816,566 has"],
            ],
          },
        ]}
      >
        <MapChart
          geoJsonUrl="/PAISAJES.geojson"
          categoriaCol="paisaje"
          hectareasCol="sup_ha"
          showChart={true}
          showDelimitationControl={false}
          showPaletteControl={false}
          showChartLabels={true}
        />
      </StoryMapSection>

      <StoryMapSection
        id="poblacion"
        title="Contexto Demográfico"
        blocks={[
          {
            type: "text",
            content:
              "De acuerdo al censo de población y vivienda 2020, en la zona de estudio radican 345 664 habitantes",
          },
          {
            type: "heading",
            content: "Distribución Demográfica",
          },
          {
            type: "table",
            header: ["", "Mujeres", "Hombres"],
            body: [
              ["  Sierra de Yautepec", "19,908", "18,936"],
              ["  Valles centrales", "140,042", "127,363"],
              ["TOTAL", "159,950", "146,299"],
            ],
          },
        ]}
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
        title="Índice de Pobreza"
        blocks={[
          {
            type: "text",
            content:
              "El índice de pobreza es un indicador que permite medir las carencias sociales y económicas de la población. En la zona de estudio, se han identificado diferentes niveles de pobreza que afectan a las comunidades.",
          },
          {
            type: "divider",
          },
          {
            type: "text",
            content:
              "En la zona de estudio, el 77% de la población presenta un nivel de pobreza, lo cual equivale a 245,611 personas",
          },
          {
            type: "table",
            header: ["", "Pobreza", "Pobreza Moderada", "Pobreza Extrema"],
            body: [
              ["  Sierra de Yautepec", "81%", "56%", "26%"],
              ["  Valles centrales", "76%", "49%", "27%"],
            ],
          },
        ]}
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

      <StoryMapSection
        id="marginacion"
        title="Índice de Marginación"
        blocks={[
          {
            type: "text",
            content:
              "El índice de marginación permite medir las condiciones de vida y carencias de la población, en cuanto a condiciones de la vivienda, el acceso a estudios de la población, la percepción de ingresos monetarios y la relacionada con la residencia en localidades pequeñas.",
          },
          {
            type: "divider",
          },
          {
            type: "table",
            header: ["", "Valles Centrales", "Sierra de Yautepec"],
            body: [
              ["", "Habitantes", "Habitantes"],
              ["Muy Baja", "14,154", "0"],
              ["Baja", "32,463", "3,294"],
              ["Media", "113,260", "14,785"],
              ["Alta", "106,285", "18,559"],
              ["Muy Alta", "30,834", "11,930"],
              ["TOTAL", "296,996", "48,668"],
            ],
          },
        ]}
      >
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
        title="Edafología del Sitio"
        blocks={[
          {
            type: "text",
            content:
              "Oaxaca presenta una gran diversidad de suelos, resultado de su variada geografía, topografía y clima. Los suelos incluyen formaciones volcánicas, aluviales y sedimentarias distribuidas en el estado según sus características geográficas (INEGI, 2014).",
          },
          {
            type: "image",
            src: topografia,
          },
        ]}
      >
        <MapChart
          geoJsonUrl="/EDAFOLOGIA.geojson"
          categoriaCol="SUELO"
          hectareasCol="HAS_SUELO"
          showChartLabels={false}
          showPaletteControl={false}
        />
      </StoryMapSection>

      <StoryMapSection
        id="humedad"
        title="Humedad de los Suelos"
        blocks={[
          {
            type: "text",
            content:
              "La húmedad de los suelos se representa por los meses en los que los suelos reciben lluvias (sin considerar la cantidad de agua), esta variable se obtuvo a partir del mapa de precipitación total mensual, con el que se contabilizan el número de meses que se presentan lluvias en un año, y de igual forma cuáles son esos meses, lo que permite conocer los meses de lluvias y secas en las diferentes zonas de la región de estudio.",
          },
          {
            type: "image",
            src: humedad,
          },
        ]}
      >
        <MapChart
          geoJsonUrl="/HUMEDAD.geojson"
          categoriaCol="HUMEDAD"
          hectareasCol="HAS_SUELO"
          showChartLabels={false}
          showPaletteControl={false}
        />
      </StoryMapSection>

      <StoryMapSection
        id="climas"
        title="Climas"
        blocks={[
          {
            type: "text",
            content:
              "Oaxaca al igual que México es reconocido por su biodiversidad, gracias a que en la entidad se presentan seis de los siete tipos de climas existentes en el país, faltándole solo el clima frio.",
          },
        ]}
      >
        <MapChart
          geoJsonUrl="/CLIMA.geojson"
          categoriaCol="CLIMA"
          hectareasCol="HECTARES"
          showChartLabels={false}
          showPaletteControl={false}
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
  // Definir un colorMap de escala de rojos para valores de 10 a 30
  // Ejemplo: 10:#fff5f0, 15:#fcbba1, 20:#fc9272, 25:#de2d26, 30:#67000d
  // Labels para la leyenda
  // El colorMap asigna colores a los valores exactos 10, 15, 20, 25, 30.
  // Para valores intermedios (11, 12, 13, etc.), la visualización interpolará colores entre los definidos.
  // Si necesitas que cada valor tenga un color específico, deberías definir cada uno en el colorMap.
  // Ejemplo para todos los valores de 10 a 30:
  const colorMap = [
    { value: 10, color: "#fff5f0" },
    { value: 11, color: "#fde0dd" },
    { value: 12, color: "#fcc5c0" },
    { value: 13, color: "#fa9fb5" },
    { value: 14, color: "#f768a1" },
    { value: 15, color: "#fcbba1" },
    { value: 16, color: "#fc9272" },
    { value: 17, color: "#fb6a4a" },
    { value: 18, color: "#ef3b2c" },
    { value: 19, color: "#cb181d" },
    { value: 20, color: "#fc9272" },
    { value: 21, color: "#fb6a4a" },
    { value: 22, color: "#ef3b2c" },
    { value: 23, color: "#cb181d" },
    { value: 24, color: "#a50f15" },
    { value: 25, color: "#de2d26" },
    { value: 26, color: "#a50f15" },
    { value: 27, color: "#67000d" },
    { value: 28, color: "#67000d" },
    { value: 29, color: "#67000d" },
    { value: 30, color: "#67000d" },
  ]
    .map(({ value, color }) => `${value}:${color}`)
    .join(",");

  const legendItems = [
    { label: "10°C", color: "#fff5f0" },
    { label: "15°C", color: "#fcbba1" },
    { label: "20°C", color: "#fc9272" },
    { label: "25°C", color: "#de2d26" },
    { label: "30°C", color: "#67000d" },
  ];
  // Definir intervalos y colores para la rampa azul (claro a oscuro)
  // Para modo continuo, solo se necesita un arreglo de colores
  const colorblue = [
    "#e3f0ff",
    "#b3d8f6",
    "#7bb6ea",
    "#4292c6",
    "#2171b5",
    "#084594",
    "#03254c",
  ];

  const legendblue = [
    { label: "310 mm", color: "#e3f0ff" },
    { label: "600 mm", color: "#b3d8f6" },
    { label: "900 mm", color: "#7bb6ea" },
    { label: "1200 mm", color: "#4292c6" },
    { label: "1500 mm", color: "#2171b5" },
    { label: "1800 mm", color: "#084594" },
    { label: "2040 mm", color: "#03254c" },
  ];

  return (
    <>
      <StoryMapSection id="temp">
        <RasterViewer
          fileName="Temp_med_anual.tif"
          colorMap={colorMap}
          legendItems={legendItems}
        />
      </StoryMapSection>

      <StoryMapSection id="prec">
        <RasterViewer
          fileName="Prec_tot_anual_4326.tif"
          colorMap={colorblue}
          legendItems={legendblue}
          continuous={true}
        />
      </StoryMapSection>

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
