// Importar todos los componentes de visualización
import MapChart from "../components/MapChart";
import DefaultVisualization from "../components/DefaultVisualization";
import Topografia from "../components/Topografia";
import Localizacion from "../components/Localizacion";
import Edafologia from "../components/Edafologia";
import Clima from "../components/Clima";
import AreaProteccion from "../components/AreaProteccion";
import Poblacion from "../components/Poblacion";
import ActividadProductiva from "../components/ActividadProductiva";
import Erosion from "../components/Erosion";
import Carbono from "../components/Carbono";
import Polinizadores from "../components/Polinizadores";
import CUS from "../components/CUS";
import EscenarioCC from "../components/EscenarioCC";
import Americana from "../components/Americana";
import Angustifolia from "../components/Angustifolia";
import Iyoba from "../components/Iyoba";
import Karwinskii from "../components/Karwinskii";
import Marmorata from "../components/Marmorata";
import Nitrogeno from "../components/Nitrogeno";
import Fosforo from "../components/Fosforo";
import Zonificacion from "../components/Zonificacion";
import Heatmap from "../components/Heatmap";

// Mapeo de ID de sección/subsección a componente de visualización
export const componentMapping = {
  // Página de inicio - Localización
  0: {
    component: Localizacion,
    props: {},
  },

  // 1.1.1 - Edafología
  "1.1.1": {
    component: Edafologia,
    props: {},
  },

  // 1.1.2 - Topografía
  "1.1.2": {
    component: Topografia,
    props: {
      baseUrl: "/",
      rasterFile: "PENDIENTE.tif",
      vectorFilesOverride: [
        { key: "area", url: "/AREA.geojson", label: "Área de Estudio" },
        { key: "municipios", url: "/MUNICIPIOS.geojson", label: "Municipios" },
        { key: "paisajes", url: "/PAISAJES.geojson", label: "Paisajes" },
        { key: "cuencas", url: "/CUENCAS.geojson", label: "Cuencas" },
        {
          key: "escurrimientos",
          url: "/ESCURRIMIENTOS.geojson",
          label: "Escurrimientos",
        },
      ],
      initialOpacities: {
        area: 1,
        municipios: 1,
        paisajes: 1,
        cuencas: 1,
        escurrimientos: 1,
      },
      initialRasterPalette: "Viridis",
    },
  },

  // 1.1.3 - Clima
  "1.1.3": {
    component: Clima,
    props: {},
  },

  // 1.1.4 - Vegetación y uso de suelo
  "1.1.4": {
    component: CUS,
    props: {},
  },

  // 1.1.5 - Áreas de protección
  "1.1.5": {
    component: AreaProteccion,
    props: {
      geoJsonUrl: "/anp.geojson",
      categoriaCol: "categoria",
      title: "Áreas Naturales Protegidas",
    },
  },

  // 1.2.1 - Población
  "1.2.1": {
    component: Poblacion,
    props: {},
  },

  // 1.2.2 - Actividades productivas
  "1.2.2": {
    component: ActividadProductiva,
    props: {},
  },

  // 2.1 - Erosión del suelo
  2.1: {
    component: Erosion,
    props: {},
  },

  // 2.2 - Acumulación de Nutrientes
  "2.2.1": {
    component: Nitrogeno,
    props: {},
  },

  // 2.3 - Secuestro de Carbono
  "2.2.2": {
    component: Fosforo,
    props: {},
  },
  2.3: {
    component: Carbono,
    props: {},
  },

  // 2.4 - Abundancia de Polinizadores
  2.4: {
    component: Polinizadores,
    props: {},
  },

  // 3.1.1 - Escenario actual
  3: {
    component: EscenarioCC,
    props: {},
  },

  // Agave Arroqueño
  "4.1.1": {
    component: Americana,
    props: {},
  },

  // 4.2 - Agave Angustifolia (Espadín)
  "4.1.2": {
    component: Angustifolia,
    props: {},
  },

  // 4.3 - Agave Iyoba
  "4.1.3": {
    component: Iyoba,
    props: {},
  },

  // 4.4 - Agave Karwinskii
  "4.1.4": {
    component: Karwinskii,
    props: {},
  },

  // 4.5 - Agave Marmorata (Tepeztate)
  "4.1.5": {
    component: Marmorata,
    props: {},
  },

  // 5.1 - Zonificación
  5.1: {
    component: Zonificacion,
    props: {},
  },

  // 5.2 - Story map
  5.2: {
    component: MapChart,
    props: {
      geoJsonUrl: "/AREA.geojson",
      categoriaCol: "zona",
      showChart: false,
      interactive: true,
      title: "Mapa Interactivo",
    },
  },

  // 5.3 - Sistema de monitoreo
  5.3: {
    component: Heatmap,
    props: {
      pointsUrl: "/puntos_monitoreo.geojson", // Asumiendo que tienes puntos de monitoreo
      title: "Red de Monitoreo",
    },
  },
};

// Función helper para obtener el componente y props de una sección
export const getComponentForSection = (sectionId) => {
  const config = componentMapping[sectionId];

  if (config) {
    return config;
  }

  // Retornar componente de fallback si no existe mapeo específico
  return {
    component: DefaultVisualization,
    props: { sectionId },
  };
};

// Función helper para verificar si una sección tiene componente asignado
export const hasComponent = (sectionId) => {
  return Boolean(componentMapping[sectionId]);
};
