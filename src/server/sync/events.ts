import "server-only";

import type { WorkflowEvent } from "@/domain/workflows/events";
import type { Queryable } from "@/server/db/pool";

export type CommittedEvent = WorkflowEvent & { serverRevision: number };

export async function findExistingRevisions(
  db: Queryable,
  workflowId: string,
  clientEventIds: string[],
): Promise<Map<string, number>> {
  if (clientEventIds.length === 0) return new Map();

  const result = await db.query<{
    client_event_id: string;
    server_revision: number;
  }>(
    `
      select client_event_id, server_revision
      from public.workflow_events
      where workflow_id = $1
        and client_event_id = any($2)
    `,
    [workflowId, clientEventIds],
  );

  return new Map(
    result.rows.map((r) => [r.client_event_id, r.server_revision]),
  );
}

export async function insertWorkflowEvents(
  db: Queryable,
  params: {
    workflowId: string;
    workspaceId: string;
    actorUserId: string;
    events: Array<{ event: WorkflowEvent; serverRevision: number }>;
  },
): Promise<void> {
  if (params.events.length === 0) return;

  const placeholders = params.events
    .map((_, i) => {
      const b = i * 8;
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8}::jsonb)`;
    })
    .join(",");

  const values = params.events.flatMap(({ event, serverRevision }) => [
    params.workflowId,
    params.workspaceId,
    params.actorUserId,
    event.clientEventId,
    serverRevision,
    event.type,
    event.eventSchemaVersion,
    JSON.stringify(event.payload),
  ]);

  await db.query(
    `INSERT INTO public.workflow_events
       (workflow_id, workspace_id, actor_user_id, client_event_id,
        server_revision, event_type, event_schema_version, payload)
     VALUES ${placeholders}`,
    values,
  );
}
