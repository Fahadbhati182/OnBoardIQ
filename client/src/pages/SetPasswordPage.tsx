import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { API_URL } from "../services/apiClient";
import "./SetPasswordPage.css";

export const SetPasswordPage: React.FC = () => {
  const [token] = useState(
    () =>
      new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
    }
  }, []);

  const passwordBytes = new TextEncoder().encode(password).length;
  const hasMinimumLength = password.length >= 8;
  const hasMaximumLength = password.length > 0 && passwordBytes <= 72;
  const passwordsMatch =
    confirmation.length > 0 && password === confirmation;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This invitation link is missing its token.");
      return;
    }
    if (!hasMinimumLength || !hasMaximumLength) {
      setError("Your password must be between 8 and 72 bytes.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords don’t match yet.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/auth/password-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || "Unable to set your password.");
      }
      setPassword("");
      setConfirmation("");
      setComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to set your password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="password-setup">
      <div className="password-setup__glow password-setup__glow--top" />
      <div className="password-setup__glow password-setup__glow--bottom" />

      <header className="password-setup__brand">
        <span className="password-setup__brand-icon">
          <Sparkles size={20} />
        </span>
        <span>
          <strong>OnboardIQ</strong>
          <small>NEW JOINER EXPERIENCE</small>
        </span>
      </header>

      <section className="password-setup__card">
        <Link className="password-setup__back" to="/login">
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <div className="password-setup__heading">
          <span className="password-setup__heading-icon">
            {complete ? <CheckCircle2 size={24} /> : <KeyRound size={23} />}
          </span>
          <p className="password-setup__eyebrow">
            {complete ? "YOU’RE ALL SET" : "ACCOUNT SETUP"}
          </p>
          <h1>{complete ? "Password created" : "Create your password"}</h1>
          <p className="password-setup__description">
            {complete
              ? "Your account is ready. Sign in with your work email and new password."
              : "Choose a secure password to finish setting up your account."}
          </p>
        </div>

        {complete ? (
          <div className="password-setup__success">
            <p className="password-setup__success-message">
              <CheckCircle2 size={19} />
              Password saved successfully
            </p>
            <Link className="password-setup__submit" to="/login">
              Continue to sign in <ArrowRight size={18} />
            </Link>
          </div>
        ) : !token ? (
          <div className="password-setup__notice" role="alert">
            <strong>Invitation link unavailable</strong>
            <p>
              This link is missing its setup token. Ask your administrator to
              send you a new invitation.
            </p>
          </div>
        ) : (
          <form
            className="password-setup__form"
            onSubmit={(event) => void submit(event)}
          >
            <PasswordField
              id="new-password"
              label="New password"
              placeholder="Enter at least 8 characters"
              value={password}
              visible={showPassword}
              onVisibilityChange={() => setShowPassword((value) => !value)}
              onChange={setPassword}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmation}
              visible={showConfirmation}
              onVisibilityChange={() =>
                setShowConfirmation((value) => !value)
              }
              onChange={setConfirmation}
            />

            <section className="password-setup__requirements">
              <h2>
                <ShieldCheck size={23} />
                Password requirements
              </h2>
              <ul>
                <Requirement met={hasMinimumLength}>
                  At least 8 characters
                </Requirement>
                <Requirement met={hasMaximumLength}>
                  No more than 72 bytes
                </Requirement>
                {confirmation && (
                  <Requirement met={passwordsMatch}>
                    Passwords match
                  </Requirement>
                )}
              </ul>
            </section>

            {error && (
              <p className="password-setup__error" role="alert">
                {error}
              </p>
            )}

            <button
              className="password-setup__submit"
              type="submit"
              disabled={
                submitting ||
                !hasMinimumLength ||
                !hasMaximumLength ||
                !passwordsMatch
              }
            >
              {submitting ? "Creating your password…" : "Create password"}
              {!submitting && <ArrowRight size={19} />}
            </button>

            <p className="password-setup__security-note">
              <ShieldCheck size={14} />
              Your password is encrypted and never emailed
            </p>
          </form>
        )}

        <p className="password-setup__help">
          Need a fresh link?{" "}
          <Link to="/login">Contact your administrator</Link>
        </p>
      </section>

      <footer className="password-setup__footer">
        © {new Date().getFullYear()} OnboardIQ · A smoother way to get started
      </footer>
    </main>
  );
};

function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  onVisibilityChange,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  visible: boolean;
  onVisibilityChange: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <label className="password-setup__field" htmlFor={id}>
      <span className="password-setup__field-label">{label}</span>
      <span className="password-setup__input-wrap">
        <LockKeyhole className="password-setup__lock-icon" size={20} />
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          minLength={8}
          maxLength={72}
        />
        <button
          className="password-setup__visibility"
          type="button"
          onClick={onVisibilityChange}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </span>
    </label>
  );
}

function Requirement({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={met ? "is-met" : ""}>
      <span aria-hidden="true" />
      {children}
    </li>
  );
}
