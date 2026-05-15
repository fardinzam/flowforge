import { NextResponse } from "next/server";

import { handleWorkflowRouteError } from "@/app/api/workflows/route";
import { requireUser } from "@/server/auth/session";
import { getWorkflowForUser } from "@/server/workflows/service";

type WorkflowRouteContext = {
  params: Promise<{
    workflowId: string;
  }>;
};

export async function GET(_request: Request, context: WorkflowRouteContext) {
  const user = await requireUser();
  const { workflowId } = await context.params;

  try {
    const workflow = await getWorkflowForUser({
      userId: user.id,
      workflowId,
    });

    return NextResponse.json({ workflow });
  } catch (error) {
    return handleWorkflowRouteError(error);
  }
}
