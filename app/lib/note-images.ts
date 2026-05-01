"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export const NOTE_IMAGE_BUCKET = "lesson-note-images";

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "note-image";

export const buildNoteImagePath = (userId: string, fileName: string) => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return `${userId}/${stamp}-${sanitizeFileName(fileName)}`;
};

export const uploadNoteImage = async (
  supabase: SupabaseClient,
  userId: string,
  file: File
) => {
  const path = buildNoteImagePath(userId, file.name || "note-image");
  const { error } = await supabase.storage.from(NOTE_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return path;
};

export const createNoteImageUrl = async (
  supabase: SupabaseClient,
  path: string
) => {
  const { data, error } = await supabase.storage
    .from(NOTE_IMAGE_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    throw error || new Error("Could not create a note image URL.");
  }

  return data.signedUrl;
};

export const removeNoteImage = async (
  supabase: SupabaseClient,
  path: string
) => {
  const { error } = await supabase.storage.from(NOTE_IMAGE_BUCKET).remove([path]);
  if (error) {
    throw error;
  }
};
