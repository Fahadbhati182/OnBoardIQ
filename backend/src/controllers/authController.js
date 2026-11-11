import { createHash, randomBytes, randomUUID } from "node:crypto";
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
import {
  EMPLOYEE_LIST_CACHE_NAMESPACE,
  getCacheGeneration,
  getCachedJson,
  invalidateCacheGeneration,
  setCachedJson,
} from "../utils/cache.js";
import { sendEmployeeWelcomeEmail } from "../services/employeeEmail.js";

const USER_COLUMNS =
  "id, name, email, password_hash, role, department_id, job_title, joining_date, team_id, is_active";
const EMPLOYEE_INVITE_COLUMNS =
  "id, name, email, role, department_id, job_title, joining_date, team_id, is_active";
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-password-placeholder", 12);
const APPLICATION_ROLES = ["ENGINEER", "ENGINEERING_ADMIN"];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PASSWORD_SETUP_TTL_MS = 60 * 60 * 1000;

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
};

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function validateNewPassword(password) {
  if (typeof password !== "string") {
    throw new ApiError(400, "Password is required");
  }
  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 8 || passwordBytes > 72) {
    throw new ApiError(400, "Password must be between 8 and 72 bytes");
  }
  return password;
}

async function sendPasswordSetupInvite(employee) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_SETUP_TTL_MS);
  const { error: revokeError } = await supabase
    .from("employee_password_setup_tokens")
    .update({ used_at: now.toISOString() })
    .eq("user_id", employee.id)
    .is("used_at", null);
  if (revokeError) {
    handleDatabaseError(revokeError, "previous password setup invite revocation");
  }

  const { error: insertError } = await supabase
    .from("employee_password_setup_tokens")
    .insert({
      user_id: employee.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });
  if (insertError) {
    handleDatabaseError(insertError, "password setup invite creation");
  }

  const setupUrl = new URL(
    "/set-password",
    process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      "http://localhost:5173",
  );
  setupUrl.hash = new URLSearchParams({ token }).toString();

  try {
    await sendEmployeeWelcomeEmail({ employee, setupUrl: setupUrl.toString() });
    return true;
  } catch (error) {
    console.error(
      "Employee invitation email failed:",
      error instanceof Error ? error.message : String(error),
    );
    const { error: revokeTokenError } = await supabase
      .from("employee_password_setup_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token_hash", tokenHash);
    if (revokeTokenError) {
      console.error(
        "Failed to revoke undelivered employee invitation:",
        revokeTokenError.message,
      );
    }
    return false;
  }
}

function validateApplicationRole(role) {
  if (!APPLICATION_ROLES.includes(role)) {
    throw new ApiError(403, "This account has an invalid application role");
  }
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
  if (
    normalizedEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    throw new ApiError(400, "A valid email address is required");
  }
  const normalizedName = typeof name === "string" ? name.trim() : undefined;
  if (requireName && normalizedName.length > 150) {
    throw new ApiError(400, "Name must be 150 characters or fewer");
  }

  const passwordBytes = Buffer.byteLength(password, "utf8");
  if (passwordBytes < 8 || passwordBytes > 72) {
    throw new ApiError(400, "Password must be between 8 and 72 bytes");
  }

  return {
    name: normalizedName,
    normalizedEmail,
    password,
  };
}

