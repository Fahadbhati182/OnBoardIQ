import { UserProfile, TaskItem, DocumentItem, AccessRequestItem, ChatMessage } from '../types';

export const mockUsers: Record<string, UserProfile> = {
  employee: {
    id: 'emp-1',
    name: 'Fahad Bhati',
    initials: 'FA',
    email: 'fahad@iss.com',
    role: 'employee',
    jobTitle: 'Software Engineer',
    department: 'Engineering Department',
    joiningDate: 'Jan 22, 2024',
    manager: 'Elena Rostova (VP of Engineering)',
    location: 'London HQ / Hybrid',
    employeeId: 'ISS-89241',
    phone: '+44 20 7946 0912',
  },
  hr_admin: {
    id: 'hr-1',
    name: 'Sarah Jenkins',
    initials: 'SJ',
    email: 'sarah.jenkins@iss.com',
    role: 'hr_admin',
    jobTitle: 'Head of People & Culture',
    department: 'Human Resources',
    joiningDate: 'Mar 15, 2021',
    manager: 'Marcus Sterling (Chief People Officer)',
    location: 'London HQ',
    employeeId: 'ISS-41002',
    phone: '+44 20 7946 0184',
  },
  it_admin: {
    id: 'it-1',
    name: 'David Miller',
    initials: 'DM',
    email: 'david.miller@iss.com',
    role: 'it_admin',
    jobTitle: 'Lead SecOps & Systems Engineer',
    department: 'Information Technology',
    joiningDate: 'Nov 02, 2022',
    manager: 'Vikram Patel (CIO)',
    location: 'London HQ',
    employeeId: 'ISS-60319',
    phone: '+44 20 7946 0773',
  },
};

