import { apiRequest } from "./apiClient";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TeamInput {
  name: string;
  description: string | null;
}

export const teamApi = {
  list: () => apiRequest<Team[]>("/teams"),
  create: (team: TeamInput) =>
    apiRequest<Team>("/teams", {
      method: "POST",
      body: JSON.stringify(team),
    }),
  update: (id: string, team: TeamInput) =>
    apiRequest<Team>(`/teams/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(team),
    }),
  delete: (id: string) =>
    apiRequest<{ id: string }>(`/teams/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
