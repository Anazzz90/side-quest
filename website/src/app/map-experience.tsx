"use client";

import { useRef, useState, type ReactNode } from "react";
import QuestMap, { type MapPoint, type QuestMapHandle } from "./quest-map";

/** 7pm-6am in Dubai Academic City counts as night for the map's own style
 * (the rest of the page stays in its normal light appearance). */
function isDubaiNight() {
  try {
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dubai", hour: "numeric", hour12: false }).format(new Date()),
      10
    );
    return hour >= 19 || hour < 6;
  } catch {
    return false;
  }
}

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
  const [expanded, setExpanded] = useState(false);
  const [night] = useState(isDubaiNight);

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
