import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicBackendConfig, getPublicMapboxToken } from "@/lib/backend-config";
import { countUnreadNotifications, listCategories, listPublishedQuestPoints, listPublishedQuests } from "@/lib/data/quests";
import MapExperience from "./map-experience";

export const dynamic = "force-dynamic";

// Emoji cues match the design spec's category chips (section 5) so a
// category is never distinguished by color alone.
const CATEGORY_ICON: Record<string, string> = {
  movies: "🎬",
  "going-out": "🎉",
  hiking: "🥾",
  food: "🍜",
  study: "📚",
  games: "🎮",
  arts: "🎨",
  sports: "🏐",
  favors: "↗",
};

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
  const questFilters = {
    questType: (type === "activity" || type === "favor" ? type : undefined) as
      | "activity"
      | "favor"
      | undefined,
    categoryId: category || undefined,
    search: q || undefined,
  };
  const [quests, categories, unreadCount, mapPoints] = canQuery
    ? await Promise.all([
        listPublishedQuests(questFilters),
        listCategories(),
        countUnreadNotifications(user!.id),
        listPublishedQuestPoints(questFilters),
      ])
    : [[], [], 0, []];

  const mapboxToken = getPublicMapboxToken();

  const filterHref = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    if (params.type) usp.set("type", params.type);
    if (params.category) usp.set("category", params.category);
    if (params.q) usp.set("q", params.q);
    const s = usp.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main>
      <header className="top-bar">
        <a className="brand" href="/" aria-label="Side Quest home">
          <span className="brand-mark" aria-hidden="true">SQ</span>
          <span className="brand-name">side<span>quest</span></span>
        </a>
        <div className="top-bar-actions">
          {user ? (
            <>
              <Link className="top-nav-item" href="/notifications">
                Notifications
                {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
              </Link>
              <Link className="button button-secondary" href="/account">Account</Link>
            </>
          ) : (
            <>
              <span className="account-note">Independent platform · 18+</span>
              <Link className="button button-secondary" href="/sign-in">Sign in</Link>
            </>
          )}
        </div>
      </header>

      <section className="map-explore" aria-label="Discovery map">
        {user ? (
          <MapExperience token={mapboxToken} points={mapPoints} resultCount={quests.length}>
            {quests.length === 0 ? (
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
                        <span>
                          {(quest.category?.slug && CATEGORY_ICON[quest.category.slug]) ?? ""}{" "}
                          {quest.category?.label ?? quest.quest_type}
                        </span>
                        <span>cap {quest.capacity}</span>
                      </div>
                      <h3>{quest.title}</h3>
                      <p className="quest-meta">{formatWhen(quest.scheduled_start)}</p>
                      <p className="quest-meta">{quest.meetup_place?.label}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="privacy-note">Pins show quest meeting places, not live locations.</p>
          </MapExperience>
        ) : (
          <div className="map-placeholder" role="img" aria-label="Illustrative map placeholder">
            <span className="map-label-static">Sign in to see sidequests near you</span>
          </div>
        )}

        <div className="map-toolbar-float">
          <form action="/" method="get" className="map-search-row">
            <label className="map-search">
              <span aria-hidden="true">⌕</span>
              <input
                name="q"
                type="search"
                placeholder="Find your next sidequest"
                defaultValue={q ?? ""}
                disabled={!user}
                aria-label="Search sidequests"
              />
            </label>
            {user && (
              <Link className="map-create" href="/quests/new" aria-label="Create a sidequest">
                ＋
              </Link>
            )}
          </form>

          <div className="map-category-chips" role="group" aria-label="Filter sidequests by category">
            <Link className={`filter-chip ${!type && !category ? "selected" : ""}`} href={filterHref({ q })}>
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                className={`filter-chip ${category === c.id ? "selected" : ""}`}
                href={filterHref({ type: c.quest_type, category: category === c.id ? undefined : c.id, q })}
              >
                {CATEGORY_ICON[c.slug] ?? ""} {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
