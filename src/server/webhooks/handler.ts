import "server-only";

import { nanoid } from "nanoid";

import type { Queryable } from "@/server/db/pool";
import { checkRateLimit } from "@/server/rate-limit/webhook-rate-limit";
import { hashToken } from "@/server/triggers/tokens";
import { createTriggerQueries } from "@/server/triggers/queries";

export type WebhookHandlerResult =
  | { accepted: true; runId: string }
  | { accepted: false };

const REJECTED: WebhookHandlerResult = { accepted: false };

export async function handleWebhook(
  token: string,
  payload: unknown,
  db?: Queryable,
): Promise<WebhookHandlerResult> {
  const queryable = db ?? (await import("@/server/db/pool")).getPool();
  const triggerQueries = createTriggerQueries(queryable);

  const tokenHash = hashToken(token);

  const trigger = await triggerQueries.findActiveByTokenHash(tokenHash);
  if (!trigger) return REJECTED;

  const allowed = await checkRateLimit(tokenHash, 10, queryable);
  if (!allowed) return REJECTED;

  const result = await queryable.query<{ id: string }>(
    `
      insert into public.workflow_runs
        (workspace_id, workflow_id, trigger_id, status,
         input_snapshot_json, idempotency_key)
      values ($1, $2, $3, 'queued', $4::jsonb, $5)
      returning id
    `,
    [
      trigger.workspaceId,
      trigger.workflowId,
      trigger.id,
      JSON.stringify(payload ?? {}),
      nanoid(),
    ],
  );

  const runId = result.rows[0]!.id;
  await triggerQueries.updateLastUsed(trigger.id);

  return { accepted: true, runId };
}
