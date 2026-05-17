import "server-only";

import type { Queryable } from "@/server/db/pool";
import { getPool } from "@/server/db/pool";
import type { CommittedEvent } from "@/server/sync/events";
import { getEventsAfterRevision } from "@/server/sync/replay";

export type StreamEvent =
  | { type: "workflow_events"; events: CommittedEvent[]; latestRevision: number }
  | { type: "runs_updated" }
  | { type: "snapshot_required" }
  | { type: "keepalive" };

const POLL_INTERVAL_MS = 2_000;
const KEEPALIVE_INTERVAL_MS = 25_000;

async function hasRecentRunUpdates(
  db: Queryable,
  workflowId: string,
  workspaceId: string,
  since: Date,
): Promise<boolean> {
  const result = await db.query<{ exists: boolean }>(
    `
      select exists (
        select 1 from public.workflow_runs
        where workflow_id = $1
          and workspace_id = $2
          and finished_at > $3
      )
    `,
    [workflowId, workspaceId, since],
  );
  return result.rows[0]?.exists ?? false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function* pollWorkflowStream(
  workspaceId: string,
  workflowId: string,
  afterRevision: number,
  signal: AbortSignal,
  db: Queryable = getPool(),
): AsyncGenerator<StreamEvent> {
  let lastRevision = afterRevision;
  let lastRunCheck = new Date();
  let lastKeepalive = Date.now();

  while (!signal.aborted) {
    // Check for new workflow events
    const replayResult = await getEventsAfterRevision(workspaceId, workflowId, lastRevision, db);

    if (replayResult.type === "snapshot_required") {
      yield { type: "snapshot_required" };
      return;
    }

    if (replayResult.events.length > 0) {
      lastRevision = replayResult.latestRevision;
      yield {
        type: "workflow_events",
        events: replayResult.events,
        latestRevision: replayResult.latestRevision,
      };
    }

    // Check for completed runs
    const hasRuns = await hasRecentRunUpdates(db, workflowId, workspaceId, lastRunCheck);
    if (hasRuns) {
      lastRunCheck = new Date();
      yield { type: "runs_updated" };
    }

    // Keepalive
    if (Date.now() - lastKeepalive >= KEEPALIVE_INTERVAL_MS) {
      lastKeepalive = Date.now();
      yield { type: "keepalive" };
    }

    if (!signal.aborted) {
      await sleep(POLL_INTERVAL_MS);
    }
  }
}
