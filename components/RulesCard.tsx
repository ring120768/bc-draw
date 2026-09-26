const RULES = [
  "Sign-up opens 07:30 Friday, closes 07:30 Saturday",
  "Draw happens at 07:45",
  "Maximum 4 players per group",
  "Groups are normally 3 or 4 players — 3-balls tee off first",
  "Players may request early or late",
  "Admin can override first or last tee group",
  "Sundays & bank holidays: admin opens sign-up, same 24-hour rule",
];

export default function RulesCard() {
  return (
    <div className="rounded-xl border border-club-green/20 bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold text-club-green">
        Breakfast Club Rules
      </h2>
      <ul className="space-y-1 text-sm text-gray-700">
        {RULES.map((rule) => (
          <li key={rule}>✅ {rule}</li>
        ))}
      </ul>
    </div>
  );
}
