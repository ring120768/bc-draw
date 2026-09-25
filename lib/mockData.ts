// Default Breakfast Club players — seeded from the WhatsApp group member list.
// This is only the STARTING list: players are stored in the app's data store
// and can be added, renamed, or removed from the Manage Players page.

export type Player = {
  id: string;
  name: string;
  active: boolean;
  /** Optional playing handicap. Stored only — not used for group balancing (per PRD). */
  handicap?: number | null;
};

const NAMES = [
  "Abbo",
  "Amanda Campbell",
  "Andy Davenport",
  "Brooks17",
  "Christopher Hetherington",
  "Dan",
  "Dave",
  "David Lister",
  "David Tanner",
  "Gareth J",
  "Gary Law",
  "Ginnie",
  "Gordon Campbell",
  "H",
  "Ian Ring",
  "James Anderson",
  "Jason",
  "Jason Cox",
  "Jon",
  "Kevin 930",
  "Kevin J",
  "Kevin M",
  "Lisa Noble",
  "Mark Noble",
  "Martyn Burke",
  "Maura",
  "Neil B",
  "Nick",
  "Paul",
  "Pete",
  "Robert Kidd",
  "Ron",
  "Ronan O'Boyle",
  "Simon Badocha",
  "Steph",
  "Steve",
  "Steve Milner",
  "Tim",
];

export const DEFAULT_PLAYERS: Player[] = NAMES.map((name, i) => ({
  id: `player-${i + 1}`,
  name,
  active: true,
  handicap: null,
}));

// Kept for backwards compatibility with any imports of the old name.
export const MOCK_PLAYERS = DEFAULT_PLAYERS;
