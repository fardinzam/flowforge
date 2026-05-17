import type { CommittedEvent } from "@/server/sync/events";

export type WorkflowSubscriptionCallbacks = {
  onWorkflowEvents(events: CommittedEvent[], latestRevision: number): void;
  onRunsUpdated(): void;
  onSnapshotRequired(): void;
};

export type WorkflowSubscription = {
  disconnect(): void;
};

export function subscribeToWorkflow(
  workflowId: string,
  afterRevision: number,
  callbacks: WorkflowSubscriptionCallbacks,
): WorkflowSubscription {
  const url = `/api/workflows/${workflowId}/stream?afterRevision=${afterRevision}`;
  const evtSource = new EventSource(url);

  evtSource.addEventListener("workflow_events", (e) => {
    try {
      const data = JSON.parse(e.data) as {
        events: CommittedEvent[];
        latestRevision: number;
      };
      callbacks.onWorkflowEvents(data.events, data.latestRevision);
    } catch {
      // malformed event — ignore
    }
  });

  evtSource.addEventListener("runs_updated", () => {
    callbacks.onRunsUpdated();
  });

  evtSource.addEventListener("snapshot_required", () => {
    callbacks.onSnapshotRequired();
    evtSource.close();
  });

  return {
    disconnect: () => evtSource.close(),
  };
}
