import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type { WorkflowEvent } from "@/domain/workflows/events";
import type { WorkflowGraph } from "@/domain/workflows/types";

interface FlowForgeDB extends DBSchema {
  workflow_snapshots: {
    key: string;
    value: { workflowId: string; graph: WorkflowGraph; savedAt: string };
  };
  pending_events: {
    key: number;
    value: { workflowId: string; event: WorkflowEvent };
    indexes: { by_workflow: string };
  };
  sync_metadata: {
    key: string;
    value: { workflowId: string; serverRevision: number };
  };
}

export type FlowForgeDatabase = IDBPDatabase<FlowForgeDB>;

export async function openFlowForgeDB(): Promise<FlowForgeDatabase> {
  return openDB<FlowForgeDB>("flowforge", 1, {
    upgrade(db) {
      db.createObjectStore("workflow_snapshots", { keyPath: "workflowId" });
      const events = db.createObjectStore("pending_events", {
        autoIncrement: true,
      });
      events.createIndex("by_workflow", "workflowId");
      db.createObjectStore("sync_metadata", { keyPath: "workflowId" });
    },
  });
}
