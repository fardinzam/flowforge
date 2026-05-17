import type { SyncStatus } from "@/client/sync/sync-status";

const STATUS_LABEL: Record<SyncStatus, string> = {
  saved_locally: "Saved locally",
  syncing: "Syncing…",
  synced: "Synced",
  reconnect_needed: "Offline — changes queued",
  refresh_required: "Conflict — action needed",
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const label = STATUS_LABEL[status];
  return (
    <span
      role={status === "refresh_required" ? "alert" : "status"}
      aria-live={
        status === "synced" || status === "syncing" ? "polite" : undefined
      }
      aria-busy={status === "syncing" ? true : undefined}
      aria-label={label}
    >
      {label}
    </span>
  );
}
