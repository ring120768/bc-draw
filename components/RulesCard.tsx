const RULES = [
  "Thumbs-up counts between 07:45 and 07:44",
  "Draw happens at 07:45",
  "Maximum 4 players per group",
  "Groups are normally 3 or 4 players",
  "Players may request early or late",
  "Admin can override first or last tee group",
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
