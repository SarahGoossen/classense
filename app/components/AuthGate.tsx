"use client";

import { useState } from "react";
import { useClassenseCloud } from "../context/ClassenseCloud";

export default function AuthGate() {
  const { authMode, setAuthMode, signIn, signUp, syncStatus } = useClassenseCloud();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage("");

    const result =
      authMode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);

    setSubmitting(false);
    setMessage(result.error || result.message || "");
  };

  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <div className="auth-copy">
          <span className="auth-chip">Classense Cloud</span>
          <h1>Keep your Classense data safe across devices.</h1>
          <p>
            Create a Classense account so your classes, logs, planner items,
            library resources, reminders, and settings stay with you when you
            switch phones, tablets, or browsers.
          </p>
          <p className="auth-note">
            Your Classense data stays private, secure, and available only to you.
          </p>
        </div>

        <div className="auth-form">
          <div className="auth-tabs">
            <button
              className={authMode === "signin" ? "active" : ""}
              onClick={() => setAuthMode("signin")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={authMode === "signup" ? "active" : ""}
              onClick={() => setAuthMode("signup")}
              type="button"
            >
              Create account
            </button>
          </div>

          <label>
            Email
            <input
              className="app-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teacher@example.com"
              type="email"
            />
          </label>

          <label>
            Password
            <input
              className="app-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              type="password"
            />
          </label>

          <button
            className="app-button app-button-primary"
            disabled={submitting}
            onClick={handleSubmit}
            type="button"
          >
            {submitting
              ? "Working..."
              : authMode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>

          <p className="auth-status">{message || syncStatus}</p>
        </div>
      </div>

      <style jsx>{`
        .auth-shell {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 32%),
            linear-gradient(180deg, #f8fbff, #eef4ff);
        }

        .auth-panel {
          width: min(980px, 100%);
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
        }

        .auth-copy h1 {
          margin: 14px 0 10px;
          font-size: clamp(2rem, 5vw, 3.5rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #0f172a;
        }

        .auth-copy p {
          max-width: 48ch;
          color: #475569;
          font-size: 1rem;
          line-height: 1.7;
        }

        .auth-note {
          margin-top: 4px;
          color: #1e3a8a;
          font-weight: 600;
        }

        .auth-chip {
          display: inline-flex;
          padding: 6px 12px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .auth-form {
          display: grid;
          gap: 14px;
          padding: 22px;
          border-radius: 22px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .auth-form label {
          display: grid;
          gap: 8px;
          color: #334155;
          font-size: 0.92rem;
          font-weight: 600;
        }

        .auth-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }

        .auth-tabs button {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          padding: 10px 14px;
          font-weight: 700;
          color: #475569;
        }

        .auth-tabs button.active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }

        .app-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
        }

        .app-button {
          border: none;
          border-radius: 12px;
          padding: 12px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .app-button-primary {
          background: linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa);
          color: white;
        }

        .auth-status {
          min-height: 20px;
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        @media (max-width: 800px) {
          .auth-panel {
            grid-template-columns: 1fr;
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}
