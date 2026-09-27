"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import QuestMap, { type MapPoint, type QuestMapHandle } from "./quest-map";

export default function MapExperience({
  token,
  points,
  resultCount,
  children,
}: {
  token: string | null;
  points: MapPoint[];
  resultCount: number;
  children: ReactNode;
}) {
  const mapRef = useRef<QuestMapHandle>(null);
  const [night, setNight] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setNight(document.documentElement.classList.contains("theme-night"));
    const onThemeChange = (e: Event) => setNight((e as CustomEvent).detail.night);
    window.addEventListener("sq-theme-change", onThemeChange);
    return () => window.removeEventListener("sq-theme-change", onThemeChange);
  }, []);

  return (
    <>
      {token ? (
        <QuestMap ref={mapRef} token={token} points={points} night={night} />
      ) : (
        <div className="map-placeholder" role="img" aria-label="Illustrative map placeholder for Dubai Academic City">
          <span className="map-label-static">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map</span>
        </div>
      )}

      {token && (
        <>
          <button
            type="button"
            className="recenter-map"
            aria-label="Recenter on nearby sidequests"
            onClick={() => mapRef.current?.recenter()}
          >
            ◎
          </button>
          <div className="map-legend-float">
            <span><i className="legend-activity" /> Sidequest</span>
            <span><i className="legend-favor" /> Favor</span>
          </div>
        </>
      )}

      <aside className={`quest-sheet ${expanded ? "expanded" : ""}`} aria-label="Nearby sidequests">
        <div className="sheet-grab-area">
          <button
            className="sheet-handle"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="grabber" />
            <span>{expanded ? "Hide list" : "List · nearby sidequests"}</span>
          </button>
        </div>
        <div className="sheet-actions">
          <span className="panel-label">NEARBY SIDEQUESTS <b>{resultCount}</b></span>
          <a className="chat-launch" href="/notifications">
            <span aria-hidden="true">◌</span> Chats
          </a>
        </div>
        <div className="quest-stack">{children}</div>
      </aside>
    </>
  );
}
