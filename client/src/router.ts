import { PageType } from "./types";

export const pagePaths: Record<PageType, string> = {
  login: "/login",
  dashboard: "/dashboard",
  chat: "/chat",
  tasks: "/tasks",
  "task-admin": "/task-admin",
  "task-create": "/task-create",
  documents: "/documents",
  "document-upload": "/document-upload",
  profile: "/profile",
  employees: "/employees",
  teams: "/teams",
  "hr-docs": "/hr-docs",
  "it-access": "/it-access",
  company: "/company",
};

const pageByPath = Object.entries(pagePaths).reduce(
  (routes, [page, path]) => ({ ...routes, [path]: page as PageType }),
  {} as Record<string, PageType>,
);

export function pageFromPath(pathname: string): PageType | null {
  return pageByPath[pathname] || null;
}