export const initialTasks: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Complete Company Introduction',
    description: 'Learn about ISS, our mission, values, and organizational culture.',
    timeEstimate: '15 min',
    status: 'completed',
    category: 'Orientation',
    thumbnailUrl: '/assets/images/welcome-bg.jpg',
    instructions: 'Watch the introductory keynote by our executive leadership team and complete the interactive culture quiz.',
    checklist: [
      { id: 'c-1', text: 'Watch ISS Welcome Video (8 min)', completed: true },
      { id: 'c-2', text: 'Review Corporate Values & Global Operations', completed: true },
      { id: 'c-3', text: 'Complete Culture Alignment Checkpoint', completed: true },
    ],
  },
  {
    id: 'task-2',
    title: 'Read IT Security Guidelines',
    description: 'Understand security policies, password standards, and best practices.',
    timeEstimate: '20 min',
    status: 'in_progress',
    category: 'Security',
    thumbnailUrl: '/assets/images/hero-bg.jpg',
    instructions: 'Review company data security protocols, 2FA hardware key guidelines, phishing prevention, and clean desk policies.',
    checklist: [
      { id: 'c-4', text: 'Configure Hardware Token (YubiKey / Authenticator)', completed: true },
      { id: 'c-5', text: 'Review Phishing Simulation Guide', completed: true },
      { id: 'c-6', text: 'Acknowledge Data Protection & GDPR Compliance', completed: false },
    ],
  },
  {
    id: 'task-3',
    title: 'Set up your Laptop & Accounts',
    description: 'Follow the IT setup guide for GitHub, Slack, and developer environments.',
    timeEstimate: '30 min',
    status: 'in_progress',
    category: 'IT',
    thumbnailUrl: '/assets/images/welcome-bg.jpg',
    instructions: 'Configure Okta Single Sign-On, join core Slack channels (#eng-general, #announcements), and set up your Git SSH credentials.',
    checklist: [
      { id: 'c-7', text: 'Log in to Okta Dashboard and configure MFA', completed: true },
      { id: 'c-8', text: 'Generate SSH keypair and register with GitHub Enterprise', completed: false },
      { id: 'c-9', text: 'Connect VPN client and verify intranet access', completed: false },
    ],
  },
  {
    id: 'task-4',
    title: 'Complete HR Forms',
    description: 'Fill in required onboarding documents, tax declarations, and direct deposit.',
    timeEstimate: '25 min',
    status: 'not_started',
    category: 'HR',
    thumbnailUrl: '/assets/images/hero-bg.jpg',
    instructions: 'Complete official paperwork including direct deposit banking info, tax withholding declarations, emergency contacts, and benefits elections.',
    checklist: [
      { id: 'c-10', text: 'Submit Banking & Direct Deposit Details', completed: false },
      { id: 'c-11', text: 'Sign Employee Confidentiality Agreement', completed: false },
      { id: 'c-12', text: 'Designate Health & Life Insurance Beneficiaries', completed: false },
    ],
  },
  {
    id: 'task-5',
    title: 'Take a Tour of Office',
    description: 'Watch this interactive video walkthrough to get familiar with our campus & amenities.',
    timeEstimate: '10 min',
    status: 'completed',
    category: 'Workplace',
    thumbnailUrl: '/assets/images/welcome-bg.jpg',
    instructions: 'Explore office layouts, meeting room booking kiosks, micro-kitchens, printing hubs, and quiet wellness pods.',
    checklist: [
      { id: 'c-13', text: 'View 360 Campus Map & Key Amenities', completed: true },
      { id: 'c-14', text: 'Locate Team Hot-Desk Zones & Meeting Rooms', completed: true },
    ],
  },
];

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Employee Handbook',
    type: 'General',
    category: 'General',
    department: 'All',
    version: 'v3.0',
    status: 'published',
    updatedAt: 'Jan 15, 2024',
    fileSize: '4.2 MB',
    summary: 'The primary guide for all ISS team members covering company values, workplace policies, standard operating procedures, and career development frameworks.',
    keyPoints: [
      'Comprehensive overview of ISS vision and operating principles',
      'Code of professional conduct and mutual respect commitments',
      'Flexible working arrangements and core working hours policy',
      'Annual review cycles, continuous feedback, and progression tracks'
    ],
    coverGradient: 'linear-gradient(135deg, #102e22 0%, #1c4b38 100%)',
    coverImage: '/assets/images/welcome-bg.jpg',
  },
  {
    id: 'doc-2',
    title: 'Code of Conduct Policy',
    type: 'Policy',
    category: 'Policies',
    department: 'All',
    version: 'v2.1',
    status: 'published',
    updatedAt: 'Dec 10, 2023',
    fileSize: '2.8 MB',
    summary: 'Our foundational ethics framework ensuring integrity, equity, anti-harassment, data transparency, and ethical business dealings worldwide.',
    keyPoints: [
      'Zero tolerance for discrimination, harassment, or retaliation',
      'Guidelines for reporting conflicts of interest and gifts policy',
      'Whistleblower protection and confidential reporting channels',
      'Protection of confidential proprietary intellectual property'
    ],
    coverGradient: 'linear-gradient(135deg, #16382b 0%, #225642 100%)',
    coverImage: '/assets/images/hero-bg.jpg',
  },
  {
    id: 'doc-3',
    title: 'IT Security Guidelines',
    type: 'Guide',
    category: 'Guides',
    department: 'All',
    version: 'v1.5',
    status: 'published',
    updatedAt: 'Jan 20, 2024',
    fileSize: '3.1 MB',
    summary: 'Essential cybersecurity rules, password requirements, hardware security token protocols, incident response guidelines, and cloud resource safety.',
    keyPoints: [
      'Mandatory hardware 2-factor authentication for corporate SSO',
      'Requirements for device disk encryption (FileVault / BitLocker)',
      'Security requirements for remote Wi-Fi and public networks',
      'Procedures for immediately reporting security incidents to SecOps'
    ],
    coverGradient: 'linear-gradient(135deg, #0e2b20 0%, #1c4e3a 100%)',
    coverImage: '/assets/images/hero-bg.jpg',
  },
  {
    id: 'doc-4',
    title: 'Parental Leave Policy',
    type: 'HR',
    category: 'HR',
    department: 'HR',
    version: 'v2.1',
    status: 'published',
    updatedAt: 'Dec 5, 2023',
    fileSize: '1.2 MB',
    summary: 'Industry-leading paid parental leave framework supporting biological, adoptive, and surrogate parents with flexible phase-back schedules.',
    keyPoints: [
      'Maternity Leave: 26 weeks fully paid leave',
      'Paternity Leave: 4 weeks fully paid leave',
      'Adoption & Foster Leave: 12 weeks fully paid leave',
      'Gradual return-to-work program with 80% hours for 100% pay in month 1'
    ],
    coverGradient: 'linear-gradient(135deg, #1d4032 0%, #2f6952 100%)',
    coverImage: '/assets/images/welcome-bg.jpg',
  },
  {
    id: 'doc-5',
    title: 'Remote Work Policy',
    type: 'Policy',
    category: 'Policies',
    department: 'All',
    version: 'v1.2',
    status: 'draft',
    updatedAt: 'Jan 18, 2024',
    fileSize: '1.9 MB',
    summary: 'Updated guidelines for hybrid and remote employees, including home office stipends, ergonomic equipment allowances, and connectivity expectations.',
    keyPoints: [
      'Eligibility for $800 initial home office setup stipend',
      'Core collaboration sync window: 10:00 AM – 3:00 PM local time',
      'Company-subsidized high-speed internet reimbursement ($60/mo)',
      'Data security protocols for home office environments'
    ],
    coverGradient: 'linear-gradient(135deg, #1a3328 0%, #27523f 100%)',
    coverImage: '/assets/images/hero-bg.jpg',
  },
  {
    id: 'doc-6',
    title: 'Benefits Overview',
    type: 'General',
    category: 'General',
    department: 'All',
    version: 'v1.0',
    status: 'published',
    updatedAt: 'Jan 2, 2024',
    fileSize: '2.4 MB',
    summary: 'A holistic summary of medical, dental, vision, 401(k) / pension matching, wellness stipends, and continuous learning budgets.',
    keyPoints: [
      'Comprehensive tier-1 health insurance covered 100% for employees',
      'Annual $1,500 learning & conference allowance per team member',
      'Annual $600 wellness & fitness reimbursement stipend',
      'Competitive 6% company 401(k) / pension contribution matching'
    ],
    coverGradient: 'linear-gradient(135deg, #123023 0%, #20503a 100%)',
    coverImage: '/assets/images/welcome-bg.jpg',
  },
  {
    id: 'doc-7',
    title: 'Developer Environment Setup',
    type: 'Guide',
    category: 'IT',
    department: 'Engineering',
    version: 'v2.4',
    status: 'published',
    updatedAt: 'Jan 12, 2024',
    fileSize: '3.8 MB',
    summary: 'Step-by-step setup for Docker containers, local microservices, VPN tunnels, and staging environment credentials.',
    keyPoints: [
      'Standard dev stack initialization script for macOS & Ubuntu',
      'Local Kubernetes minikube and Docker Compose setup',
      'Accessing internal npm registry and private artifacts',
      'Setting up automated pre-commit linters and Git hooks'
    ],
    coverGradient: 'linear-gradient(135deg, #143527 0%, #245841 100%)',
    coverImage: '/assets/images/hero-bg.jpg',
  },
  {
    id: 'doc-8',
    title: 'Travel & Expense Policy',
    type: 'Policy',
    category: 'Policies',
    department: 'Finance',
    version: 'v1.8',
    status: 'published',
    updatedAt: 'Nov 28, 2023',
    fileSize: '1.5 MB',
    summary: 'Guidelines for business travel bookings, meal per diems, client entertainment rules, and automated expense report submissions.',
    keyPoints: [
      'Corporate travel booking portal via Navan / Concur',
      'Daily per diem rate allowances by geographic zone',
      'Submission deadlines: expenses must be logged within 30 days',
      'Receipt capture requirements for transactions over $25'
    ],
    coverGradient: 'linear-gradient(135deg, #153226 0%, #22513c 100%)',
    coverImage: '/assets/images/welcome-bg.jpg',
  },
];

