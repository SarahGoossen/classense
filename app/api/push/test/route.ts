import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionsByDeviceId, sendPushMessage } from "../../../lib/push-server";

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "A device id is required." }, { status: 400 });
    }

    const subscriptions = await getSubscriptionsByDeviceId(deviceId);
    if (subscriptions.length === 0) {
      return NextResponse.json({ error: "No push subscription was found for this device." }, { status: 404 });
    }

    await Promise.all(
      subscriptions.map((subscription) =>
        sendPushMessage(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          {
            title: "Classense test notification",
            body: "Push notifications are connected for this device.",
            url: "/",
          }
        )
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send the test notification." },
      { status: 500 }
    );
  }
}
