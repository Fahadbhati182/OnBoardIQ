import React, { createContext, useContext, useState, useEffect } from "react";
import {
  PageType,
  UserRole,
  UserProfile,
  TaskItem,
  TaskStatus,
  DocumentItem,
  AccessRequestItem,
  AccessStatus,
  ChatMessage,
  ToastNotification,
  ThemeId,
} from "../types";
import {
  mockUsers,
  initialTasks,
  initialDocuments,
  initialAccessRequests,
  initialChatMessages,
  aiKnowledgeBase,
} from "../data/mockData";
import { authApi, AuthUser } from "../services/authApi";
import { documentApi } from "../services/documentApi";
import { taskApi } from "../services/taskApi";

interface AppContextType {
  isInitializing: boolean;
  isAuthenticated: boolean;
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentUser: UserProfile;
  setAuthenticatedUser: (user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) => void;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  tasks: TaskItem[];
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleChecklistItem: (taskId: string, checklistId: string) => void;
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, "id" | "updatedAt">) => void;
  toggleDocumentStatus: (docId: string) => void;
  deleteDocument: (docId: string) => void;
  accessRequests: AccessRequestItem[];
  updateAccessRequest: (requestId: string, status: AccessStatus) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  clearChat: () => void;
  toasts: ToastNotification[];
  addToast: (message: string, type?: ToastNotification["type"]) => void;
  removeToast: (id: string) => void;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notifications: { id: string; title: string; time: string; read: boolean }[];
  markAllNotificationsRead: () => void;
  activeTaskModal: TaskItem | null;
  setActiveTaskModal: (task: TaskItem | null) => void;
  activeDocModal: DocumentItem | null;
  setActiveDocModal: (doc: DocumentItem | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentPage, setCurrentPage] = useState<PageType>("login");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("employee");
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    mockUsers.employee,
  );
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [accessRequests, setAccessRequests] = useState<AccessRequestItem[]>(
    initialAccessRequests,
  );
  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>(initialChatMessages);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const storedTheme = localStorage.getItem("onboardiq-theme");
    return storedTheme === "default" || storedTheme === "veo-onyx" || storedTheme === "midnight-azure"
      || storedTheme === "ocean-blue" || storedTheme === "brainwave-slate"
      ? storedTheme as ThemeId
      : "default";
  });
  const [activeTaskModal, setActiveTaskModal] = useState<TaskItem | null>(null);
  const [activeDocModal, setActiveDocModal] = useState<DocumentItem | null>(
    null,
  );

  useEffect(() => {
    if (theme === "default") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
    localStorage.setItem("onboardiq-theme", theme);
  }, [theme]);

  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "HR Form deadline is approaching in 2 days",
      time: "10 min ago",
      read: false,
    },
    {
      id: "n2",
      title: "IT access request for GitHub approved",
      time: "1 hour ago",
      read: false,
    },
    {
      id: "n3",
      title: "Welcome to ISS! Your orientation starts now",
      time: "Yesterday",
      read: true,
    },
  ]);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setIsInitializing(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => {
        setAuthenticatedUser(user);
        setIsAuthenticated(true);
      })
      .catch(async () => {
        try {
          const { accessToken: refreshedToken } = await authApi.refresh();
          localStorage.setItem("accessToken", refreshedToken);
          const { user } = await authApi.me();
          setAuthenticatedUser(user);
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem("accessToken");
          setCurrentPage("login");
          setIsAuthenticated(false);
        } finally {
          setIsInitializing(false);
        }
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    setDocuments([]);
    setTasks([]);
    documentApi.list()
      .then((items) => setDocuments(items.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.documentType,
        category: "General",
        department: item.departmentId || "Company",
        version: item.currentVersion ? `v${item.currentVersion.versionNumber}` : "Draft",
        status: item.status === "PUBLISHED" ? "published" : "draft",
        updatedAt: new Date(item.updatedAt).toLocaleDateString(),
        fileSize: item.currentVersion
          ? `${Math.round(item.currentVersion.fileSizeBytes / 1024)} KB`
          : "Unavailable",
        summary: item.description || "",
        keyPoints: [],
        coverGradient: "linear-gradient(135deg, #163d2b, #0d221a)",
      }))))
      .catch(() => setDocuments([]));

    if (currentUserRole !== "employee") return;
    taskApi.getMyTasks()
      .then((items) => setTasks(items.map((item) => ({
        id: item.assignmentId,
        title: item.title,
        description: item.description || "",
        timeEstimate: `${item.estimatedMinutes} min`,
        status: item.status.toLowerCase() as TaskStatus,
        category: "Orientation",
        thumbnailUrl: "",
        checklist: [],
        instructions: item.description || "",
      }))))
      .catch(() => setTasks([]));
  }, [currentUserRole, isAuthenticated]);

  // Sync profile when role switches
  useEffect(() => {
    if (!localStorage.getItem("accessToken") && mockUsers[currentUserRole]) {
      setCurrentUser(mockUsers[currentUserRole]);
    }
  }, [currentUserRole]);

  const addToast = (
    message: string,
    type: ToastNotification["type"] = "success",
  ) => {
    const id =
      Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setTheme = (nextTheme: ThemeId) => {
    setThemeState(nextTheme);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    addToast("Profile updated successfully!", "success");
  };

  const setAuthenticatedUser = (user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) => {
    const role = user.role.toLowerCase().replace("-", "_") as UserRole;
    setCurrentUser((previous) => ({
      ...previous,
      ...user,
      role,
      initials: user.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    }));
    setCurrentUserRole(role);
    setIsAuthenticated(true);
    setCurrentPage("dashboard");
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("accessToken");
      setIsAuthenticated(false);
      setCurrentPage("login");
      setCurrentUserRole("employee");
    }
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );
    const statusLabels: Record<TaskStatus, string> = {
      completed: "Completed",
      in_progress: "In Progress",
      not_started: "Pending",
    };
    addToast(`Task marked as ${statusLabels[status]}`, "info");
  };

  const toggleChecklistItem = (taskId: string, checklistId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updatedChecklist = task.checklist.map((item) =>
          item.id === checklistId
            ? { ...item, completed: !item.completed }
            : item,
        );
        const allCompleted = updatedChecklist.every((item) => item.completed);
        const newStatus: TaskStatus = allCompleted
          ? "completed"
          : "in_progress";
        return {
          ...task,
          checklist: updatedChecklist,
          status: newStatus,
        };
      }),
    );
  };

  const addDocument = (docData: Omit<DocumentItem, "id" | "updatedAt">) => {
    const newDoc: DocumentItem = {
      ...docData,
      id: `doc-${Date.now()}`,
      updatedAt: "Just now",
    };
    setDocuments((prev) => [newDoc, ...prev]);
    addToast(`Document "${newDoc.title}" uploaded!`, "success");
  };

  const toggleDocumentStatus = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: d.status === "published" ? "draft" : "published",
              updatedAt: "Just now",
            }
          : d,
      ),
    );
    addToast("Document status toggled", "info");
  };

  const deleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    addToast("Document deleted successfully", "warning");
  };

  const updateAccessRequest = (requestId: string, status: AccessStatus) => {
    setAccessRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status,
              approvedBy: status === "approved" ? currentUser.name : undefined,
            }
          : req,
      ),
    );
    addToast(
      `Access request ${status === "approved" ? "Approved ✓" : "Rejected ✕"}`,
      status === "approved" ? "success" : "warning",
    );
  };

  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Simulated AI response
    setTimeout(() => {
      const lower = text.toLowerCase();
      let replyText = `Thank you for your question! As ISS AI Assistant, I'm here to help you navigate policies, IT setup, and onboarding.`;
      let attachment = undefined;

      if (
        lower.includes("parental") ||
        lower.includes("maternity") ||
        lower.includes("paternity") ||
        lower.includes("leave")
      ) {
        replyText = `According to the ISS Parental Leave Policy (v2.1), eligible employees can avail:

• Maternity Leave: 26 weeks (paid)
• Paternity Leave: 4 weeks (paid)
• Adoption Leave: 12 weeks (paid)

You can find the detailed policy here:`;
        attachment = {
          title: "Parental Leave Policy v2.1",
          version: "v2.1",
          fileSize: "1.2 MB",
          fileType: "PDF",
        };
      } else if (
        lower.includes("eligible") ||
        lower.includes("tenure") ||
        lower.includes("qualify")
      ) {
        replyText = aiKnowledgeBase.eligible;
      } else if (lower.includes("apply") || lower.includes("how to")) {
        replyText = aiKnowledgeBase.apply;
      } else if (
        lower.includes("country") ||
        lower.includes("region") ||
        lower.includes("uk") ||
        lower.includes("us")
      ) {
        replyText = aiKnowledgeBase.country;
      } else if (
        lower.includes("it") ||
        lower.includes("laptop") ||
        lower.includes("account") ||
        lower.includes("yubikey")
      ) {
        replyText = aiKnowledgeBase.it;
        attachment = {
          title: "IT Security Guidelines v1.5",
          version: "v1.5",
          fileSize: "3.1 MB",
          fileType: "PDF",
        };
      } else if (
        lower.includes("health") ||
        lower.includes("insurance") ||
        lower.includes("benefit")
      ) {
        replyText = aiKnowledgeBase.health;
        attachment = {
          title: "Benefits Overview v1.0",
          version: "v1.0",
          fileSize: "2.4 MB",
          fileType: "PDF",
        };
      } else {
        replyText = `Here is information regarding your query on "${text}". You can access all related guides in Company Resources, or reach out to the People Operations team via HR Connect.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        documentAttachment: attachment,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  const clearChat = () => {
    setChatMessages([]);
    addToast("Chat thread cleared", "info");
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast("All notifications marked as read", "info");
  };

  return (
    <AppContext.Provider
      value={{
        isInitializing,
        isAuthenticated,
        currentPage,
        setCurrentPage,
        currentUserRole,
        setCurrentUserRole,
        currentUser,
        setAuthenticatedUser,
        signOut,
        updateUserProfile,
        tasks,
        updateTaskStatus,
        toggleChecklistItem,
        documents,
        addDocument,
        toggleDocumentStatus,
        deleteDocument,
        accessRequests,
        updateAccessRequest,
        chatMessages,
        sendChatMessage,
        clearChat,
        toasts,
        addToast,
        removeToast,
        theme,
        setTheme,
        searchQuery,
        setSearchQuery,
        notifications,
        markAllNotificationsRead,
        activeTaskModal,
        setActiveTaskModal,
        activeDocModal,
        setActiveDocModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
