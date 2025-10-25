import duracionHumedad from "../assets/media/duracion-humedad-suelo.png";
import piramidePoblacional from "../assets/media/piramide-poblacional.png";
import tendenciaClimatica from "../assets/media/tendencia-climatica.png";
import zonaCentralPieChart from "../assets/media/zona-central-pie-chart.png";
import pieChartTerritorio from "../assets/media/pie-chart-territorio.png";
import temperaturaPrecipitacion from "../assets/media/temperature-precipitacion.png";

export const dataPages = {
  pages: [
    {
      id: "0",
      data: [
        {
          type: "heading",
          content: "Localización",
        },
        {
          type: "text",
          content:
            "El área de estudio se localiza en la zona central del estado de Oaxaca, con una superficie total de 816,566.9 hectáreas.",
        },
        {
          type: "image",
          src: zonaCentralPieChart,
          title: "",
          alt: "Gráfica de zona central del estado de Oaxaca",
          caption:
            "",
        },
        {
          type: "text",
          content:
            "Los municipios incluidos en el paisaje biocultural de la Sierra de Yautepec y Valles Centrales: 59",
        },
        {
          type: "table",
          title: "Distribución de paisajes bioculturales",
          header: ["Paisaje", "Municipios", "Superficie", "%"],
          body: [
            ["Valles Centrales", "11", "401,208 has", "41%"],
            ["Sierra de Yautepec", "48", "415,358 has", "49%"],
          ],
        },
      ],
    },
    {
      id: "1.1.1",
      data: [
        {
          type: "heading",
          content: "Edafología",
        },
        {
          type: "text",
          content:
          "En el área de estudio se identifican 11 tipos de suelo, de los cuales ocho presentan condiciones óptimas para la producción de agaves, equivalentes al 90 % de la superficie total (macados en color amarillo)."
        },
        {
          type: "table",
          title: "Distribución de suelos por textura (hectáreas)",
          header: [[
            "Suelo / textura",
            "",
            "Sierra de Yautepec ",
            "",
            "",
            "Valles Centrales ",
            "",
          ],
        ["","Fina", "Media", "Gruesa","Fina", "Media", "Gruesa"]],
          body: [
            ["Regosol", "0", "25,278", "24,255", "0", "66,154", "4,694"],
            [
              "Phaeozem",
              "3,235",
              "16,998",
              "19,168",
              "18,449",
              "11,629",
              "303",
            ],
            ["Leptosol", "43,610", "72,452", "0", "36,377", "58,806", "321"],
            ["Luvisol", "35,491", "67,062", "0", "66,493", "22,652", "7,944"],
            ["Cambisol", "37,197", "40,724", "0", "28,640", "24,296", "1,098"],
            ["Calcisol", "0", "0", "0", "0", "12,756", "0"],
            ["Kastanozem", "0", "4,751", "0", "0", "0", "0"],
            ["Vertisol", "0", "0", "0", "9,162", "0", "0"],
            ["Fluvisol", "0", "981", "6,433", "0", "0", "4,421"],
            ["Acrisol", "0", "2,994", "0", "26,750", "10,844", "0"],
            ["Umbrisol", "379", "0", "0", "1,005", "0", "0"],
          ],
        },
        {
          type: "text",
          content:
          "La humedad del suelo varía entre 2 y 12 meses por año, predominando las zonas con 6 meses de humedad (212 mil has aproximadamente)."
        },
        {
          type: "text",
          content:
          "El periodo de lluvias se concentra de junio–septiembre, base de la agricultura de temporal."
        },
        {
          type: "image",
          src: duracionHumedad,
          title: "Duración de humedad en suelos",
          alt: "Gráfica de duración de humedad en suelos",
          caption:
            "Distribución de meses con humedad en los suelos del área de estudio",
        },
      ],
    },
    {
      id: "1.1.2",
      data: [
        {
          type: "heading",
          content: "Topografía",
        },
        {
          type: "text",
          content:
          "La altitud varía entre 250 y 3,319 msnm, siendo las zonas más altas el parteaguas entre ambos paisajes."
        },
        {
          type: "text",
          content:
          "El 34 % del territorio son valles (0–10°), el 38 % laderas medias (11–20°) y el 28 % pendientes fuertes (21–60°)."
        },
        {
          type: "image",
          src: pieChartTerritorio,
          title: "",
          alt: "Gráfica de distribución de territorio",
          caption:
            "",
        },
      ],
    },
    {
      id: "1.1.3",
      data: [
        {
          type: "heading",
          content: "Clima",
        },
        {
          type: "text",
          content:
          "En la entidad se presentan seis de los siete tipos de clima del país, faltando solo el clima frío. Predomina el semicálido (59 %), seguido del templado (22 %), cálido (18 %) y semifrío (1 %)."
        },
        {
          type: "table",
          title: "Distribución de tipos de clima (hectáreas)",
          header: [
            "Tipos de clima",
            "Árido",
            "Semiárido",
            "Subhúmedo",
            "Húmedo",
          ],
          body: [
            ["Cálido", "45,488", "100,972", "58", ""],
            ["Semicálido", "", "110,842", "350,395", "22,180"],
            ["Semifrío", "", "", "498", "5,254"],
            ["Templado", "", "7,708", "170,572", "2,600"],
          ],
        },
        {
          type: "text",
          content:
          "Los registros meteorológicos de 1985 a 2018 muestran un aumento de temperatura y una disminución de la precipitación en el estado."
        },
        {
          type: "image",
          src: temperaturaPrecipitacion,
          title: "",
          alt: "Gráfica de temperatura y precipitación",
          caption:
            "",
        },
        {
          type: "image",
          src: tendenciaClimatica,
          title: "",
          alt: "Gráfica de temperatura y precipitación",
          caption:
            "",
        },
      ],
    },
    {
      id: "1.1.4",
      data: [
        {
          type: "heading",
          content: "Vegetación y uso de suelo",
        },
        {
          type: "text",
          content:
          "En 2018 se identificaron 14 clases, 9 tipos de vegetación y 4 de uso de suelo. \n" +
          "Predomina la vegetación arbustiva (43 %), la agricultura de temporal (18 %) y la selva baja caducifolia (17 %). "
        },
        {
          type: "table",
          title: "Distribución de vegetación y uso de suelo",
          header: ["", "Hectáreas", "Porcentaje"],
          body: [
            ["Agua", "1,251", "0.2%"],
            ["Agricultura de temporal", "149,394", "18.3%"],
            ["Agricultura de riego", "14,350", "1.8%"],
            ["Ganadería", "32,196", "3.9%"],
            ["Urbano", "7,392", "0.9%"],
            ["Vegetación secundaria arbustiva", "354,497", "43.4%"],
            ["Selva baja caducifolia", "142,507", "17.5%"],
            ["Bosque de mezquite", "44", "0.0%"],
            ["Bosque de encino", "31,013", "3.8%"],
            ["Bosque de encino-pino", "16,365", "2.0%"],
            ["Bosque de pino", "12,176", "1.5%"],
            ["Bosque de pino-encino", "52,395", "6.4%"],
            ["Bosque de oyamel", "9", "0.0%"],
            ["Bosque mesófilo", "2,979", "0.4%"],
          ],
        },
        {
          type: "text",
          content:
          "El cambio de uso de suelo permite entender la dinámica del territorio a lo largo del tiempo, el análisis incluye siete series de tiempo (INEGI, 1980–2018)."
        },
        {
          type: "text",
          content:
          "Se clasificaron los usos en vegetación “V” y no vegetación “A”, obteniendo 14 combinaciones que muestran la edad y transformación."
        },
        {
          type: "table",
          title: "Procesos de cambio de uso de suelo y vegetación",
          header: [
            "Proceso de cambio",
            "Tipo de uso de suelo y vegetación",
            "Edad",
            "Hectárea",
            "Porcentaje",
          ],
          body: [
            [
              "A - A - A - A - A - A - A",
              "Agricultura Permanente",
              "> 38 años",
              "194,076",
              "22.1%",
            ],
            [
              "A - A - A - A - A - A",
              "Agricultura Permanente",
              "25 años",
              "12,349",
              "1.4%",
            ],
            [
              "A - A - A - A - A",
              "Agricultura Permanente",
              "16 años",
              "14,962",
              "1.7%",
            ],
            [
              "A - A - A - A",
              "Agricultura Temporal",
              "11 años",
              "6,439",
              "0.7%",
            ],
            ["A - A - A", "Agricultura Temporal", "7 años", "7,785", "0.9%"],
            ["A - A", "Agricultura Temporal", "4 años", "3,535", "0.4%"],
            [
              "V",
              "Vegetación Secundaria Herbácea",
              "< 4 años",
              "45,826",
              "5.2%",
            ],
            [
              "V - V",
              "Vegetación Secundaria Arbustiva",
              "4 años",
              "20,235",
              "2.3%",
            ],
            [
              "V - V - V",
              "Vegetación Secundaria Arbustiva",
              "7 años",
              "6,948",
              "0.8%",
            ],
            [
              "V - V - V - V",
              "Vegetación Secundaria Arbustiva",
              "11 años",
              "8,725",
              "1.0%",
            ],
            [
              "V - V - V - V - V",
              "Vegetación Secundaria Arbustiva",
              "16 años",
              "7,784",
              "0.9%",
            ],
            [
              "V - V - V - V - V - V",
              "Vegetación Secundaria Arbórea",
              "25 años",
              "12,135",
              "1.4%",
            ],
            [
              "V - V - V - V - V - V - V",
              "Vegetación Primaria Arbórea",
              "> 38 años",
              "539,343",
              "61.3%",
            ],
          ],
        },
      ],
    },
    {
      id: "1.1.5",
      data: [
        {
          type: "heading",
          content: "Áreas de protección",
        },
        {
          type: "text",
          content:
          "Se identifican dos Áreas Naturales Protegidas de carácter federal: el Monumento Nacional Yagul (1,077 ha) y la Reserva Estatal Hierve el Agua (4,129 ha), que en su conjunto suman 5,206 hectáreas."
        },
        {
          type: "text",
          content:
          "Además de siete Áreas Destinadas Voluntariamente a la Conservación que en conjunto suman cerca de 27,000 ha."
        },
      ],
    },
    {
      id: "1.2.1",
      data: [
        {
          type: "heading",
          content: "Población",
        },
        {
          type: "text",
          content:
          "Según el Censo de Población y Vivienda 2020, habitan 306,142 personas, de las cuales 146,249 son hombres y 159,893 mujeres, distribuidas en distintos grupos de edad."
        },
        {
          type: "image",
          src: piramidePoblacional,
          title: "",
          alt: "Pirámide poblacional",
          caption: "",
        },
        {
          type: "table",
          title: "Distribución de pobreza por paisaje",
          header: [
            "Paisaje",
            "Población Total",
            "Pobreza",
            "Pobreza moderada",
            "Pobreza extrema",
          ],
          body: [
            [
              "Sierra de Yautepec",
              "48,668",
              "81% (40,673)",
              "56% (7,956)",
              "26% (3,677)",
            ],
            [
              "Valles Centrales",
              "296,996",
              "76% (204,938)",
              "49% (30,494)",
              "27% (16,680)",
            ],
          ],
        },
        {
          type: "text",
          content:
          "El 15 % de los municipios presenta marginación muy alta y el 40 % alta, concentrando a la mayoría de la población en condiciones desfavorables. \n" +
          "Solo el 10 % muestra niveles bajos o muy bajos. \n" +
          "Estos datos reflejan una alta vulnerabilidad social en el territorio."
        },
        {
          type: "table",
          title: "Grado de marginación por región",
          header: [[
            "Grado de marginación",
            "Valles Centrales ",
            "",
            "Sierra de Yautepec",
            "",
          ],
        ["", "Nº de municipios", "Habitantes", "Nº de municipios", "Habitantes", ],],
          body: [
            ["Muy baja", "2", "14,154", "0", "0"],
            ["Baja", "3", "32,463", "1", "3,294"],
            ["Media", "14", "113,260", "6", "14,785"],
            ["Alta", "21", "106,285", "3", "18,559"],
            ["Muy alta", "8", "30,834", "1", "11,930"],
            ["Total", "48", "296,996", "11", "48,668"],
          ],
        },
      ],
    },
    {
      id: "1.2.2",
      data: [
        {
          type: "heading",
          content: "Actividades productivas",
        },
        {
          type: "text",
          content:
          "El 60.9 % de la población es económicamente activa, y de ella el 98.8 % tiene alguna ocupación. \n" +
          "No obstante, el 90.1 % trabaja en el sector informal, principalmente en actividades agrícolas y ganaderas."
        },
        {
          type: "table",
          title: "Indicadores laborales por región",
          header: [
            "",
            "Población total",
            "PEA",
            "PEA ocupada",
            "PEA ocupada informal",
          ],
          body: [
            ["Sierra de Yautepec", "38,844", "56.6%", "99.2%", "91.4%"],
            ["Valles Centrales", "267,405", "61.7%", "98.8%", "89.8%"],
          ],
        },
        {
          type: "text",
          content:
          "En 2023, se registraron 64,776 ha de superficie sembrada. \n" +
          "Diez municipios concentran el 69 % del total, destacando Miahuatlán de Porfirio Díaz con 9,636 ha (14.9 %)."
        },
        {
          type: "table",
          title: "Municipios con mayor superficie sembrada",
          header: [
            "Posición",
            "Municipio",
            "Superficie Sembrada (ha)",
            "% del total",
          ],
          body: [
            ["1", "Miahuatlán de Porfirio Díaz", "9,636", "14.9"],
            ["2", "Nejapa de Madero", "7,519", "11.6"],
            ["3", "Heroica Ciudad de Ejutla de Crespo", "5,921", "9.1"],
            ["4", "San Carlos Yautepec", "5,180", "8.0"],
            ["5", "San Luis Amatlán", "4,197", "6.5"],
            ["6", "San Dionisio Ocotepec", "3,780", "5.8"],
            ["7", "San José del Progreso", "2,598", "4.0"],
            ["8", "San Pedro Quiatoni", "2,562", "4.0"],
            ["9", "San Baltazar Chichicápam", "1,660", "2.6"],
            ["10", "San Pablo Villa de Mitla", "1,564", "2.4"],
            // ["Total de hectáreas sembradas en la zona de estudio (64,776.3 ha)."]
          ],
        },
      ],
    },
    {
      id: "2.1",
      data: [
        {
          type: "heading",
          content: "Erosión de suelos",
        },
        {
          type: "text",
          content:
          "La erosión hídrica es la principal causa de degradación del suelo.\n" +
          "Se identificaron zonas con alta pérdida de suelo por efecto de la lluvia, pendiente y uso del terreno. \n" +
          "Los valores fueron normalizados de 0 a 1000 para destacar las áreas con mayor riesgo de erosión."
        },
      ],
    },
    {
      id: "2.2.1",
      data: [
        {
          type: "heading",
          content: "Nitrogeno",
        },
        {
          type: "text",
          content:
          "El cambio de uso de suelo y la actividad agropecuaria, por la aplicación de agroquímicos, elevan la acumulación de nitrógeno. \n" +
          "Se destacan siete microcuencas críticas en Valles Centrales y una tendencia muy alta al 2100 en la Sierra de Yautepec."
        },
      ],
    },
    {
      id: "2.2.2",
      data: [
        {
          type: "heading",
          content: "Fosforo",
        },
        {
          type: "text",
          content:
          "En 2018, se identificaron 14 microcuencas con muy alta acumulación de fósforo y 12 con valores altos, abarcando gran parte de Valles Centrales. \n" +
          "Hacia 2100, se proyectan 135,458 ha con tendencia alta y 22,995 ha muy alta, concentradas en la Sierra de Yautepec, donde se requiere acciones preventivas."
        },
      ],
    },
    {
      id: "2.3",
      data: [
        {
          type: "heading",
          content: "Balance de Carbono",
        },
        {
          type: "text",
          content:
          "El almacenamiento y balance de carbono reflejan la capacidad de los ecosistemas para capturar o emitir gases. \n" +
          "En 2018, se estimaron 66.9 millones de toneladas de carbono concentradas en 9 microcuencas montañosas. \n" +
          "Estas zonas presentan la mayor tendencia a pérdida, con 131,154 ha en riesgo alto y 25,527 ha muy alto."
        },
      ],
    },
    {
      id: "2.4",
      data: [
        {
          type: "heading",
          content: "Abundancia de Polinizadores",
        },
        {
          type: "text",
          content:
          "Los polinizadores son esenciales para la agricultura y la biodiversidad. En el sistema agave–mezcal, los murciélagos nectarívoros cumplen este papel; se evaluaron cinco especies durante el año. \n" +
          "Los resultados muestran baja variación estacional y alta concentración en zonas agrícolas, por lo que se recomienda enfocar el análisis en los cultivos de agave para representar con mayor precisión este servicio ecosistémico."
        },
      ],
    },
    {
      id: "3.1",
      data: [
        {
          type: "heading",
          content: "Escenario actual",
        },
        {
          type: "text",
          content:
          ""
        },
        {
          type: "heading",
          content: "Escenarios con cambio climático",
        },
        {
          type: "text",
          content:
          "Se incorporaron proyecciones climáticas futuras (RCP 8.5, horizonte 2075–2099), sustituyendo las variables de temperatura y precipitación. Los resultados muestran un aumento de temperatura y disminución de lluvias, que modifican la aptitud del territorio y la distribución de zonas óptimas de producción agrícola."
        },
      ],
    },
    {
      id: "3",
      data: [
        {
          type: "heading",
          content: "Escenarios con cambio climático",
        },
        {
          type: "text",
          content:
          "El potencial productivo del territorio se determinó con base en variables agroclimáticas —edafología, precipitación, temperatura, pendiente y altitud—. Estas permiten identificar zonas con distintos niveles de productividad, mediante un análisis jerárquico que integra las condiciones físicas y climáticas actuales del paisaje."
        },
      ],
    },
    {
      id: "4.1",
      data: [
        {
          type: "heading",
          content: "Agave americana (Arroqueño)",
        },
        {
          type: "text",
          content:
          "El agave presenta alto potencial productivo y amplia plasticidad ecológica, adaptándose a diversos suelos y pendientes. \n" +
          "Es el prototipo de los magueyes, originario del noreste de México, y su mezcal destaca por su sabor dulce."
        },
        {
          type: "table",
          title: "Requerimientos agroecológicos - Agave Arroqueño",
          header: ["", "Óptimo", "Medio", "Bajo", "No apto/Marginal"],
          body: [
            [
              "Productividad (t/ha)",
              "75 ton/ha",
              "53 ton/ha",
              "21 ton/ha",
              "10 ton/ha",
            ],
            [
              "Precipitación media anual (mm)",
              "800 - 1500",
              "1500 - 2000 / 600 - 800",
              "2000 - 2400 / 400 - 600",
              "> 2400 / ≤ 400",
            ],
            [
              "Temperatura media anual (°C)",
              "18 - 22",
              "22 - 24 / 16 - 18",
              "24 - 26 / 12 - 16",
              "> 26 / ≤ 12",
            ],
            [
              "Edafología Perfil textura",
              "Chernozem: fina y media, Kastanozem: media, Luvisol: fina y media, Nitisol: media, Phaeozem: fina y media, Vertisol: fina y media",
              "Andosol: media, Calcisol: media, Cambisol: media, Leptosol: media, Lixisol: fina, gruesa, Luvisol: gruesa, Nitisol: fina, Phaeozem: gruesa, Umbrisol: media",
              "Acrisol: fina, media y gruesa, Arenosol: gruesa, Calcisol: fina y gruesa, Cambisol: fina y gruesa, Durisol: fina, media y gruesa, Gipsisol: media, Leptosol: fina y gruesa, Regosol: fina, media y gruesa, Umbrisol: fina y gruesa",
              "Fluvisol: fina, media y gruesa, Gleysol: fina, media y gruesa, Planosol: fina, media y gruesa, Solonchak: fina, media y gruesa",
            ],
            ["Pendiente (%)", "≤ 30", "30 - 35", "35 - 45", "> 45"],
            [
              "Altitud (msnm)",
              "800 - 1800",
              "1800 - 2000 / 600 - 800",
              "2000 - 2200 / 400 - 600",
              "> 2200 / < 400",
            ],
          ],
        },
        {
          type: "text",
          content:
          "El 42 % del territorio (340,332 ha) presenta condiciones óptimas para el cultivo de Agave americana, y el 57 % condiciones medias."
        } ,
        {
          type: "table",
          header: [
            "Potencial productivo actual",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Sierra de Yautepec", "232,283", "167,342", "101", "302"],
            ["Valles Centrales", "108,049", "300,058", "3,887", "1,943"],
          ],
        },
        {
          type: "text",
          content:
          "Al comparar los mapas de potencial productivo bajo condiciones actuales y escenarios de cambio climático, se identificaron tres tipos de cambio:\n" +
          "a) 244,831 ha (72 %) mantienen condición óptima, \n" +
          "b) 96,609 ha mejoran sus condiciones, y \n" +
          "c) 95,501 ha las pierden, principalmente en la Sierra de Yautepec. "
        },

      ],
    },
    {
      id: "4.2",
      data: [
        {
          type: "heading",
          content: "Agave Angustifolia (Espadín)",
        },
        {
          type: "text",
          content:
          "Es la especie más cultivada y distribuida en Oaxaca por su alto contenido de azúcares, rápido crecimiento y amplia adaptabilidad agroecológica, con rendimientos de hasta 75 t/ha."
        },
        {
          type: "table",
          title: "",
          header: ["", "Óptimo", "Medio", "Bajo", "No apto/Marginal"],
          body: [
            [
              "Productividad (t/ha)",
              "75 ton/ha",
              "59 ton/ha",
              "34 ton/ha",
              "10 ton/ha",
            ],
            [
              "Precipitación media anual (mm)",
              "500 - 1300",
              "1300 - 1700 / 400 - 500",
              "1700 - 2000 / 250 - 400",
              "> 2000 / ≤ 250",
            ],
            [
              "Temperatura media anual (°C)",
              "18 - 24",
              "24 - 26 / 16 - 18",
              "26 - 28 / 12 - 16",
              "> 28 / ≤ 12",
            ],
            [
              "Edafología Perfil Textura",
              "Chernozem: fina y media, Kastanozem: media, Luvisol: fina y media, Nitisol: media, Phaeozem: fina y media, Vertisol: fina y media",
              "Andosol: media, Calcisol: media, Cambisol: media, Leptosol: media, Lixisol: fina, gruesa, Luvisol: gruesa, Nitisol: fina, Phaeozem: gruesa, Umbrisol: media",
              "Acrisol: fina, media y gruesa, Arenosol: gruesa, Calcisol: fina y gruesa, Cambisol: fina y gruesa, Durisol: fina, media y gruesa, Gipsisol: media, Leptosol: fina y gruesa, Regosol: fina, media y gruesa, Umbrisol: fina y gruesa",
              "Fluvisol: fina, media y gruesa, Gleysol: fina, media y gruesa, Planosol: fina, media y gruesa, Solonchak: fina, media y gruesa",
            ],
            ["Pendiente (%)", "≤ 30", "30 - 35", "35 - 45", "> 45"],
            [
              "Altitud (msnm)",
              "600 - 1800",
              "1800 - 2000 / 400 - 600",
              "2000 - 2,200 / 300 - 400",
              "> 2,200",
            ],
          ],
        },
        {
          type: "text",
          content:
          "El 67 % del área evaluada (729,734 ha) presenta condiciones óptimas para el cultivo, concentradas en los Valles Centrales y la Sierra de Yautepec. \n" +
          "Un 12 % (81,889 ha) muestra aptitud media, y solo el 1 % (2,342 ha) se considera baja o no apta."
        },
        {
          type: "table",
          header: [
            "Potencial productivo actual",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Valles Centrales", "108,049", "300,058", "3,887", "1,943"],
            ["Sierra de Yautepec", "232,283", "167,342", "101", "302"],
          ],
        },
        {
          type: "text",
          content:
          "Bajo los escenarios de cambio climático, el 92 % del territorio mantiene aptitud óptima, con 396,174 ha en Valles Centrales y 365,717 ha en la Sierra de Yautepec. \n" +
          "Un 6 % presenta aptitud media, mientras que las áreas no aptas son mínimas, reflejando una alta resiliencia frente a futuros impactos climáticos."
        },
        {
          type: "table",
          header: [
            "Potencial productivo con cambio climático",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Valles Centrales", "396,174", "15,367", "0", "2,396"],
            ["Sierra de Yautepec", "365,717", "34,117", "194", "0"],
          ],
        },
        {
          type: "text",
          content:
          "Al comparar los escenarios actual y futuro bajo condiciones de cambio climático, se identifican tres tendencias:\n" +
          "a) 714,431 ha (92.7 %) mantienen condiciones óptimas, \n" +
          "b) 44,460 ha (5.7 %) mejoran su aptitud, y \n" +
          "c) 12,303 ha (1.6 %) la pierden, principalmente en la Sierra de Yautepec. "
        },
        {
          type: "table",
          header: [
            "",
            "Sin cambio",
            "Incremento",
            "Pérdida",
            "No apto",
          ],
          body: [
            ["Sierra de Yautepec", "36,0286", "5,431", "9,355", "24,956"],
            ["Valles Centrales", "357,145", "39,029", "2,948", "14,815"],
          ],
        },
      ],
    },
    {
      id: "4.3",
      data: [
        {
          type: "heading",
          content: "Agave Iyoba",
        },
        {
          type: "text",
          content:
          "Es una especie silvestre con alta adaptabilidad en zonas semiáridas de los Valles Centrales. Crece entre 1,500–1,700 msnm y pendientes de hasta 45 %, mostrando alta plasticidad ecológica. \n" +
          "Se recomienda su uso productivo en Valles Centrales y manejo silvestre en la Sierra de Yautepec."
        },
        {
          type: "table",
          title: "Requerimientos agroecológicos - Agave Iyoba",
          header: ["Parámetro", "Óptimo", "Medio", "Bajo", "No apto/Marginal"],
          body: [
            [
              "Productividad (t/ha)",
              "75 ton/ha",
              "53 ton/ha",
              "21 ton/ha",
              "10 ton/ha",
            ],
            [
              "Precipitación media anual (mm)",
              "500 - 700",
              "700 - 800 / 400 - 500",
              "800 - 1000 / 300 - 400",
              "> 1000 / ≤ 300",
            ],
            [
              "Temperatura media anual (°C)",
              "18 - 22",
              "22 - 24 / 16 - 18",
              "24 - 26 / 12 - 16",
              "> 26 / ≤ 12",
            ],
            [
              "Edafología Perfil textura",
              "Luvisol: media y fina, Vertisol: media, Regosol: media, Calcicol: media, Cambisol: media y fina, Phaeozem: media",
              "Andosol: media, Leptosol: media, Luvisol: gruesa, Umbrisol: media",
              "Acrisol: fina, media y gruesa, Arenosol: gruesa, Calcisol: fina y gruesa, Durisol: fina, media y gruesa, Gipsisol: media, Leptosol: fina y gruesa, Umbrisol: fina y gruesa",
              "Fluvisol: fina, media y gruesa, Gleysol: fina, media y gruesa, Planosol: fina, media y gruesa, Solonchak: fina, media y gruesa",
            ],
            ["Pendiente (%)", "≤ 30", "30 - 35", "35 - 45", "> 45"],
            [
              "Altitud (msnm)",
              "1500 - 1700",
              "1700 - 1900 / 1200 - 1500",
              "1900 - 2000 / 1000 - 1200",
              "> 2000 / < 1000",
            ],
          ],
        },
        {
          type: "text",
          content:
          "En el escenario actual, los Valles Centrales presentan 49 % (269,926 ha) con condición óptima, 25 % media y 12 % baja. \n" +
          "En la Sierra de Yautepec, el 26 % (140,091 ha) es óptimo, el 30 % medio y el 20 % bajo, con áreas no aptas menores al 1 %."
        },
        {
          type: "table",
          header: [
            "Potencial productivo actual",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Valles Centrales", "269,926", "76,526", "65,542", "1,943"],
            ["Sierra de Yautepec", "156,897", "102,738", "0", "302"],
          ],
        },
        {
          type: "text",
          content:
          "Bajo condiciones de cambio climático, los Valles Centrales conservan 15 % (81,989 ha) con aptitud óptima, mientras que el 33 % es media y el 26 % baja. \n" +
          "En la Sierra de Yautepec, el 45 % (238,748 ha) se mantiene óptimo, el 22 % medio y el 11 % bajo, con solo 0.4 % no apto"
        },
        {
          type: "table",
          header: [
            "Potencial productivo con cambio climático",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Valles Centrales", "81,989", "177,597", "140,442", "0"],
            ["Sierra de Yautepec", "238,748", "114,405", "58,388", "2,396"],
          ],
        },
        {type: "text",
          content:
          "La comparación entre escenarios muestra tres cambios principales:\n" +
          "a) 258,620 ha (69 %) mantienen su aptitud productiva en Valles Centrales, \n" +
          "b) 19,731 ha mejoran sus condiciones, y \n" +
          "c) 87,701 ha las pierden, con mayor afectación en la Sierra de Yautepec. "
        },
        {type: "table",
          header: [
            "",
            "Sin cambio",
            "Incremento",
            "Pérdida",
            "No apto",
          ],
          body: [
            ["Sierra de Yautepec", "104,228", "2,578", "62,427", "23,0795"],
            ["Valles Centrales", "258,620", "17,153", "25,274", "112,890"],
          ],
        },
      ],
    },
    {
      id: "4.4",
      data: [
        {
          type: "heading",
          content: "Agave Karwinskii",
        },
        {
          type: "text",
          content:
          "Es una especie endémica de Oaxaca con alto potencial productivo entre 1,000–1,700 msnm. \n" +
          "Crece en zonas con 500–700 mm de lluvia, 18–22 °C y suelos Luvisol, Leptosol y Cambisol, apta para producción sustentable y restauración ecológica."
        },
        {
          type: "table",
          title: "Requerimientos agroecológicos - Agave Karwinskii",
          header: ["Parámetro", "Óptimo", "Medio", "Bajo", "No apto/Marginal"],
          body: [
            [
              "Productividad (t/ha)",
              "75 ton/ha",
              "53 ton/ha",
              "21 ton/ha",
              "10 ton/ha",
            ],
            [
              "Precipitación media anual (mm)",
              "500 - 800",
              "800 - 1200 / 400 - 500",
              "1200 - 1500 / 350 - 400",
              "> 1500 / ≤ 350",
            ],
            [
              "Temperatura media anual (°C)",
              "18 - 22",
              "22 - 24 / 16 - 18",
              "24 - 26 / 12 - 16",
              "> 26 / ≤ 12",
            ],
            [
              "Edafología Perfil textura",
              "Regosol: fina, media y gruesa, Leptosol: fina y media, Cambisol: fina, Luvisol: fina y media, Phaeozem: fina y media, Vertisol: fina y media",
              "Andosol: media, Calcisol: media, Cambisol: media, Leptosol: media, Lixisol: fina, gruesa, Luvisol: gruesa, Nitisol: fina, Phaeozem: gruesa, Umbrisol: media",
              "Acrisol: fina, media y gruesa, Arenosol: gruesa, Calcisol: fina y gruesa, Cambisol: fina y gruesa, Durisol: fina, media y gruesa, Gipsisol: media, Leptosol: fina y gruesa, Umbrisol: fina y gruesa",
              "Fluvisol: fina, media y gruesa, Gleysol: fina, media y gruesa, Planosol: fina, media y gruesa, Solonchak: fina, media y gruesa",
            ],
            ["Pendiente (%)", "≤ 30", "30 - 35", "35 - 45", "> 45"],
            [
              "Altitud (msnm)",
              "1000 - 1700",
              "1700 - 2000 / 800 - 1000",
              "2000 - 2300 / 550 - 800",
              "> 2300 / < 550",
            ],
          ],
        },
        {
          type: "text",
          content:
          "Los Valles Centrales concentran 59 % (303,111 ha) con condición óptima, y la Sierra de Yautepec 35 % (173,078 ha) con aptitud media. \n" +
          "Las áreas no aptas son mínimas, favoreciendo el manejo sostenible."
        },
        {
          type: "table",
          header: [
            "Potencial productivo actual",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Sierra de Yautepec", "198,901", "173,078", "27,747", "302"],
            ["Valles Centrales", "303,111", "86,967", "21,916", "1,943"],
          ],
        },
        {
          type: "text",
          content:
          "Con el cambio climático, los Valles Centrales mantienen 58 % (299,728 ha) con aptitud óptima, mientras que la Sierra de Yautepec reduce a 28 %, aumentando la aptitud media (47 %)."
        },
        {
          type: "table",
          header: [
            "Potencial productivo con cambio climático",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Sierra de Yautepec", "137,312", "226,439", "36,277", "0"],
            ["Valles Centrales", "299,728", "104,556", "7,257", "2,396"],
          ],
        },
        {
          type: "text",
          content:
          "La comparación entre escenarios muestra:\n" +
          "a) Valles Centrales mantienen 54 % (280,001 ha) con condición óptima, \n" +
          "b) Sierra de Yautepec reduce a 28 % y aumenta áreas no aptas (42 %), \n" +
          "c) Mejoras mínimas (4 % y <1 %). \n" +
          "Se requiere priorizar estrategias de adaptación en la Sierra de Yautepec."
        },
        {
          type: "table",
          header: [
            "",
            "Sin cambio",
            "Incremento",
            "Pérdida",
            "No apto",
          ],
          body: [
            ["Sierra de Yautepec", "134,925", "2,387", "63,976", "19,8740"],
            ["Valles Centrales", "280,001", "19,727", "23,110", "91,099"],
          ],
        },
      ],
    },
    {
      id: "4.5",
      data: [
        {
          type: "heading",
          content: "Agave Marmorata (Tepeztate)",
        },
        {
          type: "text",
          content:
          "También conocido como pichomel o maguey curadero, se distribuye desde la cuenca del Balsas hasta el Istmo de Tehuantepec entre 680–1,600 msnm. \n" +
          "Alcanza 1.5–2 m y puede rendir hasta 75 t/ha en condiciones óptimas. \n" +
          "Por su lento crecimiento (12 a 35 años), requiere manejo técnico y uso en restauración productiva sustentable."
        },
        {
          type: "table",
          title: "Requerimientos agroecológicos - Agave Marmorata (Tepeztate)",
          header: ["Parámetro", "Óptimo", "Medio", "Bajo", "No apto/Marginal"],
          body: [
            [
              "Productividad (t/ha)",
              "75 ton/ha",
              "53 ton/ha",
              "21 ton/ha",
              "10 ton/ha",
            ],
            [
              "Precipitación media anual (mm)",
              "500 - 700",
              "700 - 800 / 400 - 500",
              "800 - 1000 / 300 - 400",
              "> 1000 / ≤ 300",
            ],
            [
              "Temperatura media anual (°C)",
              "18 - 22",
              "22 - 24 / 16 - 18",
              "24 - 26 / 12 - 16",
              "> 26 / ≤ 12",
            ],
            [
              "Edafología Perfil textura",
              "Luvisol: fina, Phaeozem: media, Leptosol: fina y media, Cambisol: fina, Regosol: media y gruesa",
              "Calcisol: media, Cambisol: media, Luvisol: media",
              "Calcisol: fina y gruesa, Cambisol: fina y gruesa, Phaeozem: gruesa",
              "Fluvisol: fina, media y gruesa, Gleysol: fina, media y gruesa, Planosol: fina, media y gruesa, Solonchak: fina, media y gruesa",
            ],
            ["Pendiente (%)", "≤ 30", "30 - 35", "35 - 45", "> 45"],
            [
              "Altitud (msnm)",
              "1000 - 1700",
              "1700 - 2000 / 800 - 1000",
              "2000 - 2300 / 550 - 800",
              "> 2300 / < 550",
            ],
          ],
        },
        {
          type: "text",
          content:
          "Bajo condiciones actuales, los Valles Centrales presentan 64 % (283,894 ha) con aptitud óptima, y la Sierra de Yautepec 37 % (166,655 ha). \n" +
          "Esta última muestra baja área no apta (0.1 %) y alta continuidad territorial, favoreciendo la expansión y adaptación sustentable."
        },
        {
          type: "table",
          header: [
            "Potencial productivo actual",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Sierra de Yautepec", "166,655", "153,448", "79,623", "302"],
            ["Valles Centrales", "283,894", "75,322", "52,778", "1,943"],
          ],
        },
        {
          type: "text",
          content:
          "En el escenario futuro, la Sierra de Yautepec conservaría 58 % (275,773 ha) con aptitud óptima, mientras que los Valles Centrales reducirían a 22 % (106,806 ha). \n" +
          "Las áreas no aptas son mínimas, reflejando alta capacidad de adaptación."
        },
        {
          type: "table",
          header: [
            "Potencial productivo con cambio climático",
            "Óptimo",
            "Medio",
            "Bajo",
            "No apto/Marginal",
          ],
          body: [
            ["Sierra de Yautepec", "275,773", "77,570", "58,198", "2,396"],
            ["Valles Centrales", "106,806", "176,887", "116,335", "0"],
          ],
        },
        {type: "text",
          content:
          "La comparación entre escenarios muestra:\n" +
          "a) 362,848 ha (77.2 %) mantienen condición óptima, \n" +
          "b) 19,731 ha (4.2 %) mejoran, y \n" +
          "c) 87,701 ha (18.6 %) la pierden, principalmente en la Sierra de Yautepec, donde el 49 % resulta no apto. \n" +
          "Se requiere priorizar estrategias de adaptación en la Sierra de Yautepec."
        },
        {type: "table",
          header: [
            "",
            "Sin cambio",
            "Incremento",
            "Pérdida",
            "No apto",
          ],
          body: [
            ["Sierra de Yautepec", "104,228", "2,578", "62,427", "230,795"],
            ["Valles Centrales", "258,620", "17,153", "25,274", "112,890"],
          ],
        },
      ],
    },
  ],
};
