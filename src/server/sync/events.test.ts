import { describe, expect, it } from "vitest";

import type { Queryable } from "@/server/db/pool";
import type { WorkflowEvent } from "@/domain/workflows/events";

import { findExistingRevisions, insertWorkflowEvents } from "./events";

function makeNodeDeletedEvent(clientEventId: string): WorkflowEvent {
  return {
    clientEventId,
    type: "node_deleted",
    eventSchemaVersion: 1,
    payload: { nodeId: "node-1" },
    createdAt: new Date().toISOString(),
  };
}

function makeQueryable(rows: Record<string, unknown>[] = []): Queryable & {
  calls: { text: string; values: unknown[] }[];
} {
  const calls: { text: string; values: unknown[] }[] = [];
  return {
    calls,
    async query(text: string, values?: unknown[]) {
      calls.push({ text, values: values ?? [] });
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

describe("insertWorkflowEvents", () => {
  it("returns early without calling db.query when events array is empty", async () => {
    const db = makeQueryable();
    await insertWorkflowEvents(db, {
      workflowId: "wf-1",
      workspaceId: "ws-1",
      actorUserId: "user-1",
      events: [],
    });
    expect(db.calls).toHaveLength(0);
  });

  it("inserts a single event with the correct placeholder and 8 values", async () => {
    const db = makeQueryable();
    const event = makeNodeDeletedEvent("evt-1");
    await insertWorkflowEvents(db, {
      workflowId: "wf-1",
      workspaceId: "ws-1",
      actorUserId: "user-1",
      events: [{ event, serverRevision: 5 }],
    });

    expect(db.calls).toHaveLength(1);
    const { text, values } = db.calls[0]!;

    expect(text).toContain("($1,$2,$3,$4,$5,$6,$7,$8::jsonb)");
    expect(values).toHaveLength(8);
    expect(values[0]).toBe("wf-1"); // workflow_id
    expect(values[1]).toBe("ws-1"); // workspace_id
    expect(values[2]).toBe("user-1"); // actor_user_id
    expect(values[3]).toBe("evt-1"); // client_event_id
    expect(values[4]).toBe(5); // server_revision
    expect(values[5]).toBe("node_deleted"); // event_type
    expect(values[6]).toBe(1); // event_schema_version
    expect(values[7]).toBe(JSON.stringify({ nodeId: "node-1" })); // payload
  });

  it("inserts two events with correct placeholders and 16 values", async () => {
    const db = makeQueryable();
    const event1 = makeNodeDeletedEvent("evt-1");
    const event2 = makeNodeDeletedEvent("evt-2");
    await insertWorkflowEvents(db, {
      workflowId: "wf-1",
      workspaceId: "ws-1",
      actorUserId: "user-1",
      events: [
        { event: event1, serverRevision: 3 },
        { event: event2, serverRevision: 4 },
      ],
    });

    expect(db.calls).toHaveLength(1);
    const { text, values } = db.calls[0]!;

    expect(text).toContain("($1,$2,$3,$4,$5,$6,$7,$8::jsonb)");
    expect(text).toContain("($9,$10,$11,$12,$13,$14,$15,$16::jsonb)");
    expect(values).toHaveLength(16);

    // First event values
    expect(values[3]).toBe("evt-1");
    expect(values[4]).toBe(3);

    // Second event values start at index 8
    expect(values[11]).toBe("evt-2");
    expect(values[12]).toBe(4);
  });

  it("JSON-stringifies the payload, not the raw object", async () => {
    const db = makeQueryable();
    const event = makeNodeDeletedEvent("evt-1");
    await insertWorkflowEvents(db, {
      workflowId: "wf-1",
      workspaceId: "ws-1",
      actorUserId: "user-1",
      events: [{ event, serverRevision: 1 }],
    });

    const payloadValue = db.calls[0]!.values[7];
    expect(typeof payloadValue).toBe("string");
    expect(JSON.parse(payloadValue as string)).toEqual({ nodeId: "node-1" });
  });
});

describe("findExistingRevisions", () => {
  it("returns an empty Map without calling db.query when clientEventIds is empty", async () => {
    const db = makeQueryable();
    const result = await findExistingRevisions(db, "wf-1", []);
    expect(result.size).toBe(0);
    expect(db.calls).toHaveLength(0);
  });

  it("queries with workflow ID and IDs array, returns correct Map", async () => {
    const db = makeQueryable([
      { client_event_id: "evt-a", server_revision: 7 },
      { client_event_id: "evt-b", server_revision: 8 },
    ]);

    const result = await findExistingRevisions(db, "wf-1", ["evt-a", "evt-b"]);

    expect(db.calls).toHaveLength(1);
    expect(db.calls[0]!.values[0]).toBe("wf-1");
    expect(db.calls[0]!.values[1]).toEqual(["evt-a", "evt-b"]);

    expect(result.get("evt-a")).toBe(7);
    expect(result.get("evt-b")).toBe(8);
    expect(result.size).toBe(2);
  });

  it("returns empty Map when no matching rows are found", async () => {
    const db = makeQueryable([]);
    const result = await findExistingRevisions(db, "wf-1", ["evt-x"]);
    expect(result.size).toBe(0);
  });
});
