"use client";

import { useActionState, useState } from "react";
import { createQuest, type QuestFormState } from "../actions";

const FAVOR_GUIDANCE =
  "Favors must stay small, safe, and non-commercial: no money changes hands, no regulated services, no medical, legal, or transport tasks, and nothing that requires entering a private residence.";

type Category = { id: string; label: string; quest_type: string };
type Place = { id: string; label: string };

export default function NewQuestForm({
  areaId,
  categories,
  places,
}: {
  areaId: string;
  categories: Category[];
  places: Place[];
}) {
  const [state, formAction, pending] = useActionState<QuestFormState, FormData>(createQuest, null);
  const [questType, setQuestType] = useState<"activity" | "favor">("activity");

  const filteredCategories = categories.filter((c) => c.quest_type === questType);

  return (
    <form action={formAction} className="auth-form quest-form">
      <input type="hidden" name="areaId" value={areaId} />

      <label>Quest type</label>
      <div className="type-toggle" role="radiogroup" aria-label="Quest type">
        <label className={`type-option ${questType === "activity" ? "selected" : ""}`}>
          <input
            type="radio"
            name="questType"
            value="activity"
            checked={questType === "activity"}
            onChange={() => setQuestType("activity")}
          />
          Activity
        </label>
        <label className={`type-option ${questType === "favor" ? "selected" : ""}`}>
          <input
            type="radio"
            name="questType"
            value="favor"
            checked={questType === "favor"}
            onChange={() => setQuestType("favor")}
          />
          Favor
        </label>
      </div>

      {questType === "favor" && (
        <p className="favor-guidance">{FAVOR_GUIDANCE}</p>
      )}

      <label htmlFor="categoryId">Category</label>
      <select id="categoryId" name="categoryId" required defaultValue="">
        <option value="" disabled>
          Choose a category
        </option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <label htmlFor="title">Title</label>
      <input id="title" name="title" type="text" maxLength={80} required />

      <label htmlFor="description">Description</label>
      <textarea id="description" name="description" rows={4} maxLength={1000} required />

      <div className="field-row">
        <div>
          <label htmlFor="scheduledStart">Start</label>
          <input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
        </div>
        <div>
          <label htmlFor="scheduledEnd">End</label>
          <input id="scheduledEnd" name="scheduledEnd" type="datetime-local" required />
        </div>
      </div>

      <label htmlFor="capacity">Capacity (including you)</label>
      <input id="capacity" name="capacity" type="number" min={1} max={20} defaultValue={2} required />

      <label htmlFor="meetupPlaceId">Public meetup place</label>
      <select id="meetupPlaceId" name="meetupPlaceId" required defaultValue="">
        <option value="" disabled>
          Choose a place
        </option>
        {places.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <label htmlFor="costNote">Cost note (optional)</label>
      <input id="costNote" name="costNote" type="text" maxLength={200} placeholder="e.g. Free, or bring exact change for snacks" />

      <label htmlFor="accessibilityNotes">Accessibility notes (optional)</label>
      <textarea id="accessibilityNotes" name="accessibilityNotes" rows={2} maxLength={500} />

      <label htmlFor="proofRule">Completion proof rule</label>
      <select id="proofRule" name="proofRule" defaultValue="host_confirmation">
        <option value="host_confirmation">Host confirms completion</option>
        <option value="photo_evidence">Photo evidence required</option>
        <option value="none">No proof required</option>
      </select>

      <label htmlFor="meetingInstructions">Private meeting instructions</label>
      <textarea
        id="meetingInstructions"
        name="meetingInstructions"
        rows={3}
        maxLength={1000}
        placeholder="Only shown to you and accepted participants — e.g. exact meeting spot, what to bring."
        required
      />

      {questType === "favor" && (
        <label className="auth-checkbox">
          <input type="checkbox" name="favorAck" required />
          I confirm this favor follows the guidance above.
        </label>
      )}

      {state?.error && <p className="auth-error">{state.error}</p>}

      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish quest"}
      </button>
    </form>
  );
}
