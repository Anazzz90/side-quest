"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type MapPoint = {
  id: string;
  title: string;
  category_label: string | null;
  category_slug: string | null;
  lng: number;
  lat: number;
};

export type QuestMapHandle = {
  recenter: () => void;
};

const DUBAI_ACADEMIC_CITY: [number, number] = [55.4526, 25.1197];

// Per-category pin colors, matching the accepted design spec's map legend
// (prototype styles.css .quest-pin.category-*).
const CATEGORY_COLORS: Record<string, string> = {
  movies: "#8b5cf6",
  "going-out": "#ff5e4d",
  hiking: "#17a673",
  food: "#f59e0b",
  study: "#3484f4",
  games: "#ea4f98",
  arts: "#9b5de5",
  sports: "#13a8a8",
  favors: "#7c3aed",
};
const DEFAULT_COLOR = "#ff5e4d";

/**
 * Renders quest pins on a real map. This shows fixed quest-venue
 * coordinates only — never a device's live position. No geolocation API is
 * called anywhere in this component, matching the "no live user tracking"
 * requirement.
 */
const QuestMap = forwardRef<QuestMapHandle, { token: string; points: MapPoint[]; night: boolean }>(
  function QuestMap({ token, points, night }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const pointsRef = useRef<MapPoint[]>(points);
    pointsRef.current = points;
    const [styleLoaded, setStyleLoaded] = useState(false);

    const recenter = () => {
      const map = mapRef.current;
      if (!map) return;
      const pts = pointsRef.current;
      if (pts.length === 0) {
        map.flyTo({ center: DUBAI_ACADEMIC_CITY, zoom: 13, duration: 600 });
        return;
      }
      const bounds = new mapboxgl.LngLatBounds();
      for (const point of pts) bounds.extend([point.lng, point.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 });
    };

    useImperativeHandle(ref, () => ({ recenter }), []);

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: night ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11",
        center: DUBAI_ACADEMIC_CITY,
        zoom: 13,
        attributionControl: true,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      map.once("load", () => setStyleLoaded(true));
      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map || !styleLoaded) return;

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      for (const point of points) {
        const color = (point.category_slug && CATEGORY_COLORS[point.category_slug]) || DEFAULT_COLOR;
        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
          `<a href="/quests/${point.id}" style="font-weight:700;color:${color};text-decoration:none;">${escapeHtml(point.title)}</a>` +
            (point.category_label ? `<div style="color:#718096;font-size:11px;margin-top:2px;">${escapeHtml(point.category_label)}</div>` : "")
        );
        const marker = new mapboxgl.Marker({ color })
          .setLngLat([point.lng, point.lat])
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(marker);
      }

      if (points.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        for (const point of points) bounds.extend([point.lng, point.lat]);
        map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 0 });
      }
    }, [points, styleLoaded]);

    return (
      <div
        ref={containerRef}
        className="map-canvas"
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label="Map of published side quests"
      />
    );
  }
);

export default QuestMap;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
