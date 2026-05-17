import type { Queryable } from "@/server/db/pool";

export type ClaimedRun = {
  id: string;
  workspaceId: string;
  workflowId: string;
  inputPayload: unknown;
  timeoutMs: number;
  maxSteps: number;
  runAttempt: number;
};

export async function claimRun(db: Queryable): Promise<ClaimedRun | null> {
  const result = await db.query<{
    id: string;
    workspace_id: string;
    workflow_id: string;
    input_snapshot_json: unknown;
    timeout_ms: number;
    max_steps: number;
    run_attempt: number;
  }>(
    `
      update public.workflow_runs
      set
        status = 'running',
        started_at = coalesce(started_at, now()),
        run_attempt = run_attempt + 1,
        locked_by = $1,
        lease_expires_at = now() + interval '5 minutes'
      where id = (
        select id from public.workflow_runs
        where status = 'queued'
          and (next_attempt_at is null or next_attempt_at <= now())
        order by queued_at
        for update skip locked
        limit 1
      )
      returning id, workspace_id, workflow_id, input_snapshot_json,
                timeout_ms, max_steps, run_attempt
    `,
    [process.pid.toString()],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workflowId: row.workflow_id,
    inputPayload: row.input_snapshot_json,
    timeoutMs: row.timeout_ms,
    maxSteps: row.max_steps,
    runAttempt: row.run_attempt,
  };
}