function optionalUuid(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a valid UUID`);
  }
  return value;
}

function optionalDate(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, `${field} must be a valid date`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new ApiError(400, `${field} must be a valid date`);
  }
  return value;
}

async function ensureReferenceExists(table, id, label) {
  if (!id) return;
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (error) handleDatabaseError(error, `${label} lookup`);
  if (!data) throw new ApiError(404, `${label} was not found`);
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

export async function createEmployee(req, res) {
  const { name, normalizedEmail, password } = validateCredentials(
    req.body?.name,
    req.body?.email,
    randomBytes(32).toString("base64url"),
    true,
  );
  const {
    departmentId,
    teamId,
    joiningDate,
    jobTitle,
    isActive = true,
  } = req.body ?? {};
  const department = optionalUuid(departmentId, "departmentId");
  const team = optionalUuid(teamId, "teamId");
  const joining = optionalDate(joiningDate, "joiningDate");
  if (
    jobTitle !== undefined &&
    jobTitle !== null &&
    (typeof jobTitle !== "string" || jobTitle.trim().length > 150)
  ) {
    throw new ApiError(400, "Job title must be 150 characters or fewer");
  }
  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  await Promise.all([
    ensureReferenceExists("departments", department, "Department"),
    ensureReferenceExists("teams", team, "Team"),
  ]);

  const passwordHash = await bcrypt.hash(password, 12);
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "ENGINEER",
      department_id: department,
      job_title: jobTitle?.trim() || null,
      joining_date: joining,
      team_id: team,
      is_active: isActive,
    })
    .select(
      "id, name, email, role, department_id, job_title, joining_date, team_id, is_active",
    )
    .single();

  if (error?.code === "23505") {
    throw new ApiError(409, "An account with this email already exists");
  }
  if (error) {
    handleDatabaseError(error, "employee creation");
  }
  if (!user) {
    throw new ApiError(500, "Employee creation did not return an account");
  }

  await invalidateCacheGeneration(EMPLOYEE_LIST_CACHE_NAMESPACE);

  let inviteEmailSent = false;
  try {
    inviteEmailSent = await sendPasswordSetupInvite(
      await getUserProfile(user),
    );
  } catch (error) {
    console.error(
      "Employee invitation could not be created:",
      error instanceof Error ? error.message : String(error),
    );
  }

  res.status(201).json({
    success: true,
    message: inviteEmailSent
      ? "Employee created and invitation email sent"
      : "Employee created, but the invitation email could not be sent",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.department_id,
      jobTitle: user.job_title,
      joiningDate: user.joining_date,
      teamId: user.team_id,
      isActive: user.is_active,
      inviteEmailSent,
    },
  });
}

export async function resendEmployeeInvite(req, res) {
  const employeeId = req.params.employeeId;
  if (typeof employeeId !== "string" || !UUID_PATTERN.test(employeeId)) {
    throw new ApiError(400, "employeeId must be a valid UUID");
  }

  const { data: employee, error } = await supabase
    .from("users")
    .select(EMPLOYEE_INVITE_COLUMNS)
    .eq("id", employeeId)
    .eq("role", "ENGINEER")
    .maybeSingle();
  if (error) handleDatabaseError(error, "employee invitation lookup");
  if (!employee) throw new ApiError(404, "Employee was not found");

  let sent;
  try {
    sent = await sendPasswordSetupInvite(await getUserProfile(employee));
  } catch (inviteError) {
    console.error(
      "Employee invitation could not be created:",
      inviteError instanceof Error ? inviteError.message : String(inviteError),
    );
    sent = false;
  }

  if (!sent) {
    return res.status(503).json({
      success: false,
      message: "The employee account exists, but the invitation email could not be sent",
    });
  }
  return res.json({
    success: true,
    message: "Employee invitation email sent",
  });
}

export async function completeEmployeePasswordSetup(req, res) {
  const token = req.body?.token;
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new ApiError(400, "A valid password setup token is required");
  }
  const password = validateNewPassword(req.body?.password);
  const passwordHash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase.rpc(
    "consume_employee_password_setup_token",
    {
      p_token_hash: hashToken(token),
      p_password_hash: passwordHash,
    },
  );
  if (error) handleDatabaseError(error, "employee password setup");
  if (data !== true) {
    throw new ApiError(400, "This password setup link is invalid or expired");
  }
  res.json({ success: true, message: "Password set successfully" });
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
  validateApplicationRole(user.role);

  const profile = await getUserProfile(user);
  const accessToken = await createSession(user, req, res);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user: profile, accessToken },
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
  validateApplicationRole(user.data.role);

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

export async function getCurrentUser(req, res) {
  const user = await getUserProfile(req.user);
  res.status(200).json({ success: true, data: { user } });
}

async function getUserProfile(user) {
  const [departmentResult, teamResult] = await Promise.all([
    user.department_id
      ? supabase
          .from("departments")
          .select("name")
          .eq("id", user.department_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    user.team_id
      ? supabase
          .from("teams")
          .select("name")
          .eq("id", user.team_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (departmentResult.error) {
    handleDatabaseError(departmentResult.error, "profile department lookup");
  }
  if (teamResult.error) {
    handleDatabaseError(teamResult.error, "profile team lookup");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.department_id ?? null,
    departmentName: departmentResult.data?.name ?? null,
    jobTitle: user.job_title ?? null,
    joiningDate: user.joining_date ?? null,
    teamId: user.team_id ?? null,
    teamName: teamResult.data?.name ?? null,
    isActive: user.is_active,
  };
}

export async function updateCurrentUser(req, res) {
  const allowedFields = new Set(["name", "email"]);
  const unexpectedField = Object.keys(req.body ?? {}).find(
    (field) => !allowedFields.has(field),
  );
  if (unexpectedField) {
    throw new ApiError(400, "Only name and email can be updated");
  }

  const updates = {};
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "name")) {
    const name = req.body.name;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 150) {
      throw new ApiError(
        400,
        "Name is required and must be 150 characters or fewer",
      );
    }
    updates.name = name.trim();
  }
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "email")) {
    if (typeof req.body.email !== "string") {
      throw new ApiError(400, "A valid email address is required");
    }
    const email = req.body.email.trim().toLowerCase();
    if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "A valid email address is required");
    }
    updates.email = email;
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "Provide a name or email to update");
  }

  updates.updated_at = new Date().toISOString();
  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.user.id)
    .select(USER_COLUMNS)
    .single();

  if (error?.code === "23505") {
    throw new ApiError(409, "An account with this email already exists");
  }
  if (error) handleDatabaseError(error, "profile update");
  if (!user) throw new ApiError(404, "User was not found");
  await invalidateCacheGeneration(EMPLOYEE_LIST_CACHE_NAMESPACE);

  res.status(200).json({
    success: true,
    message: "Profile updated",
    data: { user: await getUserProfile(user) },
  });
}

export async function listEmployees(req, res) {
  const generation = await getCacheGeneration(EMPLOYEE_LIST_CACHE_NAMESPACE);
  const cacheKey =
    generation === null
      ? null
      : `onboardiq:${EMPLOYEE_LIST_CACHE_NAMESPACE}:v${generation}`;
  if (cacheKey) {
    const cachedResponse = await getCachedJson(cacheKey);
    if (cachedResponse) return res.status(200).json(cachedResponse);
  }

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, role, department_id, job_title, joining_date, team_id, is_active",
    )
    .eq("role", "ENGINEER")
    .order("name", { ascending: true });

  if (error) {
    handleDatabaseError(error, "employee directory lookup");
  }

  const response = {
    success: true,
    data: (data || []).map((employee) => ({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      departmentId: employee.department_id,
      jobTitle: employee.job_title,
      joiningDate: employee.joining_date,
      teamId: employee.team_id,
      isActive: employee.is_active,
    })),
  };
  if (cacheKey) await setCachedJson(cacheKey, response, 300);
  res.status(200).json(response);
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
