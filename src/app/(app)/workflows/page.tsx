import { CreateWorkflowDialog } from "@/components/workflows/create-workflow-dialog";
import { WorkflowList } from "@/components/workflows/workflow-list";
import { requireUser } from "@/server/auth/session";
import { listWorkflowsForWorkspace } from "@/server/workflows/service";
import { bootstrapDefaultWorkspace } from "@/server/workspaces/service";

export default async function WorkflowsPage() {
  const user = await requireUser();
  const activeWorkspace = await bootstrapDefaultWorkspace({
    id: user.id,
    email: user.email,
    name: user.user_metadata.name,
  });
  const workflows = await listWorkflowsForWorkspace({
    userId: user.id,
    workspaceId: activeWorkspace.id,
  });

  return (
    <section>
      <header>
        <h1>Workflows</h1>
        {activeWorkspace ? (
          <CreateWorkflowDialog workspaceId={activeWorkspace.id} />
        ) : null}
      </header>
      <WorkflowList workflows={workflows} />
    </section>
  );
}
