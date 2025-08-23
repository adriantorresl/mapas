export const navigationData = {
  "indice": [
    {
      "id": "0",
      "titulo": "Inicio",
    },
    {
      "id": "1",
      "titulo": "Caracterización del área de estudio",
      "subsecciones": [
        {
          "id": "1.1",
          "titulo": "Características biofísicas",
          "subsecciones": [
            {
              "id": "1.1.1",
              "titulo": "Edafología"
            },
            {
              "id": "1.1.2",
              "titulo": "Topografía"
            },
            {
              "id": "1.1.3",
              "titulo": "Clima"
            },
            {
              "id": "1.1.4",
              "titulo": "Vegetación y uso de suelo"
            },
            {
              "id": "1.1.5",
              "titulo": "Áreas de protección"
            }
          ]
        },
        {
          "id": "1.2",
          "titulo": "Condiciones socioeconómicas",
          "subsecciones": [
            {
              "id": "1.2.1",
              "titulo": "Población"
            },
            {
              "id": "1.2.2",
              "titulo": "Actividades productivas"
            }
          ]
        }
      ]
    },
    {
      "id": "2",
      "titulo": "Degradación funcional del paisaje",
      "subsecciones": [
        {
          "id": "2.1",
          "titulo": "Erosión del suelo"
        },
        {
          "id": "2.2",
          "titulo": "Acumulación de Nutrientes",
          // "subsecciones": [
          //   {
          //     "id": "2.2.1",
          //     "titulo": "Nitrógeno"
          //   },
          //   {
          //     "id": "2.2.2",
          //     "titulo": "Fosforo"
          //   }
          // ]
        },
        {
          "id": "2.3",
          "titulo": "Secuestro de Carbono"
        },
        {
          "id": "2.4",
          "titulo": "Abundancia de Polinizadores"
        }
      ]
    },
    {
      "id": "3",
      "titulo": "Potencial Productivo",
      "subsecciones": [
        {
          "id": "3.1",
          "titulo": "Características agroclimáticas",
          "subsecciones": [
            {
              "id": "3.1.1",
              "titulo": "Escenario actual"
            },
            {
              "id": "3.1.2",
              "titulo": "Escenarios con cambio climático"
            }
          ]
        },
        {
          "id": "3.2",
          "titulo": "Potencial productivo",
          "subsecciones": [
            {
              "id": "3.2.1",
              "titulo": "Agave Arroqueño"
            },
            {
              "id": "3.2.2",
              "titulo": "Agave Angustifolia (Espadín)"
            },
            {
              "id": "3.2.3",
              "titulo": "Agave Iyoba"
            },
            {
              "id": "3.2.4",
              "titulo": "Agave Karwinskii"
            },
            {
              "id": "3.2.5",
              "titulo": "Agave Marmorata (Tepeztate)"
            }
          ]
        }
      ]
    },
    {
      "id": "4",
      "titulo": "Plan de Manejo Integral del paisaje",
      "subsecciones": [
        {
          "id": "4.1",
          "titulo": "Zonificación"
        },
        {
          "id": "4.2",
          "titulo": "Story map"
        },
        {
          "id": "4.3",
          "titulo": "Sistema de monitoreo"
        }
      ]
    }
  ]
};

// Función helper para encontrar sección por ID
export const findSectionById = (id) => {
  for (const section of navigationData.indice) {
    if (section.id === id) return section;
    if (section.subsecciones) {
      for (const subsection of section.subsecciones) {
        if (subsection.id === id) return subsection;
        if (subsection.subsecciones) {
          for (const subsubsection of subsection.subsecciones) {
            if (subsubsection.id === id) return subsubsection;
          }
        }
      }
    }
  }
  return null;
};