export const initialAccessRequests: AccessRequestItem[] = [
  {
    id: 'req-1',
    employeeName: 'Fahad Bhati',
    employeeEmail: 'fahad@iss.com',
    initials: 'FA',
    systemTool: 'GitHub Access',
    reason: 'For development work & repository contribution',
    status: 'pending',
    requestedAt: 'Jan 22, 2024',
  },
  {
    id: 'req-2',
    employeeName: 'Priya Sharma',
    employeeEmail: 'priya@iss.com',
    initials: 'PS',
    systemTool: 'Jira Access',
    reason: 'Project management & sprint planning backlog',
    status: 'pending',
    requestedAt: 'Jan 20, 2024',
  },
  {
    id: 'req-3',
    employeeName: 'Rahul Mehta',
    employeeEmail: 'rahul@iss.com',
    initials: 'RM',
    systemTool: 'AWS Console',
    reason: 'For deployment and microservices monitoring',
    status: 'approved',
    requestedAt: 'Jan 18, 2024',
    approvedBy: 'David Miller',
  },
  {
    id: 'req-4',
    employeeName: 'Elena Rostova',
    employeeEmail: 'elena@iss.com',
    initials: 'ER',
    systemTool: 'Datadog APM',
    reason: 'Cluster observability and error alerting dashboards',
    status: 'approved',
    requestedAt: 'Jan 16, 2024',
    approvedBy: 'David Miller',
  },
  {
    id: 'req-5',
    employeeName: 'Marcus Vance',
    employeeEmail: 'marcus@iss.com',
    initials: 'MV',
    systemTool: 'Tableau BI',
    reason: 'Executive analytics and onboarding report generation',
    status: 'approved',
    requestedAt: 'Jan 15, 2024',
    approvedBy: 'David Miller',
  },
  {
    id: 'req-6',
    employeeName: 'Chloe Bennett',
    employeeEmail: 'chloe@iss.com',
    initials: 'CB',
    systemTool: 'Production Database Read Replica',
    reason: 'Ad-hoc analytical query verification',
    status: 'rejected',
    requestedAt: 'Jan 14, 2024',
    approvedBy: 'David Miller',
  },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: "What is our company's parental leave policy?",
    timestamp: '10:34 AM',
  },
  {
    id: 'msg-2',
    sender: 'ai',
    text: `According to the ISS Parental Leave Policy (v2.1), eligible employees can avail:

• Maternity Leave: 26 weeks (paid)
• Paternity Leave: 4 weeks (paid)
• Adoption Leave: 12 weeks (paid)

You can find the detailed policy here:`,
    timestamp: '10:34 AM',
    documentAttachment: {
      title: 'Parental Leave Policy v2.1',
      version: 'v2.1',
      fileSize: '1.2 MB',
      fileType: 'PDF',
    },
  },
];

