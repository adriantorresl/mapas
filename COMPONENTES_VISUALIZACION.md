# Sistema de Mapeo de Componentes de Visualización

## Descripción General

Este sistema permite asignar dinámicamente componentes de visualización específicos a cada sección y subsección de la aplicación. Cada vez que el usuario navega a una sección diferente, se carga automáticamente el componente de visualización correspondiente.

## Estructura del Sistema

### 1. Archivo de Mapeo (`/src/constants/componentMapping.js`)

Este archivo contiene la configuración de qué componente mostrar para cada sección:

```javascript
export const componentMapping = {
  sectionId: {
    component: ComponentName,
    props: {
      // Props específicos para este componente en esta sección
    },
  },
};
```

### 2. Componentes Disponibles

- **MapChart**: Mapas con datos GeoJSON y gráficos
- **RasterViewer**: Visualización de archivos raster/TIFF
- **GeoJsonLayerWithLegend**: Capas GeoJSON con leyenda
- **SideBySideRasters**: Comparación lado a lado de rasters
- **RasterSlideCompare**: Comparación deslizante de rasters
- **TimeSeriesMapViewer**: Series temporales de mapas
- **Heatmap**: Mapas de calor
- **Contour3DViewer**: Visualizaciones 3D de contornos
- **SlideTifCompare**: Comparación de múltiples TIFF
- **GeoLayerCompare**: Comparación de capas geográficas
- **DefaultVisualization**: Componente de fallback

## Cómo Agregar un Nuevo Mapeo

### Paso 1: Identificar la Sección

Encuentra el ID de la sección en `/src/constants/navigationData.js`:

```javascript
{
  "id": "1.1.1",
  "titulo": "Edafología"
}
```

### Paso 2: Agregar el Mapeo

En `/src/constants/componentMapping.js`, agrega una nueva entrada:

```javascript
export const componentMapping = {
  // ... mapeos existentes ...

  "1.1.1": {
    component: GeoJsonLayerWithLegend,
    props: {
      geoJsonUrl: "/EDAFOLOGIA.geojson",
      categoriaCol: "suelo_textura",
      title: "Tipos de Suelo",
      showLegend: true,
    },
  },
};
```

### Paso 3: Verificar los Datos

Asegúrate de que los archivos referenciados en las props existan en la carpeta `/public/`:

- Archivos GeoJSON: `/public/archivo.geojson`
- Archivos Raster: `/public/archivo.tif`

## Ejemplos de Configuración por Tipo de Componente

### MapChart (Para datos categóricos con gráfico)

```javascript
"0": {
  component: MapChart,
  props: {
    geoJsonUrl: "/PAISAJES.geojson",
    categoriaCol: "paisaje",
    hectareasCol: "sup_ha",
    showChart: true,
    showDelimitationControl: false,
    showPaletteControl: false,
    showChartLabels: true
  }
}
```

### RasterViewer (Para datos raster individuales)

```javascript
"1.1.2": {
  component: RasterViewer,
  props: {
    rasterUrl: "/MDE.tif",
    title: "Modelo Digital de Elevación",
    colormap: "terrain"
  }
}
```

### SideBySideRasters (Para comparar dos rasters)

```javascript
"1.1.3": {
  component: SideBySideRasters,
  props: {
    leftRasterUrl: "/Temp_med_anual.tif",
    rightRasterUrl: "/Prec_tot_anual_4326.tif",
    leftTitle: "Temperatura Media Anual",
    rightTitle: "Precipitación Total Anual"
  }
}
```

### TimeSeriesMapViewer (Para series temporales)

```javascript
"1.1.4": {
  component: TimeSeriesMapViewer,
  props: {
    layers: [
      { url: "/SERIE1.geojson", year: "1985", categoriaCol: "tipo_veg" },
      { url: "/SERIE2.geojson", year: "1995", categoriaCol: "tipo_veg" },
      // ... más capas
    ],
    title: "Evolución de la Vegetación"
  }
}
```

## Flujo de Funcionamiento

1. **Usuario navega**: Click en sección en el header
2. **Sistema identifica**: Se obtiene el ID de la sección activa
3. **Busca mapeo**: Se consulta `componentMapping[sectionId]`
4. **Renderiza componente**: Se carga el componente con sus props específicos
5. **Fallback**: Si no hay mapeo, se muestra `DefaultVisualization`

## Mantenimiento

### Agregar Nuevo Componente de Visualización

1. Crear el componente en `/src/components/`
2. Importarlo en `componentMapping.js`
3. Agregarlo a la documentación

### Modificar Props Existentes

Solo edita el objeto `props` del mapeo correspondiente en `componentMapping.js`.

### Debugging

- Revisa la consola del navegador para errores de componentes
- Verifica que los archivos de datos existan en `/public/`
- Asegúrate de que los IDs de sección coincidan con `navigationData.js`

## Notas Importantes

- Los cambios en `componentMapping.js` se reflejan inmediatamente sin necesidad de reiniciar
- Siempre usa rutas relativas para archivos en `/public/` (ej: `"/archivo.geojson"`)
- El sistema es tolerante a fallos: si un componente falla, se muestra el fallback
- Los componentes se renderizan con `AnimatePresence` para transiciones suaves
