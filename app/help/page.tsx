import Link from "next/link";
import Header from "@/components/Header";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Getting the app on your phone",
    body: [
      "iPhone: open bc-draw.vercel.app in Safari, tap Share, then Add to Home Screen.",
      "Android: open the link in Chrome, tap the ⋮ menu, then Add to Home screen.",
      "You'll get the Breakfast Club egg on your home screen — no app store needed.",
    ],
  },
  {
    title: "Entering the draw",
    body: [
      "Entries open Friday 07:45 and close Saturday 07:44 — same as the WhatsApp rule.",
      "Tap 👍 Player Entry, pick your name, tap “I'm playing”. Done in ten seconds.",
      "You can ask to Prefer early or Prefer late — the draw will lean that way if it can.",
      "Changed your mind? Withdraw any time before 07:44.",
      "Miss the window? Message the admin — they can add you manually.",
    ],
  },
  {
    title: "How the draw works",
    body: [
      "At 07:45 Saturday the admin presses the button and the app draws names out of a hat — completely random.",
      "3-balls always tee off at the top of the draw, 4-balls at the bottom.",
      "Early/late requests are leaned towards; the admin can force first or last group when needed.",
      "No other influence is possible. Handicaps are recorded but never affect the draw.",
      "The result goes straight to the WhatsApp group as usual.",
    ],
  },
  {
    title: "Scores, prizes and the league",
    body: [
      "After the round, scores go in once on the Scores page.",
      "Two prizes every week: highest individual stableford, and best team — your drawn group, scored by average points so 3-balls and 4-balls compete fairly.",
      "The League Table builds itself: ranked by individual wins, then team wins, then total points, with every week's results kept underneath.",
    ],
  },
];

export default function HelpPage() {
  return (
    <main>
      <Header />

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-club-green">How It Works</h2>
        <p className="mt-1 text-sm text-gray-600">
          Same swindle, same rules — just no more working the draw out by hand
          at 07:45.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold text-club-green">{s.title}</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {s.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link
        href="/"
        className="mt-4 block text-center text-sm text-gray-500 underline"
      >
        Back to Home
      </Link>
    </main>
  );
}
