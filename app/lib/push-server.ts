import webpush, { PushSubscription } from "web-push";

type StoredPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
  device_id: string;
  user_agent: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

const assertPushEnv = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase push storage is not configured.");
  }

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error("VAPID keys are not configured.");
  }
};

const getRestHeaders = () => ({
  apikey: supabaseServiceRoleKey!,
  Authorization: `Bearer ${supabaseServiceRoleKey!}`,
  "Content-Type": "application/json",
});

export const getPushPublicKey = () => {
  if (!vapidPublicKey) {
    throw new Error("Push public key is not configured.");
  }

  return vapidPublicKey;
};

export const savePushSubscription = async (input: StoredPushSubscription) => {
  assertPushEnv();

  const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
    method: "POST",
    headers: {
      ...getRestHeaders(),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        ...input,
        updated_at: new Date().toISOString(),
      },
    ]),
  });

  if (!response.ok) {
    throw new Error("Could not save the push subscription.");
  }
};

export const deletePushSubscription = async (endpoint: string) => {
  assertPushEnv();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
    {
      method: "DELETE",
      headers: getRestHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Could not remove the push subscription.");
  }
};

export const getSubscriptionsByDeviceId = async (deviceId: string) => {
  assertPushEnv();

  const response = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?device_id=eq.${encodeURIComponent(deviceId)}&select=endpoint,p256dh,auth,user_id,device_id,user_agent`,
    {
      method: "GET",
      headers: getRestHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Could not load push subscriptions.");
  }

  return (await response.json()) as StoredPushSubscription[];
};

export const sendPushMessage = async (
  subscription: PushSubscription,
  payload: Record<string, unknown>
) => {
  assertPushEnv();

  webpush.setVapidDetails(vapidSubject!, vapidPublicKey!, vapidPrivateKey!);
  await webpush.sendNotification(subscription, JSON.stringify(payload));
};
