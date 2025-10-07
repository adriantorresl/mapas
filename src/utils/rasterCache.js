// Sistema de cache para rasters con límite de memoria
class RasterCache {
  constructor(maxSizeMB = 50) {
    this.cache = new Map();
    this.maxSize = maxSizeMB * 1024 * 1024; // Convertir a bytes
    this.currentSize = 0;
  }

  // Estimar tamaño en bytes de un objeto raster
  estimateSize(data) {
    if (!data) return 0;

    // Estimar tamaño basado en propiedades del raster
    let size = 0;

    if (data.data && data.data.length) {
      // Asumir 4 bytes por pixel (Float32)
      size += data.data.length * 4;
    }

    if (data.canvas) {
      // Estimar tamaño del canvas: width * height * 4 (RGBA)
      size += data.width * data.height * 4;
    }

    // Agregar overhead de metadatos (estimado)
    size += 1000;

    return size;
  }

  // Limpiar cache si excede el límite de memoria
  cleanup() {
    if (this.currentSize <= this.maxSize) return;

    // Convertir a array y ordenar por último acceso (LRU)
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    // Eliminar entradas más antiguas hasta estar bajo el límite
    while (this.currentSize > this.maxSize && entries.length > 0) {
      const [key, entry] = entries.shift();
      this.currentSize -= entry.size;
      this.cache.delete(key);
      console.log(
        `[RasterCache] Removed ${key} from cache (${entry.size} bytes)`
      );
    }
  }

  // Obtener from cache
  get(key) {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccess = Date.now();
      console.log(`[RasterCache] Cache hit for ${key}`);
      return entry.data;
    }
    console.log(`[RasterCache] Cache miss for ${key}`);
    return null;
  }

  // Guardar en cache
  set(key, data) {
    const size = this.estimateSize(data);

    // No cachear si el objeto es demasiado grande
    if (size > this.maxSize * 0.5) {
      console.log(
        `[RasterCache] Object too large to cache: ${key} (${size} bytes)`
      );
      return;
    }

    const entry = {
      data,
      size,
      lastAccess: Date.now(),
      created: Date.now(),
    };

    // Eliminar entrada existente si existe
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key);
      this.currentSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.currentSize += size;

    console.log(
      `[RasterCache] Cached ${key} (${size} bytes). Total: ${this.currentSize} bytes`
    );

    // Limpiar si es necesario
    this.cleanup();
  }

  // Verificar si existe en cache
  has(key) {
    return this.cache.has(key);
  }

  // Limpiar toda la cache
  clear() {
    this.cache.clear();
    this.currentSize = 0;
    console.log("[RasterCache] Cache cleared");
  }

  // Obtener estadísticas de cache
  getStats() {
    return {
      entries: this.cache.size,
      currentSizeMB: (this.currentSize / (1024 * 1024)).toFixed(2),
      maxSizeMB: (this.maxSize / (1024 * 1024)).toFixed(2),
      hitRate: this.hits / (this.hits + this.misses) || 0,
    };
  }
}

// Instancia global del cache
const rasterCache = new RasterCache(50); // 50MB límite

export default rasterCache;
