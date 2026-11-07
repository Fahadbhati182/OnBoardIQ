import React, { useEffect, useRef, useState } from "react";
import { Bot, MessageSquare, Pencil, Plus, RefreshCw, Send, Sparkles, Trash2, User } from "lucide-react";
import { useApp } from "../context/AppContext";
import { chatApi, ChatCitation, ChatMessageRecord, ChatSession } from "../services/chatApi";

const selectedSessionKey = "onboardiq-selected-chat-session";
type DisplayMessage = ChatMessageRecord & { optimistic?: boolean; failed?: boolean; retryText?: string };

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MarkdownText({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/);
  return <div>{blocks.map((block, index) => {
    const lines = block.split("\n");
    if (lines.length >= 2 && lines.every((line) => line.includes("|"))) {
      const rows = lines.filter((line) => !/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line))
        .map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean));
      if (rows.length) {
        return <table key={index} style={{ borderCollapse: "collapse", margin: "10px 0", width: "100%", fontSize: 13 }}>
          <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell) => rowIndex === 0 ? <th key={cell} style={styles.tableCell}>{inlineMarkdown(cell)}</th> : <td key={cell} style={styles.tableCell}>{inlineMarkdown(cell)}</td>)}</tr>)}</tbody>
        </table>;
      }
    }
    const isList = lines.every((line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line));
    if (isList) {
      const ordered = /^\s*\d+\./.test(lines[0]);
      const List = ordered ? "ol" : "ul";
      return <List key={index} style={{ margin: "8px 0", paddingLeft: 22 }}>{lines.map((line) => <li key={line}>{inlineMarkdown(line.replace(/^\s*(?:[-*]|\d+\.)\s+/, ""))}</li>)}</List>;
    }
    if (/^#{1,3}\s+/.test(lines[0])) {
      const level = Math.min(lines[0].match(/^#+/)?.[0].length || 2, 3) as 1 | 2 | 3;
      const Heading = (`h${level}`) as "h1" | "h2" | "h3";
      return <Heading key={index} style={{ color: "#f8fafc", margin: "8px 0" }}>{inlineMarkdown(lines[0].replace(/^#{1,3}\s+/, ""))}</Heading>;
    }
    return <p key={index} style={{ margin: "7px 0" }}>{lines.map((line, lineIndex) => <React.Fragment key={`${line}-${lineIndex}`}>{lineIndex > 0 && <br />}{inlineMarkdown(line)}</React.Fragment>)}</p>;
  })}</div>;
}

function inlineMarkdown(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);
  return parts.map((part, index) => {
    if (/^\*\*.*\*\*$|^__.*__$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (/^\*.*\*$|^_.*_$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export const AIAssistantPage: React.FC = () => {
  const { addToast } = useApp();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, DisplayMessage[]>>({});
  const [citations, setCitations] = useState<Record<string, ChatCitation[]>>({});
  const [input, setInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    const loaded = await chatApi.listSessions();
    setSessions(loaded);
    const savedId = localStorage.getItem(selectedSessionKey);
    const selected = loaded.find((session) => session.id === savedId);
    if (selected) {
      setActiveSession(selected);
      const history = await chatApi.getMessages(selected.id);
      setMessagesBySession((previous) => ({ ...previous, [selected.id]: history }));
    }
  };

  useEffect(() => {
    loadSessions().catch(() => addToast("Unable to load your conversations", "error"));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.id, messagesBySession, sending]);

  const messages = activeSession ? messagesBySession[activeSession.id] || [] : [];

  const createSession = async () => {
    const session = await chatApi.createSession();
    setSessions((previous) => [session, ...previous]);
    setActiveSession(session);
    setMessagesBySession((previous) => ({ ...previous, [session.id]: [] }));
    localStorage.setItem(selectedSessionKey, session.id);
  };

  const selectSession = async (session: ChatSession) => {
    setActiveSession(session);
    localStorage.setItem(selectedSessionKey, session.id);
    if (messagesBySession[session.id]) {
      setHistoryLoading(false);
    } else {
      setHistoryLoading(true);
    }
    try {
      const history = await chatApi.getMessages(session.id);
      setMessagesBySession((previous) => ({ ...previous, [session.id]: history }));
    } catch {
      addToast("Unable to load this conversation", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const send = async (retryText?: string) => {
    const text = (retryText ?? input).trim();
    if (!text || sending) return;
    let session = activeSession;
    let optimisticId = "";
    try {
      if (!session) {
        session = await chatApi.createSession();
        setActiveSession(session);
        setSessions((previous) => [session!, ...previous]);
        localStorage.setItem(selectedSessionKey, session.id);
      }
      optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: DisplayMessage = {
        id: optimisticId,
        session_id: session.id,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
        optimistic: true,
      };
      setMessagesBySession((previous) => ({
        ...previous,
        [session!.id]: [...(previous[session!.id] || []), optimisticMessage],
      }));
      setInput("");
      setSending(true);
      const result = await chatApi.sendMessage(session.id, text);
      setMessagesBySession((previous) => ({
        ...previous,
        [session!.id]: [
          ...(previous[session!.id] || []).filter((message) => message.id !== optimisticId),
          result.userMessage,
          result.assistantMessage,
        ],
      }));
      setCitations((previous) => ({ ...previous, [result.assistantMessage.id]: result.citations }));
      setSessions((previous) => previous.map((item) => item.id === result.session.id ? result.session : item)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
      setActiveSession(result.session);
    } catch (error) {
      setMessagesBySession((previous) => ({
        ...previous,
        [session!.id]: (previous[session!.id] || []).map((message) =>
          message.id === optimisticId ? { ...message, failed: true, retryText: text } : message,
        ),
      }));
      setInput(text);
      addToast(error instanceof Error ? error.message : "The assistant could not answer", "error");
    } finally {
      setSending(false);
    }
  };

  const rename = async (session: ChatSession) => {
    const title = editingTitle.trim();
    if (!title || title === session.title) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await chatApi.renameSession(session.id, title);
      setSessions((previous) => previous.map((item) => item.id === session.id ? updated : item));
      if (activeSession?.id === session.id) setActiveSession(updated);
      setEditingId(null);
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to rename conversation", "error");
    }
  };

  const remove = async (session: ChatSession) => {
    if (!window.confirm(`Delete "${session.title}"?`)) return;
    try {
      await chatApi.deleteSession(session.id);
      const remaining = sessions.filter((item) => item.id !== session.id);
      setSessions(remaining);
      if (activeSession?.id === session.id) {
        setActiveSession(null);
        setMessagesBySession((previous) => {
          const next = { ...previous };
          delete next[session.id];
          return next;
        });
        localStorage.removeItem(selectedSessionKey);
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to delete conversation", "error");
    }
  };

  return (
    <div className="page-container chat-workspace" style={styles.layout}>
      <aside className="glass-card chat-sidebar" style={styles.conversationSidebar}>
        <button className="btn-primary" style={styles.newChat} onClick={() => void createSession()}>
          <Plus size={16} /> New Chat
        </button>
        <div style={styles.sidebarHeading}>Recent conversations</div>
        {!sessions.length && !activeSession ? <div style={styles.emptySidebar}>Your conversations will appear here.</div> : sessions.length === 0 ? (
          <div style={styles.emptySidebar}>Your conversations will appear here.</div>
        ) : sessions.map((session) => (
          <div key={session.id} style={{ ...styles.sessionRow, ...(activeSession?.id === session.id ? styles.activeSession : {}) }}>
            {editingId === session.id ? (
              <input autoFocus value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)}
                onBlur={() => void rename(session)} onKeyDown={(event) => { if (event.key === "Enter") void rename(session); }}
                style={styles.renameInput} maxLength={255} />
            ) : (
              <button onClick={() => void selectSession(session)} style={styles.sessionButton}>
                <MessageSquare size={15} /><span>{session.title}</span>
              </button>
            )}
            <div style={styles.sessionActions}>
              <button title="Rename" onClick={() => { setEditingId(session.id); setEditingTitle(session.title); }}><Pencil size={13} /></button>
              <button title="Delete" onClick={() => void remove(session)}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </aside>
      <section className="glass-card chat-card" style={styles.chatCard}>
        <header style={styles.header}>
          <div><h1 style={styles.title}>AI Assistant</h1><p style={styles.subtitle}>Conversation-aware answers from your company knowledge base</p></div>
          <Sparkles size={22} color="#e7d7be" />
        </header>
        <div style={styles.messageStream}>
          {historyLoading ? <div style={styles.historyLoading}>Loading messages…</div> : !activeSession || messages.length === 0 ? (
            <div style={styles.emptyChat}><Sparkles size={30} color="#e7d7be" /><h2>How can I help today?</h2><p>Ask about company policies, onboarding, benefits, or IT procedures.</p></div>
          ) : messages.map((message) => (
            <div key={message.id} style={{ ...styles.messageRow, justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}>
              {message.role === "assistant" && <div style={styles.avatar}><Bot size={16} /></div>}
              <div style={{ ...styles.messageBubble, ...(message.role === "user" ? styles.userBubble : styles.assistantBubble), ...(message.failed ? styles.failedBubble : {}) }}>
                <div style={styles.messageText}>{message.role === "assistant" ? <MarkdownText content={message.content} /> : message.content}</div>
                {message.role === "assistant" && (citations[message.id] || []).length > 0 && (
                  <details style={styles.citations}><summary>Sources ({citations[message.id].length})</summary>{citations[message.id].map((citation, index) => <span key={`${message.id}-${index}`}>[{index + 1}] {citation.document_title || "Company document"}{citation.page_number ? ` · p. ${citation.page_number}` : ""}</span>)}</details>
                )}
                <small style={styles.timestamp}>{formatTime(message.created_at)}</small>
                {message.failed && <button onClick={() => void send(message.retryText || message.content)} style={styles.retry}><RefreshCw size={12} /> Retry</button>}
              </div>
              {message.role === "user" && <div style={styles.avatar}><User size={16} /></div>}
            </div>
          ))}
          {sending && <div style={styles.thinking}><div style={styles.avatar}><Sparkles size={15} /></div><div style={styles.thinkingBubble}><span /> <span /> <span /> OnBoardIQ is thinking…</div></div>}
          <div ref={endRef} />
        </div>
        <form style={styles.composer} onSubmit={(event) => { event.preventDefault(); void send(); }}>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" rows={1}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
            style={styles.input} disabled={sending} />
          <button type="submit" className="btn-primary" disabled={!input.trim() || sending} style={styles.sendButton}><Send size={16} /></button>
        </form>
        <div style={styles.disclaimer}>AI responses are grounded in documents you are authorized to access.</div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", gap: 18, height: "calc(100vh - var(--topbar-height) - 40px)", paddingBottom: 30 },
  conversationSidebar: { width: 280, padding: 14, overflowY: "auto", flexShrink: 0 },
  newChat: { width: "100%", justifyContent: "center", display: "flex", gap: 8, alignItems: "center" },
  sidebarHeading: { color: "#8da498", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "22px 6px 10px" },
  muted: { color: "#8da498", fontSize: 13, padding: 8 },
  emptySidebar: { color: "#64766d", fontSize: 13, padding: 8, lineHeight: 1.5 },
  sessionRow: { display: "flex", alignItems: "center", borderRadius: 8, marginBottom: 4, padding: "2px 4px" },
  activeSession: { background: "rgba(231, 215, 190, 0.14)" },
  sessionButton: { background: "transparent", border: 0, color: "#d8e3dd", display: "flex", alignItems: "center", gap: 8, padding: "9px 5px", textAlign: "left", flex: 1, minWidth: 0, cursor: "pointer", overflow: "hidden" },
  sessionActions: { display: "flex", gap: 2 },
  renameInput: { background: "transparent", border: "1px solid #6f8e7d", color: "#fff", borderRadius: 5, padding: 5, width: "100%" },
  chatCard: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "20px 24px 14px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(141,164,152,.18)", paddingBottom: 14 },
  title: { color: "#f8fafc", fontSize: 23, margin: 0 },
  subtitle: { color: "#8da498", fontSize: 13, margin: "4px 0 0" },
  messageStream: { flex: 1, overflowY: "auto", padding: "24px 4px", display: "flex", flexDirection: "column", gap: 18 },
  emptyChat: { margin: "auto", textAlign: "center", color: "#8da498" },
  messageRow: { display: "flex" },
  avatar: { width: 30, height: 30, borderRadius: "50%", background: "#e7d7be", color: "#0d2118", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, margin: "2px 8px" },
  messageBubble: { maxWidth: "75%", borderRadius: 14, padding: "12px 15px", color: "#e2e8f0", lineHeight: 1.55 },
  userBubble: { background: "#1d5941", borderBottomRightRadius: 3 },
  assistantBubble: { background: "rgba(24,49,38,.85)", borderBottomLeftRadius: 3 },
  messageText: { fontSize: 14, overflowWrap: "anywhere" },
  failedBubble: { border: "1px solid rgba(248,113,113,.65)" },
  timestamp: { display: "block", color: "#83a092", fontSize: 10, marginTop: 7 },
  citations: { display: "flex", flexDirection: "column", gap: 3, borderTop: "1px solid rgba(141,164,152,.2)", marginTop: 12, paddingTop: 8, color: "#b7c8bf", fontSize: 11 },
  thinking: { display: "flex", alignItems: "center", color: "#8da498", fontSize: 12 },
  thinkingBubble: { background: "rgba(24,49,38,.85)", borderRadius: 14, padding: "10px 13px" },
  historyLoading: { margin: "auto", color: "#8da498", fontSize: 13 },
  retry: { display: "flex", alignItems: "center", gap: 4, color: "#fecaca", background: "transparent", border: 0, fontSize: 11, padding: "5px 0 0", cursor: "pointer" },
  composer: { display: "flex", gap: 10, border: "1px solid rgba(141,164,152,.35)", borderRadius: 12, padding: 8, background: "rgba(6,17,13,.7)" },
  input: { flex: 1, resize: "none", background: "transparent", border: 0, color: "#f8fafc", outline: 0, padding: "9px 7px", font: "inherit", maxHeight: 120 },
  sendButton: { alignSelf: "flex-end", padding: 10 },
  disclaimer: { color: "#64766d", textAlign: "center", fontSize: 10, marginTop: 8 },
  tableCell: { border: "1px solid rgba(141,164,152,.25)", padding: "6px 8px", textAlign: "left" },
};
