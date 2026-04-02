"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase";

const allowedTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirming your Classense account...");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const tokenHash = searchParams.get("token_hash");
    const typeParam = searchParams.get("type");

    if (!supabase || !tokenHash || !typeParam || !allowedTypes.has(typeParam as EmailOtpType)) {
      setMessage("This confirmation link is missing information. Please request a new email.");
      return;
    }

    let active = true;

    const confirm = async () => {
      const { error } = await supabase.auth.verifyOtp({
        type: typeParam as EmailOtpType,
        token_hash: tokenHash,
      });

      if (!active) return;

      if (error) {
        setMessage("This confirmation link has expired or is no longer valid. Please request a new one.");
        return;
      }

      setMessage("Your email is confirmed. Opening Classense...");
      window.setTimeout(() => {
        router.replace("/");
      }, 700);
    };

    void confirm();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 32%), linear-gradient(180deg, #f8fbff, #eef4ff)",
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.12)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#2563eb",
            marginBottom: 14,
          }}
        >
          Classense Cloud
        </div>
        <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", margin: "0 0 12px", color: "#0f172a" }}>
          Email confirmation
        </h1>
        <p style={{ margin: 0, color: "#475569", fontSize: "1rem", lineHeight: 1.65 }}>
          {message}
        </p>
      </div>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmContent />
    </Suspense>
  );
}
