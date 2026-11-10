import React from "react";
import { useApp } from "../context/AppContext";
import { PageType, UserRole } from "../types";
import {
  Home,
  CheckSquare,
  FileText,
  Sparkles,
  User,
  Building2,
  Users,
  UsersRound,
  BarChart3,
  KeyRound,
  ShieldAlert,
  LogOut,
  FolderOpen,
  PlusCircle,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentUserRole,
    setCurrentUserRole,
    currentUser,
    signOut,
  } = useApp();

  interface NavItem {
    id: PageType;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }

  const employeeNav: NavItem[] = [
    { id: "dashboard", label: "Home", icon: <Home size={18} /> },
    {
      id: "tasks",
      label: "My Tasks",
      icon: <CheckSquare size={18} />,
    },
    { id: "documents", label: "Documents", icon: <FileText size={18} /> },
    { id: "chat", label: "AI Assistant", icon: <Sparkles size={18} /> },
    { id: "profile", label: "My Progress", icon: <User size={18} /> },
    { id: "company", label: "Company Info", icon: <Building2 size={18} /> },
  ];

  const engineeringAdminNav: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    {
      id: "documents",
      label: "Documents",
      icon: <FolderOpen size={18} />,
    },
    { id: "chat", label: "AI Assistant", icon: <Sparkles size={18} /> },
    {
      id: "task-admin",
      label: "Onboarding",
      icon: <CheckSquare size={18} />,
    },
    { id: "task-create", label: "Create Task", icon: <PlusCircle size={18} /> },
    { id: "employees", label: "Employees", icon: <Users size={18} /> },
    { id: "teams", label: "Teams", icon: <UsersRound size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
  ];

  const currentNavItems =
    currentUserRole === "engineering_admin" ? engineeringAdminNav : employeeNav;

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div
        style={styles.brandContainer}
        onClick={() => setCurrentPage("dashboard")}
      >
        <div style={styles.brandRow}>
          <span className="brand-company-name">Northstar Technologies</span>
        </div>
        <p style={styles.brandSubtitle}>Intelligent Workspace</p>
      </div>

      {/* Role Indicator Banner */}
      <div style={styles.roleSwitcherBox}>
        <div style={styles.rolePill}>
          <span style={styles.roleDot} />
          <span style={styles.roleText}>
            {currentUserRole === "engineering_admin"
              ? "Admin View"
              : "Engineer View"}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={styles.navSection}>
        <div style={styles.navGroupTitle}>NAVIGATION</div>
        {currentNavItems.map((item, idx) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => setCurrentPage(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {}),
              }}
            >
              <div style={styles.navButtonContent}>
                <span
                  style={{
                    ...styles.navIcon,
                    color: isActive ? "#0d2118" : "#8da498",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    ...styles.navLabel,
                    color: isActive ? "#0d2118" : "#94a3b8",
                  }}
                >
                  {item.label}
                </span>
              </div>
              {item.badge && (
                <span
                  style={{
                    ...styles.navBadge,
                    ...(isActive ? styles.navBadgeActive : {}),
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Direct Portal Quick Links
      {(currentUserRole === "hr_admin" || currentUserRole === "it_admin") && (
        <div style={styles.adminDirectLinks}>
          <div style={styles.navGroupTitle}>PORTALS</div>
          <button
            onClick={() => {
              setCurrentUserRole("hr_admin");
              setCurrentPage("hr-docs");
            }}
            style={{
              ...styles.directLinkBtn,
              ...(currentPage === "hr-docs" ? styles.directLinkBtnActive : {}),
            }}
          >
            <FolderOpen size={15} />
            <span>HR Admin Portal</span>
          </button>
          <button
            onClick={() => {
              setCurrentUserRole("it_admin");
              setCurrentPage("it-access");
            }}
            style={{
              ...styles.directLinkBtn,
              ...(currentPage === "it-access"
                ? styles.directLinkBtnActive
                : {}),
            }}
          >
            <KeyRound size={15} />
            <span>IT Access Portal</span>
          </button>
        </div>
      )} */}

    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "var(--sidebar-width)",
    minWidth: "var(--sidebar-width)",
    background: "rgba(8, 23, 17, 0.95)",
    borderRight: "1px solid rgba(46, 125, 96, 0.22)",
    backdropFilter: "blur(20px)",
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    minHeight: "100vh",
    position: "sticky",
    top: 0,
    zIndex: 100,
    padding: "24px 16px",
    userSelect: "none",
    flexShrink: 0,
  },
  brandContainer: {
    cursor: "pointer",
    marginBottom: "20px",
    paddingLeft: "8px",
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandBadge: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#e7d7be",
    background: "rgba(231, 215, 190, 0.12)",
    border: "1px solid rgba(231, 215, 190, 0.3)",
    borderRadius: "4px",
    padding: "2px 6px",
  },
  brandSubtitle: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
    letterSpacing: "0.04em",
  },
  roleSwitcherBox: {
    background: "rgba(20, 48, 36, 0.55)",
    border: "1px solid rgba(46, 125, 96, 0.28)",
    borderRadius: "10px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    marginBottom: "22px",
    transition: "all 0.2s ease",
  },
  rolePill: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  roleDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 8px #4ade80",
  },
  roleText: {
    fontSize: "11.5px",
    fontWeight: 600,
    color: "#e7d7be",
  },
  switchHint: {
    fontSize: "10.5px",
    color: "#8da498",
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
    overflowY: "auto",
  },
  navGroupTitle: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#64748b",
    padding: "0 12px 6px",
  },
  navButton: {
    background: "transparent",
    border: "none",
    borderRadius: "9999px",
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    textAlign: "left",
    width: "100%",
  },
  navButtonActive: {
    background: "#e7d7be",
    boxShadow: "0 4px 14px rgba(231, 215, 190, 0.25)",
  },
  navButtonContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  navIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: "13.5px",
    fontWeight: 500,
  },
  navBadge: {
    fontSize: "11px",
    fontWeight: 700,
    background: "rgba(255, 255, 255, 0.08)",
    color: "#8da498",
    borderRadius: "9999px",
    padding: "2px 8px",
  },
  navBadgeActive: {
    background: "rgba(10, 27, 20, 0.2)",
    color: "#0d2118",
  },
  adminDirectLinks: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(46, 125, 96, 0.18)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  directLinkBtn: {
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#8da498",
    fontSize: "12px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  directLinkBtnActive: {
    background: "rgba(231, 215, 190, 0.12)",
    color: "#e7d7be",
    fontWeight: 600,
  },
  userFooter: {
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid rgba(46, 125, 96, 0.22)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #d4af37 0%, #a88424 100%)",
    color: "#0b1913",
    fontWeight: 700,
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
  },
  userInfo: {
    flex: 1,
    overflow: "hidden",
    cursor: "pointer",
  },
  userName: {
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#f8fafc",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  userRole: {
    fontSize: "11px",
    color: "#8da498",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  logoutBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
  },
};
