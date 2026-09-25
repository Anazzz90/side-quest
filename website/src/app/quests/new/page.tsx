import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listActiveAreas, listCategories, listMeetupPlaces } from "@/lib/data/quests";
import NewQuestForm from "./new-quest-form";

export const metadata = { title: "New quest · Side Quest" };
export const dynamic = "force-dynamic";

export default async function NewQuestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/quests/new");

  const [areas, categories] = await Promise.all([listActiveAreas(), listCategories()]);
  const area = areas[0];
  const places = area ? await listMeetupPlaces(area.id) : [];

  return (
    <main className="page-shell">
      <div className="page-card">
        <p className="eyebrow">CREATE A QUEST</p>
        <h1>Post a new side quest</h1>
        <p className="auth-note">
          Development-only fixture data: the operating area and meetup places
          below are synthetic and have not been reviewed as real public
          venues. Real venue and area approval is a CP1 decision.
        </p>
        {!area || places.length === 0 ? (
          <p className="auth-error">
            No active area or meetup place is configured yet. Development
            fixtures should have been loaded by `supabase/seed.sql`.
          </p>
        ) : (
          <NewQuestForm areaId={area.id} categories={categories} places={places} />
        )}
      </div>
    </main>
  );
}
