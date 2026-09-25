# Side Quest clickable prototype

A responsive, browser-only prototype for an independent student platform; the sample campus-style map is illustrative only. It uses sample student names and a schematic local-area map. It is an independent concept prototype and does not imply endorsement by any institution.

## Run locally

Open `index.html` in a browser, or serve this folder with any static file server. No build step or dependencies are required. Demo data lives in JavaScript memory and resets when the page is refreshed. No photo, account, or message is uploaded or persisted.

## Try the main flow

1. The app opens directly to the local-area map. Search for a sidequest, choose a category chip, or open **Filter** to narrow the pins.
2. Tap a pin for details, or swipe up on the **List** handle to browse nearby sidequests. Tap **I’m interested** to send a request.
3. Open **Chats** to see accepted sidequest conversations. In the demo inbox, choose **Preview host acceptance** to add yourself and open the private chat.
4. Send a message, then choose **Complete quest** and select an image to simulate proof of completion. The image remains local to the browser; the demo awards points and adds a recap.
5. Create a quest, browse the student feed and leaderboard, and toggle leaderboard visibility from the profile. The map switches between bright day and dark night themes based on local time; use the sun/moon control to switch manually.

The local-area map is deliberately schematic. Quest pins represent places, not live student locations.

## Hosting direction

### Clickable prototype

Deploy this folder as a static site on Vercel. Set the Vercel project root to `Side Quest/prototype`; use the static/Other framework preset and no build command. The output directory can be the project root (`.`). A custom domain can be added in Vercel when the name is chosen. The static prototype does not need Supabase.

### MVP

For the production MVP, use **Next.js on Vercel** with **Supabase** for Postgres, Google and email/password authentication, private proof-image storage, and Realtime chat. The static HTML here demonstrates the product flows; a production implementation should replace sample identities and in-memory state with authenticated server-backed records.

Key implementation constraints for the MVP:

- Keep general access open to any account holder aged 18 or older who meets the safety rules. Students across institutions are a core audience, not an eligibility boundary. Support Google sign-in or email/password; no student-status verification or single university domain gate is required for general access.
- Enforce the 18+ eligibility rule, account standing, quest visibility, requests, accepted chat membership, reports, and leaderboard opt-in with trusted backend checks and Supabase Row Level Security (RLS). Check optional community membership only for content explicitly restricted to that community. The browser's public/anon key is only safe when these database policies are correct.
- Keep the Supabase service-role key on trusted server code only; never ship it to the browser.
- Store proof photos in a private Storage bucket and grant access through short-lived signed URLs and policies. Decide retention and moderation rules before collecting real photos.
- Use Realtime authorization so only accepted quest participants can read or send messages. End chat access when the quest is closed according to the product's retention policy.
- Put secrets in Vercel environment variables. Keep separate Supabase projects for development and production, and configure allowed authentication redirect URLs for each.
- Have a clear report/block path and moderation workflow before opening the service to students.

## Prototype limitations

This is a UI prototype, not a secure service. Demo request acceptance is simulated, messages and posts are not persisted, photo selection does not upload the image, the map has no map provider, and sample leaderboard data is fictional. Do not use it to collect real user information.


## Account access scope

The product direction supports Google sign-in or email/password for any account holder aged 18 or older who meets the safety rules. Student-status verification is not required for general access. This browser prototype does not implement authentication, 18+ age checks, or real account data.
