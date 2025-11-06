import duracionHumedad from "../assets/media/duracion-humedad-suelo.png";
import piramidePoblacional from "../assets/media/piramide-poblacional.png";
import tendenciaClimatica from "../assets/media/tendencia-climatica.png";
import zonaCentralPieChart from "../assets/media/zona-central-pie-chart.png";
import pieChartTerritorio from "../assets/media/pie-chart-territorio.png";
import temperaturaPrecipitacion from "../assets/media/temperature-precipitacion.png";
import mapaZonificacionChart from "../assets/media/zonificacion-chart.png";

import mapaZonificacion from "../assets/media/tables/municipiosTable.png";
import edafologiaTable from "../assets/media/tables/edafologia.png";
import tiposClima from "../assets/media/tables/clima.png";
import cambioUsoSuelo from "../assets/media/tables/vegetacion.png";
import clasificacionUsoSuelo from "../assets/media/tables/clasificacionVegetacion.png";
import piramidePoblacionalTable from "../assets/media/tables/poblacion.png";
import actividadesProductivas from "../assets/media/tables/vulnerabilidad.png";
import actividadesGanaderasTable from "../assets/media/tables/actividadesGanaderas.png";
import superficieSembradaTable from "../assets/media/tables/superficieSembrada.png";
import agaveArroqueno1 from "../assets/media/tables/agaveArroqueno1.png";
import agaveArroqueno2 from "../assets/media/tables/agaveArroqueno2.png";
import agaveArroqueno3 from "../assets/media/tables/agaveArroqueno3.png";
import Angustifolia1 from "../assets/media/tables/Angustifolia1.png";
import Angustifolia2 from "../assets/media/tables/Angustifolia2.png";
import Angustifolia3 from "../assets/media/tables/Angustifolia3.png";
import Iyoba1 from "../assets/media/tables/Iyoba1.png";
import Iyoba2 from "../assets/media/tables/Iyoba2.png";
import Iyoba3 from "../assets/media/tables/Iyoba3.png";
import Karwinskii1 from "../assets/media/tables/Karwinskii1.png";
import Karwinskii2 from "../assets/media/tables/Karwinskii2.png";
import Karwinskii3 from "../assets/media/tables/Karwinskii3.png";
import Marmorata1 from "../assets/media/tables/Marmorata1.png";
import Marmorata2 from "../assets/media/tables/Marmorata2.png";
import Marmorata3 from "../assets/media/tables/Marmorata3.png";
import ZonificacionTable from "../assets/media/tables/Zonificacion.png";

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
          content:[
            {
              type: "paragraph",
              content: "El área de estudio se localiza en la zona central del estado de Oaxaca, con una superficie total de ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "816,566.9 hectáreas.",
              color: "#FFE699",
            }
          ]
        },
        {
          type: "image",
          src: zonaCentralPieChart,
          title: "",
          alt: "Gráfica de zona central del estado de Oaxaca",
          width: "60%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "Los municipios incluidos en el paisaje biocultural de la Sierra de Yautepec y Valles Centrales: ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "59",
              color: "#FFE699",
            }
          ]
        },
        {
          type: "image",
          src: mapaZonificacion,
          width: "90%",
          height: "auto",
          caption:
            "",
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
          content:[
            {
              type: "paragraph",
              content: "En el área de estudio se identifican ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "11 tipos de suelo,",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: " de los cuales ocho presentan condiciones óptimas para la producción de ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "agaves, equivalentes al ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "90 % de la superficie total",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: " (macados en color amarillo).",
              color: "#fff",
            }
          ]
        },
        {
          type: "image",
          src: edafologiaTable,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "La ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "humedad del suelo ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "varía entre",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "2 y 12 meses por año, ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "predominando las zonas con ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "6 meses de humedad",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "(212 mil has aproximadamente).",
              color: "#fff",
            },{
              type: "paragraph",
              content: "",
              color: "#FFE699",
            }
          ]
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "El periodo de lluvias se concentra de ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "junio–septiembre,",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "base de la agricultura de temporal.",
              color: "#fff",
            }
          ]
        },
        {
          type: "image",
          src: duracionHumedad,
          title: "",
          alt: "Gráfica de duración de humedad en suelos",
          caption:
            "",
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
          content:[
            {
              type: "paragraph",
              content: "La altitud varía entre ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "250 y 3,319 msnm,",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "siendo las zonas más altas el parteaguas entre ambos paisajes.",
              color: "#fff",
            }
          ]
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "El ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "34 % ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "del territorio son ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "valles ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "(0–10°), el ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "38 % ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "laderas medias (11–20°) y el",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "28 % ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "pendientes fuertes (21–60°).",
              color: "#fff",
            },
          ]
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
          content: [
            {
              type: "paragraph",
              content: "En la entidad se presentan ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "6 de los 7 tipos de clima del país, faltando solo el clima frío.",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "Predomina el semicálido (59 %), seguido del templado (22 %), cálido (18 %) y semifrío (1 %).",
              color: "#fff",
            },
          ]
        },
        {
          type: "image",
          src: tiposClima,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "Los registros meteorológicos de ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "1985 a 2018",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " muestran un ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "aumento de temperatura",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " y una ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "disminución de la precipitación",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " en el estado",
              color: "#fff"
            }
          ]
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
          content: [
            {
              type: "paragraph",
              content: "En 2018 se identificaron ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "14 clases, 9 tipos de vegetación y 4 de uso de suelo.",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "\nPredomina la vegetación arbustiva (43 %) la agricultura de temporal (18 %) y la selva baja caducifolia (17 %).",
              color: "#fff"
            },
          ]
        },
        {
          type: "image",
          src: cambioUsoSuelo,
          width: "90%",
          height: "auto",
          caption:
            "",
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
          type: "image",
          src: clasificacionUsoSuelo,
          width: "90%",
          height: "auto",
          caption:
            "",
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
          content: [
            {
              type: "paragraph",
              content: "Se identifican dos Áreas Naturales Protegidas de carácter federal: el Monumento Nacional Yagul (1,077 ha) y la Reserva Estatal Hierve el Agua (4,129 ha), que en su conjunto suman ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "5,206 hectáreas.",
              color: "#FFE699"
            }
          ]
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "Además de siete Áreas Destinadas Voluntariamente a la Conservación que en conjunto suman cerca de ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "27,000 ha.",
              color: "#FFE699"
            }
          ]
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
          content: [
            {
              type: "paragraph",
              content: "Según el ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "Censo de Población y Vivienda 2020",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: ", habitan ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "306,142 personas",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: ", de las cuales ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "146,249 son hombres",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: " y ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "159,893 mujeres",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: ", distribuidas en distintos grupos de edad.",
              color: "#fff",
            }
          ]
        },
        {
          type: "image",
          src: piramidePoblacional,
          title: "",
          alt: "Pirámide poblacional",
          caption: "",
        },
        {
          type: "image",
          src: piramidePoblacionalTable,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content:
          [
            {
              type: "paragraph",
              content: "El ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "15 %",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " de los municipios presenta ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "marginación muy alta",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " y el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "40 % alta,",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " concentrando a la mayoría de la población en condiciones desfavorables.",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Solo el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "10 %",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " muestra niveles ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "bajos o muy bajos.",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "\nEstos datos reflejan una ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "alta vulnerabilidad social",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " en el territorio.",
              color: "#fff"
            }
          ]
        },
        {
          type: "image",
          src: actividadesProductivas,
          width: "90%",
          height: "auto",
          caption:
            "",
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
          content: [
            {
              type: "paragraph",
              content: "El ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "60.9 % ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "de la población total es ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "económicamente activa",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: ", y de ella el ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "98.8 % ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "tiene alguna ocupación.",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "Sin embargo, el ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "90.1 % ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "trabaja en el ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "sector informal",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: ", principalmente en ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "actividades agrícolas y ganaderas.",
              color: "#FFE699",
            },
          ]
        },
        {
          type: "image",
          src: actividadesGanaderasTable,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "En ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "2023,",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " se registraron ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "64,776 ha",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " de superficie sembrada.",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "\nDiez municipios concentran el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "69 %",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " del total, destacando ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Miahuatlán de Porfirio Díaz",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " con ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "9,636 ha (14.9 %).",
              color: "#FFE699"
            },
          ]
        },
        {
          type: "image",
          src: superficieSembradaTable,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "Históricamente (2013-2023) son los cinco cultivos que concentran la mayor proporción de la superficie sembrada son:",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "el maíz en grano (78.1%), el agave (8.6%), los pastos para ganadería (5.2%), el frijol (3.5%) y el café (2.2%). ",
              color: "#FFE699"
            }
          ]
        }
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
          "Se identificaron zonas con alta pérdida de suelo por efecto de la lluvia, pendiente y uso del terreno. \n" 
        },
        {
          type: "text",
          content: "De acuerdo al uso de suelo Serie VII del 2018, en la zona de estudio son 8 las microcuencas (3, 4, 8, 9, 10, 11, 19, 26) que presentan una exportación muy alta de sedimentos y 9 microcuencas con valores altos (1, 6, 13, 14, 20, 21, 45, 63, 66), casi en su totalidad se localizan en el paisaje de La Sierra de Yautepec, por lo que esta región debe ser atendida para atender problemas de erosión."
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "De acuerdo al análisis tendencial a 100 años en la zona de estudio: \n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "• 367, 986 hectáreas, no presentan una tendencia de erosión \n"+
              "• 385, 964 hectáreas su tendencia es moderada \n"+
              "• 24,015 hectáreas alta \n"+
              "• 38,524 hectáreas muy alta.",
              color: "#FFE699"
            }
          ]
        }
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
          "La acumulación de nitrógeno es causada por la aplicación de agroquímicos en las zonas agropecuarias."
        },
        {
          type:"text",
          content: "Se destacan siete microcuencas críticas (42, 48, 50, 51, 59, 60, 70) en Valles Centrales y una tendencia media al 2100 en la Sierra de Yautepec (microcuencas 15, 16, 18 y 19). "
        },
        {
          type:"text",
          content: [
            {
              type: "paragraph",
              content: "La tendencia al 2100 en la zona de estudio identifica que: \n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: " • 688,857 hectáreas no presentan una tendencia en la acumulación de nitrógeno \n"+
                  " • 97,652 hectareas la tendencia es alta, \n"+
                  " • 24,015 hectáreas 10,968 hectáreas es muy alta, \n"+
                  " • 10,968 hectáreas es muy alta.",
              color: "#FFE699"
            }
          ]
        }
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
          "En 2018, se identificaron 14 microcuencas con muy alta acumulación de fósforo (29, 37, 41, 42, 46, 48, 50, 51, 57, 58, 59, 60, 70, 73) y 12 con valores altos (15, 18, 19, 26, 44, 45, 54, 56, 62, 67, 71, 72), abarcando gran parte de Valles Centrales."
        },
        {
          type:"text",
          content: [
            {
              type: "paragraph",
              content: "La tendencia al 2100 proyectan: \n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: " • 135,458 ha con tendencia alta \n"+
                  " • 22,995 ha muy alta",
              color: "#FFE699"
            }
          ]
        }
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
          "El almacenamiento y balance de carbono reflejan la capacidad de los ecosistemas para capturar o emitir gases. \n\n" +
          "En 2018, se estimaron 66.9 millones de toneladas de carbono concentradas principalmente en 9 microcuencas (3, 9, 11,19, 29, 37, 48, 60, 62). \n\n"
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "Así mismo, estas áreas presentan la mayor tendencia a pérdida, con \n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: " • 131,154 hectáreas con riesgo alto \n"+
                  " • 25,527 hectáreas con riesgo muy alto.",
              color: "#FFE699"
            }
          ]
        }
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
          content: "Escenarios de cambio climático",
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "La modelación de los impactos del cambio climático en el potencial productivo de agave, se utilizaron los parámetros con los que se construyó el Atlas Nacional de Vulnerabilidad al Cambio Climático  (INECC, 2023). \n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Para la construcción del ANVCC, el INECC utilizó el modelo ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "acoplado CMIP5",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "que consta de anomalías mensuales de 4 modelos de circulación general de la atmósfera que son:",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "CNRM-CM5, ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "HADGEM2-ES, MPI-ESM-LR, GFDL-CM3, así mismo considera tres horizontes de tiempo: \n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "• Corto de 2015 -2039 \n"+
              "• Mediano plazo de 2045 – 2069 \n"+
              "• Largo plazo de 2075 – 2099.",
              color: "#FFE699"
            }
          ]
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "Los escenarios muestran las anomalías en las temperaturas y los porcentajes de cambio en la precipitación, variables de los que dependen los sistemas productivos del agave.",
              color: "#fff"
            }
          ]
        }
      ],
    },
    {
      id: "4.1.1",
      data: [
        {
          type: "heading",
          content: "Agave americana (Arroqueño)",
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "El agave presenta ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "alto potencial productivo y amplia plasticidad ecológica, ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "adaptándose a diversos suelos y pendientes.",
              color: "#fff"
            }
          ]
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "El",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "42 % del territorio (340,332 ha)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "presenta ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "condiciones óptimas ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "para el cultivo de ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Agave americana, y el 57 % condiciones medias.",
              color: "#FFE699"
            }
          ]
        },
        {
          type: "image",
          src: agaveArroqueno1,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "Con el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "cambio climático, la Sierra de Yautepec pierde 31,573 ha óptimas,",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "mientras que ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Valles Centrales gana 32,681 ha.",
              color: "#FFE699"
            }
          ]
        } ,
        {
          type: "image",
          src: agaveArroqueno2,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "Al comparar el escenario actual con el impacto del cambio climático se identificaron tres tipos de cambio:",
              color: "#fff"
            }
          ]
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "I. 244,831 ha (72 %) ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "mantienen condición óptima,\n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "II. 96,609 ha ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "mejoran sus condiciones, y \n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "III. 95,501 ha ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "pierden su potencial productivo (principalmente en la ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Sierra de Yautepec). \n",
              color: "#FFE699"
            }
          ]
        },
        {
          type: "image",
          src: agaveArroqueno3,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
      ],
    },
    {
      id: "4.1.2",
      data: [
        {
          type: "heading",
          content: "Agave Angustifolia (Espadín)",
        },
        {
          type: "text",
          content:
          "Es la especie más cultivada y distribuida en Oaxaca por su alto contenido de azúcares, rápido crecimiento y amplia adaptabilidad agroecológica." 
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "El ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "67 %",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " del área evaluada (729,734 ha) presenta ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "condiciones óptimas",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " para el cultivo, concentradas en los Valles Centrales y la Sierra de Yautepec. Un ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "12 %",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " (81,889 ha) muestra ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "aptitud media",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: ", y solo el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "1 %",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " (2,342 ha) se considera ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "baja o no apta.",
              color: "#FFE699"
            }
          ]
        },
        {
          type: "image",
          src: Angustifolia1,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "Con ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "escenarios de cambio climático",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: ", el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "92 % del territorio",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " mantiene ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "aptitud óptima,",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " con ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "396,174 ha",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " en ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Valles Centrales",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " y ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "365,717 ha",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " en la ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "Sierra de Yautepec.",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " Un ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "6 %",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " presenta ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "aptitud media,",
              color: "#ebec89"
            },
            {
              type: "paragraph",
              content: " mientras que las áreas ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "no aptas son mínimas,",
              color: "#b7b7a4"
            },
            {
              type: "paragraph",
              content: " reflejando una ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "alta resiliencia",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " frente a futuros impactos climáticos.",
              color: "#fff"
            }
          ]
        },
        {
          type: "image", 
          src: Angustifolia2,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content:
            [
              {
                type: "paragraph",
                content: "Al comparar los ",
                color: "#fff"
              },
              {
                type: "paragraph",
                content: "escenarios actual y futuro",
                color: "#FFE699"
              },
              {
                type: "paragraph",
                content: " bajo ",
                color: "#fff"
              },
              {
                type: "paragraph",
                content: "condiciones de cambio climático",
                color: "#FFE699"
              },
              {
                type: "paragraph",
                content: ", se identifican tres tendencias:",
                color: "#fff"
              }
            ]
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "I.  ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "714,431 ha (92.7 %)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " mantienen condiciones óptimas.",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "\nII.  ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "44,460 ha (5.7 %)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " mejoran su aptitud.",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "\nIII.  ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "12,303 ha (1.6 %)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " la pierden su aptitud",
              color: "#fff"
            }
          ]
        },
        {
          type: "image",
          src: Angustifolia3,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
      ],
    },
    {
      id: "4.1.3",
      data: [
        {
          type: "heading",
          content: "Agave Iyoba",
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "Es una especie silvestre con alta adaptabilidad en zonas semiáridas de los Valles Centrales. \n\n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "El 50 % ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " del área ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "(410,091 ha) ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " presenta ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "condición óptima, ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "29 % media y 21 % baja.",
              color: "#FFE699"
            }
          ]
        },
        {
          type: "image",
          src: Iyoba1,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content:
                "Bajo condiciones de cambio climático se reduce la superficie al ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "39 % (320,737 ha)",
              color: "#FFE699", // Highlight same as table
            },
            {
              type: "paragraph",
              content: " con ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "aptitud óptima,",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: " mientras que el ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "36 %",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: " mantiene las condiciones medias y el ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "24 %",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: " baja.",
              color: "#fff",
            },
          ],
        },
        {
          type: "image",
          src: Iyoba2,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content:
                "La comparación entre escenarios muestra tres cambios principales:",
              color: "#fff",
            },
          ],
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "I.",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: " 258,620 ha (69%) ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "mantienen su ",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: "aptitud productiva óptima",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: ",",
              color: "#fff",
            },
          ],
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "II.",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: " 19,731 ha ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "mejoran su aptitud",
              color: "#fff",
            },
          ],
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "III.",
              color: "#fff",
            },
            {
              type: "paragraph",
              content: " 87,701 ha ",
              color: "#FFE699",
            },
            {
              type: "paragraph",
              content: "pierden su aptitud",
              color: "#fff",
            },
          ],
        },
        {
          type: "image",
          src: Iyoba3,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
      ],
    },
    {
      id: "4.1.4",
      data: [
        {
          type: "heading",
          content: "Agave Karwinskii",
        },
        {
          type: "text",
          content:[
            {
              type: "paragraph",
              content: "Es una especie endémica de Oaxaca con alto potencial productivo \n\n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "El ", color: "#fff" },
                { type: "text", text: "62 %", color: "#FFE699" },
                { type: "text", text: " del área (", color: "#fff" },
                { type: "text", text: "502,012ha", color: "#FFE699" },
                { type: "text", text: ") presenta ", color: "#fff" },
                { type: "text", text: "condición óptima", color: "#FFE699" },
                { type: "text", text: ", el ", color: "#fff" },
                { type: "text", text: "32 %", color: "#FFE699" },
                { type: "text", text: " media y ", color: "#fff" },
                { type: "text", text: "6 %", color: "#FFE699" },
                { type: "text", text: " baja.", color: "#fff" }
              ]
            }
          ]
        },
        {
          type: "image",
          src: Karwinskii1,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "Bajo condiciones de cambio climático se reduce la superficie al ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "54 % (437,040 ha)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " con ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "aptitud óptima",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: ", mientras que el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "41 % ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "mantiene las condiciones medias y el ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "5 % ",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: "baja.",
              color: "#fff"
            }
          ]
        },
        {
          type: "image",
          src: Karwinskii2,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: "La comparación entre escenarios muestra tres cambios principales:\n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "I. ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "414,926 ha (51 %)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " mantienen su aptitud productiva óptima.\n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "II. ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "22,114 ha (3 %)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " mejoran su aptitud.\n",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "III. ",
              color: "#fff"
            },
            {
              type: "paragraph",
              content: "87,086 ha (11 %)",
              color: "#FFE699"
            },
            {
              type: "paragraph",
              content: " pierden su aptitud.",
              color: "#fff"
            }
          ]
        },
        {
          type: "image",
          src: Karwinskii3,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
      ],
    },
    {
      id: "4.1.5",
      data: [
        {
          type: "heading",
          content: "Agave Marmorata (Tepeztate)",
        },
        {
          type: "text",
          content:
          "También conocido como pichomel o maguey curadero, se distribuye desde la cuenca del Balsas hasta el Istmo de Tehuantepec. "
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "El ", color: "#fff" },
                { type: "text", text: "55 %", color: "#ffe26f" },
                { type: "text", text: " del área (", color: "#fff" },
                { type: "text", text: "450,549 ha", color: "#ffe26f" },
                { type: "text", text: ") presenta ", color: "#fff" },
                { type: "text", text: "condición óptima", color: "#ffe26f" },
                { type: "text", text: ", el ", color: "#fff" },
                { type: "text", text: "28 %", color: "#ffe26f" },
                { type: "text", text: " media y ", color: "#fff" },
                { type: "text", text: "16 %", color: "#ffe26f" },
                { type: "text", text: " baja.", color: "#fff" },
              ],
            },
          ]
        },
        {
          type: "image",
          src: Marmorata1,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Bajo condiciones de cambio climático se reduce la superficie al ", color: "#fff" },
                { type: "text", text: "47 % (382,579 ha)", color: "#ffe26f" },
                { type: "text", text: " con ", color: "#fff" },
                { type: "text", text: "aptitud óptima", color: "#ffe26f" },
                { type: "text", text: ", mientras que el ", color: "#fff"},
                { type: "text", text: "31 %", color: "#e5c02d" },
                { type: "text", text: " mantiene las condiciones medias y el ", color: "#fff" },
                { type: "text", text: "21 %", color: "#ffe26f" },
                { type: "text", text: " baja.", color: "#fff" },
              ],
            }
          ],
        },
        {
          type: "image",
          src: Marmorata2,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "La comparación entre escenarios muestra tres cambios principales: \n", color: "#fff", fontSize: "1rem" },
              ],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "I. ", color: "#fff" },
                { type: "text", text: "362,848 ha (45 %)", color: "#ffe26f" },
                { type: "text", text: " mantienen su aptitud productiva óptima,\n", color: "#fff" }
              ]
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "II. ", color: "#fff"},
                { type: "text", text: "19,731 ha (2 %)", color: "#ffe26f"},
                { type: "text", text: " mejoran su aptitud.\n", color: "#fff"}
              ]
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "III. ", color: "#fff"},
                { type: "text", text: "87,701 ha (11 %)", color: "#ffe26f"},
                { type: "text", text: " pierden su aptitud.", color: "#fff"}
              ]
            }
          ]
        },
        {
          type: "image",
          src: Marmorata3,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
      ],
    },
    {
      id: "5.1",
      data: [
        {
          type: "heading",
          content: "Plan de Manejo Integral del paisaje - Zonificación",
        },
        {
          type: "text",
          content:
          "La zonificación considera variables ecológicas, sociales y productivas, seleccionadas por su relevancia en la determinación de conflictos y oportunidades en el paisaje. "
        },
        {
          type: "image",
          src: ZonificacionTable,
          width: "90%",
          height: "auto",
          caption:
            "",
        },
        {
          type: "text",
          content:
          "Las variables fueron reclasificadas en 5 rangos (muy alto, alto, medio, bajo y muy bajo), valores que fueron ordenándose en una matriz de exclusión, de tal manera que permitirán identificar las áreas de conservación, preservación, restauración (ecológica y productiva) y aprovechamiento sustentable."
        },
        {
          type: "image",
          src: mapaZonificacionChart,
          alt: "Mapa de zonificación",
          width: "60%",
        }
        ],
    }
  ],
};
