import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import { pageFromPath, pagePaths } from './router';

const AppContent: React.FC = () => {
  const { currentPage, isInitializing, isAuthenticated, currentUserRole } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated && location.pathname !== pagePaths.login) {
      navigate(pagePaths.login, { replace: true });
    } else if (isAuthenticated && location.pathname === pagePaths.login) {
      navigate(pagePaths.dashboard, { replace: true });
    } else if (!pageFromPath(location.pathname)) {
      navigate(isAuthenticated ? pagePaths.dashboard : pagePaths.login, {
        replace: true,
      });
    }
  }, [isAuthenticated, isInitializing, location.pathname, navigate]);

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

  const allowedPages = currentUserRole === 'engineering_admin'
    ? ['dashboard', 'documents', 'task-admin', 'task-create', 'employees', 'profile', 'company', 'document-upload']
    : currentUserRole === 'hr_admin'
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
          <Routes>
            <Route path={pagePaths.dashboard} element={<DashboardPage />} />
            <Route path={pagePaths.chat} element={<AIAssistantPage />} />
            <Route path={pagePaths.tasks} element={<MyTasksPage />} />
            <Route path={pagePaths['task-admin']} element={<TaskManagementPage />} />
            <Route path={pagePaths['task-create']} element={<TaskCreatePage />} />
            <Route path={pagePaths.documents} element={<DocumentsPage />} />
            <Route path={pagePaths['document-upload']} element={<DocumentUploadPage />} />
            <Route path={pagePaths.profile} element={<ProfilePage />} />
            <Route path={pagePaths.employees} element={<EmployeesPage />} />
            <Route path={pagePaths['hr-docs']} element={<HRAdminDocsPage />} />
            <Route path={pagePaths['it-access']} element={<ITAdminAccessPage />} />
            <Route path={pagePaths.company} element={<CompanyInfoPage />} />
            <Route path="*" element={<Navigate to={pagePaths.dashboard} replace />} />
          </Routes>
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
