import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-side data access for quest discovery, detail, and request state.
 * Every query here relies on row-level security to scope the result to
 * what the signed-in user is allowed to see — there is no additional
 * filtering here that authorization depends on.
 */

export type QuestListItem = Awaited<ReturnType<typeof listPublishedQuests>>[number];

export async function listCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quest_categories")
    .select("id, slug, label, quest_type")
    .eq("enabled", true)
    .order("label");
  if (error) throw error;
  return data;
}

export async function listMeetupPlaces(areaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetup_places")
    .select("id, label")
    .eq("area_id", areaId)
    .eq("status", "active")
    .order("label");
  if (error) throw error;
  return data;
}

export async function listActiveAreas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("geographic_areas")
    .select("id, slug, name, time_zone")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return data;
}

export type QuestFilters = {
  questType?: "activity" | "favor";
  categoryId?: string;
  search?: string;
};

export async function listPublishedQuests(filters: QuestFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("quests")
    .select(
      "id, title, description, quest_type, scheduled_start, scheduled_end, capacity, expires_at, status, category:quest_categories(label, slug), meetup_place:meetup_places(label)"
    )
    .eq("status", "published")
    .gt("expires_at", new Date().toISOString())
    .order("scheduled_start", { ascending: true });

  if (filters.questType) query = query.eq("quest_type", filters.questType);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getQuestDetail(questId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quests")
    .select(
      "id, host_user_id, title, description, quest_type, scheduled_start, scheduled_end, capacity, cost_note, accessibility_notes, proof_rule, expires_at, status, created_at, category:quest_categories(label, slug), meetup_place:meetup_places(label)"
    )
    .eq("id", questId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAcceptedCount(questId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("quest_join_requests")
    .select("id", { count: "exact", head: true })
    .eq("quest_id", questId)
    .eq("status", "accepted");
  if (error) throw error;
  return count ?? 0;
}

export async function getMyRequestForQuest(questId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quest_join_requests")
    .select("id, status, created_at")
    .eq("quest_id", questId)
    .eq("requester_user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listHostRequests(questId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quest_join_requests")
    .select("id, status, created_at, requester:user_profiles!quest_join_requests_requester_user_id_fkey(display_name)")
    .eq("quest_id", questId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPrivateInstructions(questId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quest_private_instructions")
    .select("instructions, updated_at")
    .eq("quest_id", questId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listRoomMessages(questId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quest_room_messages")
    .select("id, sender_user_id, body, created_at, sender:user_profiles!quest_room_messages_sender_user_id_fkey(display_name)")
    .eq("quest_id", questId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listMyQuests(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quests")
    .select("id, title, status, scheduled_start")
    .eq("host_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listNotifications(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, quest_id, data, created_at, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function countUnreadNotifications(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}
