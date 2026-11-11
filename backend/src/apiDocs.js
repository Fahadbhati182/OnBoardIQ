const jsonObject = {
  type: "object",
  additionalProperties: true,
};

const jsonBody = (schema = jsonObject, required = true) => ({
  required,
  content: {
    "application/json": { schema },
  },
});

const objectSchema = (properties, required = []) => ({
  type: "object",
  properties,
  required,
});

const stringSchema = { type: "string" };
const uuidSchema = { type: "string", format: "uuid" };
const idParameter = (name, description = `${name} identifier`) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: stringSchema,
});

const queryParameter = (name, description, schema = stringSchema) => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
});

function operation({
  summary,
  tag,
  role,
  security = "bearerAuth",
  parameters = [],
  body,
  success = 200,
  successResponse,
  description,
}) {
  const responses = {
    [success]:
      successResponse ??
      {
        description:
          success === 204
            ? "Operation completed; no response body."
            : "Success.",
        ...(success === 204
          ? {}
          : {
              content: {
                "application/json": {
                  schema: jsonObject,
                },
              },
            }),
      },
    400: { description: "Invalid request." },
    401: { description: "Authentication required or credentials are invalid." },
    403: { description: "The authenticated user does not have permission." },
    404: { description: "The requested resource was not found." },
    409: { description: "The request conflicts with the current resource state." },
    413: { description: "The uploaded file exceeds the configured size limit." },
    500: { description: "Unexpected server error." },
    502: { description: "A dependent service could not complete the request." },
    503: { description: "The service is temporarily unavailable." },
  };

  if (success !== 204) delete responses[204];

  return {
    summary,
    description: [role ? `Required role: ${role}.` : null, description]
      .filter(Boolean)
      .join(" "),
    tags: [tag],
    ...(security ? { security: [{ [security]: [] }] } : { security: [] }),
    ...(parameters.length ? { parameters } : {}),
    ...(body ? { requestBody: body } : {}),
    responses,
  };
}

const body = (properties, required = []) =>
  jsonBody(objectSchema(properties, required));
