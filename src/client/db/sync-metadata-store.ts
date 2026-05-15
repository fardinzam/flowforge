import type { FlowForgeDatabase } from "./indexed-db";

export async function getSyncMetadata(
  db: FlowForgeDatabase,
  workflowId: string,
): Promise<{ serverRevision: number } | null> {
  const record = await db.get("sync_metadata", workflowId);
  if (!record) return null;
  return { serverRevision: record.serverRevision };
}

export async function setSyncMetadata(
  db: FlowForgeDatabase,
  workflowId: string,
  serverRevision: number,
): Promise<void> {
  await db.put("sync_metadata", { workflowId, serverRevision });
}
