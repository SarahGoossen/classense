const DEVICE_ID_KEY = "classensePushDeviceId";

export const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

export const getOrCreatePushDeviceId = () => {
  if (typeof window === "undefined") return "";

  const saved = localStorage.getItem(DEVICE_ID_KEY);
  if (saved) return saved;

  const deviceId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};

export const registerPushServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }

  return navigator.serviceWorker.register("/sw.js");
};
