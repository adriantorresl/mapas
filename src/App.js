import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import MapChart from "./components/MapChart";
import logo from "./assets/logo.png";
import "./App.css";
import CoreTemplate from "./components/templates/core";
import { NavigationProvider } from "./contexts/NavigationContext";

function App() {
  const [seccionActiva, setSeccionActiva] = useState("0");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [seccionActiva]);
  
  //console.log(seccionActiva);

  return (
    <div className="App">
      <NavigationProvider>
        <CoreTemplate
          title="Tierra de Agaves"
          content="Tierra de Agaves"
          onNavigate={setSeccionActiva}
          logo={logo}
          children={
            <AnimatePresence>
              { <MapChart
                geoJsonUrl="/PAISAJES.geojson"
                categoriaCol="paisaje"
                hectareasCol="sup_ha"
                showChart={true}
                showDelimitationControl={false}
                showPaletteControl={false}
                showChartLabels={true}
              />}
              {/* {seccionActiva === "degradacion" && <DegradacionSeccion />}
              {seccionActiva === "cambio-climatico" && <PotencialSection />} */}
            </AnimatePresence>
          }
        />
      </NavigationProvider>
    </div>
  );
}

export default App;
