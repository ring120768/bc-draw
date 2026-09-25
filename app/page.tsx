import Link from "next/link";
import Header from "@/components/Header";
import RulesCard from "@/components/RulesCard";

export default function HomePage() {
  return (
    <main>
      <Header />
      <div className="space-y-4">
        <Link
          href="/player"
          className="block rounded-xl bg-club-green p-5 text-center text-lg font-semibold text-white shadow hover:bg-club-greenDark"
        >
          👍 Player Entry
        </Link>
        <Link
          href="/admin"
          className="block rounded-xl border-2 border-club-green bg-white p-5 text-center text-lg font-semibold text-club-green shadow-sm hover:bg-club-cream"
        >
          Admin Dashboard
        </Link>
        <Link
          href="/scores"
          className="block rounded-xl border-2 border-club-gold bg-white p-5 text-center text-lg font-semibold text-club-gold shadow-sm hover:bg-club-cream"
        >
          🏆 Scores &amp; Results
        </Link>
        <Link
          href="/league"
          className="block rounded-xl border-2 border-club-green bg-white p-5 text-center text-lg font-semibold text-club-green shadow-sm hover:bg-club-cream"
        >
          📊 League Table
        </Link>
        <RulesCard />
      </div>
    </main>
  );
}
