"use client";

import { FormEvent, MouseEvent, useState } from "react";
import { useClassenseCloud } from "../context/ClassenseCloud";

export default function AuthGate() {
  const { authMode, setAuthMode, signIn, signUp, resetPassword, syncStatus } = useClassenseCloud();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const result =
      authMode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);

    setSubmitting(false);
    setMessage(result.error || result.message || "");
  };

  const handlePasswordReset = async (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.form;
    if (!form) {
      setMessage("We couldn't read the email form. Refresh and try again.");
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();

    setSubmitting(true);
    setMessage("");

    const result = await resetPassword(email);

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

        <form className="auth-form" onSubmit={handleSubmit}>
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
              autoComplete="email"
              className="app-input"
              name="email"
              placeholder="teacher@example.com"
              type="email"
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                className="app-input password-input"
                name="password"
                placeholder="At least 6 characters"
                type={showPassword ? "text" : "password"}
              />
              <button
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    className="password-icon"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1 2.26-2.75 4.15-4.98 5.32M6.61 6.61C4.62 7.8 3.06 9.62 2 12c1.73 3.89 6 7 10 7 1.73 0 3.38-.36 4.86-1.02"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="password-icon"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M2 12s3.64-7 10-7 10 7 10 7-3.64 7-10 7-10-7-10-7z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      fill="none"
                      r="3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <button
            className="app-button app-button-primary"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? "Working..."
              : authMode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>

          {authMode === "signin" ? (
            <button
              className="auth-link"
              disabled={submitting}
              onClick={handlePasswordReset}
              type="button"
            >
              Forgot password?
            </button>
          ) : null}

          <p className="auth-status">{message || syncStatus}</p>
        </form>
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

        .password-field {
          position: relative;
        }

        .password-input {
          padding-right: 72px;
        }

        .password-toggle {
          position: absolute;
          top: 50%;
          right: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #2563eb;
          cursor: pointer;
        }

        .password-icon {
          width: 18px;
          height: 18px;
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

        .auth-link {
          justify-self: start;
          padding: 0;
          border: none;
          background: transparent;
          color: #2563eb;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
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
