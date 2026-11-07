export const APPLICATION_ROLES = ["ENGINEER", "ENGINEERING_ADMIN"];
export const DOCUMENT_ACCESS_SCOPES = [
  "ALL_EMPLOYEES",
  "TEAM_ONLY",
  "ADMIN_ONLY",
];
export const DOCUMENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
export const DOCUMENT_TYPES = ["POLICY", "GUIDE", "HANDBOOK", "FORM", "OTHER"];

export function isAdministrator(user) {
  return user?.role === "ENGINEERING_ADMIN";
}

export function canManageDocument(user) {
  return isAdministrator(user);
}

export function canViewDocument(user, document) {
  if (!user || !document) return false;
  if (isAdministrator(user)) return true;
  if (user.role !== "ENGINEER" || document.status !== "PUBLISHED") return false;

  if (document.access_scope === "ALL_EMPLOYEES") return true;
  return (
    document.access_scope === "TEAM_ONLY" &&
    Boolean(user.team_id) &&
    user.team_id === document.team_id
  );
}

export function buildDocumentAccessFilter(user) {
  if (isAdministrator(user)) return {};
  return {
    status: "PUBLISHED",
    access_scope: ["ALL_EMPLOYEES", "TEAM_ONLY"],
    team_id: user?.team_id || null,
  };
}
