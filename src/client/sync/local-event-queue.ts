import type { WorkflowEvent } from "@/domain/workflows/events";

export type EventQueueStorage = {
  add(workflowId: string, event: WorkflowEvent): Promise<void>;
  getAll(workflowId: string): Promise<WorkflowEvent[]>;
  remove(workflowId: string, clientEventId: string): Promise<void>;
};

export type LocalEventQueue = {
  enqueue(event: WorkflowEvent): Promise<void>;
  getPendingEvents(): Promise<WorkflowEvent[]>;
  markCommitted(clientEventId: string): Promise<void>;
};

export function createLocalEventQueue(
  workflowId: string,
  storage: EventQueueStorage,
): LocalEventQueue {
  return {
    enqueue: (event) => storage.add(workflowId, event),
    getPendingEvents: () => storage.getAll(workflowId),
    markCommitted: (clientEventId) => storage.remove(workflowId, clientEventId),
  };
}
