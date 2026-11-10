import path from "node:path";
import supabase from "../config/supabase.js";
import ApiError from "../utils/ApiError.js";
import {
  getMaxDocumentSize,
  getPdfInfo,
  isPdf,
  removePdf,
  savePdf,
  streamPdf,
} from "../services/documentStorage.js";
import {
  canManageDocument,
  canViewDocument,
  DOCUMENT_ACCESS_SCOPES,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  isAdministrator,
} from "../services/documentAuthorization.js";
import { sendKafkaMessage } from "../config/kafka.js";

const DOCUMENT_COLUMNS =
  "id, title, description, document_type, status, department_id, team_id, access_scope, uploaded_by, created_at, updated_at";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuid(value, field = "id") {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a valid UUID`);
  }
  return value;
}

function text(value, field, required = false) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || (required && !value.trim())) {
    throw new ApiError(400, `${field} is required`);
  }
  return value.trim();
}

function parseMetadata(body, partial = false) {
  const values = {};
  if (!partial || body.title !== undefined)
    values.title = text(body.title, "title", true);
  if (!partial || body.description !== undefined)
    values.description = body.description
      ? text(body.description, "description")
      : null;
  if (!partial || body.documentType !== undefined) {
    values.document_type = text(body.documentType, "documentType", true);
    if (!DOCUMENT_TYPES.includes(values.document_type)) {
      throw new ApiError(400, "Invalid documentType");
    }
  }
  if (!partial || body.accessScope !== undefined) {
    values.access_scope = text(body.accessScope, "accessScope", true);
    if (!DOCUMENT_ACCESS_SCOPES.includes(values.access_scope)) {
      throw new ApiError(400, "Invalid accessScope");
    }
  }
  if (!partial || body.teamId !== undefined)
    values.team_id = body.teamId ? uuid(body.teamId, "teamId") : null;
  if (!partial || body.departmentId !== undefined)
    values.department_id = body.departmentId
      ? uuid(body.departmentId, "departmentId")
      : null;
  if (
    values.access_scope &&
    values.access_scope !== "TEAM_ONLY" &&
    values.team_id !== undefined &&
    values.team_id !== null
  ) {
    throw new ApiError(400, "Only TEAM_ONLY documents may have a teamId");
  }
  if (values.access_scope === "TEAM_ONLY" && values.team_id === null) {
    throw new ApiError(400, "TEAM_ONLY documents require a teamId");
  }
  return values;
}

function mapDocument(document, version) {
  return {
    id: document.id,
    title: document.title,
    description: document.description,
    documentType: document.document_type,
    status: document.status,
    departmentId: document.department_id,
    teamId: document.team_id,
    accessScope: document.access_scope,
    uploadedBy: document.uploaded_by,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
    currentVersion: version
      ? {
          id: version.id,
          versionNumber: version.version_number,
          fileName: version.file_name,
          mimeType: version.mime_type,
          fileSizeBytes: version.file_size_bytes,
          createdAt: version.created_at,
        }
      : null,
  };
}

async function findDocument(id) {
  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_COLUMNS)
    .eq("id", uuid(id))
    .maybeSingle();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  if (!data) throw new ApiError(404, "Document was not found");
  return data;
}

async function latestVersion(documentId) {
  const { data, error } = await supabase
    .from("document_versions")
    .select(
      "id, version_number, storage_path, file_name, mime_type, file_size_bytes, uploaded_by, created_at",
    )
    .eq("document_id", documentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  return data;
}

async function authorize(user, document, operation = "view") {
  const allowed =
    operation === "manage"
      ? canManageDocument(user, document)
      : canViewDocument(user, document);
  if (!allowed) {
    throw new ApiError(403, "You are not allowed to access this resource");
  }
}

function validateUpload(file) {
  if (!file || !file.buffer?.length)
    throw new ApiError(400, "A PDF file is required");
  if (
    file.mimetype !== "application/pdf" ||
    path.extname(file.originalname).toLowerCase() !== ".pdf" ||
    !isPdf(file.buffer)
  ) {
    throw new ApiError(400, "Only valid PDF files are accepted");
  }
  if (file.buffer.length > getMaxDocumentSize())
    throw new ApiError(413, "The uploaded file is too large");
}

export async function publishDocumentEvent(document, version) {
  let teamData = null;

  if (document.team_id != null) {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .eq("id", document.team_id)
      .single();

    if (error || !data) {
      throw new Error(`Failed to fetch team data: ${error?.message}`);
    }

    teamData = data;
  }

  await sendKafkaMessage("document.uploaded", {
    documentId: document.id,
    versionId: version.id,

    // File information
    storageKey: version.storage_path,
    fileName: version.file_name,
    mimeType: version.mime_type,
    fileSize: version.file_size_bytes,

    // Document information
    title: document.title,
    description: document.description,
    documentType: document.document_type,

    // Authorization metadata
    accessScope: document.access_scope,
    teamId: document.team_id ?? null,
    teamName: teamData?.name ?? null,
    status: document.status,

    // Ownership and versioning
    uploadedBy: document.uploaded_by,
    versionNumber: version.version_number,

    // Event information
    eventType: "DOCUMENT_UPLOADED",
    createdAt: new Date().toISOString(),
  });
}

export async function listDocuments(req, res) {
  let query = supabase
    .from("documents")
    .select(DOCUMENT_COLUMNS, { count: "exact" })
    .order("updated_at", { ascending: false });
  if (!isAdministrator(req.user)) query = query.eq("status", "PUBLISHED");
  if (req.query.search)
    query = query.ilike("title", `%${text(req.query.search, "search")}%`);
  if (req.query.documentType) {
    const documentType = text(req.query.documentType, "documentType");
    if (!DOCUMENT_TYPES.includes(documentType)) {
      throw new ApiError(400, "Invalid documentType");
    }
    query = query.eq("document_type", documentType);
  }
  if (req.query.status && isAdministrator(req.user)) {
    const status = text(req.query.status, "status");
    if (!DOCUMENT_STATUSES.includes(status))
      throw new ApiError(400, "Invalid status");
    query = query.eq("status", status);
  }
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit || "20", 10)),
  );
  const { data, error } = await query;
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  const permitted = [];
  for (const document of data || []) {
    if (
      canViewDocument(req.user, document) ||
      canManageDocument(req.user, document)
    ) {
      permitted.push(mapDocument(document, await latestVersion(document.id)));
    }
  }
  const total = permitted.length;
  const paged = permitted.slice((page - 1) * limit, page * limit);
  res.json({
    success: true,
    data: paged,
    pagination: { page, limit, total },
  });
}

export async function listEmployeeDocuments(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit || "20", 10)),
  );
  let query = supabase
    .from("documents")
    .select(DOCUMENT_COLUMNS)
    .eq("status", "PUBLISHED")
    .in("access_scope", ["ALL_EMPLOYEES", "TEAM_ONLY"])
    .order("updated_at", { ascending: false });

  if (req.query.search) {
    query = query.ilike("title", `%${text(req.query.search, "search")}%`);
  }
  if (req.query.documentType) {
    const documentType = text(req.query.documentType, "documentType");
    if (!DOCUMENT_TYPES.includes(documentType)) {
      throw new ApiError(400, "Invalid documentType");
    }
    query = query.eq("document_type", documentType);
  }

  const { data, error } = await query;
  if (error) throw new ApiError(500, "An unexpected database error occurred");

  const permitted = [];
  for (const document of data || []) {
    if (canViewDocument(req.user, document)) {
      permitted.push(mapDocument(document, await latestVersion(document.id)));
    }
  }
  res.json({
    success: true,
    data: permitted.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: permitted.length },
  });
}

export async function getDocument(req, res) {
  const document = await findDocument(req.params.id);
  await authorize(
    req.user,
    document,
    isAdministrator(req.user) ? "manage" : "view",
  );
  res.json({
    success: true,
    data: mapDocument(document, await latestVersion(document.id)),
  });
}

export async function uploadDocument(req, res) {
  validateUpload(req.file);
  const metadata = parseMetadata(req.body || {});

  const stored = await savePdf(req.file.buffer).catch((error) => {
    throw new ApiError(400, error.message);
  });
  try {
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({ ...metadata, status: "DRAFT", uploaded_by: req.user.id })
      .select(DOCUMENT_COLUMNS)
      .single();

    if (documentError) throw documentError;

    const { data: version, error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: document.id,
        version_number: 1,
        storage_path: stored.storageKey,
        file_name: req.file.originalname,
        mime_type: "application/pdf",
        file_size_bytes: req.file.buffer.length,
        uploaded_by: req.user.id,
      })
      .select(
        "id, version_number, file_name, mime_type, file_size_bytes, created_at",
      )
      .single();

    if (versionError) throw versionError;

    console.log(document, {
      ...version,
      storage_path: stored.storageKey,
    });

    // return
    await publishDocumentEvent(document, {
      ...version,
      storage_path: stored.storageKey,
    });

    res
      .status(201)
      .json({ success: true, data: mapDocument(document, version) });
  } catch (error) {
    await removePdf(stored.storageKey).catch(() => {});
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Document upload failed");
  }
}

export async function updateDocument(req, res) {
  const document = await findDocument(req.params.id);
  await authorize(req.user, document, "manage");
  const values = parseMetadata(req.body || {}, true);
  if (!Object.keys(values).length)
    throw new ApiError(400, "At least one document field is required");
  const nextScope = values.access_scope ?? document.access_scope;
  const nextTeamId =
    values.team_id !== undefined ? values.team_id : document.team_id;
  if (nextScope === "TEAM_ONLY" && nextTeamId === null) {
    throw new ApiError(400, "TEAM_ONLY documents require a teamId");
  }
  if (nextScope !== "TEAM_ONLY" && nextTeamId !== null) {
    throw new ApiError(400, "Only TEAM_ONLY documents may have a teamId");
  }
  values.updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("documents")
    .update(values)
    .eq("id", document.id)
    .select(DOCUMENT_COLUMNS)
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  const version = await latestVersion(data.id);
  if (version) await publishDocumentEvent(data, version);
  res.json({
    success: true,
    data: mapDocument(data, version),
  });
}

export async function archiveDocument(req, res) {
  const document = await findDocument(req.params.id);
  await authorize(req.user, document, "manage");
  const { data, error } = await supabase
    .from("documents")
    .update({ status: "ARCHIVED", updated_at: new Date().toISOString() })
    .eq("id", document.id)
    .select(DOCUMENT_COLUMNS)
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  const version = await latestVersion(data.id);
  if (version) await publishDocumentEvent(data, version);
  res.json({
    success: true,
    data: mapDocument(data, version),
  });
}

export async function publishDocument(req, res) {
  const document = await findDocument(req.params.id);
  await authorize(req.user, document, "manage");
  if (!(await latestVersion(document.id)))
    throw new ApiError(409, "A document version is required before publishing");
  const { data, error } = await supabase
    .from("documents")
    .update({ status: "PUBLISHED", updated_at: new Date().toISOString() })
    .eq("id", document.id)
    .select(DOCUMENT_COLUMNS)
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  const version = await latestVersion(data.id);
  if (version) await publishDocumentEvent(data, version);
  res.json({
    success: true,
    data: mapDocument(data, version),
  });
}

export async function listVersions(req, res) {
  const document = await findDocument(req.params.id);
  await authorize(req.user, document, "view");
  const { data, error } = await supabase
    .from("document_versions")
    .select(
      "id, version_number, file_name, mime_type, file_size_bytes, uploaded_by, created_at",
    )
    .eq("document_id", document.id)
    .order("version_number", { ascending: false });
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.json({ success: true, data: data || [] });
}

export async function uploadVersion(req, res) {
  const document = await findDocument(req.params.id);
  await authorize(req.user, document, "manage");
  validateUpload(req.file);
  const stored = await savePdf(req.file.buffer).catch((error) => {
    throw new ApiError(400, error.message);
  });
  try {
    const current = await latestVersion(document.id);
    const nextVersion = (current?.version_number || 0) + 1;
    const { data, error } = await supabase
      .from("document_versions")
      .insert({
        document_id: document.id,
        version_number: nextVersion,
        storage_path: stored.storageKey,
        file_name: req.file.originalname,
        mime_type: "application/pdf",
        file_size_bytes: req.file.buffer.length,
        uploaded_by: req.user.id,
      })
      .select(
        "id, version_number, file_name, mime_type, file_size_bytes, created_at",
      )
      .single();
    if (error) throw error;
    const { error: updateError } = await supabase
      .from("documents")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", document.id);
    if (updateError) throw new ApiError(500, "Document metadata update failed");
    await publishDocumentEvent(document, {
      ...data,
      storage_path: stored.storageKey,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    await removePdf(stored.storageKey).catch(() => {});
    if (error?.code === "23505")
      throw new ApiError(
        409,
        "A concurrent version upload occurred; retry the request",
      );
    throw new ApiError(500, "Document version upload failed");
  }
}

export async function downloadDocument(req, res) {
  const document = await findDocument(req.params.id);
  await authorize(req.user, document, "view");
  const version = await latestVersion(document.id);
  if (!version) throw new ApiError(404, "Document version was not found");
  let info;
  try {
    info = await getPdfInfo(version.storage_path);
  } catch {
    throw new ApiError(404, "Document file was not found");
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", info.size);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${version.file_name.replace(/["\r\n]/g, "")}"`,
  );
  streamPdf(info.absolutePath).pipe(res);
}

export async function downloadDocumentForInternal(req, res) {
  const document = await findDocument(req.params.id);

  const version = await latestVersion(document.id);

  if (!version) {
    throw new ApiError(404, "Document version was not found");
  }

  let info;

  try {
    info = await getPdfInfo(version.storage_path);
  } catch {
    throw new ApiError(404, "Document file was not found");
  }

  const safeFileName = version.file_name.replace(/["\r\n]/g, "");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", info.size);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeFileName}"`,
  );

  const stream = streamPdf(info.absolutePath);

  stream.on("error", (error) => {
    console.error("Internal document download failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to stream document",
      });
    } else {
      res.destroy(error);
    }
  });

  stream.pipe(res);
}

export async function listVersionsForInternal(req, res) {
  const document = await findDocument(req.params.id);

  const { data, error } = await supabase
    .from("document_versions")
    .select(
      "id, version_number, file_name, mime_type, file_size_bytes, uploaded_by, created_at",
    )
    .eq("document_id", document.id)
    .order("version_number", { ascending: false });

  if (error) {
    throw new ApiError(500, "An unexpected database error occurred");
  }

  res.json({
    success: true,
    data: data || [],
  });
}
