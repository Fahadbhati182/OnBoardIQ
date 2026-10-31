import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { authApi } from "../services/authApi";
import {
  Compass,
  Sparkles,
  Layers,
  ArrowRight,
  Mail,
  Lock,
  Check,
  Palette,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { setCurrentPage, setAuthenticatedUser, addToast, theme, setTheme } = useApp();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("fahad@iss.com");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user, accessToken } = isRegistering
        ? await authApi.register(name, email, password)
        : await authApi.login(email, password);
      localStorage.setItem("accessToken", accessToken);
      setAuthenticatedUser(user);
      setCurrentPage("dashboard");
      addToast(
        isRegistering
          ? "Account created successfully"
          : "Welcome back! Signed in successfully",
        "success",
      );
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Unable to sign in",
        "error",
      );
    }
  };

  return (
    <div className="login-theme-root" style={styles.loginContainer}>
      <div className="login-theme-picker">
        <Palette size={15} />
        <select value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)} aria-label="Color theme">
          <option value="default">Forest Default</option>
          <option value="veo-onyx">Veo Onyx</option>
          <option value="midnight-azure">Midnight Azure</option>
          <option value="ocean-blue">Ocean Blue</option>
          <option value="brainwave-slate">Brainwave Slate</option>
        </select>
      </div>
      {/* Left Column: Hero Brand & Vision */}
      <div className="login-theme-hero" style={styles.heroColumn}>
        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          {/* Logo */}
          <div style={styles.heroBrandRow}>
            <span className="brand-iss">iss</span>
          </div>

          <div style={styles.heroMainBlock}>
            <div style={styles.heroTag}>— NEW JOINER EXPERIENCE</div>
            <h1 style={styles.heroHeading}>
              People
              <br />
              Build
              <br />
              What's Next.
            </h1>
            <p style={styles.heroText}>
              Your guide to a smooth start at ISS. Get answers, complete
              onboarding tasks, and access everything you need — powered by AI.
            </p>
          </div>

          {/* 3 Bottom Pills */}
          <div style={styles.heroPillsRow}>
            <div style={styles.heroPill}>
              <div style={styles.pillIconBox}>
                <Compass size={14} />
              </div>
              <span>Guided Onboarding</span>
            </div>

            <div style={styles.heroPill}>
              <div style={styles.pillIconBox}>
                <Sparkles size={14} />
              </div>
              <span>Instant Answers</span>
            </div>

            <div style={styles.heroPill}>
              <div style={styles.pillIconBox}>
                <Layers size={14} />
              </div>
              <span>All Resources in One Place</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Warm Champagne Login Card */}
      <div className="login-theme-form" style={styles.formColumn}>
        <div className="login-theme-card" style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              {isRegistering ? "Create Account" : "Welcome Back"}
            </h2>
            <p style={styles.cardSubtitle}>
              {isRegistering
                ? "Create your onboarding account"
                : "Sign in to continue to your journey"}
            </p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {isRegistering && (
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Full name</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={styles.formInput}
                  />
                </div>
              </div>
            )}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Email address</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.fieldIcon} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.formInput}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.fieldIcon} />
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.formInput}
                />
              </div>
            </div>

            <div style={styles.rememberRow}>
              <label
                style={styles.checkboxLabel}
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div
                  style={{
                    ...styles.checkbox,
                    ...(rememberMe ? styles.checkboxChecked : {}),
                  }}
                >
                  {rememberMe && <Check size={12} color="#ffffff" />}
                </div>
                <span>Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  addToast("Password reset link sent to HR support", "info");
                }}
                style={styles.forgotLink}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" style={styles.submitBtn}>
              <span>{isRegistering ? "Create Account" : "Sign In"}</span>
              <ArrowRight size={16} />
            </button>

            <div style={styles.dividerRow}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <span style={styles.dividerLine} />
            </div>

            <button
              type="button"
              onClick={() => {
                addToast("Google Single Sign-On authenticated", "success");
                setCurrentPage("dashboard");
              }}
              style={styles.googleBtn}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsRegistering((value) => !value)}
            style={styles.forgotLink}
          >
            {isRegistering
              ? "Already have an account? Sign in"
              : "Need an account? Register"}
          </button>

          <div style={styles.cardFooter}>
            <span>New to ISS? </span>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                addToast("Contact HR support at onboarding@iss.com", "info");
              }}
              style={styles.contactLink}
            >
              Contact your HR team.
            </a>
          </div>
          <div className="text-xl  space-y-1 border">
            <button
              onClick={() => {
                setEmail("fahadbhati3600@gmail.com");
                setPassword("123456789");
              }}
              className=" text-black font-body "
            >
              Add ADMIN Details
            </button>
            <hr />
            <button
              onClick={() => {
                setEmail("anam@gmail.com");
                setPassword("123456789");
              }}
              className=" text-black font-body "
            >
              Add EMPLOYEE Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#06110d",
  },
  heroColumn: {
    flex: 1.25,
    position: "relative",
    backgroundImage: `url(/assets/images/hero-bg.jpg)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "48px 56px",
    overflow: "hidden",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(135deg, rgba(6, 17, 13, 0.88) 0%, rgba(10, 29, 21, 0.72) 100%)",
    zIndex: 1,
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
  },
  heroBrandRow: {
    display: "flex",
    alignItems: "center",
  },
  heroMainBlock: {
    maxWidth: "560px",
    margin: "auto 0",
  },
  heroTag: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.15em",
    color: "#e7d7be",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  heroHeading: {
    fontSize: "60px",
    fontWeight: 700,
    lineHeight: 1.05,
    color: "#f8fafc",
    letterSpacing: "-0.03em",
    marginBottom: "20px",
  },
  heroText: {
    fontSize: "15px",
    color: "#cbd5e1",
    lineHeight: 1.6,
    maxWidth: "460px",
  },
  heroPillsRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "40px",
  },
  heroPill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(12, 32, 23, 0.82)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(46, 125, 96, 0.35)",
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#e2e8f0",
  },
  pillIconBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e7d7be",
  },
  formColumn: {
    flex: 1,
    background: "#091913",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 32px",
    position: "relative",
    zIndex: 2,
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    background: "#f8f4ec",
    borderRadius: "24px",
    padding: "40px 36px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.55)",
    color: "#13281f",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: 700,
    color: "#0d221a",
    letterSpacing: "-0.02em",
  },
  cardSubtitle: {
    fontSize: "13px",
    color: "#65786f",
    marginTop: "4px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  inputLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#284135",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  fieldIcon: {
    position: "absolute",
    left: "14px",
    color: "#7b9186",
    pointerEvents: "none",
  },
  formInput: {
    width: "100%",
    height: "44px",
    background: "#ffffff",
    border: "1px solid #d5ded8",
    borderRadius: "10px",
    padding: "0 14px 0 40px",
    fontSize: "13.5px",
    color: "#0e241b",
    outline: "none",
    transition: "border-color 0.2s",
  },
  rememberRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "12px",
    marginTop: "2px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    color: "#3d564a",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    borderRadius: "4px",
    border: "1.5px solid #8ba095",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  },
  checkboxChecked: {
    background: "#133628",
    borderColor: "#133628",
  },
  forgotLink: {
    color: "#1a4f3a",
    fontWeight: 600,
    textDecoration: "none",
  },
  submitBtn: {
    width: "100%",
    height: "46px",
    background: "#0e2c20",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(14, 44, 32, 0.3)",
    marginTop: "6px",
    transition: "background 0.2s",
  },
  dividerRow: {
    display: "flex",
    alignItems: "center",
    margin: "10px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#d6dfd9",
  },
  dividerText: {
    padding: "0 10px",
    fontSize: "11px",
    color: "#7b9186",
    textTransform: "uppercase",
  },
  googleBtn: {
    width: "100%",
    height: "44px",
    background: "#ffffff",
    border: "1px solid #d5ded8",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#284135",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  quickAccessSection: {
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px dashed #d5ded8",
  },
  quickAccessTitle: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#557063",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginBottom: "8px",
  },
  quickAccessButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  personaBtn: {
    background: "#edf3ef",
    border: "1px solid #c8d7cf",
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "11.5px",
    color: "#133628",
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
  },
  cardFooter: {
    textAlign: "center",
    fontSize: "12px",
    color: "#65786f",
    marginTop: "18px",
  },
  contactLink: {
    color: "#12392b",
    fontWeight: 600,
    textDecoration: "none",
  },
};
