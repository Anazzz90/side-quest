import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicBackendConfig } from "@/lib/backend-config";

const navigation = ["Explore", "Saved", "Chats", "Leaderboard", "Profile"];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = getPublicBackendConfig();
  const user = config
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#explore" aria-label="Side Quest home">
          <span className="brand-mark" aria-hidden="true">SQ</span>
          <span className="brand-name">side<span>quest</span></span>
        </a>
        <nav className="primary-nav" aria-label="Main">
          {navigation.map((item, index) => (
            index === 0 ? (
              <a className="nav-item active" href="#explore" aria-current="page" key={item}>
                <span className="nav-symbol" aria-hidden="true">⌖</span>{item}
              </a>
            ) : (
              <span className="nav-item nav-upcoming" aria-disabled="true" key={item}>
                <span className="nav-symbol" aria-hidden="true">{["", "☆", "◌", "♜", "☺"][index]}</span>{item}
              </span>
            )
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">A LOCAL CONNECTION PLATFORM</span>
          <strong>Small plans.<br />Good people.</strong>
          <p>Find an activity or a small favor, then decide if it feels right for you.</p>
        </div>
      </aside>

      <section className="main-area" id="explore">
        <header className="topbar">
          <div>
            <p className="eyebrow">SIDE QUEST · DUBAI ACADEMIC CITY</p>
            <h1>Find your next side quest</h1>
          </div>
          <div className="header-actions" aria-label="Account actions">
            <span className="account-note">Independent platform · 18+</span>
            {user ? (
              <Link className="button button-secondary" href="/account">Account</Link>
            ) : (
              <Link className="button button-secondary" href="/sign-in">Sign in</Link>
            )}
          </div>
        </header>

        <div className="explore-layout">
          <section className="map-panel" aria-labelledby="map-title">
            <div className="map-toolbar">
              <div>
                <p className="eyebrow">INITIAL AREA</p>
                <h2 id="map-title">Dubai Academic City</h2>
              </div>
              <span className="map-status">Map connection · CP4</span>
            </div>
            <div className="map-placeholder" role="img" aria-label="Illustrative map placeholder for Dubai Academic City">
              <div className="map-road road-one" />
              <div className="map-road road-two" />
              <div className="map-block block-one" />
              <div className="map-block block-two" />
              <div className="map-block block-three" />
              <span className="map-label label-one">Academic City</span>
              <span className="map-label label-two">Public places will be configured after review</span>
              <span className="map-pin pin-one" aria-hidden="true">＋</span>
              <span className="map-pin pin-two" aria-hidden="true">＋</span>
              <div className="map-caption">Illustrative development view · no live user locations</div>
            </div>
          </section>

          <aside className="discovery-panel" aria-labelledby="nearby-title">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">EXPLORE</p>
                <h2 id="nearby-title">Nearby side quests</h2>
              </div>
              <span className="result-count">0</span>
            </div>
            <label className="search-label" htmlFor="quest-search">Search activities and places</label>
            <input id="quest-search" className="search-input" type="search" placeholder="Search side quests" disabled />
            <div className="filter-row" aria-label="Quest categories">
              <button type="button" className="filter-chip selected" aria-pressed="true" disabled>All</button>
              <button type="button" className="filter-chip" disabled>Activities</button>
              <button type="button" className="filter-chip" disabled>Favors</button>
            </div>
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">✦</span>
              <h3>Quest discovery is coming together</h3>
              <p>The map, search, and quest list will connect to the backend in the next build checkpoint.</p>
            </div>
            <p className="privacy-note">Browse without sharing your live location. Public meetup places will be added after local review.</p>
          </aside>
        </div>
        <footer className="page-footer">Side Quest is independently operated. Student status is not required for general access.</footer>
      </section>
    </main>
  );
}
