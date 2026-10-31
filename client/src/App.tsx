import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ToastContainer } from './components/ToastContainer';
import { TaskModal } from './components/TaskModal';
import { DocumentModal } from './components/DocumentModal';

// All 9 Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { EmployeesPage } from './pages/EmployeesPage';
import { HRAdminDocsPage } from './pages/HRAdminDocsPage';
import { ITAdminAccessPage } from './pages/ITAdminAccessPage';
import { CompanyInfoPage } from './pages/CompanyInfoPage';
import { TaskManagementPage } from './pages/TaskManagementPage';
import { TaskCreatePage } from './pages/TaskCreatePage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';

const AppContent: React.FC = () => {
  const { currentPage, isInitializing, isAuthenticated, currentUserRole } = useApp();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#06110d] text-slate-400 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm">
          <span className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  // Page 1: Login is a standalone full-bleed layout
  if (!isAuthenticated || currentPage === 'login') {
    return (
      <div className="relative min-h-screen bg-[#06110d]">
        <LoginPage />
        <ToastContainer />
      </div>
    );
  }

  const allowedPages = currentUserRole === 'hr_admin'
    ? ['dashboard', 'documents', 'hr-docs', 'task-admin', 'task-create', 'employees', 'profile', 'company', 'document-upload']
    : currentUserRole === 'it_admin'
    ? ['dashboard', 'it-access', 'documents', 'employees', 'profile', 'company']
      : ['dashboard', 'chat', 'tasks', 'documents', 'profile', 'company'];
  const isAllowed = allowedPages.includes(currentPage);

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#06110d] text-slate-100 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <h1 className="text-xl font-semibold">You are not allowed to access this resource</h1>
          <button className="btn-primary mt-5" onClick={() => window.location.reload()}>
            Return to your dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#06110d] flex">
      {/* Background radial atmosphere */}
      <div className="app-atmosphere" />

      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content">
        <TopBar />

        <main className="flex-1 overflow-x-hidden">
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'chat' && <AIAssistantPage />}
          {currentPage === 'tasks' && <MyTasksPage />}
          {currentPage === 'task-admin' && <TaskManagementPage />}
          {currentPage === 'task-create' && <TaskCreatePage />}
          {currentPage === 'documents' && <DocumentsPage />}
          {currentPage === 'document-upload' && <DocumentUploadPage />}
          {currentPage === 'profile' && <ProfilePage />}
          {currentPage === 'employees' && <EmployeesPage />}
          {currentPage === 'hr-docs' && <HRAdminDocsPage />}
          {currentPage === 'it-access' && <ITAdminAccessPage />}
          {currentPage === 'company' && <CompanyInfoPage />}
        </main>
      </div>

      {/* Interactive Global Modals */}
      <TaskModal />
      <DocumentModal />

      {/* Toast Alert Feedback */}
      <ToastContainer />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
