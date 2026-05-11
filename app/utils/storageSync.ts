"use client";

export const CLASSENSE_STORAGE_SYNC_EVENT = "classense-storage-sync";

export const emitClassenseStorageSync = () => {
  if (typeof window === "undefined") return;
  const emit = () => window.dispatchEvent(new Event(CLASSENSE_STORAGE_SYNC_EVENT));
  emit();
  window.setTimeout(emit, 0);
  window.setTimeout(emit, 250);
};

export const subscribeClassenseStorageSync = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(CLASSENSE_STORAGE_SYNC_EVENT, callback);
  return () => window.removeEventListener(CLASSENSE_STORAGE_SYNC_EVENT, callback);
};
