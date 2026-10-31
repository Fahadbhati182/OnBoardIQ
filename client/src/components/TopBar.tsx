import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Bell, Check, Sparkles, User, LogOut, ChevronDown, Palette } from 'lucide-react';
import { ThemeId } from '../types';

const themeOptions: { id: ThemeId; name: string; description: string; colors: [string, string, string] }[] = [
  { id: 'default', name: 'Forest Default', description: 'Original green & champagne', colors: ['#06110d', '#0d221a', '#e7d7be'] },
  { id: 'veo-onyx', name: 'Veo Onyx', description: 'Charcoal & soft white', colors: ['#111315', '#34383d', '#f1f3f4'] },
  { id: 'midnight-azure', name: 'Midnight Azure', description: 'Deep blue & luminous', colors: ['#07152f', '#19346d', '#6f8eff'] },
  { id: 'ocean-blue', name: 'Ocean Blue', description: 'Clear & confident', colors: ['#17213a', '#405989', '#9eb6ff'] },
  { id: 'brainwave-slate', name: 'Brainwave Slate', description: 'Cool graphite & electric blue', colors: ['#1b2b3a', '#2f5c82', '#269bff'] },
];

export const TopBar: React.FC = () => {
  const {
    currentUser,
    searchQuery,
    setSearchQuery,
    setCurrentPage,
    notifications,
    markAllNotificationsRead,
    currentUserRole,
    signOut,
    theme,
    setTheme,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header style={styles.topbar}>
      {/* Search Input matching mockup */}
      <div style={styles.searchWrapper}>
        <Search size={16} style={styles.searchIcon} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search policies, guides, or ask anything..."
          style={styles.searchInput}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            ✕
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div style={styles.actionsGroup}>
        <div className="theme-picker-wrap">
          <button
            className="theme-picker-trigger"
            onClick={() => {
              setShowThemePicker((visible) => !visible);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            title="Change color theme"
          >
            <Palette size={16} />
            <span>Theme</span>
          </button>
          {showThemePicker && (
            <div className="theme-picker-menu">
              <strong>Color theme</strong>
              <div className="theme-picker-options">
                {themeOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`theme-option ${theme === option.id ? 'selected' : ''}`}
                    onClick={() => {
                      setTheme(option.id);
                      setShowThemePicker(false);
                    }}
                  >
                    <span className="theme-preview" style={{ background: option.colors[0] }}>
                      <i style={{ background: option.colors[2] }} />
                      <i style={{ background: option.colors[1] }} />
                    </span>
                    <span className="theme-option-copy">
                      <b>{option.name}</b>
                      <small>{option.description}</small>
                    </span>
                    <span className="theme-radio" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick AI Assistant Trigger */}
        <button
          onClick={() => setCurrentPage('chat')}
          style={styles.aiQuickBtn}
          title="Instant AI Help"
        >
          <Sparkles size={15} style={{ color: '#e7d7be' }} />
          <span>Ask ISS AI</span>
        </button>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            style={styles.iconBtn}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span style={styles.notificationDot} />}
          </button>

          {showNotifications && (
            <div style={styles.notificationsDropdown}>
              <div style={styles.notifHeader}>
                <span style={styles.notifTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllNotificationsRead} style={styles.markReadBtn}>
                    <Check size={12} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
              <div style={styles.notifList}>
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.notifItem,
                      ...(item.read ? {} : styles.notifItemUnread),
                    }}
                  >
                    <div style={styles.notifDot} />
                    <div style={styles.notifBody}>
                      <p style={styles.notifText}>{item.title}</p>
                      <span style={styles.notifTime}>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill Menu */}
        <div style={{ position: 'relative' }}>
          <div
            style={styles.userPill}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div style={styles.avatarCircle}>{currentUser.initials}</div>
            <div style={styles.userTextBlock}>
              <span style={styles.profileName}>{currentUser.name}</span>
              <span style={styles.profileJob}>{currentUser.jobTitle}</span>
            </div>
            <ChevronDown size={14} style={{ color: '#94a3b8' }} />
          </div>

          {showProfileMenu && (
            <div style={styles.profileDropdown}>
              <div style={styles.menuHeader}>
                <div style={styles.menuRoleBadge}>
                  {currentUserRole.toUpperCase().replace('_', ' ')}
                </div>
                <div style={styles.menuEmail}>{currentUser.email}</div>
              </div>

              <div style={styles.menuDivider} />

              <button
                style={styles.menuItem}
                onClick={() => {
                  setCurrentPage('profile');
                  setShowProfileMenu(false);
                }}
              >
                <User size={15} />
                <span>View Full Profile</span>
              </button>

              <div style={styles.menuDivider} />

              <button
                style={{ ...styles.menuItem, color: '#f87171' }}
                onClick={() => {
                  void signOut();
                  setShowProfileMenu(false);
                }}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    height: 'var(--topbar-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 36px',
    borderBottom: '1px solid rgba(46, 125, 96, 0.18)',
    background: 'rgba(6, 17, 13, 0.8)',
    backdropFilter: 'blur(16px)',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '420px',
    maxWidth: '45%',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#64748b',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    background: 'rgba(12, 30, 23, 0.75)',
    border: '1px solid rgba(46, 125, 96, 0.25)',
    borderRadius: '9999px',
    padding: '0 36px 0 42px',
    color: '#f8fafc',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '12px',
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  aiQuickBtn: {
    background: 'rgba(231, 215, 190, 0.1)',
    border: '1px solid rgba(231, 215, 190, 0.3)',
    borderRadius: '9999px',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e7d7be',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  iconBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(20, 44, 34, 0.6)',
    border: '1px solid rgba(46, 125, 96, 0.22)',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  notificationDot: {
    position: 'absolute',
    top: '9px',
    right: '9px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 6px #4ade80',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '6px 14px 6px 8px',
    borderRadius: '9999px',
    background: 'rgba(15, 36, 28, 0.85)',
    border: '1px solid rgba(46, 125, 96, 0.25)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  avatarCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #d4af37 0%, #aa8529 100%)',
    color: '#081711',
    fontWeight: 700,
    fontSize: '12.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextBlock: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#f8fafc',
    lineHeight: 1.2,
  },
  profileJob: {
    fontSize: '11px',
    color: '#8da498',
  },
  notificationsDropdown: {
    position: 'absolute',
    top: '48px',
    right: 0,
    width: '320px',
    background: '#0d221a',
    border: '1px solid rgba(46, 125, 96, 0.35)',
    borderRadius: '16px',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
    padding: '16px',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease',
  },
  notifHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  notifTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e7d7be',
  },
  markReadBtn: {
    background: 'transparent',
    border: 'none',
    color: '#4ade80',
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  notifList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  notifItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    padding: '8px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  notifItemUnread: {
    background: 'rgba(46, 125, 96, 0.12)',
  },
  notifDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4ade80',
    marginTop: '6px',
  },
  notifBody: {
    flex: 1,
  },
  notifText: {
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: 1.4,
  },
  notifTime: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '2px',
    display: 'block',
  },
  profileDropdown: {
    position: 'absolute',
    top: '48px',
    right: 0,
    width: '240px',
    background: '#0d221a',
    border: '1px solid rgba(46, 125, 96, 0.35)',
    borderRadius: '16px',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
    padding: '12px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  menuHeader: {
    padding: '8px 8px 4px',
  },
  menuRoleBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#e7d7be',
    letterSpacing: '0.08em',
  },
  menuEmail: {
    fontSize: '11.5px',
    color: '#8da498',
    marginTop: '2px',
  },
  menuDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '6px 0',
  },
  menuSubheading: {
    fontSize: '9.5px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.08em',
    padding: '4px 8px',
  },
  menuItem: {
    background: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '12.5px',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  menuItemActive: {
    background: 'rgba(231, 215, 190, 0.12)',
    color: '#e7d7be',
    fontWeight: 600,
  },
};
