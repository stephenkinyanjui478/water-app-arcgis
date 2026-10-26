import { useEffect, useRef } from "react";
import type MapView from "@arcgis/core/views/MapView";

export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Fallback centre when geolocation is unavailable or denied (Nairobi CBD). */
const DEFAULT_CENTER: LatLng = { longitude: 36.8219, latitude: -1.2921 };

/**
 * A centre-pin location picker. The pin is a fixed overlay at the middle of the
 * map; dragging the map moves the basemap underneath it, so the captured point
 * is always whatever sits under the pin. Defaults to the user's current location
 * when the browser grants it. Built on the ArcGIS Maps SDK (OpenStreetMap
 * basemap, no API key required).
 */
export default function IncidentLocationMap({ onChange }: { onChange: (loc: LatLng) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let view: MapView | undefined;
    let handle: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ default: Map }, { default: MapView }, reactiveUtils] = await Promise.all([
        import("@arcgis/core/Map"),
        import("@arcgis/core/views/MapView"),
        import("@arcgis/core/core/reactiveUtils"),
      ]);
      if (cancelled || !containerRef.current) return;

      const map = new Map({ basemap: "osm" });
      view = new MapView({
        container: containerRef.current,
        map,
        center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
        zoom: 13,
        ui: { components: ["zoom"] },
        constraints: { minZoom: 3 },
      });

      const emit = () => {
        const c = view?.center;
        if (c && c.latitude != null && c.longitude != null) {
          onChangeRef.current({ latitude: c.latitude, longitude: c.longitude });
        }
      };

      await view.when();
      if (cancelled) return;
      emit();

      // Re-read the centre each time the map settles after a drag or zoom.
      handle = reactiveUtils.watch(
        () => view?.stationary,
        (stationary) => {
          if (stationary) emit();
        }
      );

      // Recentre on the user's current position when they allow it.
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled || !view) return;
            view.goTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 }).catch(() => {});
          },
          () => {
            /* denied or unavailable — keep the default centre */
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    })();

    return () => {
      cancelled = true;
      handle?.remove();
      view?.destroy();
    };
  }, []);

  return (
    <div className="map-picker">
      <div ref={containerRef} className="map-picker-view" />
      <div className="map-picker-pin" aria-hidden="true">
        <calcite-icon icon="pin-tear-f" scale="l" />
      </div>
    </div>
  );
}