export const chatSuggestedPrompts = [
  'Who is eligible?',
  'How to apply?',
  'Is it different by country?',
  'Show related documents',
  'What is the IT setup process?',
  'How do I claim health insurance?',
];

export const aiKnowledgeBase: Record<string, string> = {
  eligible: `All full-time ISS employees with a minimum of 6 months continuous service prior to the expected date are eligible for full company-paid parental leave. Part-time employees receive proportional pro-rated entitlements according to their contracted hours.`,
  apply: `To apply for Parental Leave:
1. Log in to the ISS Workday portal under Time & Absence.
2. Select "Parental Leave" and upload your medical confirmation or adoption certification.
3. Submit at least 30 days in advance.
Your HR Business Partner and manager will review and confirm within 3 business days.`,
  country: `Yes, while the global ISS baseline provides 26 weeks maternity, 4 weeks paternity, and 12 weeks adoption, local statutory mandates in certain countries (e.g. Nordics, Germany, UK) may offer enhanced leave structures. Refer to HR > Regional Addendums for your local country guidelines.`,
  documents: `Related documentation:
• Parental Leave Policy v2.1 (PDF • 1.2 MB)
• Flexible Return-to-Work Guidelines (PDF • 850 KB)
• Healthcare Dependent Enrollment Form (PDF • 450 KB)`,
  it: `For IT setup:
• You will receive your corporate hardware token and credentials via encrypted SMS.
• Connect via SSO at id.iss.com to configure passwordless YubiKey authentication.
• Access Jira, GitHub, Slack, and VPN through the Okta App Catalog.`,
  health: `ISS health coverage is effective starting your very first day! You can enroll your dependents in medical, dental, and vision within your first 30 days via the Benefits Hub. Emergency travel coverage is also included automatically.`,
};
