# The Breakfast Club Draw — MVP

Mobile-first Next.js app for the weekend golf swindle draw. Built from the build pack in the parent folder.

## Run it

```bash
cd breakfast-club-draw
npm install
npm run dev
```

Open http://localhost:3000 on your phone or browser.

## Test it

```bash
npm test
```

48 tests covering the full TEST_CASES.md suite: all 24 group-size cases, hard overrides, soft preferences, mixed overrides, draw validity, and WhatsApp message format.

## Screens

- `/` — home with links to both flows
- `/player` — pick your name, tap 👍 I'm playing, optional early/late preference, withdraw
- `/admin` — confirmed player list, add/remove players, edit preferences and first/last overrides, live conflict warnings, Generate Draw
- `/draw` — group cards with Early/Late labels, Copy to WhatsApp, Reshuffle, Save Draw, draw history

## Architecture notes

- `lib/drawEngine.ts` — pure logic, no React or storage. This is the module to keep when you move to Supabase.
- `lib/store.ts` — localStorage-backed mock store. All data access goes through here, so swapping to Supabase means rewriting this one file (the schema in `../DATA_MODEL.md` maps directly onto its types).
- `lib/timeWindow.ts` — 07:45 → 07:44 window logic, draw day = next Saturday.
- `lib/whatsappMessage.ts` — plain-text message builder.

## Not built yet (per CODEX.md)

WhatsApp API, payments, handicaps, tee booking, real auth, push notifications.
