import { describe, expect, it, vi } from "vitest";

// replay.ts imports getPool (a value import) which transitively evaluates the
// env schema. Mock the module so the test environment doesn't need real creds.
vi.mock("@/server/db/pool", () => ({
  getPool: vi.fn(() => {
    throw new Error("getPool should not be called in tests");
  }),
}));

import type { Queryable } from "@/server/db/pool";

import { getEventsAfterRevision } from "./replay";

type EventRow = {
  client_event_id: string;
  server_revision: number;
  event_type: string;
  event_schema_version: number;
  payload: unknown;
  created_at: string | Date;
};

function makeQueryable(rows: EventRow[]): Queryable {
  return {
    async query() {
      return {
        rows,
        rowCount: rows.length,
        command: "SELECT",
        oid: 0,
        fields: [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
    },
  };
}

function makeNodeDeletedRow(overrides: Partial<EventRow> = {}): EventRow {
  return {
    client_event_id: "evt-1",
    server_revision: 1,
    event_type: "node_deleted",
    event_schema_version: 1,
    payload: { nodeId: "node-abc" },
    created_at: "2026-05-17T10:00:00.000Z",
    ...overrides,
  };
}

describe("getEventsAfterRevision", () => {
  it("returns snapshot_required when row count exceeds REPLAY_LIMIT", async () => {
    // REPLAY_LIMIT is 1000; the query fetches limit+1 to detect overflow
    const rows = Array.from({ length: 1001 }, (_, i) =>
      makeNodeDeletedRow({
        client_event_id: `evt-${i}`,
        server_revision: i + 1,
      }),
    );
    const db = makeQueryable(rows);
    const result = await getEventsAfterRevision("ws-1", "wf-1", 0, db);
    expect(result).toEqual({ type: "snapshot_required" });
  });

  it("returns empty events list when no rows are found", async () => {
    const db = makeQueryable([]);
    const result = await getEventsAfterRevision("ws-1", "wf-1", 5, db);
    expect(result).toEqual({ type: "events", events: [], latestRevision: 5 });
  });

  it("parses a row with created_at as an ISO string correctly", async () => {
    const db = makeQueryable([makeNodeDeletedRow({ server_revision: 3 })]);
    const result = await getEventsAfterRevision("ws-1", "wf-1", 0, db);
    expect(result.type).toBe("events");
    if (result.type !== "events") return;

    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.serverRevision).toBe(3);
    expect(result.events[0]!.type).toBe("node_deleted");
    expect(result.latestRevision).toBe(3);
  });

  it("parses a row with created_at as a Date object (pg timestamptz behaviour)", async () => {
    const dateObj = new Date("2026-05-17T10:00:00.000Z");
    const db = makeQueryable([
      makeNodeDeletedRow({ created_at: dateObj as unknown as string }),
    ]);

    // This must NOT throw a ZodError (which was the original bug before the fix)
    const result = await getEventsAfterRevision("ws-1", "wf-1", 0, db);
    expect(result.type).toBe("events");
    if (result.type !== "events") return;

    const event = result.events[0]!;
    expect(event.type).toBe("node_deleted");
    // createdAt should be a valid ISO string derived from the Date object
    expect(event.createdAt).toBe(dateObj.toISOString());
  });

  it("attaches serverRevision from the row to each event", async () => {
    const db = makeQueryable([
      makeNodeDeletedRow({ client_event_id: "e1", server_revision: 7 }),
      makeNodeDeletedRow({ client_event_id: "e2", server_revision: 8 }),
    ]);
    const result = await getEventsAfterRevision("ws-1", "wf-1", 6, db);
    expect(result.type).toBe("events");
    if (result.type !== "events") return;

    expect(result.events[0]!.serverRevision).toBe(7);
    expect(result.events[1]!.serverRevision).toBe(8);
    expect(result.latestRevision).toBe(8);
  });
});
