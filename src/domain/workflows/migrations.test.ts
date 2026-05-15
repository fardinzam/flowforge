import { describe, expect, it } from "vitest";

import {
  UnsupportedWorkflowSchemaVersionError,
  migrateWorkflowEvent,
  migrateWorkflowSnapshot,
} from "./migrations";
import type { WorkflowEvent } from "./events";
import type { WorkflowGraph } from "./types";

const graph: WorkflowGraph = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

const event: WorkflowEvent = {
  clientEventId: "evt_1",
  type: "workflow_renamed",
  eventSchemaVersion: 1,
  payload: { name: "Production webhook" },
  createdAt: "2026-05-14T20:00:00.000Z",
};

describe("workflow migrations", () => {
  it("returns current workflow events unchanged", () => {
    expect(migrateWorkflowEvent(event)).toEqual(event);
  });

  it("returns current workflow snapshots unchanged", () => {
    expect(
      migrateWorkflowSnapshot({
        schemaVersion: 1,
        graph,
      }),
    ).toEqual(graph);
  });

  it("throws a typed error for unsupported event versions", () => {
    expect(() =>
      migrateWorkflowEvent({
        ...event,
        eventSchemaVersion: 99,
      }),
    ).toThrow(UnsupportedWorkflowSchemaVersionError);
  });

  it("throws a typed error for unsupported snapshot versions", () => {
    expect(() =>
      migrateWorkflowSnapshot({
        schemaVersion: 99,
        graph,
      }),
    ).toThrow(UnsupportedWorkflowSchemaVersionError);
  });
});
