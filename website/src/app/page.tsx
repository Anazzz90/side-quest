import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicBackendConfig } from "@/lib/backend-config";
import { countUnreadNotifications, listCategories, listPublishedQuests } from "@/lib/data/quests";

const navigation = ["Explore", "Saved", "Chats", "Leaderboard", "Profile"];

export const dynamic = "force-dynamic";

function formatWhen(start: string) {
  const s = new Date(start);
  return s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
    " · " + s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; category?: string; q?: string }>;
}) {
  const { type, category, q } = await searchParams;
  const config = getPublicBackendConfig();
  const user = config
    ? (await (await createClient()).auth.getUser()).data.user
    : null;

  const canQuery = Boolean(config && user);
  const [quests, categories, unreadCount] = canQuery
    ? await Promise.all([
        listPublishedQuests({
          questType: type === "activity" || type === "favor" ? type : undefined,
          categoryId: category || undefined,
          search: q || undefined,
        }),
        listCategories(),
        countUnreadNotifications(user!.id),
      ])
    : [[], [], 0];

  const filterHref = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    if (params.type) usp.set("type", params.type);
    if (params.category) usp.set("category", params.category);
    if (params.q) usp.set("q", params.q);
    const s = usp.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#explore" aria-label="Side Quest home">
          <span className="brand-mark" aria-hidden="true">SQ</span>
          <span className="brand-name">side<span>quest</span></span>
        </a>
        <nav className="primary-nav" aria-label="Main">
          <a className="nav-item active" href="#explore" aria-current="page">
            <span className="nav-symbol" aria-hidden="true">⌖</span>Explore
          </a>
          {user ? (
            <Link className="nav-item" href="/notifications">
              <span className="nav-symbol" aria-hidden="true">☆</span>Notifications
              {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
            </Link>
          ) : (
            <span className="nav-item nav-upcoming" aria-disabled="true">
              <span className="nav-symbol" aria-hidden="true">☆</span>Notifications
            </span>
          )}
          {navigation.slice(2).map((item, index) => (
            <span className="nav-item nav-upcoming" aria-disabled="true" key={item}>
              <span className="nav-symbol" aria-hidden="true">{["◌", "♜", "☺"][index]}</span>{item}
            </span>
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
              <>
                <Link className="button button-primary" href="/quests/new">New quest</Link>
                <Link className="button button-secondary" href="/account">Account</Link>
              </>
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
              <span className="map-status">Illustrative placeholder · map provider pending CP1</span>
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
              <span className="result-count">{quests.length}</span>
            </div>

            <form action="/" method="get">
              <label className="search-label" htmlFor="quest-search">Search activities and places</label>
              <input
                id="quest-search"
                name="q"
                className="search-input"
                type="search"
                placeholder="Search side quests"
                defaultValue={q ?? ""}
                disabled={!user}
              />
            </form>

            <div className="filter-row" aria-label="Quest categories">
              <Link className={`filter-chip ${!type ? "selected" : ""}`} href={filterHref({ category, q })}>
                All
              </Link>
              <Link className={`filter-chip ${type === "activity" ? "selected" : ""}`} href={filterHref({ type: "activity", category, q })}>
                Activities
              </Link>
              <Link className={`filter-chip ${type === "favor" ? "selected" : ""}`} href={filterHref({ type: "favor", category, q })}>
                Favors
              </Link>
            </div>

            {categories.length > 0 && (
              <div className="filter-row" aria-label="Quest sub-categories">
                {categories
                  .filter((c) => !type || c.quest_type === type)
                  .map((c) => (
                    <Link
                      key={c.id}
                      className={`filter-chip ${category === c.id ? "selected" : ""}`}
                      href={filterHref({ type, category: category === c.id ? undefined : c.id, q })}
                    >
                      {c.label}
                    </Link>
                  ))}
              </div>
            )}

            {!user ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">✦</span>
                <h3>Sign in to see quests near you</h3>
                <p>Discovery is available to signed-in account holders.</p>
              </div>
            ) : quests.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">✦</span>
                <h3>No quests match yet</h3>
                <p>Try a different filter, or be the first to post one.</p>
              </div>
            ) : (
              <ul className="quest-list">
                {quests.map((quest) => (
                  <li key={quest.id}>
                    <Link href={`/quests/${quest.id}`} className="quest-card">
                      <div className="quest-card-top">
                        <span className="quest-card-type">{quest.category?.label ?? quest.quest_type}</span>
                        <span className="quest-card-capacity">cap {quest.capacity}</span>
                      </div>
                      <h3>{quest.title}</h3>
                      <p className="quest-meta">{formatWhen(quest.scheduled_start)}</p>
                      <p className="quest-meta">{quest.meetup_place?.label}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <p className="privacy-note">Browse without sharing your live location. Public meetup places will be added after local review.</p>
          </aside>
        </div>
        <footer className="page-footer">Side Quest is independently operated. Student status is not required for general access.</footer>
      </section>
    </main>
  );
}
