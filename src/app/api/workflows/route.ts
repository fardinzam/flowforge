import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/server/auth/session";
import {
  createWorkflowForWorkspace,
  listWorkflowsForWorkspace,
  WorkflowAccessError,
  WorkflowNotFoundError,
} from "@/server/workflows/service";

const createWorkflowRequestSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
});

function workflowAccessResponse() {
  return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
}

export function workflowNotFoundResponse() {
  return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
}

export function handleWorkflowRouteError(error: unknown) {
  if (error instanceof WorkflowAccessError) {
    return workflowAccessResponse();
  }

  if (error instanceof WorkflowNotFoundError) {
    return workflowNotFoundResponse();
  }

  throw error;
}

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 },
    );
  }

  try {
    const workflows = await listWorkflowsForWorkspace({
      userId: user.id,
      workspaceId,
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    return handleWorkflowRouteError(error);
  }
}

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = createWorkflowRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workflow request" },
      { status: 400 },
    );
  }

  try {
    const workflow = await createWorkflowForWorkspace({
      userId: user.id,
      workspaceId: parsed.data.workspaceId,
      name: parsed.data.name,
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    return handleWorkflowRouteError(error);
  }
}
