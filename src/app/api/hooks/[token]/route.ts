import { NextResponse } from "next/server";

import { handleWebhook } from "@/server/webhooks/handler";

type HookRouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: HookRouteContext) {
  const { token } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  try {
    const result = await handleWebhook(token, payload);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[webhook] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
