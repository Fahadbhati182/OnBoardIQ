import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../config/auth.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/authTokens.js";
import ApiError from "../utils/ApiError.js";

const USER_COLUMNS ="id, name, email, password_hash, role, department_id, is_active";
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-password-placeholder",12,);

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
};

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function toPublicUser(user) {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
}

function handleDatabaseError(error, operation) {
  console.error(`Supabase ${operation} failed:`, error.message);
  throw new ApiError(500, "An unexpected database error occurred");
}

function validateCredentials(name, email, password, requireName = false) {
  if (
    (requireName && (typeof name !== "string" || !name.trim())) ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ApiError(400, "A valid email address is required");
  }

  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 8 || passwordBytes > 72) {
    throw new ApiError(400, "Password must be between 8 and 72 bytes");
  }

  return {
    name: typeof name === "string" ? name.trim() : undefined,
    normalizedEmail,
    password,
  };
}

async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    handleDatabaseError(error, "user lookup");
  }

  return data;
}

async function createSession(user, req, res) {
  const sessionId = randomUUID();
  const refreshToken = createRefreshToken(user.id, sessionId);
  const refreshExpiresAt = new Date(
    Date.now() + REFRESH_TOKEN_MAX_AGE_MS,
  ).toISOString();
  const { error } = await supabase.from("refresh_sessions").insert({
    id: sessionId,
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    expires_at: refreshExpiresAt,
    user_agent: req.get("user-agent") || null,
    ip_address: req.ip || null,
  });

  if (error) {
    handleDatabaseError(error, "session creation");
  }

  setRefreshCookie(res, refreshToken);
  return createAccessToken(user);
}

export async function register(req, res) {
  const { name, normalizedEmail, password } = validateCredentials(
    req.body?.name,
    req.body?.email,
    req.body?.password,
    true,
  );
  const passwordHash = await bcrypt.hash(password, 12);
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
    })
    .select(USER_COLUMNS)
    .single();

  if (error?.code === "23505") {
    throw new ApiError(409, "An account with this email already exists");
  }
  if (error) {
    handleDatabaseError(error, "registration");
  }
  if (!user) {
    throw new ApiError(500, "User registration did not return an account");
  }

  const accessToken = await createSession(user, req, res);
  res.status(201).json({
    success: true,
    message: "Account created",
    data: { user: toPublicUser(user), accessToken },
  });
}

export async function login(req, res) {
  const { normalizedEmail, password } = validateCredentials(
    undefined,
    req.body?.email,
    req.body?.password,
  );
  const user = await findUserByEmail(normalizedEmail);

  const passwordMatches = await bcrypt.compare(
    password,
    user?.password_hash || DUMMY_PASSWORD_HASH,
  );
  if (!user || !passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.is_active) {
    throw new ApiError(403, "This account is inactive");
  }

  const accessToken = await createSession(user, req, res);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: toPublicUser(user), accessToken },
  });
}

export async function refresh(req, res) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let claims;
  try {
    claims = verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      clearRefreshCookie(res);
      throw new ApiError(401, "Refresh token is invalid or expired");
    }
    throw error;
  }

  if (
    typeof claims === "string" ||
    claims.type !== "refresh" ||
    typeof claims.sub !== "string" ||
    typeof claims.sid !== "string"
  ) {
    clearRefreshCookie(res);
    throw new ApiError(401, "Refresh token is invalid");
  }

  const user = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", claims.sub)
    .maybeSingle();
  if (user.error) {
    handleDatabaseError(user.error, "refresh user lookup");
  }
  if (!user.data?.is_active) {
    clearRefreshCookie(res);
    throw new ApiError(401, "The account is unavailable");
  }

  const nextRefreshToken = createRefreshToken(user.data.id, claims.sid);
  const { data: session, error } = await supabase
    .from("refresh_sessions")
    .update({
      token_hash: hashToken(nextRefreshToken),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS).toISOString(),
      last_used_at: new Date().toISOString(),
    })
    .eq("id", claims.sid)
    .eq("user_id", claims.sub)
    .eq("token_hash", hashToken(refreshToken))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error) {
    handleDatabaseError(error, "session refresh");
  }
  if (!session) {
    clearRefreshCookie(res);
    throw new ApiError(401, "Refresh session is invalid or expired");
  }

  setRefreshCookie(res, nextRefreshToken);
  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: { accessToken: createAccessToken(user.data) },
  });
}

export async function logout(req, res) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (refreshToken) {
    let claims;
    try {
      claims = verifyRefreshToken(refreshToken);
    } catch (error) {
      if (!(error instanceof jwt.JsonWebTokenError)) {
        throw error;
      }
    }

    if (
      claims &&
      typeof claims !== "string" &&
      claims.type === "refresh" &&
      typeof claims.sid === "string"
    ) {
      const { error } = await supabase
        .from("refresh_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", claims.sid)
        .eq("token_hash", hashToken(refreshToken))
        .is("revoked_at", null);

      if (error) {
        handleDatabaseError(error, "session revocation");
      }
    }
  }

  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: "Logged out" });
}

export function getCurrentUser(req, res) {
  res.status(200).json({
    success: true,
    data: { user: toPublicUser(req.user) },
  });
}

export async function listEmployees(req, res) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, department_id, is_active")
    .eq("role", "EMPLOYEE")
    .order("name", { ascending: true });

  if (error) {
    handleDatabaseError(error, "employee directory lookup");
  }

  res.status(200).json({
    success: true,
    data: (data || []).map((employee) => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      departmentId: employee.department_id,
      isActive: employee.is_active,
    })),
  });
}

export async function listDepartments(req, res) {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, description")
    .order("name", { ascending: true });

  if (error) {
    handleDatabaseError(error, "department directory lookup");
  }

  res.status(200).json({
    success: true,
    data: (data || []).map((department) => ({
      id: department.id,
      name: department.name,
      description: department.description || "",
    })),
  });
}
