import { apiRequest } from "./apiClient";

export interface ChatSession {
  id: string;
  employee_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatCitation {
  document_id: string | null;
  version_id: string | null;
  document_title: string | null;
  page_number: string | number | null;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SendChatResult {
  session: ChatSession;
  userMessage: ChatMessageRecord;
  assistantMessage: ChatMessageRecord;
  citations: ChatCitation[];
}

export const chatApi = {
  listSessions: () => apiRequest<ChatSession[]>("/chat/sessions"),
  createSession: () =>
    apiRequest<ChatSession>("/chat/sessions", { method: "POST", body: JSON.stringify({}) }),
  getMessages: (sessionId: string) =>
    apiRequest<ChatMessageRecord[]>(`/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId: string, message: string) =>
    apiRequest<SendChatResult>(`/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  renameSession: (sessionId: string, title: string) =>
    apiRequest<ChatSession>(`/chat/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),
  deleteSession: (sessionId: string) =>
    apiRequest<null>(`/chat/sessions/${sessionId}`, { method: "DELETE" }),
};
