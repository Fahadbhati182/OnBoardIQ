export type PageType = 
  | 'login' 
  | 'dashboard' 
  | 'chat' 
  | 'tasks' 
  | 'task-admin'
  | 'task-create'
  | 'documents' 
  | 'document-upload'
  | 'profile' 
  | 'employees'
  | 'hr-docs' 
  | 'it-access' 
  | 'company';

export type UserRole = 'employee' | 'hr_admin' | 'it_admin';

export type ThemeId = 'default' | 'veo-onyx' | 'midnight-azure' | 'ocean-blue' | 'brainwave-slate';

export interface UserProfile {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  department: string;
  joiningDate: string;
  manager: string;
  location: string;
  employeeId: string;
  phone: string;
}

export type TaskStatus = 'completed' | 'in_progress' | 'not_started';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  timeEstimate: string;
  status: TaskStatus;
  category: 'Orientation' | 'Security' | 'IT' | 'HR' | 'Workplace';
  thumbnailUrl: string;
  checklist: TaskChecklistItem[];
  instructions: string;
  resources?: { name: string; url: string }[];
}

export type DocumentCategory = 'All' | 'Policies' | 'Guides' | 'HR' | 'IT' | 'General';
export type DocumentStatus = 'published' | 'draft';

export interface DocumentItem {
  id: string;
  title: string;
  type: string;
  category: DocumentCategory;
  department: string;
  version: string;
  status: DocumentStatus;
  updatedAt: string;
  fileSize: string;
  summary: string;
  keyPoints: string[];
  coverGradient: string;
  coverImage?: string;
}

export type AccessStatus = 'pending' | 'approved' | 'rejected';

export interface AccessRequestItem {
  id: string;
  employeeName: string;
  employeeEmail: string;
  initials: string;
  systemTool: string;
  reason: string;
  status: AccessStatus;
  requestedAt: string;
  approvedBy?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  documentAttachment?: {
    title: string;
    version: string;
    fileSize: string;
    fileType: string;
  };
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}
