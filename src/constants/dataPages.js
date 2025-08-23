import duracionHumedad from "../assets/media/duracion-humedad-suelo.png";
import piramidePoblacional from "../assets/media/piramide-poblacional.png";
import tendenciaClimatica from "../assets/media/tendencia-climatica.png";

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
            "Un paisaje biocultural es un área geográfica donde se da reconocimiento a los valores culturales y su vinculación con la riqueza natural de un territorio, en este caso asociada a la producción del agave y mezcal.",
        },
        {
          type: "text",
          content:
            "El área que integran los paisajes bioculturales de la Sierra de Yautepec y Los Valles Centrales suman un total de 816,566.9 hectáreas.",
        },
        {
          type: "table",
          title: "Distribución de paisajes bioculturales",
          header: ["Paisaje", "Municipios", "Superficie"],
          body: [
            ["Valles Centrales", "48", "415,358 has"],
            ["Sierra de Yautepec", "11", "401,208 has"],
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
            "Resultado de su variada geografía, topografía y clima, los suelos del área de estudio incluyen formaciones volcánicas, aluviales y sedimentarias.",
        },
        {
          type: "table",
          title: "Distribución de suelos por textura (hectáreas)",
          header: [
            "Suelo / textura",
            "Sierra de Yautepec Fina",
            "Sierra de Yautepec Media",
            "Sierra de Yautepec Gruesa",
            "Valles Centrales Fina",
            "Valles Centrales Media",
            "Valles Centrales Gruesa",
          ],
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
            "En la zona de estudio, la duración de la humedad en los suelos varía de dos a doce meses por año, predominando las zonas con seis meses de humedad en suelos.",
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
            "La variabilidad altitudinal va de los 250 a los 3319 msnm. Siendo el límite de los dos paisajes bioculturales la zona más alta, delimitando el parte aguas de las dos cuencas.",
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
            "En la entidad se presentan seis de los siete tipos de climas existentes en el país (INEGI, 2008), 'faltándole solo el clima frio'.",
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
            "Registros meteorológicos de 1985 a 2018 del estado indican aumento en la temperatura y disminución en la precipitación.",
        },
        {
          type: "image",
          src: tendenciaClimatica,
          title: "Tendencia climática 1985-2018",
          alt: "Gráfica de tendencia climática",
          caption:
            "Evolución de temperatura y precipitación en el período 1985-2018",
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
            "3 clases ocupan más del 78% de la superficie del área de estudio. Vegetación arbustiva 43%, Agricultura de temporal 18%, Selva baja caducifolia 17%.",
        },
        {
          type: "table",
          title: "Distribución de vegetación y uso de suelo",
          header: ["Tipo", "Hectáreas", "Porcentaje"],
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
            "En la zona de estudio hay 2 ANPs de carácter federal: Monumento nacional Yagui y Reserva Estatal Hierve el Agua.",
        },
        {
          type: "text",
          content:
            "Hay también 6 áreas dedicadas voluntariamente a la conservación: El Campanario - Laacanloo Cruz, El Fuerte, Danii Idoo (Cerro Iglesia), La Mina, Cerro de Guinas, La Muralla.",
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
            "En la zona de estudio radican 306,142 habitantes, de los cuales 146,249 son hombres y 159,893 mujeres.",
        },
        {
          type: "image",
          src: piramidePoblacional,
          title: "",
          alt: "Pirámide poblacional",
          caption: "Pirámide poblacional del área de estudio",
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
          type: "table",
          title: "Grado de marginación por región",
          header: [
            "Grado de marginación",
            "Valles Centrales Nº de municipios",
            "Valles Centrales Habitantes",
            "Sierra de Yautepec Nº de municipios",
            "Sierra de Yautepec Habitantes",
          ],
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
            "De acuerdo a los Indicadores Laborales para los Municipios de México el 60.9% de la población es Población Económicamente Activa (+15 años). 98.8% es PEA ocupada y 90.1% de manera informal.",
        },
        {
          type: "table",
          title: "Indicadores laborales por región",
          header: [
            "Región",
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
            "La erosión hídrica es uno de los procesos fundamentales que contribuyen a la degradación de los suelos a nivel mundial, nacional y provincial.",
        },
      ],
    },
    {
      id: "2.2",
      data: [
        {
          type: "heading",
          content: "Nitrogeno",
        },
        {
          type: "text",
          content:
            "Los procesos de cambios de uso de suelo de áreas con vegetación primaria y secundaria a usos de suelo antropogénico, modifican dramáticamente el ciclo natural de nutrientes.",
        },
        {
          type: "heading",
          content: "Fosforo",
        },
      ],
    },
    // {
    //     "id": "2.2.2",
    //     "data":[
    //     ]
    // },
    {
      id: "2.3",
      data: [
        {
          type: "heading",
          content: "Secuestro de Carbono",
        },
        {
          type: "text",
          content:
            "El secuestro de carbono es el proceso de capturar dióxido de carbono (CO2) de la atmósfera y almacenarlo en depósitos naturales o artificiales para reducir la cantidad de CO2 en la atmósfera y mitigar el cambio climático.",
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
            "Los polinizadores brindan un servicio ecosistémico vital para la agricultura, la biodiversidad y la seguridad alimentaria, ya que muchas plantas cultivadas dependen de los polinizadores para producir alimentos.",
        },
      ],
    },
    {
      id: "3.1.1",
      data: [
        {
          type: "heading",
          content: "Escenario actual",
        },
        {
          type: "text",
          content:
            "Para evaluar la aptitud del territorio para diferentes cultivos, es necesario conocer la fisiología de las plantas/cultivos, con lo que se pueden determinar las características agroecológicas que determinan los diferentes niveles de productividad.",
        },
      ],
    },
    {
      id: "3.1.2",
      data: [
        {
          type: "heading",
          content: "Escenarios con cambio climático",
        },
        {
          type: "text",
          content:
            "Los escenarios con cambio climático muestran las anomalías en las temperaturas y los porcentajes de cambio en la precipitación, variables de los que dependen los sistemas productivos prioritarios caracterizados anteriormente.",
        },
      ],
    },
    {
      id: "3.2.1",
      data: [
        {
          type: "heading",
          content: "Agave Arroqueño",
        },
        {
          type: "table",
          title: "Requerimientos agroecológicos - Agave Arroqueño",
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
      ],
    },
    {
      id: "3.2.2",
      data: [
        {
          type: "heading",
          content: "Agave Angustifolia (Espadín)",
        },
        {
          type: "table",
          title: "Requerimientos agroecológicos - Agave Angustifolia (Espadín)",
          header: ["Parámetro", "Óptimo", "Medio", "Bajo", "No apto/Marginal"],
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
              "> 2,200 / < 300",
            ],
          ],
        },
      ],
    },
    {
      id: "3.2.3",
      data: [
        {
          type: "heading",
          content: "Agave Iyoba",
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
      ],
    },
    {
      id: "3.2.4",
      data: [
        {
          type: "heading",
          content: "Agave Karwinskii",
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
      ],
    },
    {
      id: "3.2.5",
      data: [
        {
          type: "heading",
          content: "Agave Marmorata (Tepeztate)",
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
      ],
    },
  ],
};
