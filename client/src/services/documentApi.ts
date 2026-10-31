import { API_URL, apiRequest } from "./apiClient";

export interface ApiDocument {
  id: string;
  title: string;
  description: string | null;
  documentType: string;
  status: string;
  departmentId: string | null;
  accessScope: string;
  updatedAt: string;
  currentVersion: {
    id?: string;
    versionNumber: number;
    fileName: string;
    mimeType?: string | null;
    fileSizeBytes: number;
    createdAt: string;
  } | null;
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number;
  uploaded_by: string | null;
  created_at: string;
}

export const documentApi = {
  list: (search = "") =>
    apiRequest<ApiDocument[]>(
      `/documents${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  get: (id: string) => apiRequest<ApiDocument>(`/documents/${id}`),
  download: async (id: string, fileName: string) => {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${API_URL}/documents/${id}/download`, {
      credentials: "include",
      headers: token ? { Authorization: ["Bearer", token].join(" ") } : {},
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || "Unable to download document");
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },
  upload: (input: {
    file: File;
    title: string;
    description: string;
    documentType: string;
    departmentId?: string;
    accessScope: string;
  }) => {
    const form = new FormData();
    form.append("file", input.file);
    form.append("title", input.title);
    form.append("description", input.description);
    form.append("documentType", input.documentType);
    form.append("accessScope", input.accessScope);
    if (input.departmentId) form.append("departmentId", input.departmentId);
    return requestMultipart<ApiDocument>("/documents", form);
  },
  update: (
    id: string,
    input: Partial<{
      title: string;
      description: string;
      documentType: string;
      departmentId: string | null;
      accessScope: string;
    }>,
  ) =>
    apiRequest<ApiDocument>(`/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  archive: (id: string) =>
    apiRequest<ApiDocument>(`/documents/${id}/archive`, { method: "PATCH" }),
  publish: (id: string) =>
    apiRequest<ApiDocument>(`/documents/${id}/publish`, { method: "PATCH" }),
  versions: (id: string) =>
    apiRequest<DocumentVersion[]>(`/documents/${id}/versions`),
  uploadVersion: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return requestMultipart<ApiDocument>(`/documents/${id}/versions`, form);
  },
};

async function requestMultipart<T>(path: string, body: FormData): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: ["Bearer", token].join(" ") } : {},
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(payload.message || "The request could not be completed");
  return payload.data as T;
}
