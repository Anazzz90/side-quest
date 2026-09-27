"use client";

import { useEffect, useState } from "react";

/** Mirrors the blocking init script in layout.tsx so the button's icon
 * matches whatever theme actually got applied before hydration. */
export default function ThemeToggle() {
  const [night, setNight] = useState(false);

  useEffect(() => {
    setNight(document.documentElement.classList.contains("theme-night"));
  }, []);

  function toggle() {
    const next = !night;
    setNight(next);
    document.documentElement.classList.toggle("theme-night", next);
    try {
      localStorage.setItem("sq-theme", next ? "night" : "day");
    } catch {
      // Storage can be unavailable (private mode, blocked); the toggle
      // still works for this page load, it just won't persist.
    }
    // Lets MapExperience (a separate client component) switch the map's
    // own day/night style without both components needing shared state.
    window.dispatchEvent(new CustomEvent("sq-theme-change", { detail: { night: next } }));
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={night ? "Switch to daytime map" : "Switch to nighttime map"}
      title="Switch map theme"
    >
      {night ? "☀" : "☾"}
    </button>
  );
}
