import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import MapChart from "./components/MapChart";
import logo from "./assets/logo.png";
import "./App.css";
import CoreTemplate from "./components/templates/core";
import {
  NavigationProvider,
  useNavigation,
} from "./contexts/NavigationContext";
import { getComponentForSection } from "./constants/componentMapping";

// Componente interno que usa el contexto
function AppContent() {
  const { currentPageId } = useNavigation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPageId]);

  // Obtener el componente de visualización para la sección activa
  const getVisualizationComponent = () => {
    const componentConfig = getComponentForSection(currentPageId);
    const { component: Component, props } = componentConfig;
    return <Component {...props} key={currentPageId} />;
  };

  return (
    <div className="App">
      <CoreTemplate
        title="Tierra de Agaves"
        content="Tierra de Agaves"
        logo={logo}
        children={
          <AnimatePresence mode="wait">
            {getVisualizationComponent()}
          </AnimatePresence>
        }
      />
    </div>
  );
}

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;
