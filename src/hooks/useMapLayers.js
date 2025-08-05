import { useState, useEffect } from "react";

export function useMapLayers(layersConfig) {
  const [layers, setLayers] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      const results = {};
      for (const { key, url } of layersConfig) {
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (isMounted) results[key] = data;
        } catch (e) {
          if (isMounted) results[key] = null;
        }
      }
      if (isMounted) setLayers(results);
    };
    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(layersConfig)]);

  return layers;
}
