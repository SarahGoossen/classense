import { NextResponse } from "next/server";

const buildVersion =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.npm_package_version ||
  "dev";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      version: buildVersion,
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
