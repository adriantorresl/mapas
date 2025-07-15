import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const TimeSeriesMapViewer = ({ geoJsonUrl = "/CUS_cambios.geojson" }) => {
  const [geoData, setGeoData] = useState(null);
  const [scale, setScale] = useState("area");
  const [selectedPaisaje, setSelectedPaisaje] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [yearIndex, setYearIndex] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);

  const mapRef = useRef();
  const geoJsonLayerRef = useRef();

  // Alterna el menú abierto
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Maneja la selección de escala/paisaje/municipio
  const handleMenuClick = (type, value) => {
    if (type === "scale") {
      setScale(value);
      setSelectedPaisaje("");
      setSelectedMunicipio("");
      setSelectedFeature(null);
    } else if (type === "paisaje") {
      setSelectedPaisaje(value);
      setSelectedMunicipio("");
      setSelectedFeature(null);
      setOpenMenu(null);
    } else if (type === "municipio") {
      setSelectedMunicipio(value);
      setSelectedFeature(null);
      setOpenMenu(null);
    }
  };

  // Maneja el clic en un polígono del mapa
  const handleFeatureClick = (feature, event) => {
    if (scale === "municipio") {
      setSelectedMunicipio(feature.properties.NOMGEO);
    } else if (scale === "paisaje") {
      setSelectedPaisaje(feature.properties.PAISAJE);
    }
    setSelectedFeature(feature);

    // Zoom al feature seleccionado
    if (event && event.target && mapRef.current) {
      mapRef.current.fitBounds(event.target.getBounds(), {
        padding: [50, 50],
        maxZoom: 12,
      });
    }
  };

  const years = ["S0_S1", "S1_S2", "S2_S3", "S3_S4", "S4_S5", "S5_S6", "S6_S7"];
  const labels = [1980, 1990, 2000, 2004, 2007, 2011, 2018];

  // Carga los datos GeoJSON
  useEffect(() => {
    fetch(geoJsonUrl)
      .then((res) => res.json())
      .then((data) => {
        setGeoData(data);
      })
      .catch((err) => console.error("Error cargando GeoJSON:", err));
  }, [geoJsonUrl]);

  // Ajusta la vista del mapa cuando cambian los datos o selecciones
  useEffect(() => {
    if (!mapRef.current || !geoData) return;

    const features = getFeaturesToRender();
    if (features.length === 0) return;

    if (selectedFeature) {
      // Si hay un feature seleccionado, hacer zoom a él
      const layer = L.geoJSON(selectedFeature);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 12,
        });
      }
    } else {
      // Si no hay selección, ajustar a todos los features visibles
      const layer = L.geoJSON(features);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geoData, selectedFeature, scale, selectedPaisaje, selectedMunicipio]);

  // Obtiene la lista de paisajes únicos
  const paisajes = geoData
    ? [...new Set(geoData.features.map((f) => f.properties.PAISAJE))]
    : [];

  // Obtiene municipios por paisaje
  const municipiosByPaisaje = (paisaje) =>
    geoData
      ? [
          ...new Set(
            geoData.features
              .filter((f) => f.properties.PAISAJE === paisaje)
              .map((f) => f.properties.NOMGEO)
          ),
        ]
      : [];

  // Filtra features para la tabla/resumen
  const getFilteredFeatures = () => {
    if (!geoData) return [];
    switch (scale) {
      case "paisaje":
        return selectedPaisaje
          ? geoData.features.filter(
              (f) => f.properties.PAISAJE === selectedPaisaje
            )
          : geoData.features;
      case "municipio":
        return selectedMunicipio
          ? geoData.features.filter(
              (f) => f.properties.NOMGEO === selectedMunicipio
            )
          : geoData.features;
      default:
        return geoData.features;
    }
  };

  // Obtiene features para renderizar en el mapa
  const getFeaturesToRender = () => {
    if (!geoData) return [];

    // Si hay una selección específica, mostrar solo los relevantes
    if (scale === "municipio" && selectedMunicipio) {
      return geoData.features.filter(
        (f) => f.properties.NOMGEO === selectedMunicipio
      );
    } else if (scale === "paisaje" && selectedPaisaje) {
      return geoData.features.filter(
        (f) => f.properties.PAISAJE === selectedPaisaje
      );
    }

    // Sin selección específica, mostrar todos
    return geoData.features;
  };

  // Define colores por tipo de cambio
  const getColorByType = (type) => {
    switch (type) {
      case "Deforestación":
        return "#FF0000";
      case "Revegetación":
        return "#90EE90";
      case "Permanencia antrópica":
        return "#FFFF00";
      case "Permanencia vegetación":
        return "#006400";
      default:
        return "#CCCCCC";
    }
  };

  // Obtiene el tipo de cambio para el año seleccionado
  const getFeatureChangeType = (feature) => {
    const yearKey = years[yearIndex];
    return feature.properties[yearKey] || null;
  };

  // Estilo base para los polígonos
  const getBaseStyle = () => ({
    weight: 1,
    opacity: 1,
    color: "#555",
    fillOpacity: 0.7,
  });

  // Estilo para cada feature según selección y tipo de cambio
  const getFeatureStyle = (feature) => {
    const baseStyle = getBaseStyle();
    const tipo = getFeatureChangeType(feature);
    const fillColor = getColorByType(tipo);

    // Determina si está seleccionado
    const isSelected =
      selectedFeature &&
      (feature.properties.NOMGEO === selectedFeature.properties.NOMGEO ||
        feature.properties.PAISAJE === selectedFeature.properties.PAISAJE);

    // Resalta el seleccionado
    if (isSelected) {
      return {
        ...baseStyle,
        fillColor,
        weight: 1,
        color: "#000",
        fillOpacity: 0.9,
      };
    }

    // Polígonos no seleccionados
    return {
      ...baseStyle,
      fillColor,
    };
  };

  // Para la tabla/resumen:
  const filteredFeatures = getFilteredFeatures();
  const aggregateHectareasByCategory = () => {
    const totals = {};
    filteredFeatures.forEach((feature) => {
      const yearKey = years[yearIndex];
      const cat = feature.properties[yearKey];
      const has = Number(feature.properties.HECTARES) || 0;
      if (cat) {
        totals[cat] = (totals[cat] || 0) + has;
      }
    });
    return totals;
  };
  const totals = aggregateHectareasByCategory();

  return (
    <div className="tsmv-container">
      <aside
        className="tsmv-sidebar"
        style={{
          width: "300px",
          height: "auto",
          padding: "15px",
          background: "#f5f5f5",
          borderRight: "1px solid #ddd",
          position: "relative",
        }}
      >
        <div>
          <h4>Seleccionar escala</h4>
          <ul
            className="tsmv-menu"
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            <li
              style={{
                cursor: "pointer",
                padding: "5px 0",
                fontWeight: scale === "area" ? "bold" : "normal",
              }}
              onClick={() => toggleMenu("scale")}
            >
              Área de estudio
              {openMenu === "scale" && (
                <ul
                  className="tsmv-submenu"
                  style={{
                    position: "absolute",
                    paddingLeft: "15px",
                    marginTop: "5px",
                    listStyle: "none",
                    background: "#fff", // <-- Fondo blanco sólido
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    zIndex: 1001,
                    padding: "8px 0",
                    minWidth: 160,
                  }}
                >
                  <li
                    style={{ cursor: "pointer", padding: "3px 0" }}
                    onClick={() => handleMenuClick("scale", "area")}
                  >
                    Área de estudio
                  </li>
                  <li
                    style={{ cursor: "pointer", padding: "3px 0" }}
                    onClick={() => handleMenuClick("scale", "paisaje")}
                  >
                    Paisaje
                  </li>
                  <li
                    style={{ cursor: "pointer", padding: "3px 0" }}
                    onClick={() => handleMenuClick("scale", "municipio")}
                  >
                    Municipio
                  </li>
                </ul>
              )}
            </li>
            {scale !== "area" && (
              <li
                style={{
                  cursor: "pointer",
                  padding: "5px 0",
                  fontWeight: scale === "paisaje" ? "bold" : "normal",
                }}
                onClick={() => toggleMenu("paisaje")}
              >
                Paisaje {selectedPaisaje ? `: ${selectedPaisaje}` : ""}
                {openMenu === "paisaje" && (
                  <ul
                    className="tsmv-submenu"
                    style={{
                      paddingLeft: "15px",
                      marginTop: "5px",
                      listStyle: "none",
                      background: "#fff", // <-- Fondo blanco sólido
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      zIndex: 1001,
                      padding: "8px 0",
                      minWidth: 160,
                    }}
                  >
                    {paisajes.length === 0 && (
                      <li style={{ padding: "3px 0" }}>Cargando...</li>
                    )}
                    {paisajes.map((p) => (
                      <li
                        key={p}
                        style={{
                          cursor: "pointer",
                          padding: "3px 0",
                          fontWeight: selectedPaisaje === p ? "bold" : "normal",
                        }}
                        onClick={() => handleMenuClick("paisaje", p)}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
            {scale === "municipio" && selectedPaisaje && (
              <li
                style={{
                  cursor: "pointer",
                  padding: "5px 0",
                  fontWeight: scale === "municipio" ? "bold" : "normal",
                }}
                onClick={() => toggleMenu("municipio")}
              >
                Municipio {selectedMunicipio ? `: ${selectedMunicipio}` : ""}
                {openMenu === "municipio" && (
                  <ul
                    className="tsmv-submenu"
                    style={{
                      paddingLeft: "15px",
                      marginTop: "5px",
                      listStyle: "none",
                      background: "#fff", // <-- Fondo blanco sólido
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      zIndex: 1001,
                      padding: "8px 0",
                      minWidth: 160,
                    }}
                  >
                    {municipiosByPaisaje(selectedPaisaje).map((m) => (
                      <li
                        key={m}
                        style={{
                          cursor: "pointer",
                          padding: "3px 0",
                          fontWeight:
                            selectedMunicipio === m ? "bold" : "normal",
                        }}
                        onClick={() => handleMenuClick("municipio", m)}
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Año</h4>
          <input
            type="range"
            min={0}
            max={years.length - 1}
            value={yearIndex}
            onChange={(e) => setYearIndex(Number(e.target.value))}
            step={1}
            style={{ width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            {labels.map((label, idx) => (
              <span
                key={label}
                style={{
                  fontSize: 12,
                  color: idx === yearIndex ? "#1976d2" : "#555",
                  fontWeight: idx === yearIndex ? "bold" : "normal",
                  minWidth: 24,
                  textAlign: "center",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Leyenda</h4>
          <table
            className="tsmv-leyenda-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
            }}
          >
            <tbody>
              <tr>
                <td style={{ backgroundColor: "#FF0000", width: "20px" }}></td>
                <td style={{ textAlign: "left" }}>Deforestación</td>
              </tr>
              <tr>
                <td style={{ backgroundColor: "#90EE90", width: "20px" }}></td>
                <td style={{ textAlign: "left" }}>Revegetación</td>
              </tr>
              <tr>
                <td style={{ backgroundColor: "#FFFF00", width: "20px" }}></td>
                <td style={{ textAlign: "left" }}>Permanencia antrópica</td>
              </tr>
              <tr>
                <td style={{ backgroundColor: "#006400", width: "20px" }}></td>
                <td style={{ textAlign: "left" }}>Permanencia vegetación</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Resumen hectáreas</h4>
          <table
            className="tsmv-summary-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #ddd",
                    background: "#eee",
                    textAlign: "center",
                  }}
                >
                  Categoría
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    background: "#eee",
                    textAlign: "center",
                  }}
                >
                  Hectáreas
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totals).length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    style={{
                      padding: "5px",
                      border: "1px solid #ddd",
                      textAlign: "left",
                    }}
                  >
                    No hay datos
                  </td>
                </tr>
              ) : (
                Object.entries(totals).map(([cat, ha]) => (
                  <tr key={cat}>
                    <td style={{ padding: "5px", border: "1px solid #ddd" }}>
                      {cat}
                    </td>
                    <td style={{ padding: "5px", border: "1px solid #ddd" }}>
                      {ha.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </aside>

      <main className="tsmv-maparea" style={{ flex: 1, height: "auto" }}>
        <MapContainer
          ref={mapRef}
          center={[23, -102]}
          zoom={5}
          style={{ height: "auto", width: "auto" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {geoData && (
            <GeoJSON
              key={`geojson-${scale}-${selectedPaisaje}-${selectedMunicipio}-${yearIndex}`}
              data={{
                type: "FeatureCollection",
                features: getFeaturesToRender(),
              }}
              style={getFeatureStyle}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: (e) => handleFeatureClick(feature, e),
                  mouseover: (e) => {
                    e.target.setStyle({
                      weight: 1,
                      color: "#666",
                      fillOpacity: 0.9,
                    });
                  },
                  mouseout: (e) => {
                    e.target.setStyle(getFeatureStyle(feature));
                  },
                });
              }}
              ref={geoJsonLayerRef}
            />
          )}
        </MapContainer>
      </main>
    </div>
  );
};

export default TimeSeriesMapViewer;
