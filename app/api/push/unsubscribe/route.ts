import { NextRequest, NextResponse } from "next/server";
import { deletePushSubscription } from "../../../lib/push-server";

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: "A subscription endpoint is required." }, { status: 400 });
    }

    await deletePushSubscription(endpoint);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove push subscription." },
      { status: 500 }
    );
  }
}
