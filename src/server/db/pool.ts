import "server-only";

import pg from "pg";

import { serverEnv } from "@/server/env";

const { Pool } = pg;

export type Queryable = {
  query<T extends pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<T>>;
};

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  pool ??= new Pool({
    connectionString: serverEnv.DATABASE_URL,
    max: 5,
  });

  return pool;
}

export async function query<T extends pg.QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  fn: (db: Queryable) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
