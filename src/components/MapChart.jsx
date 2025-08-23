import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  Rectangle,
} from "react-leaflet";
import L from "leaflet";
// leaflet-minimap plugin (creates a minimap control linked to a main map)
import "leaflet-minimap/dist/Control.MiniMap.min.css";
import "leaflet-minimap";
import "leaflet/dist/leaflet.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  schemeCategory10,
  schemeAccent,
  schemeDark2,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemePaired,
  schemePastel1,
  schemePastel2,
} from "d3-scale-chromatic";
import { scaleOrdinal } from "d3-scale";
import { useMapLayers } from "../hooks/useMapLayers";
import RetractableMapControls from "./RetractableMapControls";

ChartJS.register(ArcElement, Tooltip, Legend);

const paletteOptions = {
  schemeCategory10,
  schemeAccent,
  schemeDark2,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemePaired,
  schemePastel1,
  schemePastel2,
};

const DELIMITATION_OPTIONS = [
  { value: "all", label: "Área de Estudio" },
  { value: "PAISAJE", label: "Paisaje" },
  { value: "RM", label: "Región" },
  { value: "NOMGEO", label: "Municipio" },
];

const toRGBA = (hex, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const capitalizeFirstLetter = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const MapChart = (props) => {
  const {
    geoJsonUrl,
    extraLayers = [],
    showMiniMap = false,
    showChart = true,
    showFullExtent = true,
    showPaletteControl = true,
    showDelimitationControl = true,
    showCategoryLabels = false,
    mainLayerLabel = "Datos principales",
    categoriaCol = "PAISAJE",
    hectareasCol = "AREA_HA",
  } = props;

  // opacidades dinámicas para capas extra (key => opacity)
  const [extraOpacities, setExtraOpacities] = useState({});

  // datos principales y opacidades (faltaban y produjeron errores de ESLint)
  const [geoData, setGeoData] = useState(null);
  const [mainLayerOpacity, setMainLayerOpacity] = useState(1);
  const [areaOpacity, setAreaOpacity] = useState(1);
  const [paisajeOpacity, setPaisajeOpacity] = useState(1);
  const [municipiosOpacity, setMunicipiosOpacity] = useState(1);

  // pequeñas opciones adicionales
  const [showChartLabels, setShowChartLabels] = useState(false);
  // título opcional del mapa (prop sensible a incluir)
  const mapTitle = props.mapTitle || null;

  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedDelimitation, setSelectedDelimitation] = useState("all");
  const [selectedPaletteName, setSelectedPaletteName] =
    useState("schemeCategory10");
  const [highlightedAreas, setHighlightedAreas] = useState([]);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  // mini map refs/estado
  const miniMapRef = useRef(null);
  const [miniMapInstance, setMiniMapInstance] = useState(null);
  const [currentMainBounds, setCurrentMainBounds] = useState(null);
  // ref para el control de minimapa (plugin) y su visibilidad controlada por UI
  const miniControlRef = useRef(null);
  const [miniControlVisible, setMiniControlVisible] = useState(false);
  // ref para evitar loops en sincronización bidireccional
  const syncRef = useRef(null);
  // visibilidad de overlays y capa activa para el gráfico
  const [visibleOverlays, setVisibleOverlays] = useState({});
  const [activeChartLayerKey, setActiveChartLayerKey] = useState("main");
  const geoJsonLayerRef = useRef(null);
  const controlsAddedRef = useRef({
    mousePosition: false,
    scale: false,
    easyPrint: false,
  });
  const [mainBounds, setMainBounds] = useState(null);
  const [fullExtentBounds, setFullExtentBounds] = useState(null);

  // Nuevo: estado para colapsar/expandir solo el área del gráfico
  const [chartCollapsed, setChartCollapsed] = useState(false);
  // Leyenda: mostrar/ocultar
  const [showLegend, setShowLegend] = useState(true);

  // --- CAPAS: base + extraLayers prop ---
  const baseLayersConfig = [
    { key: "areaBorders", url: "AREA.geojson", label: "Área de Estudio" },
    { key: "paisajeBorders", url: "PAISAJES.geojson", label: "Paisajes" },
    {
      key: "municipiosBorders",
      url: "MARGINACION.geojson",
      label: "Municipios",
    },
  ];

  // normalizar extraLayers (asegura key/label)
  const extraLayersNormalized = (extraLayers || []).map((l, i) => ({
    key: l.key || `extraLayer${i}`,
    url: l.url,
    label: l.label || l.key || `Capa ${i}`,
    categoriaCol: l.categoriaCol,
    hectareasCol: l.hectareasCol,
    chartable: l.chartable !== false, // por defecto true
    // opcional: permitir pasar la paleta deseada por capa
    paletteName: l.paletteName || l.palette || null,
  }));

  // configurar config para useMapLayers
  const layersConfig = [
    ...baseLayersConfig.map(({ key, url }) => ({ key, url })),
    ...extraLayersNormalized.map(({ key, url }) => ({ key, url })),
  ];

  // carga dinámica de capas (useMapLayers devuelve objeto con claves)
  const loadedLayers = useMapLayers(layersConfig);

  const areaBorders = loadedLayers?.areaBorders;
  const paisajeBorders = loadedLayers?.paisajeBorders;
  const municipiosBorders = loadedLayers?.municipiosBorders;

  // capas extra con su data ya cargada (data puede ser undefined hasta fetch)
  const extraLoaded = extraLayersNormalized.map((cfg) => ({
    ...cfg,
    data: loadedLayers?.[cfg.key],
  }));

  // Carga del GeoJSON principal (geoJsonUrl) que faltaba — setea geoData y ajusta bounds
  useEffect(() => {
    if (!geoJsonUrl) return;
    let mounted = true;
    fetch(geoJsonUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setGeoData(data);
        if (mapInstance) {
          try {
            const b = L.geoJSON(data).getBounds();
            if (b.isValid()) mapInstance.fitBounds(b);
          } catch (err) {
            /* ignore */
          }
        }
      })
      .catch((e) => console.error("Error cargando GeoJSON principal:", e));
    return () => {
      mounted = false;
    };
  }, [geoJsonUrl, mapInstance]);

  // --- ASIGNACIÓN DE PALETAS POR CAPA ---
  const paletteNames = Object.keys(paletteOptions);

  // asigna por defecto una paleta distinta por capa (rota entre las disponibles)
  const perLayerPalette = useMemo(() => {
    const keys = [
      "main",
      "areaBorders",
      "paisajeBorders",
      "municipiosBorders",
      ...extraLoaded.map((el) => el.key),
    ];
    const map = {};
    keys.forEach((k, i) => {
      // prioridad: paleta definida en la configuración de la capa, sino rotar palettes
      const extra = extraLoaded.find((el) => el.key === k);
      const preferred = extra?.paletteName || null;
      map[k] = preferred || paletteNames[i % paletteNames.length];
    });
    return map;
  }, [extraLoaded]);

  // escala principal (para la capa 'main')
  const colorScaleMain = useMemo(() => {
    const palName = perLayerPalette?.main || selectedPaletteName;
    const pal = paletteOptions[palName] || paletteOptions.schemeCategory10;
    if (!geoData) return scaleOrdinal(pal);
    const categoriasUnicas = [
      ...new Set(geoData.features.map((f) => f.properties[categoriaCol])),
    ];
    return scaleOrdinal(pal).domain(categoriasUnicas);
  }, [geoData, categoriaCol, perLayerPalette, selectedPaletteName]);

  // crear escalas por capa (base + extras)
  const colorScalesByKey = useMemo(() => {
    const m = {
      main: colorScaleMain,
    };
    // base layers (si quisieras colorearlas por categoría, se pueden configurar)
    ["areaBorders", "paisajeBorders", "municipiosBorders"].forEach((k) => {
      const pal =
        paletteOptions[perLayerPalette[k] || selectedPaletteName] ||
        paletteOptions.schemeCategory10;
      // si no hay datos para esas capas, se deja una escala genérica
      const data = loadedLayers?.[k];
      const cats = data?.features
        ? [
            ...new Set(
              data.features.map((f) => f.properties[categoriaCol] || "Sin dato")
            ),
          ]
        : [];
      m[k] = cats.length ? scaleOrdinal(pal).domain(cats) : scaleOrdinal(pal);
    });
    extraLoaded.forEach((el) => {
      const pal =
        paletteOptions[perLayerPalette[el.key] || selectedPaletteName] ||
        paletteOptions.schemeCategory10;
      const cats = el.data?.features
        ? [
            ...new Set(
              el.data.features.map(
                (f) =>
                  f.properties[el.categoriaCol || categoriaCol] || "Sin dato"
              )
            ),
          ]
        : [];
      m[el.key] = cats.length
        ? scaleOrdinal(pal).domain(cats)
        : scaleOrdinal(pal);
    });
    return m;
  }, [
    extraLoaded,
    perLayerPalette,
    colorScaleMain,
    selectedPaletteName,
    loadedLayers,
    categoriaCol,
  ]);

  // Agrupa features por la delimitación seleccionada (usado en onFeatureClick)
  const groupedFeatures = useMemo(() => {
    if (!geoData || selectedDelimitation === "all") return null;
    const groups = {};
    geoData.features.forEach((feature) => {
      const groupKey = feature.properties[selectedDelimitation];
      if (!groups[groupKey]) {
        groups[groupKey] = { type: "FeatureCollection", features: [] };
      }
      groups[groupKey].features.push(feature);
    });
    return groups;
  }, [geoData, selectedDelimitation]);

  const getBaseStyle = (fillOpacity = mainLayerOpacity) => ({
    weight: 0,
    opacity: 0.9,
    color: "red",
    fillOpacity,
  });

  const getFeatureStyle = (feature) => {
    const baseStyle = getBaseStyle();

    if (selectedDelimitation === "all") {
      return {
        ...baseStyle,
        fillColor: colorScaleMain(feature.properties[categoriaCol]),
      };
    }

    const areaValue = feature.properties[selectedDelimitation];

    if (selectedArea) {
      if (areaValue === selectedArea) {
        return {
          ...baseStyle,
          fillColor: colorScaleMain(feature.properties[categoriaCol]),
          weight: 1,
          color: "#000",
        };
      }
      return {
        ...baseStyle,
        fillColor: "transparent",
        color: "#ccc",
        fillOpacity: 0,
      };
    }

    return {
      ...baseStyle,
      fillColor: colorScaleMain(feature.properties[categoriaCol]),
    };
  };

  const onFeatureClick = (e) => {
    if (selectedDelimitation !== "all") {
      const clickedFeature = e.target.feature;
      const clickedArea = clickedFeature.properties[selectedDelimitation];
      setSelectedArea(clickedArea);

      if (groupedFeatures && groupedFeatures[clickedArea] && mapInstance) {
        const bounds = L.geoJSON(groupedFeatures[clickedArea]).getBounds();
        mapInstance.fitBounds(bounds);
      }
    }
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    let popupContent = `<b>${
      selectedDelimitation !== "all" ? props[selectedDelimitation] : ""
    }</b><br/>`;
    popupContent += Object.entries(props)
      .map(([k, v]) => `<b>${k}:</b> ${v}`)
      .join("<br/>");
    layer.bindPopup(popupContent);

    // Tooltip personalizado: categoriaCol, municipio y hectáreasCol (dinámico)
    const categoria = props[categoriaCol] ?? "Sin dato";
    const municipio = props.NOMGEO || props.NOM_MUN;
    const hectareas = props[hectareasCol]
      ? Number(props[hectareasCol]).toLocaleString("es-MX", {
          maximumFractionDigits: 2,
        })
      : "Sin dato";
    if (showCategoryLabels) {
      // Etiqueta permanente solo con el valor de la categoría
      layer.bindTooltip(`${categoria || ""}`.trim(), {
        permanent: true,
        direction: "center",
        className: "mapchart-cat-label",
        opacity: 0.9,
      });
    } else {
      layer.bindTooltip(
        `<b>${categoriaCol}:</b> ${categoria}<br/><b>Municipio:</b> ${municipio}<br/><b>Hectáreas:</b> ${hectareas}`,
        {
          direction: "top",
          sticky: true,
          className: "mapchart-tooltip",
        }
      );
    }

    layer.on({
      click: selectedDelimitation !== "all" ? onFeatureClick : undefined,
      mouseover: () => {
        layer.setStyle({
          weight: 3,
          color: "#000",
        });
        layer.bringToFront();
      },
      mouseout: () => {
        layer.setStyle(getFeatureStyle(feature));
      },
    });
  };

  const resetView = () => {
    setSelectedArea(null);
    setHighlightedAreas([]);
    if (geoData && mapInstance) {
      const bounds = L.geoJSON(geoData).getBounds();
      mapInstance.fitBounds(bounds);
    }
  };

  // Función para inicializar los controles del mapa
  const initializeMapControls = (map) => {
    if (!map || !map._container) {
      console.log("Mapa no disponible para agregar controles");
      return;
    }

    console.log("Inicializando controles del mapa...");

    try {
      // Control de posición del mouse
      if (!controlsAddedRef.current.mousePosition) {
        console.log("Agregando control de posición del mouse...");
        const mousePositionControl = L.control.mousePosition({
          position: "bottomleft",
          separator: " | ",
          emptyString: "Mueve el cursor sobre el mapa",
          lngFirst: false,
          numDigits: 5,
          lngFormatter: (lng) => `Lon: ${lng.toFixed(5)}°`,
          latFormatter: (lat) => `Lat: ${lat.toFixed(5)}°`,
        });

        mousePositionControl.addTo(map);
        controlsAddedRef.current.mousePosition = true;
        console.log("✅ Control de posición del mouse agregado");
      }

      // Control de escala
      if (!controlsAddedRef.current.scale) {
        console.log("Agregando control de escala...");
        const scaleControl = L.control.scale({
          position: "bottomright",
          metric: true,
          imperial: false,
          maxWidth: 150,
        });

        scaleControl.addTo(map);
        controlsAddedRef.current.scale = true;
        console.log("✅ Control de escala agregado");
      }

      // MiniMap control moved to dedicated effect to allow UI toggling
    } catch (error) {
      console.error("❌ Error al inicializar controles del mapa:", error);
    }
  };

  // Manejar cuando el mapa esté listo
  const handleMapCreated = (map) => {
    console.log("Mapa creado:", map);
    setMapInstance(map);
    mapRef.current = map;

    // Esperar un poco para que el mapa esté completamente inicializado
    setTimeout(() => {
      initializeMapControls(map);
    }, 100);
  };

  // Efecto para re-inicializar controles si el mapa cambia
  useEffect(() => {
    if (mapInstance && mapInstance._container) {
      initializeMapControls(mapInstance);
    }
  }, [mapInstance]);

  // Effect: create/destroy Leaflet MiniMap control when user toggles visibility
  useEffect(() => {
    if (!mapInstance || !showMiniMap) return;

    // if visibility off and control exists, remove it
    if (!miniControlVisible && miniControlRef.current) {
      try {
        mapInstance.removeControl(miniControlRef.current);
      } catch (err) {}
      miniControlRef.current = null;
      controlsAddedRef.current.miniMap = false;
      return;
    }

    // if visibility on and control not created, create it
    if (miniControlVisible && !miniControlRef.current) {
      try {
        const miniTile = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "" }
        );
        // eslint-disable-next-line no-undef
        const mini = new L.Control.MiniMap(miniTile, {
          position: "bottomright",
          toggleDisplay: false,
          minimized: false,
          width: 180,
          height: 120,
          aimingRectOptions: { color: "#ff5722", weight: 1 },
        });
        mini.addTo(mapInstance);
        miniControlRef.current = mini;
        controlsAddedRef.current.miniMap = true;
      } catch (err) {
        console.warn("No se pudo crear MiniMap plugin:", err);
      }
    }

    return () => {
      if (miniControlRef.current && mapInstance) {
        try {
          mapInstance.removeControl(miniControlRef.current);
        } catch (err) {}
        miniControlRef.current = null;
        controlsAddedRef.current.miniMap = false;
      }
    };
  }, [miniControlVisible, mapInstance, showMiniMap]);

  // Sincronizar vista: cuando mapInstance cambia su vista, actualizar miniMap (centro/bounds)
  useEffect(() => {
    if (!mapInstance || !showMiniMap) return;

    const onMoveEnd = () => {
      try {
        const b = mapInstance.getBounds();
        setCurrentMainBounds([
          [b.getSouth(), b.getWest()],
          [b.getNorth(), b.getEast()],
        ]);

        if (!miniMapInstance) return;

        // si la última sincronización vino del mini, ignorar para evitar loop
        if (syncRef.current === "mini") return;

        syncRef.current = "main";
        const c = mapInstance.getCenter();
        // mantener zoom del mini pero centrar
        try {
          miniMapInstance.setView(c, miniMapInstance.getZoom());
        } catch (err) {
          miniMapInstance.setView(c);
        }
        // liberar el guard después de corto delay
        setTimeout(() => {
          if (syncRef.current === "main") syncRef.current = null;
        }, 50);
      } catch (err) {
        /* ignore */
      }
    };

    mapInstance.on("moveend", onMoveEnd);
    mapInstance.on("zoomend", onMoveEnd);

    // inicializar
    onMoveEnd();

    return () => {
      mapInstance.off("moveend", onMoveEnd);
      mapInstance.off("zoomend", onMoveEnd);
    };
  }, [mapInstance, miniMapInstance, showMiniMap]);

  // Cuando mainBounds o geoData cambian, centrar mini-map en la región de interés
  useEffect(() => {
    if (!showMiniMap || !miniMapInstance) return;
    try {
      if (mainBounds) {
        const b = L.latLngBounds(mainBounds);
        miniMapInstance.fitBounds(b);
      } else if (geoData) {
        const b = L.geoJSON(geoData).getBounds();
        if (b.isValid()) miniMapInstance.fitBounds(b);
      }
    } catch (err) {
      /* ignore */
    }
  }, [mainBounds, geoData, miniMapInstance, showMiniMap]);

  // Cuando el mini-map se mueve o se hace click, recentrar el mapa principal (bidireccional)
  useEffect(() => {
    if (!miniMapInstance || !showMiniMap || !mapInstance) return;

    const onMiniClick = (e) => {
      try {
        const latlng = e.latlng;
        // marcar que la acción viene del mini para evitar eco
        syncRef.current = "mini";
        mapInstance.setView(latlng, mapInstance.getZoom());
        setTimeout(() => {
          if (syncRef.current === "mini") syncRef.current = null;
        }, 50);
      } catch (err) {
        /* ignore */
      }
    };

    const onMiniMoveEnd = () => {
      try {
        if (syncRef.current === "main") return; // evitar loop
        syncRef.current = "mini";
        const c = miniMapInstance.getCenter();
        try {
          mapInstance.setView(c, mapInstance.getZoom());
        } catch (err) {
          mapInstance.setView(c);
        }
        setTimeout(() => {
          if (syncRef.current === "mini") syncRef.current = null;
        }, 50);
      } catch (err) {}
    };

    miniMapInstance.on("click", onMiniClick);
    miniMapInstance.on("moveend", onMiniMoveEnd);

    // init
    onMiniMoveEnd();

    return () => {
      miniMapInstance.off("click", onMiniClick);
      miniMapInstance.off("moveend", onMiniMoveEnd);
    };
  }, [miniMapInstance, mapInstance, showMiniMap]);

  // Inicializar ambas vistas centradas en la región de interés cuando ambas instancias estén listas
  useEffect(() => {
    if (!showMiniMap || !mapInstance || !miniMapInstance) return;

    try {
      let bounds = null;
      // prioridad: selectedArea (si aplica) > mainBounds > geoData
      if (selectedArea && groupedFeatures && groupedFeatures[selectedArea]) {
        bounds = L.geoJSON(groupedFeatures[selectedArea]).getBounds();
      } else if (mainBounds) {
        bounds = L.latLngBounds(mainBounds);
      } else if (geoData) {
        const b = L.geoJSON(geoData).getBounds();
        if (b.isValid()) bounds = b;
      }

      if (bounds && bounds.isValid()) {
        // usar fitBounds en ambas, marcando guard para evitar loops
        syncRef.current = "main";
        mapInstance.fitBounds(bounds);
        miniMapInstance.fitBounds(bounds);
        setTimeout(() => {
          syncRef.current = null;
        }, 100);
      }
    } catch (err) {
      /* ignore */
    }
  }, [
    showMiniMap,
    mapInstance,
    miniMapInstance,
    selectedArea,
    mainBounds,
    geoData,
    groupedFeatures,
  ]);

  // 1. Agrega la función fuera del componente o dentro pero fuera de handleMapCreated
  const exportMapAsImage = async (mapInstance) => {
    if (!mapInstance) {
      alert("El mapa aún no está listo para exportar.");
      return;
    }
    try {
      const html2canvas = await import("html2canvas");
      const mapContainer = mapInstance.getContainer();

      // Opcional: Oculta controles antes de exportar
      const controls = mapContainer.querySelectorAll(
        ".leaflet-control-container"
      );
      controls.forEach((el) => (el.style.visibility = "hidden"));

      const canvas = await html2canvas.default(mapContainer, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        logging: false,
      });

      // Restaura controles
      controls.forEach((el) => (el.style.visibility = "visible"));

      const link = document.createElement("a");
      link.download = "mapa_completo.png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Mapa exportado exitosamente");
    } catch (error) {
      console.error("Error al exportar el mapa:", error);
      alert("Error al exportar el mapa. Intenta de nuevo.");
    }
  };

  // Nueva función para descargar el geoJsonUrl -> ahora permite elegir entre capas disponibles
  const downloadGeoJson = async () => {
    try {
      // construir lista de opciones disponibles
      const options = [];

      // main
      options.push({
        key: "main",
        label: mainLayerLabel || "Datos principales",
        data: geoData,
        url: geoJsonUrl,
        filename: (geoJsonUrl || "datos").split("/").pop() || "datos.geojson",
      });

      // base layers
      if (areaBorders) {
        options.push({
          key: "areaBorders",
          label: "Área de Estudio",
          data: areaBorders,
          filename: "area.geojson",
        });
      }
      if (paisajeBorders) {
        options.push({
          key: "paisajeBorders",
          label: "Paisajes",
          data: paisajeBorders,
          filename: "paisajes.geojson",
        });
      }
      if (municipiosBorders) {
        options.push({
          key: "municipiosBorders",
          label: "Municipios",
          data: municipiosBorders,
          filename: "municipios.geojson",
        });
      }

      // extra layers
      extraLoaded.forEach((el) =>
        options.push({
          key: el.key,
          label: el.label || el.key,
          data: el.data,
          filename: `${(el.label || el.key).replace(/\s+/g, "_")}.geojson`,
        })
      );

      if (!options.length) {
        alert("No hay capas disponibles para descargar.");
        return;
      }

      // construir texto para prompt
      const lines = options.map(
        (opt, i) =>
          `${i}: ${opt.label}${opt.data ? "" : " (se descargará desde URL)"}`
      );
      const choice = window.prompt(
        `Elige la capa a descargar (escribe el número):\n\n${lines.join(
          "\n"
        )}\n\nDeja en blanco para cancelar.`
      );
      if (!choice) return;

      const idx = parseInt(choice, 10);
      if (Number.isNaN(idx) || idx < 0 || idx >= options.length) {
        alert("Selección inválida.");
        return;
      }

      const sel = options[idx];

      // si hay data en memoria, descargarla directamente
      if (sel.data) {
        downloadLayerData(sel.data, sel.filename);
        return;
      }

      // si no hay data en memoria pero hay una URL (p. ej. main con geoJsonUrl), intentar fetch
      if (sel.url) {
        try {
          const response = await fetch(sel.url);
          if (!response.ok) throw new Error("No se pudo descargar el archivo.");
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = sel.filename || "capa.geojson";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          return;
        } catch (err) {
          console.error("Error descargando desde URL:", err);
          alert("Error al descargar la capa desde su URL.");
          return;
        }
      }

      alert("No hay datos disponibles para la capa seleccionada.");
    } catch (error) {
      console.error("Error al descargar el archivo GeoJSON.", error);
      alert("Error al descargar el archivo GeoJSON.");
    }
  };

  // función genérica para descargar cualquier GeoJSON en memoria
  const downloadLayerData = (data, suggestedName = "capa.geojson") => {
    try {
      if (!data) {
        alert("No hay datos para descargar.");
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/geo+json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando capa:", error);
      alert("Error al descargar la capa.");
    }
  };

  // --- Nuevo: inyectar controles (slider + botón) dentro del panel de LayersControl ---
  useEffect(() => {
    if (!mapInstance) return;

    const addControlsToLayersPanel = () => {
      try {
        const container = mapInstance.getContainer();
        const layersControl = container.querySelector(
          ".leaflet-control-layers"
        );
        if (!layersControl) return;

        // construir mapping dinámico (nombre visible => datos y setters)
        const mapping = [];

        // base overlays
        mapping.push({
          name: "Área de Estudio",
          data: areaBorders,
          setter: setAreaOpacity,
          filename: "area.geojson",
        });
        mapping.push({
          name: "Paisajes",
          data: paisajeBorders,
          setter: setPaisajeOpacity,
          filename: "paisajes.geojson",
        });
        mapping.push({
          name: "Municipios",
          data: municipiosBorders,
          setter: setMunicipiosOpacity,
          filename: "municipios.geojson",
        });

        // main layer
        mapping.push({
          name: mainLayerLabel,
          data: geoData,
          setter: setMainLayerOpacity,
          filename: (geoJsonUrl || "datos").split("/").pop() || "datos.geojson",
        });

        // extra layers
        extraLoaded.forEach((el) =>
          mapping.push({
            name: el.label,
            data: el.data,
            setter: (v) =>
              setExtraOpacities((prev) => ({ ...prev, [el.key]: v })),
            filename: `${(el.label || el.key).replace(/\s+/g, "_")}.geojson`,
          })
        );

        const overlayItems = layersControl.querySelectorAll(
          ".leaflet-control-layers-overlays li"
        );
        overlayItems.forEach((li) => {
          const label = li.querySelector("label");
          if (!label) return;

          // obtener el texto visible del label (puede venir en un <span> o como texto)
          const labelText =
            (label.querySelector("span") &&
              label.querySelector("span").textContent) ||
            label.textContent ||
            "";

          const mapEntry = mapping.find((m) => {
            // comparar a la baja para evitar problemas de espacios/HTML
            return labelText
              .trim()
              .toLowerCase()
              .includes(m.name.toLowerCase());
          });

          if (!mapEntry) return;

          // evitar agregar controles duplicados
          if (label.querySelector(".mapchart-layer-controls")) return;

          // crear contenedor de controles
          const controlsWrapper = document.createElement("div");
          controlsWrapper.className = "mapchart-layer-controls";
          controlsWrapper.style.display = "inline-flex";
          controlsWrapper.style.gap = "6px";
          controlsWrapper.style.alignItems = "center";
          controlsWrapper.style.marginLeft = "8px";

          // slider
          const slider = document.createElement("input");
          slider.type = "range";
          slider.min = "0";
          slider.max = "1";
          slider.step = "0.01";
          slider.value = (
            mapEntry.name === mainLayerLabel
              ? mainLayerOpacity
              : mapEntry.name === "Área de Estudio"
              ? areaOpacity
              : mapEntry.name === "Paisajes"
              ? paisajeOpacity
              : mapEntry.name === "Municipios"
              ? municipiosOpacity
              : // extra layers
                extraOpacities[
                  extraLoaded.find((el) =>
                    el.label.toLowerCase().includes(mapEntry.name.toLowerCase())
                  )?.key
                ] || 1
          ).toString();
          slider.style.width = "80px";
          slider.addEventListener("pointerdown", (e) => e.stopPropagation());
          slider.addEventListener("mousedown", (e) => e.stopPropagation());
          slider.addEventListener("click", (e) => e.stopPropagation());
          slider.addEventListener("input", (e) => {
            const v = parseFloat(e.target.value);
            // llamar al setter React correspondiente
            mapEntry.setter(v);
          });

          // botón de descarga
          const btn = document.createElement("button");
          btn.type = "button";
          btn.title = "Descargar capa";
          btn.textContent = "⬇️";
          btn.style.cursor = "pointer";
          btn.style.padding = "4px 6px";
          btn.addEventListener("pointerdown", (e) => e.stopPropagation());
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (mapEntry.data) {
              downloadLayerData(mapEntry.data, mapEntry.filename);
            } else {
              // si no hay data in-memory, pero es la capa principal y existe geoJsonUrl, intentar fetch
              if (mapEntry.name === mainLayerLabel && geoJsonUrl) {
                downloadGeoJson();
              } else {
                alert("No hay datos disponibles para descargar.");
              }
            }
          });

          controlsWrapper.appendChild(slider);
          controlsWrapper.appendChild(btn);

          // insertar junto al label (no reemplaza)
          label.appendChild(controlsWrapper);
        });
      } catch (err) {
        console.error("Error al inyectar controles en LayersControl:", err);
      }
    };

    // ejecutar ahora y también con un pequeño delay para cubrir actualizaciones del DOM
    addControlsToLayersPanel();
    const t = setTimeout(addControlsToLayersPanel, 300);
    // limpiar
    return () => clearTimeout(t);
  }, [
    mapInstance,
    areaBorders,
    paisajeBorders,
    municipiosBorders,
    geoData,
    mainLayerOpacity,
    areaOpacity,
    paisajeOpacity,
    municipiosOpacity,
    extraLoaded,
    extraOpacities,
    mainLayerLabel,
    geoJsonUrl,
  ]);

  // Efecto para escuchar overlayadd / overlayremove y elegir capa para gráfico
  useEffect(() => {
    if (!mapInstance) return;

    const nameToKey = {};
    // base
    nameToKey["Área de Estudio"] = "areaBorders";
    nameToKey["Paisajes"] = "paisajeBorders";
    nameToKey["Municipios"] = "municipiosBorders";
    // main
    nameToKey[mainLayerLabel] = "main";
    // extra
    extraLoaded.forEach((el) => (nameToKey[el.label] = el.key));

    const onAdd = (e) => {
      setVisibleOverlays((prev) => ({ ...prev, [e.name]: true }));
      const k = nameToKey[e.name];
      if (!k) return;
      const extraCfg = extraLoaded.find((x) => x.key === k);
      if (k === "main" || (extraCfg && extraCfg.chartable)) {
        // preferir la última capa chartable activada
        setActiveChartLayerKey(k);
      }
    };
    const onRemove = (e) => {
      setVisibleOverlays((prev) => ({ ...prev, [e.name]: false }));
      const k = nameToKey[e.name];
      if (!k) return;
      if (activeChartLayerKey === k) {
        // buscar otra visible chartable
        // prioridad: main si visible, sino la primera extra visible y chartable
        if (visibleOverlays[mainLayerLabel]) {
          setActiveChartLayerKey("main");
        } else {
          const found = extraLoaded.find(
            (el) => visibleOverlays[el.label] && el.chartable
          );
          setActiveChartLayerKey(found ? found.key : "main");
        }
      }
    };

    mapInstance.on("overlayadd", onAdd);
    mapInstance.on("overlayremove", onRemove);

    // inicializar visibles por defecto (cuando se crea el control)
    setTimeout(() => {
      const initial = {};
      const layersControl = mapInstance
        .getContainer()
        .querySelector(".leaflet-control-layers");
      if (layersControl) {
        const items = layersControl.querySelectorAll(
          ".leaflet-control-layers-overlays li"
        );
        items.forEach((li) => {
          const inp = li.querySelector("input[type=checkbox]");
          const lbl = li.querySelector("label");
          const name =
            (lbl &&
              (lbl.querySelector("span")?.textContent || lbl.textContent)) ||
            "";
          initial[name.trim()] = inp ? inp.checked : false;
        });
        setVisibleOverlays(initial);

        // si main está visible y chartable, seleccionarlo
        if (initial[mainLayerLabel]) setActiveChartLayerKey("main");
        else {
          const found = extraLoaded.find(
            (el) => initial[el.label] && el.chartable
          );
          if (found) setActiveChartLayerKey(found.key);
        }
      }
    }, 300);

    return () => {
      mapInstance.off("overlayadd", onAdd);
      mapInstance.off("overlayremove", onRemove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mapInstance,
    extraLoaded,
    mainLayerLabel,
    visibleOverlays,
    activeChartLayerKey,
  ]);

  const chartData = useMemo(() => {
    // elegir fuente según activeChartLayerKey
    let source = null;
    let useCategoria = categoriaCol;
    let useHectareas = hectareasCol;

    if (activeChartLayerKey === "main") {
      source = geoData;
    } else if (activeChartLayerKey === "areaBorders") {
      source = areaBorders;
    } else if (activeChartLayerKey === "paisajeBorders") {
      source = paisajeBorders;
    } else if (activeChartLayerKey === "municipiosBorders") {
      source = municipiosBorders;
    } else {
      // extra
      const el = extraLoaded.find((x) => x.key === activeChartLayerKey);
      if (el) {
        source = el.data;
        if (el.categoriaCol) useCategoria = el.categoriaCol;
        if (el.hectareasCol) useHectareas = el.hectareasCol;
      }
    }

    if (!source) return null;

    // si la capa no tiene features, no mostrar gráfico
    if (!source.features || source.features.length === 0) return null;

    let featuresToInclude = source.features;

    // si hay selección por delimitación aplicarla (igual que antes)
    if (selectedArea && selectedDelimitation !== "all") {
      featuresToInclude =
        featuresToInclude.filter(
          (f) => f.properties[selectedDelimitation] === selectedArea
        ) || [];
    }

    const summary = featuresToInclude.reduce((acc, feat) => {
      const categoria = feat.properties[useCategoria] ?? "Sin dato";
      const hectareas = parseFloat(feat.properties[useHectareas]) || 0;
      acc[categoria] = (acc[categoria] || 0) + hectareas;
      return acc;
    }, {});

    const labels = Object.keys(summary);
    // usar la escala correspondiente a la capa activa para colorear el chart
    const scaleForActive =
      colorScalesByKey[activeChartLayerKey] || colorScaleMain;
    return {
      labels,
      datasets: [
        {
          data: Object.values(summary),
          backgroundColor: labels.map((label) =>
            toRGBA(scaleForActive(label), 0.5)
          ),
        },
      ],
    };
  }, [
    geoData,
    selectedArea,
    selectedDelimitation,
    categoriaCol,
    hectareasCol,
    activeChartLayerKey,
    areaBorders,
    paisajeBorders,
    municipiosBorders,
    extraLoaded,
    colorScalesByKey,
  ]);

  const chartOptions = {
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 12,
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            const valueMiles = Math.round(value / 1000);
            return `${label}: ${valueMiles.toLocaleString()} mil ha (${percentage}%)`;
          },
        },
      },
      datalabels: showChartLabels
        ? {
            color: "#000",
            font: {
              weight: "bold",
              size: 12,
            },
            formatter: (value, context) => {
              const total = context.chart.data.datasets[0].data.reduce(
                (a, b) => a + b,
                0
              );
              const percentage = Math.round((value / total) * 100);
              const valueMiles = Math.round(value / 1000);
              return `${valueMiles.toLocaleString()} mil\n(${percentage}%)`;
            },
          }
        : {
            display: false,
          },
    },
    maintainAspectRatio: false,
  };

  // Construye items de leyenda para una key de capa
  const getLegendItems = (layerKey) => {
    try {
      const scale = colorScalesByKey[layerKey] || colorScaleMain;
      let categories = [];

      if (
        scale &&
        typeof scale.domain === "function" &&
        scale.domain().length
      ) {
        categories = scale.domain();
      } else {
        // intentar obtener categorías desde los datos de la capa
        let source = null;
        if (layerKey === "main") source = geoData;
        else if (layerKey === "areaBorders") source = areaBorders;
        else if (layerKey === "paisajeBorders") source = paisajeBorders;
        else if (layerKey === "municipiosBorders") source = municipiosBorders;
        else {
          const extra = extraLoaded.find((el) => el.key === layerKey);
          source = extra?.data;
        }

        if (source && source.features) {
          const set = new Set();
          source.features.forEach((f) => {
            const v = f.properties?.[categoriaCol] ?? "Sin dato";
            set.add(v);
          });
          categories = Array.from(set);
        }
      }

      // transformar a objetos {label, color}
      return categories.map((c) => ({
        label: c,
        color: scale ? scale(c) : "#999",
      }));
    } catch (err) {
      return [];
    }
  };

  return (
    <div
      className="mapchart-responsive-container"
      style={{
        position: "relative",
        width: "100%",
        height: "70vh",
        minHeight: 400,
      }}
    >
      {mapTitle && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 600,
            zIndex: 1000,
            background: "rgba(255,248,230,0.95)",
            padding: "8px 16px",
            borderRadius: 8,
            fontFamily: "Roboto",
            fontWeight: 800,
            fontSize: 25,
            color: "#333",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            pointerEvents: "none",
          }}
        >
          {mapTitle}
        </div>
      )}

      {/* Controles siempre visibles */}
      <div
        className="mapchart-controls"
        style={{ marginTop: 48 /* ajustar px según necesites */ }}
      >
        {showDelimitationControl && (
          <div>
            <label htmlFor="delimitationSelect" style={styles.label}>
              Delimitar por:
            </label>
            <select
              id="delimitationSelect"
              value={selectedDelimitation}
              onChange={(e) => {
                setSelectedDelimitation(e.target.value);
                resetView();
              }}
              style={styles.select}
            >
              {DELIMITATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showPaletteControl && (
          <div>
            <label htmlFor="paletteSelect" style={styles.label}>
              Paleta de colores:
            </label>
            <select
              id="paletteSelect"
              value={selectedPaletteName}
              onChange={(e) => setSelectedPaletteName(e.target.value)}
              style={styles.select}
            >
              {Object.keys(paletteOptions).map((name) => (
                <option key={name} value={name}>
                  {name.replace("scheme", "")}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedArea && (
          <button onClick={resetView} style={styles.button}>
            Mostrar todo
          </button>
        )}

        {/* NOTE: Opacidad movida dentro del panel retráctil (children) */}
      </div>

      <div className="mapchart-maparea" style={{ position: "relative" }}>
        {!showLegend && (
          <button
            onClick={() => setShowLegend(true)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 1400,
              padding: "6px 8px",
              borderRadius: 8,
              background: "#fff",
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            Leyenda
          </button>
        )}
        {/* Compact legend (small, always visible) */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1400,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 6,
            padding: "6px 8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            maxHeight: 160,
            overflow: "auto",
            minWidth: 140,
            fontSize: 12,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {capitalizeFirstLetter(categoriaCol)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {getLegendItems(activeChartLayerKey).map((it) => (
              <div
                key={it.label}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: it.color,
                    border: "1px solid #ccc",
                  }}
                />
                <div style={{ fontSize: 11 }}>{it.label}</div>
              </div>
            ))}
          </div>
        </div>
        {showFullExtent && fullExtentBounds && (
          <div
            style={{
              position: "absolute",
              bottom: 100, // arriba de la escala (bottomright)
              right: 16,
              width: 180,
              height: 140,
              zIndex: 1100,
              border: "1px solid #999",
              background: "#fff",
              borderRadius: 6,
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <MapContainer
              style={{ width: "100%", height: "100%" }}
              bounds={fullExtentBounds}
              zoomControl={false}
              attributionControl={false}
              dragging={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
              boxZoom={false}
              keyboard={false}
              preferCanvas
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution=""
              />
              {areaBorders && (
                <GeoJSON
                  data={areaBorders}
                  style={{
                    color: "#000",
                    weight: 2,
                    fillOpacity: 0,
                    dashArray: "4 2",
                  }}
                />
              )}
              {geoData && (
                <GeoJSON
                  data={geoData}
                  style={{ color: "#1565c0", weight: 1, fillOpacity: 0 }}
                />
              )}
              {mainBounds && (
                <Rectangle
                  bounds={mainBounds}
                  pathOptions={{ color: "#ff5722", weight: 2, fillOpacity: 0 }}
                />
              )}
            </MapContainer>
            <div
              style={{
                position: "absolute",
                top: 2,
                left: 4,
                fontSize: 10,
                background: "rgba(255,255,255,0.7)",
                padding: "1px 4px",
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              Extensión
            </div>
          </div>
        )}
        <RetractableMapControls
          panelTitle="Herramientas"
          position={{ bottom: 40, left: 14 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={downloadGeoJson}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#e8f5e9",
                  color: "#222",
                  border: "1px solid #d7c9b5",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                ⬇️ Descargar GeoJSON
              </button>

              <button
                onClick={() => exportMapAsImage(mapInstance)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#e3f2fd",
                  color: "#222",
                  border: "1px solid #d7c9b5",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                📷 Exportar Mapa
              </button>
            </div>

            {/* Controles de opacidad dentro del panel retráctil */}
            <div style={{ marginTop: 4 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                Opacidad de capas
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 12,
                  }}
                >
                  {mainLayerLabel}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={mainLayerOpacity}
                    onChange={(e) =>
                      setMainLayerOpacity(parseFloat(e.target.value))
                    }
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 12,
                  }}
                >
                  Área de Estudio
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={areaOpacity}
                    onChange={(e) => setAreaOpacity(parseFloat(e.target.value))}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 12,
                  }}
                >
                  Paisajes
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={paisajeOpacity}
                    onChange={(e) =>
                      setPaisajeOpacity(parseFloat(e.target.value))
                    }
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    fontSize: 12,
                  }}
                >
                  Municipios
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={municipiosOpacity}
                    onChange={(e) =>
                      setMunicipiosOpacity(parseFloat(e.target.value))
                    }
                  />
                </label>

                {extraLoaded.map((el) => (
                  <label
                    key={el.key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      fontSize: 12,
                    }}
                  >
                    {el.label}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={extraOpacities[el.key] ?? 1}
                      onChange={(e) =>
                        setExtraOpacities((prev) => ({
                          ...prev,
                          [el.key]: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </RetractableMapControls>
        <MapContainer
          center={[23.6345, -102.5528]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          whenCreated={handleMapCreated}
          ref={(mapRef) => {
            if (mapRef) {
              console.log("📍 MapContainer ref obtenido");
              handleMapCreated(mapRef);
            }
          }}
        >
          <LayersControl position="topleft">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satélite (ESRI)">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              />
            </LayersControl.BaseLayer>

            {areaBorders && (
              <LayersControl.Overlay checked name="Área de Estudio">
                <GeoJSON
                  data={areaBorders}
                  style={() => ({
                    color: "black",
                    weight: 4,
                    fillOpacity: 0,
                    opacity: areaOpacity,
                  })}
                />
              </LayersControl.Overlay>
            )}

            {paisajeBorders && (
              <LayersControl.Overlay checked name="Paisajes">
                <GeoJSON
                  data={paisajeBorders}
                  style={() => ({
                    color: "black",
                    weight: 3,
                    fillOpacity: 0,
                    opacity: paisajeOpacity,
                  })}
                />
              </LayersControl.Overlay>
            )}

            {municipiosBorders && (
              <LayersControl.Overlay checked name="Municipios">
                <GeoJSON
                  data={municipiosBorders}
                  style={() => ({
                    color: "#fff",
                    weight: 1,
                    fillOpacity: 0,
                    opacity: municipiosOpacity,
                  })}
                />
              </LayersControl.Overlay>
            )}

            {geoData && (
              <LayersControl.Overlay checked name={mainLayerLabel}>
                <GeoJSON
                  key={`${selectedDelimitation}-${selectedArea}-${mainLayerOpacity}`}
                  data={geoData}
                  style={(feature) => {
                    const base = getFeatureStyle
                      ? getFeatureStyle(feature)
                      : getBaseStyle();
                    return {
                      ...base,
                      fillOpacity: mainLayerOpacity,
                      opacity: Math.max(0.15, mainLayerOpacity),
                    };
                  }}
                  onEachFeature={onEachFeature}
                  ref={geoJsonLayerRef}
                />
              </LayersControl.Overlay>
            )}

            {/* capas extra dinámicas */}
            {extraLoaded.map((el) =>
              el.data ? (
                <LayersControl.Overlay key={el.key} checked name={el.label}>
                  <GeoJSON
                    data={el.data}
                    style={(feature) => {
                      const scale = colorScalesByKey[el.key];
                      const fillColor = scale
                        ? scale(
                            feature.properties[el.categoriaCol || categoriaCol]
                          )
                        : "#888";
                      return {
                        color: "#444",
                        weight: 1,
                        fillOpacity: 0.6,
                        opacity: extraOpacities[el.key] ?? 1,
                        fillColor,
                      };
                    }}
                    onEachFeature={(feature, layer) => {
                      // tooltip/bindPopup básico; puedes personalizar por capa
                      const categoria =
                        feature.properties[el.categoriaCol || categoriaCol] ??
                        "Sin dato";
                      layer.bindPopup(`<b>${el.label}</b><br/>${categoria}`);
                    }}
                  />
                </LayersControl.Overlay>
              ) : null
            )}
          </LayersControl>
        </MapContainer>
        {/* Mini-map sincronizado (opcional, retractil) */}
        {showMiniMap && (
          <RetractableMapControls
            collapsedLabel="🗺️"
            panelTitle="Mini mapa"
            position={{ bottom: 40, right: 16 }}
          >
            <div
              style={{
                width: 220,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>Mini mapa</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setMiniControlVisible((v) => !v)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  {miniControlVisible ? "Ocultar mini" : "Mostrar mini"}
                </button>
                <div style={{ fontSize: 12, color: "#444" }}>
                  El mini-mapa del plugin se mostrará en la esquina del mapa.
                </div>
              </div>
            </div>
          </RetractableMapControls>
        )}
      </div>

      {showChart && chartData && (
        <div
          className="mapchart-chart"
          style={{
            transition: "all 220ms ease",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px" }}>
              {activeChartLayerKey === "main"
                ? selectedArea
                  ? `Distribución de ${capitalizeFirstLetter(
                      categoriaCol
                    )} en ${selectedArea}`
                  : `Distribución de ${capitalizeFirstLetter(
                      categoriaCol
                    )} en Área de Estudio`
                : (() => {
                    const el = extraLoaded.find(
                      (x) => x.key === activeChartLayerKey
                    );
                    const label = el ? el.label : activeChartLayerKey;
                    return selectedArea
                      ? `Distribución de ${capitalizeFirstLetter(
                          el?.categoriaCol || categoriaCol
                        )} en ${selectedArea} (${label})`
                      : `Distribución de ${capitalizeFirstLetter(
                          el?.categoriaCol || categoriaCol
                        )} en ${label}`;
                  })()}
            </h3>
            <button
              onClick={() => setChartCollapsed((c) => !c)}
              title={chartCollapsed ? "Expandir gráfico" : "Colapsar gráfico"}
              style={{
                height: 28,
                width: 28,
                minWidth: 28,
                borderRadius: 6,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              {chartCollapsed ? "▾" : "▴"}
            </button>
          </div>

          <div
            style={{
              height: chartCollapsed ? 0 : 300,
              transition: "height 220ms ease",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 300 }}>
              <Pie data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  label: {
    display: "block",
    marginBottom: "4px",
    fontWeight: 500,
    fontSize: "0.98em",
  },
  select: {
    minWidth: 120,
    maxWidth: 180,
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "0.98em",
    background: "#fafafa",
    marginBottom: 8,
  },
  button: {
    minWidth: 120,
    maxWidth: 180,
    padding: "6px 10px",
    backgroundColor: "#f5f5f5",
    color: "#1976d2",
    border: "1px solid #bdbdbd",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.98em",
    marginTop: 6,
    transition: "background 0.2s, color 0.2s",
  },
};

export default MapChart;
