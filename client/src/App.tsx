import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DemoSwitcher } from './components/DemoSwitcher';
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
import { HRAdminDocsPage } from './pages/HRAdminDocsPage';
import { ITAdminAccessPage } from './pages/ITAdminAccessPage';
import { CompanyInfoPage } from './pages/CompanyInfoPage';

const AppContent: React.FC = () => {
  const { currentPage } = useApp();

  // Page 1: Login is a standalone full-bleed layout
  if (currentPage === 'login') {
    return (
      <div className="relative min-h-screen bg-[#06110d]">
        <LoginPage />
        <DemoSwitcher />
        <ToastContainer />
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
          {currentPage === 'documents' && <DocumentsPage />}
          {currentPage === 'profile' && <ProfilePage />}
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

      {/* Floating Demo Bar to switch between all 9 pages */}
      <DemoSwitcher />
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
