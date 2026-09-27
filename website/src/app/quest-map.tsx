"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export type MapPoint = {
  id: string;
  title: string;
  category_label: string | null;
  lng: number;
  lat: number;
};

const DUBAI_ACADEMIC_CITY: [number, number] = [55.4526, 25.1197];

/**
 * Renders quest pins on a real map. This shows fixed quest-venue
 * coordinates only — never a device's live position. No geolocation API is
 * called anywhere in this component, matching the "no live user tracking"
 * requirement.
 */
export default function QuestMap({ token, points }: { token: string; points: MapPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DUBAI_ACADEMIC_CITY,
      zoom: 13,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    const applyMarkers = () => {
      for (const point of points) {
        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
          `<a href="/quests/${point.id}" style="font-weight:700;color:#bd473c;text-decoration:none;">${escapeHtml(point.title)}</a>` +
            (point.category_label ? `<div style="color:#718096;font-size:11px;margin-top:2px;">${escapeHtml(point.category_label)}</div>` : "")
        );
        const marker = new mapboxgl.Marker({ color: "#ff6756" })
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
    };

    if (map.isStyleLoaded()) applyMarkers();
    else map.once("load", applyMarkers);
  }, [points]);

  return <div ref={containerRef} className="map-canvas" role="img" aria-label="Map of published side quests" />;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
