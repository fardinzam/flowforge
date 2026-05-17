import type { Queryable } from "@/server/db/pool";

export async function succeedRun(db: Queryable, runId: string): Promise<void> {
  await db.query(
    `
      update public.workflow_runs
      set status = 'succeeded', finished_at = now()
      where id = $1
    `,
    [runId],
  );
}

export async function failRun(
  db: Queryable,
  runId: string,
  errorSummary: string,
): Promise<void> {
  await db.query(
    `
      update public.workflow_runs
      set status = 'failed', finished_at = now(), error_summary = $2
      where id = $1
    `,
    [runId, errorSummary],
  );
}

export async function scheduleRetry(
  db: Queryable,
  runId: string,
  delayMs: number,
): Promise<void> {
  await db.query(
    `
      update public.workflow_runs
      set
        status = 'queued',
        next_attempt_at = now() + ($2 || ' milliseconds')::interval,
        locked_by = null,
        lease_expires_at = null
      where id = $1
    `,
    [runId, delayMs.toString()],
  );
}
