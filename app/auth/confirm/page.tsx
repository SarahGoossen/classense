"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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

type ScreenMode = "loading" | "message" | "recovery";

const parseHashParams = () => {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash);
};

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirming your Classense account...");
  const [mode, setMode] = useState<ScreenMode>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) {
      setMode("message");
      setMessage("Classense Cloud is not configured right now. Please try again later.");
      return;
    }

    const tokenHash = searchParams.get("token_hash");
    const typeParam = searchParams.get("type");
    const code = searchParams.get("code");
    const hashParams = parseHashParams();
    const hashType = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const detectedType = (typeParam || hashType || "") as EmailOtpType;
    const isRecovery = detectedType === "recovery";
    let active = true;

    const finishWithMessage = (nextMessage: string) => {
      if (!active) return;
      setMode("message");
      setMessage(nextMessage);
    };

    const openRecoveryForm = () => {
      if (!active) return;
      setMode("recovery");
      setMessage("Create a new password for your Classense account.");
    };

    const confirm = async () => {
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          finishWithMessage(
            "This password reset link has expired or is no longer valid. Please request a new one."
          );
          return;
        }

        if (isRecovery) {
          openRecoveryForm();
          return;
        }

        finishWithMessage("Your email is confirmed. Opening Classense...");
        window.setTimeout(() => {
          router.replace("/");
        }, 700);
        return;
      }

      if (tokenHash && detectedType && allowedTypes.has(detectedType)) {
        const { error } = await supabase.auth.verifyOtp({
          type: detectedType,
          token_hash: tokenHash,
        });

        if (error) {
          finishWithMessage(
            isRecovery
              ? "This password reset link has expired or is no longer valid. Please request a new one."
              : "This confirmation link has expired or is no longer valid. Please request a new one."
          );
          return;
        }

        if (isRecovery) {
          openRecoveryForm();
          return;
        }

        finishWithMessage("Your email is confirmed. Opening Classense...");
        window.setTimeout(() => {
          router.replace("/");
        }, 700);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          finishWithMessage(
            isRecovery
              ? "This password reset link has expired or is no longer valid. Please request a new one."
              : "This confirmation link has expired or is no longer valid. Please request a new one."
          );
          return;
        }

        if (isRecovery) {
          openRecoveryForm();
          return;
        }

        finishWithMessage("Your email is confirmed. Opening Classense...");
        window.setTimeout(() => {
          router.replace("/");
        }, 700);
        return;
      }

      finishWithMessage("This confirmation link is missing information. Please request a new email.");
    };

    void confirm();

    return () => {
      active = false;
    };
  }, [router, searchParams, supabase]);

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setMessage("Classense Cloud is not configured right now. Please try again later.");
      return;
    }

    if (password.length < 6) {
      setMessage("Use at least 6 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match yet. Please re-enter them.");
      return;
    }

    setSubmittingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmittingPassword(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMode("message");
    setMessage("Your password is updated. Opening Classense...");
    window.setTimeout(() => {
      router.replace("/");
    }, 900);
  };

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
            textAlign: "center",
          }}
        >
          Classense Cloud
        </div>

        {mode === "recovery" ? (
          <form onSubmit={handlePasswordUpdate} style={{ display: "grid", gap: 14 }}>
            <h1
              style={{
                fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
                margin: "0 0 4px",
                color: "#0f172a",
                textAlign: "center",
              }}
            >
              Reset your password
            </h1>
            <p
              style={{
                margin: "0 0 8px",
                color: "#475569",
                fontSize: "1rem",
                lineHeight: 1.65,
                textAlign: "center",
              }}
            >
              Choose a new password for your Classense account.
            </p>

            <label style={labelStyle}>
              New password
              <input
                autoComplete="new-password"
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyle}
                type="password"
                value={password}
              />
            </label>

            <label style={labelStyle}>
              Confirm new password
              <input
                autoComplete="new-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={inputStyle}
                type="password"
                value={confirmPassword}
              />
            </label>

            <button
              disabled={submittingPassword}
              style={primaryButtonStyle}
              type="submit"
            >
              {submittingPassword ? "Updating..." : "Save new password"}
            </button>

            <p style={statusStyle}>{message}</p>
          </form>
        ) : (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", margin: "0 0 12px", color: "#0f172a" }}>
              Email confirmation
            </h1>
            <p style={{ margin: 0, color: "#475569", fontSize: "1rem", lineHeight: 1.65 }}>
              {message}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  color: "#334155",
  fontSize: "0.92rem",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa)",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const statusStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.96rem",
  lineHeight: 1.6,
  textAlign: "center",
};

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmContent />
    </Suspense>
  );
}
