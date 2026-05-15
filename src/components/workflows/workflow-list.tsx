import type { WorkflowSummary } from "@/server/workflows/queries";
import Link from "next/link";

type WorkflowListProps = {
  workflows: WorkflowSummary[];
};

export function WorkflowList({ workflows }: WorkflowListProps) {
  if (workflows.length === 0) {
    return <p>No workflows yet.</p>;
  }

  return (
    <ul aria-label="Workflows">
      {workflows.map((workflow) => (
        <li key={workflow.id}>
          <Link href={`/workflows/${workflow.id}`}>{workflow.name}</Link>
          <span>Version {workflow.version}</span>
        </li>
      ))}
    </ul>
  );
}
