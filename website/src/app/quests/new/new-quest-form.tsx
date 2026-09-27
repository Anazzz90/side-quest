"use client";

import { useActionState, useState } from "react";
import { createQuest, type CreateQuestState } from "../actions";

const FAVOR_GUIDANCE =
  "Favors must stay small, safe, and non-commercial: no money changes hands, no regulated services, no medical, legal, or transport tasks, and nothing that requires entering a private residence.";

type Category = { id: string; label: string; quest_type: string };
type Place = { id: string; label: string };

const DEFAULT_VALUES: Record<string, string> = {
  categoryId: "",
  title: "",
  description: "",
  scheduledStart: "",
  scheduledEnd: "",
  capacity: "2",
  meetupPlaceId: "",
  costNote: "",
  accessibilityNotes: "",
  proofRule: "host_confirmation",
  meetingInstructions: "",
};

export default function NewQuestForm({
  areaId,
  categories,
  places,
}: {
  areaId: string;
  categories: Category[];
  places: Place[];
}) {
  const [state, formAction, pending] = useActionState<CreateQuestState, FormData>(createQuest, null);
  const [questType, setQuestType] = useState<"activity" | "favor">("activity");
  const [favorAck, setFavorAck] = useState(false);
  // Every field is controlled from this one object, seeded from whatever
  // was submitted (state?.values) the moment a submission fails. Because
  // it's plain React state, not the DOM's own uncontrolled value, nothing
  // the server round trip does can wipe it out from under the user.
  const [values, setValues] = useState<Record<string, string>>(DEFAULT_VALUES);

  const filteredCategories = categories.filter((c) => c.quest_type === questType);

  const field = (name: string) => ({
    name,
    value: values[name] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value })),
  });

  return (
    <form
      action={(formData) => {
        formData.set("questType", questType);
        if (favorAck) formData.set("favorAck", "on");
        return formAction(formData);
      }}
      className="auth-form quest-form"
    >
      <input type="hidden" name="areaId" value={areaId} />

      <label>Quest type</label>
      <div className="type-toggle" role="radiogroup" aria-label="Quest type">
        <label className={`type-option ${questType === "activity" ? "selected" : ""}`}>
          <input
            type="radio"
            name="questTypeRadio"
            value="activity"
            checked={questType === "activity"}
            onChange={() => setQuestType("activity")}
          />
          Activity
        </label>
        <label className={`type-option ${questType === "favor" ? "selected" : ""}`}>
          <input
            type="radio"
            name="questTypeRadio"
            value="favor"
            checked={questType === "favor"}
            onChange={() => setQuestType("favor")}
          />
          Favor
        </label>
      </div>

      {questType === "favor" && <p className="favor-guidance">{FAVOR_GUIDANCE}</p>}

      <label htmlFor="categoryId">Category</label>
      <select id="categoryId" required {...field("categoryId")}>
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
      <input id="title" type="text" maxLength={80} required {...field("title")} />

      <label htmlFor="description">Description (optional)</label>
      <textarea id="description" rows={4} maxLength={1000} {...field("description")} />

      <div className="field-row">
        <div>
          <label htmlFor="scheduledStart">Start</label>
          <input id="scheduledStart" type="datetime-local" required {...field("scheduledStart")} />
        </div>
        <div>
          <label htmlFor="scheduledEnd">End</label>
          <input id="scheduledEnd" type="datetime-local" required {...field("scheduledEnd")} />
        </div>
      </div>

      <label htmlFor="capacity">Capacity (including you)</label>
      <input id="capacity" type="number" min={1} max={20} required {...field("capacity")} />

      <label htmlFor="meetupPlaceId">Public meetup place</label>
      <select id="meetupPlaceId" required {...field("meetupPlaceId")}>
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
      <input
        id="costNote"
        type="text"
        maxLength={200}
        placeholder="e.g. Free, or bring exact change for snacks"
        {...field("costNote")}
      />

      <label htmlFor="accessibilityNotes">Accessibility notes (optional)</label>
      <textarea id="accessibilityNotes" rows={2} maxLength={500} {...field("accessibilityNotes")} />

      <label htmlFor="proofRule">Completion proof rule</label>
      <select id="proofRule" {...field("proofRule")}>
        <option value="host_confirmation">Host confirms completion</option>
        <option value="photo_evidence">Photo evidence required</option>
        <option value="none">No proof required</option>
      </select>

      <label htmlFor="meetingInstructions">Private meeting instructions</label>
      <textarea
        id="meetingInstructions"
        rows={3}
        maxLength={1000}
        placeholder="Only shown to you and accepted participants — e.g. exact meeting spot, what to bring."
        required
        {...field("meetingInstructions")}
      />

      {questType === "favor" && (
        <label className="auth-checkbox">
          <input
            type="checkbox"
            checked={favorAck}
            onChange={(e) => setFavorAck(e.target.checked)}
            required
          />
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
