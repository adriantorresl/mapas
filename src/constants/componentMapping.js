// Importar todos los componentes de visualización
import MapChart from "../components/MapChart";
import RasterViewer from "../components/RasterViewer";
import GeoJsonLayerWithLegend from "../components/GeoJsonLayerWithLegend";
import SideBySideRasters from "../components/SideBySideRasters";
import RasterSlideCompare from "../components/RasterSlideCompare";
import TimeSeriesMapViewer from "../components/TimeSeriesMapViewer";
import Heatmap from "../components/Heatmap";
import SlideTifCompare from "../components/SlideTifCompare";
import GeoLayerCompare from "../components/GeoLayerCompare";
import DefaultVisualization from "../components/DefaultVisualization";
import GeoMapViewer from "../components/GeoMapViewer";
import Topografia from "../components/Topografia";
import Localizacion from "../components/Localizacion";
import Edafologia from "../components/Edafologia";
import Clima from "../components/Clima";
import { color } from "framer-motion";

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
    component: TimeSeriesMapViewer,
    props: {},
  },

  // 1.1.5 - Áreas de protección
  "1.1.5": {
    component: GeoJsonLayerWithLegend,
    props: {
      geoJsonUrl: "/anp.geojson",
      categoriaCol: "categoria",
      title: "Áreas Naturales Protegidas",
    },
  },

  // 1.2.1 - Población
  "1.2.1": {
    component: GeoJsonLayerWithLegend,
    props: {
      geoJsonUrl: "/MARGINACION.geojson",
      categoriaCol: "grado_marg",
      title: "Grado de Marginación",
    },
  },

  // 1.2.2 - Actividades productivas
  "1.2.2": {
    component: GeoJsonLayerWithLegend,
    props: {
      geoJsonUrl: "/POBREZA.geojson",
      categoriaCol: "grado_pobr",
      title: "Nivel de Pobreza",
    },
  },

  // 2.1 - Erosión del suelo
  2.1: {
    component: RasterViewer,
    props: {
      fileName: "/reprojected_USLE_Tendencia.tif",
      colorMap: "RdYlBu_r",
    },
  },

  // 2.2 - Acumulación de Nutrientes
  2.2: {
    component: SideBySideRasters,
    props: {
      leftRasterUrl: "/reprojected_Tend_N.tif",
      rightRasterUrl: "/reprojected_tend_P.tif",
      leftTitle: "Tendencia de Nitrógeno",
      rightTitle: "Tendencia de Fósforo",
    },
  },

  // 2.3 - Secuestro de Carbono
  2.3: {
    component: RasterViewer,
    props: {
      rasterUrl: "/reprojected_tend_co2.tif",
      title: "Tendencia de Secuestro de CO2",
      colormap: "RdYlGn",
    },
  },

  // 2.4 - Abundancia de Polinizadores
  2.4: {
    component: SideBySideRasters,
    props: {
      leftRasterUrl: "/reprojected_abundance_total_primavera.tif",
      rightRasterUrl: "/reprojected_abundance_total_verano.tif",
      leftTitle: "Abundancia Primavera",
      rightTitle: "Abundancia Verano",
    },
  },

  // 3.1.1 - Escenario actual
  "3.1.1": {
    component: RasterSlideCompare,
    props: {
      leftRasterUrl: "/Temp_med_1539.tif",
      rightRasterUrl: "/Temp_med_anual.tif",
      leftTitle: "Temperatura Histórica",
      rightTitle: "Temperatura Actual",
    },
  },

  // 3.1.2 - Escenarios con cambio climático
  "3.1.2": {
    component: SlideTifCompare,
    props: {
      rasters: [
        { url: "/Temp_med_4569.tif", title: "Escenario 2045-2069" },
        { url: "/Temp_med_7599.tif", title: "Escenario 2075-2099" },
      ],
      title: "Proyecciones de Temperatura",
    },
  },

  // 3.2.1 - Agave Arroqueño
  "3.2.1": {
    component: SideBySideRasters,
    props: {
      leftRasterUrl: "/A_Americana_4326.tif",
      rightRasterUrl: "/A_Americana_CC_4326.tif",
      leftTitle: "Idoneidad Actual",
      rightTitle: "Idoneidad con Cambio Climático",
    },
  },

  // 3.2.2 - Agave Angustifolia (Espadín)
  "3.2.2": {
    component: SideBySideRasters,
    props: {
      leftRasterUrl: "/A_Angustifolia_4326.tif",
      rightRasterUrl: "/A_Angustifolia_CC_4326.tif",
      leftTitle: "Idoneidad Actual",
      rightTitle: "Idoneidad con Cambio Climático",
    },
  },

  // 3.2.3 - Agave Iyoba
  "3.2.3": {
    component: SideBySideRasters,
    props: {
      leftRasterUrl: "/A_Iyoba_4326.tif",
      rightRasterUrl: "/A_Iyoba_CC_4326.tif",
      leftTitle: "Idoneidad Actual",
      rightTitle: "Idoneidad con Cambio Climático",
    },
  },

  // 3.2.4 - Agave Karwinskii
  "3.2.4": {
    component: SideBySideRasters,
    props: {
      leftRasterUrl: "/A_Karswinskii_4326.tif",
      rightRasterUrl: "/A_Karswinskii_CC_4326.tif",
      leftTitle: "Idoneidad Actual",
      rightTitle: "Idoneidad con Cambio Climático",
    },
  },

  // 3.2.5 - Agave Marmorata (Tepeztate)
  "3.2.5": {
    component: SideBySideRasters,
    props: {
      leftRasterUrl: "/A_Marmorata_4326.tif",
      rightRasterUrl: "/A_Marmorata_CC_4326.tif",
      leftTitle: "Idoneidad Actual",
      rightTitle: "Idoneidad con Cambio Climático",
    },
  },

  // 4.1 - Zonificación
  4.1: {
    component: GeoLayerCompare,
    props: {
      layers: [
        { url: "/CUS.geojson", name: "Uso Actual", categoriaCol: "uso_actual" },
        {
          url: "/CUS_cambios.geojson",
          name: "Cambios Propuestos",
          categoriaCol: "cambio_prop",
        },
      ],
      title: "Comparación de Zonificación",
    },
  },

  // 4.2 - Story map
  4.2: {
    component: MapChart,
    props: {
      geoJsonUrl: "/AREA.geojson",
      categoriaCol: "zona",
      showChart: false,
      interactive: true,
      title: "Mapa Interactivo",
    },
  },

  // 4.3 - Sistema de monitoreo
  4.3: {
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
