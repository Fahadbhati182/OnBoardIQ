import "dotenv/config";

import supabase from "../config/supabase.js";
import ApiError from "../utils/ApiError.js";

const SESSION_COLUMNS = "id, employee_id, title, created_at, updated_at";
const MESSAGE_COLUMNS = "id, session_id, role, content, created_at";
const DEFAULT_TITLE = "New Conversation";
const MAX_TITLE_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 10000;

function databaseError(error, operation) {
  console.error(`Supabase ${operation} failed:`, error.message);
  throw new ApiError(500, "An unexpected database error occurred");
}

function validateMessage(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "Message is required");
  }
  if (value.trim().length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(
      400,
      `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
    );
  }
  return value.trim();
}

function validateTitle(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "Title is required");
  }
  const title = value.trim();
  if (title.length > MAX_TITLE_LENGTH) {
    throw new ApiError(
      400,
      `Title must be ${MAX_TITLE_LENGTH} characters or fewer`,
    );
  }
  return title;
}

async function findOwnedSession(sessionId, employeeId) {
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    throw new ApiError(400, "A valid session ID is required");
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error) databaseError(error, "chat session lookup");
  if (!data) throw new ApiError(404, "Chat session not found");
  return data;
}

async function getHistory(sessionId) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) databaseError(error, "chat history lookup");
  return data || [];
}

function makeTitle(question) {
  const words = question
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7);
  if (!words.length) return DEFAULT_TITLE;
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}

async function callAiService({ session, employee, message, history }) {
  const serviceUrl = process.env.AI_BACKEND_URL;
  const serviceToken = process.env.ONBOARDIQ_SERVICE_TOKEN;

  if (!serviceUrl || !serviceToken) {
    throw new ApiError(503, "The AI service is not configured");
  }

  let accessScope;

  if (employee.role === "ENGINEER" && employee.team_id == null) {
    accessScope = "ALL_EMPLOYEES";
  } else if (employee.role === "ENGINEER" && employee.team_id != null) {
    accessScope = "TEAM_ONLY";
  } else {
    accessScope = "ADMIN_ONLY";
  }

  let response;

  try {
    response = await fetch(`${serviceUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceToken}`,
      },
      body: JSON.stringify({
        conversation_id: session.id,
        user_id: employee.id,
        user_role: employee.role,
        access_scope: accessScope,
        team_id: employee.team_id || null,
        query: message,

        history: history.map(({ role, content }) => ({
          role: role.toLowerCase(),
          content,
        })),
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    console.error("AI service request failed:", error.message);
    throw new ApiError(502, "The AI service is currently unavailable");
  }

  // Parse FastAPI response
  const body = await response.json().catch(() => null);

  // Log actual FastAPI errors
  if (!response.ok || !body?.answer || typeof body.answer !== "string") {
    console.error("AI service returned an invalid response:", {
      status: response.status,
      body,
    });

    throw new ApiError(502, "The AI service could not answer this question");
  }

  return {
    answer: body.answer.trim(),
    citations: Array.isArray(body.citations) ? body.citations : [],
  };
}

export async function createChatSession(req, res) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ employee_id: req.user.id, title: DEFAULT_TITLE })
    .select(SESSION_COLUMNS)
    .single();

  if (error) databaseError(error, "chat session creation");
  res
    .status(201)
    .json({ success: true, message: "Chat session created", data });
}

export async function listChatSessions(req, res) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select(SESSION_COLUMNS)
    .eq("employee_id", req.user.id)
    .order("updated_at", { ascending: false });

  if (error) databaseError(error, "chat session listing");
  res.status(200).json({
    success: true,
    message: "Chat sessions retrieved",
    data: data || [],
  });
}

export async function listChatMessages(req, res) {
  await findOwnedSession(req.params.sessionId, req.user.id);
  const data = await getHistory(req.params.sessionId);
  res
    .status(200)
    .json({ success: true, message: "Chat messages retrieved", data });
}

export async function sendChatMessage(req, res) {
  const message = validateMessage(req.body?.message);
  const session = await findOwnedSession(req.params.sessionId, req.user.id);
  const history = await getHistory(session.id);

  const { data: userMessage, error: userMessageError } = await supabase
    .from("chat_messages")
    .insert({ session_id: session.id, role: "USER", content: message })
    .select(MESSAGE_COLUMNS)
    .single();

  if (userMessageError)
    databaseError(userMessageError, "user chat message creation");

  let aiResult;

  try {
    aiResult = await callAiService({
      session,
      employee: req.user,
      message,
      history: [...history, userMessage],
    });
  } catch (error) {
    // The user message is intentionally retained as the source-of-truth audit trail.
    // No assistant message is written when generation fails.
    throw error;
  }

  const { data: assistantMessage, error: assistantMessageError } =
    await supabase
      .from("chat_messages")
      .insert({
        session_id: session.id,
        role: "ASSISTANT",
        content: aiResult.answer,
      })
      .select(MESSAGE_COLUMNS)
      .single();

  if (assistantMessageError)
    databaseError(assistantMessageError, "assistant chat message creation");

  const updates = { updated_at: new Date().toISOString() };
  if (session.title === DEFAULT_TITLE && history.length === 0) {
    updates.title = makeTitle(message);
  }

  const { data: updatedSession, error: updateError } = await supabase
    .from("chat_sessions")
    .update(updates)
    .eq("id", session.id)
    .eq("employee_id", req.user.id)
    .select(SESSION_COLUMNS)
    .single();

  if (updateError) databaseError(updateError, "chat session update");

  res.status(201).json({
    success: true,
    message: "Chat message sent",
    data: {
      session: updatedSession,
      userMessage,
      assistantMessage,
      citations: aiResult.citations,
    },
  });
}

export async function renameChatSession(req, res) {
  const title = validateTitle(req.body?.title);
  await findOwnedSession(req.params.sessionId, req.user.id);
  const { data, error } = await supabase
    .from("chat_sessions")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", req.params.sessionId)
    .eq("employee_id", req.user.id)
    .select(SESSION_COLUMNS)
    .single();
  if (error) databaseError(error, "chat session rename");
  res
    .status(200)
    .json({ success: true, message: "Chat session renamed", data });
}

export async function deleteChatSession(req, res) {
  await findOwnedSession(req.params.sessionId, req.user.id);
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", req.params.sessionId)
    .eq("employee_id", req.user.id);
  if (error) databaseError(error, "chat session deletion");
  res.status(204).send();
}
