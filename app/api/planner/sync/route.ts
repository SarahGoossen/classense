import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SnapshotPayload = {
  app_name?: string;
  lastUsedClass?: string;
  remindersEnabled?: string;
  classReminder?: string;
  prepReminder?: string;
  prepTime?: string;
  app_theme?: string;
  classes?: unknown[];
  logs?: unknown[];
  plannerEvents?: unknown[];
  library?: unknown[];
  reminders?: unknown[];
};

const getServerClient = () => {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Classense cloud server config is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";

    if (!token) {
      return NextResponse.json({ error: "Missing session token." }, { status: 401 });
    }

    const supabase = getServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Could not verify Classense account." }, { status: 401 });
    }

    const body = (await request.json()) as {
      plannerEvents?: unknown[];
      reminders?: unknown[];
    };

    const plannerEvents = Array.isArray(body?.plannerEvents) ? body.plannerEvents : [];
    const reminders = Array.isArray(body?.reminders) ? body.reminders : [];

    const { data: existingRow, error: readError } = await supabase
      .from("user_snapshots")
      .select("payload")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: "Could not read existing Classense data." }, { status: 500 });
    }

    const existingPayload = ((existingRow?.payload as SnapshotPayload | null) || {}) satisfies SnapshotPayload;
    const nextPayload: SnapshotPayload = {
      app_name: existingPayload.app_name ?? "",
      lastUsedClass: existingPayload.lastUsedClass ?? "",
      remindersEnabled: existingPayload.remindersEnabled ?? "true",
      classReminder: existingPayload.classReminder ?? "true",
      prepReminder: existingPayload.prepReminder ?? "true",
      prepTime: existingPayload.prepTime ?? "2h",
      app_theme: existingPayload.app_theme ?? "light",
      classes: existingPayload.classes ?? [],
      logs: existingPayload.logs ?? [],
      plannerEvents,
      library: existingPayload.library ?? [],
      reminders,
    };

    const { error: writeError } = await supabase.from("user_snapshots").upsert({
      user_id: user.id,
      payload: nextPayload,
      updated_at: new Date().toISOString(),
    });

    if (writeError) {
      return NextResponse.json({ error: "Could not save planner changes to Classense Cloud." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save planner changes to Classense Cloud.",
      },
      { status: 500 }
    );
  }
}
