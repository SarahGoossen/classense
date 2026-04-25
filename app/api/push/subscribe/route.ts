import { NextRequest, NextResponse } from "next/server";
import { savePushSubscription } from "../../../lib/push-server";

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId, deviceId, userAgent } = await request.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "A valid push subscription is required." }, { status: 400 });
    }

    if (!deviceId) {
      return NextResponse.json({ error: "A device id is required." }, { status: 400 });
    }

    await savePushSubscription({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_id: userId || null,
      device_id: deviceId,
      user_agent: userAgent || null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save push subscription." },
      { status: 500 }
    );
  }
}
