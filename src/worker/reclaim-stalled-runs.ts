import type { Queryable } from "@/server/db/pool";

export async function reclaimStalledRuns(db: Queryable): Promise<number> {
  const result = await db.query(
    `UPDATE public.workflow_runs
     SET status = 'queued', locked_by = NULL, lease_expires_at = NULL
     WHERE status = 'running'
       AND lease_expires_at < now()
     RETURNING id`,
  );
  return result.rows.length;
}
