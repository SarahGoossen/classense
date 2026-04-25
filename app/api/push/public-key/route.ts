import { NextResponse } from "next/server";
import { getPushPublicKey } from "../../../lib/push-server";

export async function GET() {
  try {
    return NextResponse.json({ publicKey: getPushPublicKey() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Push public key is unavailable." },
      { status: 500 }
    );
  }
}
