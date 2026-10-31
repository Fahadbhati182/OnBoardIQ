export function isAdministrator(user) {
  return ["ADMIN", "HR_ADMIN", "IT_ADMIN"].includes(user?.role);
}

export function canManageDocument(user, document) {
  if (!isAdministrator(user)) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "HR_ADMIN") return document.document_type !== "IT";
  if (user.role === "IT_ADMIN") return document.document_type === "IT";
  return false;
}

export function canViewDocument(user, document, permissions = []) {
  if (!user || document.status !== "PUBLISHED") return false;
  if (isAdministrator(user)) return canManageDocument(user, document) ||
    document.access_scope === "ALL_EMPLOYEES";
  if (document.access_scope === "ALL_EMPLOYEES") return true;
  return permissions.some((permission) =>
    permission.can_view &&
    ((permission.user_id && permission.user_id === user.id) ||
      (permission.role && permission.role === user.role) ||
      (permission.department_id && permission.department_id === user.department_id)),
  );
}
