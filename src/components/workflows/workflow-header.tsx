import type { WorkflowSummary } from "@/server/workflows/queries";

type WorkflowHeaderProps = {
  workflow: WorkflowSummary;
};

export function WorkflowHeader({ workflow }: WorkflowHeaderProps) {
  return (
    <header>
      <p>Workflow</p>
      <h1>{workflow.name}</h1>
      <p aria-label="Sync status">Sync status: ready</p>
    </header>
  );
}
