import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Plus,
  Send,
  Paperclip,
  FileText,
  Download,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { chatSuggestedPrompts } from '../data/mockData';

export const AIAssistantPage: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    clearChat,
    currentUser,
    setActiveDocModal,
    documents,
    addToast,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal);
    setInputVal('');
  };

  const handlePromptClick = (prompt: string) => {
    sendChatMessage(prompt);
  };

  const handleOpenDoc = (docTitle: string) => {
    const doc = documents.find((d) => d.title.toLowerCase().includes('parental')) || documents[0];
    setActiveDocModal(doc);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 40px)', paddingBottom: '30px' }}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={styles.pageTitle}>AI Assistant</h1>
            <span style={styles.aiBadge}>ISS Copilot</span>
          </div>
          <p style={styles.pageSubtitle}>
            Ask anything about company policies, onboarding, benefits and more.
          </p>
        </div>

        <button onClick={clearChat} className="btn-secondary" style={styles.newChatBtn}>
          <Plus size={15} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat Thread Container */}
      <div className="glass-card" style={styles.chatCard}>
        <div style={styles.messagesStream}>
          {chatMessages.length === 0 ? (
            <div style={styles.emptyChatState}>
              <div style={styles.emptyIconBox}>
                <Sparkles size={28} color="#e7d7be" />
              </div>
              <h3 style={{ fontSize: '18px', color: '#f8fafc', marginTop: '12px' }}>
                How can ISS AI assist you today?
              </h3>
              <p style={{ fontSize: '13px', color: '#8da498', maxWidth: '420px', textAlign: 'center', marginTop: '4px' }}>
                Ask about parental leave, hardware requisitions, health benefits, or office policies.
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* AI Avatar */}
                  {!isUser && (
                    <div style={styles.aiAvatar}>
                      <span className="brand-iss" style={{ fontSize: '14px', fontStyle: 'italic' }}>
                        iss
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.messageBubble,
                      ...(isUser ? styles.userBubble : styles.aiBubble),
                    }}
                  >
                    <p style={{ ...styles.messageText, color: isUser ? '#f8fafc' : '#e2e8f0' }}>
                      {msg.text}
                    </p>

                    {/* Embedded Document Preview Card */}
                    {msg.documentAttachment && (
                      <div
                        onClick={() => handleOpenDoc(msg.documentAttachment!.title)}
                        style={styles.attachmentCard}
                      >
                        <div style={styles.attachmentIconBox}>
                          <FileText size={20} color="#f87171" />
                        </div>
                        <div style={styles.attachmentInfo}>
                          <div style={styles.attachmentTitle}>
                            {msg.documentAttachment.title}
                          </div>
                          <div style={styles.attachmentMeta}>
                            {msg.documentAttachment.fileType} • {msg.documentAttachment.fileSize}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToast(`Downloading ${msg.documentAttachment!.title}...`, 'info');
                          }}
                          style={styles.downloadIconBtn}
                          title="Download document"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    )}

                    <span style={styles.timestamp}>{msg.timestamp}</span>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div style={styles.userAvatar}>
                      {currentUser.initials}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Chips */}
        <div style={styles.suggestionsContainer}>
          {chatSuggestedPrompts.slice(0, 4).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt)}
              style={styles.promptChip}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={styles.inputContainer}>
          <button
            type="button"
            onClick={() => addToast('File upload attached to query', 'info')}
            style={styles.clipBtn}
            title="Attach File"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask a question..."
            style={styles.chatInput}
          />

          <button
            type="submit"
            disabled={!inputVal.trim()}
            style={{
              ...styles.sendBtn,
              opacity: inputVal.trim() ? 1 : 0.5,
              cursor: inputVal.trim() ? 'pointer' : 'default',
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f8fafc',
  },
  aiBadge: {
    fontSize: '11px',
    fontWeight: 700,
    background: 'rgba(231, 215, 190, 0.15)',
    border: '1px solid rgba(231, 215, 190, 0.3)',
    color: '#e7d7be',
    borderRadius: '6px',
    padding: '2px 8px',
  },
  pageSubtitle: {
    fontSize: '13.5px',
    color: '#8da498',
    marginTop: '3px',
  },
  newChatBtn: {
    padding: '8px 16px',
    fontSize: '13px',
  },
  chatCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '20px 24px 16px',
  },
  messagesStream: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  emptyChatState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
  },
  emptyIconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(231, 215, 190, 0.12)',
    border: '1px solid rgba(231, 215, 190, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    width: '100%',
  },
  aiAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#0d221a',
    border: '1px solid rgba(231, 215, 190, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #d4af37 0%, #a88424 100%)',
    color: '#081711',
    fontWeight: 700,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: '650px',
    padding: '16px 20px',
    borderRadius: '18px',
    position: 'relative',
  },
  userBubble: {
    background: 'rgba(19, 44, 34, 0.95)',
    border: '1px solid rgba(46, 125, 96, 0.35)',
    borderBottomRightRadius: '4px',
  },
  aiBubble: {
    background: 'rgba(10, 26, 19, 0.9)',
    border: '1px solid rgba(46, 125, 96, 0.25)',
    borderBottomLeftRadius: '4px',
  },
  messageText: {
    fontSize: '13.5px',
    lineHeight: 1.6,
    whiteSpace: 'pre-line',
  },
  timestamp: {
    display: 'block',
    fontSize: '10.5px',
    color: '#64748b',
    marginTop: '6px',
    textAlign: 'right',
  },
  attachmentCard: {
    marginTop: '12px',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(46, 125, 96, 0.3)',
    borderRadius: '12px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  attachmentIconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#f8fafc',
  },
  attachmentMeta: {
    fontSize: '11px',
    color: '#8da498',
  },
  downloadIconBtn: {
    background: 'transparent',
    border: 'none',
    color: '#e7d7be',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  suggestionsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 0 10px',
    flexWrap: 'wrap',
  },
  promptChip: {
    background: 'rgba(20, 46, 35, 0.7)',
    border: '1px solid rgba(46, 125, 96, 0.3)',
    borderRadius: '9999px',
    padding: '6px 14px',
    fontSize: '12px',
    color: '#cbd5e1',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(10, 24, 18, 0.85)',
    border: '1px solid rgba(46, 125, 96, 0.3)',
    borderRadius: '14px',
    padding: '6px 10px 6px 14px',
  },
  clipBtn: {
    background: 'transparent',
    border: 'none',
    color: '#8da498',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#f8fafc',
    fontSize: '13.5px',
    outline: 'none',
  },
  sendBtn: {
    background: '#e7d7be',
    border: 'none',
    borderRadius: '10px',
    width: '36px',
    height: '36px',
    color: '#0a1b14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
};