const route = (method, options) => ({ [method]: operation(options) });
const employeeId = idParameter("employeeId");
const taskId = idParameter("taskId");
const assignmentId = idParameter("assignmentId");
const documentId = idParameter("id");
const sessionId = idParameter("sessionId");
const teamId = idParameter("teamId");

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "OnboardIQ API",
    version: "1.0.0",
    description:
      "Interactive documentation for the Node.js backend. The separate FastAPI AI service has its own Swagger UI at http://localhost:8000/docs (including /api/chat and /api/health).",
  },
  servers: [{ url: "/", description: "Current backend origin" }],
  tags: [
    { name: "System" },
    { name: "Authentication" },
    { name: "Employees" },
    { name: "Tasks" },
    { name: "Documents" },
    { name: "Chat" },
    { name: "Teams" },
  ],
  paths: {
    "/": {
      get: operation({
        summary: "Check backend status",
        tag: "System",
        security: null,
      }),
    },
    "/api/auth/login": {
      post: operation({
        summary: "Sign in",
        tag: "Authentication",
        security: null,
        body: body(
          {
            email: stringSchema,
            password: { type: "string", format: "password" },
          },
          ["email", "password"],
        ),
        description:
          "Returns an access token and sets the HTTP-only refresh-token cookie.",
      }),
    },
    "/api/auth/refresh": {
      post: operation({
        summary: "Refresh access token",
        tag: "Authentication",
        security: null,
        description: "Uses the HTTP-only refresh-token cookie.",
      }),
    },
    "/api/auth/logout": {
      post: operation({
        summary: "Sign out",
        tag: "Authentication",
        security: null,
        description: "Revokes the refresh session and clears its cookie.",
      }),
    },
    "/api/auth/password-setup": {
      post: operation({
        summary: "Set a password using a one-time email link",
        tag: "Authentication",
        security: null,
        body: body(
          {
            token: {
              type: "string",
              description: "One-time token from the employee invitation email.",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              maxLength: 72,
            },
          },
          ["token", "password"],
        ),
        description:
          "The invitation expires after one hour and can only be used once.",
      }),
    },
    "/api/auth/me": {
      get: operation({
        summary: "Get the current user",
        tag: "Authentication",
      }),
      patch: operation({
        summary: "Update the current user profile",
        tag: "Authentication",
        body: jsonBody(jsonObject),
      }),
    },
    "/api/auth/employees": {
      post: operation({
        summary: "Create an employee account",
        tag: "Employees",
        role: "ENGINEERING_ADMIN",
        success: 201,
        body: body(
          {
            name: stringSchema,
            email: { type: "string", format: "email" },
            departmentId: uuidSchema,
            teamId: uuidSchema,
            joiningDate: { type: "string", format: "date" },
            jobTitle: stringSchema,
            isActive: { type: "boolean", default: true },
          },
          ["name", "email"],
        ),
        description:
          "Creates the employee with a random inaccessible initial password and emails profile information with a one-time setup link. Passwords are never emailed.",
      }),
      get: operation({
        summary: "List employee accounts",
        tag: "Employees",
        role: "ENGINEERING_ADMIN",
      }),
    },
    "/api/auth/employees/{employeeId}/password-setup": {
      post: operation({
        summary: "Resend an employee password setup invitation",
        tag: "Employees",
        role: "ENGINEERING_ADMIN",
        parameters: [employeeId],
      }),
    },
    "/api/auth/departments": {
      get: operation({
        summary: "List departments",
        tag: "Employees",
        role: "ENGINEERING_ADMIN",
      }),
    },
    "/api/auth/teams": {
      get: operation({
        summary: "List teams",
        tag: "Teams",
        role: "ENGINEER or ENGINEERING_ADMIN",
      }),
    },
    "/api/auth/employees/{employeeId}/team": {
      patch: operation({
        summary: "Assign an employee to a team",
        tag: "Employees",
        role: "ENGINEERING_ADMIN",
        parameters: [employeeId],
        body: body({ teamId: { ...uuidSchema, nullable: false } }, ["teamId"]),
      }),
    },
    "/api/tasks/my-tasks": {
      get: operation({
        summary: "List the current engineer's task assignments",
        tag: "Tasks",
        role: "ENGINEER",
        parameters: [
          queryParameter("status", "Filter by task status.", {
            type: "string",
            enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
          }),
        ],
      }),
    },
    "/api/tasks/my-tasks/{assignmentId}": {
      get: operation({
        summary: "Get one of the current engineer's task assignments",
        tag: "Tasks",
        role: "ENGINEER",
        parameters: [assignmentId],
      }),
    },
    "/api/tasks/my-tasks/{assignmentId}/start": {
      patch: operation({
        summary: "Start a task assignment",
        tag: "Tasks",
        role: "ENGINEER",
        parameters: [assignmentId],
      }),
    },
    "/api/tasks/my-tasks/{assignmentId}/complete": {
      patch: operation({
        summary: "Complete a task assignment",
        tag: "Tasks",
        role: "ENGINEER",
        parameters: [assignmentId],
      }),
    },
    "/api/tasks/my-progress": {
      get: operation({
        summary: "Get the current engineer's onboarding progress",
        tag: "Tasks",
        role: "ENGINEER",
      }),
    },
    "/api/tasks": {
      post: operation({
        summary: "Create an onboarding task",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        success: 201,
        body: body(
          {
            title: stringSchema,
            description: stringSchema,
            departmentId: { ...uuidSchema, nullable: true },
            required: { type: "boolean" },
            estimatedMinutes: { type: "integer", minimum: 1 },
          },
          ["title", "required", "estimatedMinutes"],
        ),
      }),
      get: operation({
        summary: "List onboarding tasks",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [
          queryParameter("departmentId", "Filter by department.", uuidSchema),
          queryParameter("active", "Filter by active status.", {
            type: "string",
            enum: ["true", "false"],
          }),
        ],
      }),
    },
    "/api/tasks/admin/dashboard-summary": {
      get: operation({
        summary: "Get the admin dashboard summary",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
      }),
    },
    "/api/tasks/admin/employees/{employeeId}/available-tasks": {
      get: operation({
        summary: "List tasks available to an employee",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [employeeId],
      }),
    },
    "/api/tasks/admin/employees/{employeeId}/tasks": {
      get: operation({
        summary: "List an employee's task assignments",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [employeeId],
      }),
    },
    "/api/tasks/admin/employees/{employeeId}/progress": {
      get: operation({
        summary: "Get an employee's onboarding progress",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [employeeId],
      }),
    },
    "/api/tasks/{taskId}": {
      get: operation({
        summary: "Get an onboarding task",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [taskId],
      }),
      put: operation({
        summary: "Replace an onboarding task",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [taskId],
        body: body(
          {
            title: stringSchema,
            description: stringSchema,
            departmentId: { ...uuidSchema, nullable: true },
            required: { type: "boolean" },
            estimatedMinutes: { type: "integer", minimum: 1 },
          },
          ["title", "required", "estimatedMinutes"],
        ),
      }),
    },
    "/api/tasks/{taskId}/deactivate": {
      patch: operation({
        summary: "Deactivate an onboarding task",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [taskId],
      }),
    },
    "/api/tasks/{taskId}/assign": {
      post: operation({
        summary: "Assign a task to an employee",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [taskId],
        body: jsonBody(jsonObject),
      }),
    },
    "/api/tasks/{taskId}/assign-bulk": {
      post: operation({
        summary: "Assign a task to multiple employees",
        tag: "Tasks",
        role: "ENGINEERING_ADMIN",
        parameters: [taskId],
        body: jsonBody(jsonObject),
      }),
    },
    "/api/documents": {
      get: operation({
        summary: "List documents visible to the current user",
        tag: "Documents",
        parameters: [
          queryParameter("search", "Search document titles."),
          queryParameter("documentType", "Filter by document type."),
          queryParameter("status", "Admin-only status filter."),
          queryParameter("page", "Page number.", {
            type: "integer",
            minimum: 1,
          }),
          queryParameter("limit", "Results per page (maximum 100).", {
            type: "integer",
            minimum: 1,
            maximum: 100,
          }),
        ],
      }),
      post: operation({
        summary: "Upload a PDF document",
        tag: "Documents",
        role: "ENGINEERING_ADMIN",
        success: 201,
        body: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
                required: ["file"],
                additionalProperties: true,
              },
            },
          },
        },
      }),
    },
    "/api/documents/employee": {
      get: operation({
        summary: "List published documents available to engineers",
        tag: "Documents",
        role: "ENGINEER",
        parameters: [
          queryParameter("search", "Search document titles."),
          queryParameter("documentType", "Filter by document type."),
          queryParameter("page", "Page number.", {
            type: "integer",
            minimum: 1,
          }),
          queryParameter("limit", "Results per page (maximum 100).", {
            type: "integer",
            minimum: 1,
            maximum: 100,
          }),
        ],
      }),
    },
    "/api/documents/{id}": {
      get: operation({
        summary: "Get a document",
        tag: "Documents",
        parameters: [documentId],
      }),
      patch: operation({
        summary: "Update document metadata",
        tag: "Documents",
        role: "ENGINEERING_ADMIN",
        parameters: [documentId],
        body: jsonBody(jsonObject),
      }),
    },
    "/api/documents/{id}/download": {
      get: operation({
        summary: "Download the latest document version",
        tag: "Documents",
        parameters: [documentId],
        successResponse: {
          description: "PDF file.",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      }),
    },
    "/api/documents/{id}/versions": {
      get: operation({
        summary: "List document versions",
        tag: "Documents",
        parameters: [documentId],
      }),
      post: operation({
        summary: "Upload a new document version",
        tag: "Documents",
        role: "ENGINEERING_ADMIN",
        success: 201,
        parameters: [documentId],
        body: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                },
                required: ["file"],
                additionalProperties: true,
              },
            },
          },
        },
      }),
    },
    "/api/documents/{id}/archive": {
      patch: operation({
        summary: "Archive a document",
        tag: "Documents",
        role: "ENGINEERING_ADMIN",
        parameters: [documentId],
      }),
    },
    "/api/documents/{id}/publish": {
      patch: operation({
        summary: "Publish a document",
        tag: "Documents",
        role: "ENGINEERING_ADMIN",
        parameters: [documentId],
      }),
    },
    "/api/documents/internal/{id}/download": {
      get: operation({
        summary: "Download a document for an internal service",
        tag: "Documents",
        security: "serviceBearerAuth",
        parameters: [documentId],
      }),
    },
    "/api/documents/internal/{id}/versions": {
      get: operation({
        summary: "List document versions for an internal service",
        tag: "Documents",
        security: "serviceBearerAuth",
        parameters: [documentId],
      }),
    },
    "/api/chat/sessions": {
      post: operation({
        summary: "Create a chat session",
        tag: "Chat",
        success: 201,
      }),
      get: operation({
        summary: "List the current user's chat sessions",
        tag: "Chat",
      }),
    },
    "/api/chat/sessions/{sessionId}/messages": {
      get: operation({
        summary: "List messages in a chat session",
        tag: "Chat",
        parameters: [sessionId],
      }),
      post: operation({
        summary: "Send a message to the AI assistant",
        tag: "Chat",
        success: 201,
        parameters: [sessionId],
        body: body(
          { message: { type: "string", minLength: 1, maxLength: 10000 } },
          ["message"],
        ),
      }),
    },
    "/api/chat/sessions/{sessionId}": {
      patch: operation({
        summary: "Rename a chat session",
        tag: "Chat",
        parameters: [sessionId],
        body: body(
          { title: { type: "string", minLength: 1, maxLength: 255 } },
          ["title"],
        ),
      }),
      delete: operation({
        summary: "Delete a chat session",
        tag: "Chat",
        parameters: [sessionId],
        success: 204,
      }),
    },
    "/api/teams": {
      get: operation({
        summary: "List teams",
        tag: "Teams",
        role: "ENGINEERING_ADMIN",
      }),
      post: operation({
        summary: "Create a team",
        tag: "Teams",
        role: "ENGINEERING_ADMIN",
        success: 201,
        body: body(
          {
            name: { type: "string", maxLength: 100 },
            description: { type: "string", nullable: true },
          },
          ["name"],
        ),
      }),
    },
    "/api/teams/{teamId}": {
      patch: operation({
        summary: "Update a team",
        tag: "Teams",
        role: "ENGINEERING_ADMIN",
        parameters: [teamId],
        body: jsonBody(jsonObject),
      }),
      delete: operation({
        summary: "Delete a team",
        tag: "Teams",
        role: "ENGINEERING_ADMIN",
        parameters: [teamId],
      }),
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token returned by POST /api/auth/login.",
      },
      serviceBearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "Internal ONBOARDIQ_SERVICE_TOKEN.",
      },
    },
  },
};

export default openApiSpec;
