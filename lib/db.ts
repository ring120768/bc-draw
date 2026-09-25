// Server-side database layer (Neon Postgres via Vercel).
// The schema bootstraps itself on first use — no manual migrations for MVP.
import { Pool } from "pg";
import { DEFAULT_PLAYERS } from "./mockData";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!connectionString) {
    throw new Error(
      "No database connection string found (DATABASE_URL). Is the Neon integration connected?"
    );
  }
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

let schemaReady: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const p = getPool();
  await p.query(`
    create table if not exists players (
      id text primary key,
      name text not null unique,
      active boolean not null default true,
      handicap real
    );
    create table if not exists entries (
      player_id text primary key references players(id) on delete cascade,
      status text not null default 'playing',
      preference text not null default 'none',
      override text not null default 'none',
      note text,
      entered_at timestamptz not null default now()
    );
    create table if not exists draws (
      draw_date date primary key,
      generated_at timestamptz not null default now(),
      is_current boolean not null default false,
      result jsonb not null,
      whatsapp_message text not null,
      scores jsonb
    );
  `);

  // Seed the club player list once
  const { rows } = await p.query("select count(*)::int as n from players");
  if (rows[0].n === 0) {
    const values: string[] = [];
    const params: (string | null)[] = [];
    DEFAULT_PLAYERS.forEach((pl, i) => {
      values.push(`($${i * 2 + 1}, $${i * 2 + 2})`);
      params.push(pl.id, pl.name);
    });
    await p.query(
      `insert into players (id, name) values ${values.join(",")} on conflict do nothing`,
      params
    );
  }
}

/** Get the pool, guaranteeing the schema exists (runs once per server instance). */
export async function db(): Promise<Pool> {
  if (!schemaReady) {
    schemaReady = bootstrap().catch((e) => {
      schemaReady = null; // allow retry on next request
      throw e;
    });
  }
  await schemaReady;
  return getPool();
}
