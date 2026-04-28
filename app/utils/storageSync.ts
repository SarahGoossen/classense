"use client";

export const CLASSENSE_STORAGE_SYNC_EVENT = "classense-storage-sync";

export const emitClassenseStorageSync = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLASSENSE_STORAGE_SYNC_EVENT));
};

export const subscribeClassenseStorageSync = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(CLASSENSE_STORAGE_SYNC_EVENT, callback);
  return () => window.removeEventListener(CLASSENSE_STORAGE_SYNC_EVENT, callback);
};
