type HeaderProps = {
  badge?: "Entries Open" | "Entries Closed" | "Draw Generated";
};

const BADGE_STYLES: Record<string, string> = {
  "Entries Open": "bg-green-100 text-green-800",
  "Entries Closed": "bg-red-100 text-red-800",
  "Draw Generated": "bg-blue-100 text-blue-800",
};

import TreeLogo from "./TreeLogo";
import Link from "next/link";

export default function Header({
  badge,
  home = false,
}: HeaderProps & { home?: boolean }) {
  return (
    <header className="relative pt-6 pb-4 text-center">
      {!home && (
        <Link
          href="/"
          className="absolute left-0 top-2 rounded-lg border border-club-green/30 bg-white px-3 py-1.5 text-xs font-semibold text-club-green shadow-sm"
        >
          ← Dashboard
        </Link>
      )}
      <div className="flex justify-center">
        <TreeLogo size={64} />
      </div>
      <h1 className="text-2xl font-bold text-club-green">
        The Breakfast Club
      </h1>
      <p className="text-sm text-gray-600">Weekend Swindle Draw</p>
      {badge && (
        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[badge]}`}
        >
          {badge}
        </span>
      )}
    </header>
  );
}
