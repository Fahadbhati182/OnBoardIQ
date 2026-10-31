import supabase from "../config/supabase.js";
import ApiError from "../utils/ApiError.js";

const TASK_COLUMNS =
  "id, title, description, department_id, required, estimated_minutes, is_active, created_at";
const ASSIGNMENT_COLUMNS =
  "id, employee_id, task_id, status, assigned_at, due_date, completed_at";
const TASK_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a valid UUID`);
  }
  return value;
}

function optionalUuid(value, field) {
  if (value === undefined || value === null || value === "") return null;
  return requireUuid(value, field);
}

function parseDate(value, field = "dueDate") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, `${field} must use YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new ApiError(400, `${field} is invalid`);
  }
  return value;
}

function parseTaskInput(body, partial = false) {
  const input = {};
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new ApiError(400, "Title is required");
    }
    input.title = body.title.trim();
  }
  if (!partial || body.description !== undefined) {
    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      throw new ApiError(400, "Description must be a string");
    }
    input.description = body.description?.trim() || null;
  }
  if (!partial || body.departmentId !== undefined) {
    input.department_id = optionalUuid(body.departmentId, "departmentId");
  }
  if (!partial || body.required !== undefined) {
    if (typeof body.required !== "boolean") {
      throw new ApiError(400, "Required must be a boolean");
    }
    input.required = body.required;
  }
  if (!partial || body.estimatedMinutes !== undefined) {
    if (
      !Number.isInteger(body.estimatedMinutes) ||
      body.estimatedMinutes <= 0
    ) {
      throw new ApiError(400, "Estimated minutes must be a positive integer");
    }
    input.estimated_minutes = body.estimatedMinutes;
  }
  return input;
}

function mapTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    departmentId: task.department_id,
    required: task.required,
    estimatedMinutes: task.estimated_minutes,
    isActive: task.is_active,
    createdAt: task.created_at,
    department: task.departments || null,
  };
}

function mapAssignment(row) {
  const task = row.onboarding_tasks;
  return {
    assignmentId: row.id,
    employeeId: row.employee_id,
    taskId: row.task_id,
    title: task?.title,
    description: task?.description,
    required: task?.required,
    estimatedMinutes: task?.estimated_minutes,
    isActive: task?.is_active,
    status: row.status,
    assignedAt: row.assigned_at,
    dueDate: row.due_date,
    completedAt: row.completed_at,
  };
}

function ensureStatus(status) {
  if (status !== undefined && !TASK_STATUSES.includes(status)) {
    throw new ApiError(400, "Invalid task status");
  }
  return status;
}

async function findTask(taskId, includeInactive = true) {
  const query = supabase
    .from("onboarding_tasks")
    .select(`${TASK_COLUMNS}, departments(id, name)`)
    .eq("id", requireUuid(taskId, "taskId"));
  const { data, error } = await (
    includeInactive ? query : query.eq("is_active", true)
  ).maybeSingle();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  if (!data) throw new ApiError(404, "Task was not found");
  return data;
}

function progress(rows) {
  const total = rows.length;
  const completed = rows.filter((row) => row.status === "COMPLETED").length;
  const inProgress = rows.filter((row) => row.status === "IN_PROGRESS").length;
  const notStarted = rows.filter((row) => row.status === "NOT_STARTED").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = rows.filter(
    (row) => row.due_date && row.due_date < today && row.status !== "COMPLETED",
  ).length;
  const requiredRows = rows.filter((row) => row.onboarding_tasks?.required);
  const requiredCompleted = requiredRows.filter(
    (row) => row.status === "COMPLETED",
  ).length;
  return {
    total,
    completed,
    inProgress,
    notStarted,
    overdue,
    requiredCompleted,
    totalRequired: requiredRows.length,
    completionPercentage: total ? Math.round((completed / total) * 100) : 0,
    requiredCompletionPercentage: requiredRows.length
      ? Math.round((requiredCompleted / requiredRows.length) * 100)
      : 0,
  };
}

async function getAssignments(employeeId, status) {
  ensureStatus(status);
  let query = supabase
    .from("employee_tasks")
    .select(`${ASSIGNMENT_COLUMNS}, onboarding_tasks(${TASK_COLUMNS})`)
    .eq("employee_id", employeeId)
    .order("assigned_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  return data || [];
}

export async function getMyTasks(req, res) {
  const rows = await getAssignments(req.user.id, req.query.status);
  res.json({ success: true, data: rows.map(mapAssignment) });
}

export async function getMyProgress(req, res) {
  const rows = await getAssignments(req.user.id);
  res.json({ success: true, data: progress(rows) });
}

export async function getMyTask(req, res) {
  const assignmentId = requireUuid(req.params.assignmentId, "assignmentId");
  const { data, error } = await supabase
    .from("employee_tasks")
    .select(`${ASSIGNMENT_COLUMNS}, onboarding_tasks(${TASK_COLUMNS})`)
    .eq("id", assignmentId)
    .eq("employee_id", req.user.id)
    .maybeSingle();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  if (!data) throw new ApiError(404, "Task assignment was not found");
  res.json({ success: true, data: mapAssignment(data) });
}

async function updateMyTask(req, res, nextStatus) {
  const assignmentId = requireUuid(req.params.assignmentId, "assignmentId");
  const { data: current, error: lookupError } = await supabase
    .from("employee_tasks")
    .select("id, status, completed_at")
    .eq("id", assignmentId)
    .eq("employee_id", req.user.id)
    .maybeSingle();
  if (lookupError)
    throw new ApiError(500, "An unexpected database error occurred");
  if (!current) throw new ApiError(404, "Task assignment was not found");
  if (
    (nextStatus === "IN_PROGRESS" && current.status !== "NOT_STARTED") ||
    (nextStatus === "COMPLETED" &&
      !["IN_PROGRESS", "COMPLETED"].includes(current.status))
  ) {
    throw new ApiError(
      409,
      `Task cannot transition from ${current.status} to ${nextStatus}`,
    );
  }
  if (nextStatus === "COMPLETED" && current.status === "COMPLETED") {
    const { data, error } = await supabase
      .from("employee_tasks")
      .select(`${ASSIGNMENT_COLUMNS}, onboarding_tasks(${TASK_COLUMNS})`)
      .eq("id", assignmentId)
      .eq("employee_id", req.user.id)
      .single();
    if (error) throw new ApiError(500, "An unexpected database error occurred");
    return res.json({ success: true, data: mapAssignment(data) });
  }
  const update = {
    status: nextStatus,
    completed_at: nextStatus === "COMPLETED" ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from("employee_tasks")
    .update(update)
    .eq("id", assignmentId)
    .eq("employee_id", req.user.id)
    .select(`${ASSIGNMENT_COLUMNS}, onboarding_tasks(${TASK_COLUMNS})`)
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.json({ success: true, data: mapAssignment(data) });
}

export const startMyTask = (req, res) => updateMyTask(req, res, "IN_PROGRESS");
export const completeMyTask = (req, res) => updateMyTask(req, res, "COMPLETED");

export async function createTask(req, res) {
  const values = parseTaskInput(req.body || {});
  const { data, error } = await supabase
    .from("onboarding_tasks")
    .insert(values)
    .select(`${TASK_COLUMNS}, departments(id, name)`)
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.status(201).json({ success: true, data: mapTask(data) });
}

export async function listTasks(req, res) {
  let query = supabase
    .from("onboarding_tasks")
    .select(`${TASK_COLUMNS}, departments(id, name)`)
    .order("created_at", { ascending: false });
  if (req.query.departmentId)
    query = query.eq(
      "department_id",
      requireUuid(req.query.departmentId, "departmentId"),
    );
  if (req.query.active !== undefined) {
    if (!["true", "false"].includes(req.query.active))
      throw new ApiError(400, "active must be true or false");
    query = query.eq("is_active", req.query.active === "true");
  }
  const { data, error } = await query;
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.json({ success: true, data: (data || []).map(mapTask) });
}

export async function getTask(req, res) {
  res.json({ success: true, data: mapTask(await findTask(req.params.taskId)) });
}

export async function updateTask(req, res) {
  const taskId = requireUuid(req.params.taskId, "taskId");
  await findTask(taskId);
  const values = parseTaskInput(req.body || {}, true);
  if (!Object.keys(values).length)
    throw new ApiError(400, "At least one task field is required");
  const { data, error } = await supabase
    .from("onboarding_tasks")
    .update(values)
    .eq("id", taskId)
    .select(`${TASK_COLUMNS}, departments(id, name)`)
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.json({ success: true, data: mapTask(data) });
}

export async function deactivateTask(req, res) {
  const taskId = requireUuid(req.params.taskId, "taskId");
  await findTask(taskId);
  const { data, error } = await supabase
    .from("onboarding_tasks")
    .update({ is_active: false })
    .eq("id", taskId)
    .select(`${TASK_COLUMNS}, departments(id, name)`)
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.json({ success: true, data: mapTask(data) });
}

async function verifyEmployee(employeeId) {
  const id = requireUuid(employeeId, "employeeId");
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, role, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  if (!data) throw new ApiError(404, "Employee was not found");
  if (!data.is_active) throw new ApiError(409, "Employee account is inactive");
  if (data.role !== "EMPLOYEE")
    throw new ApiError(400, "The selected user is not an employee");
  return data;
}

async function assign(taskId, employeeId, dueDate) {
  await findTask(taskId, false);
  await verifyEmployee(employeeId);
  const { data, error } = await supabase
    .from("employee_tasks")
    .insert({
      task_id: taskId,
      employee_id: employeeId,
      due_date: parseDate(dueDate),
    })
    .select(`${ASSIGNMENT_COLUMNS}, onboarding_tasks(${TASK_COLUMNS})`)
    .single();
  if (error?.code === "23505")
    throw new ApiError(409, "This task is already assigned to the employee");
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  return mapAssignment(data);
}

export async function assignTask(req, res) {
  const assignment = await assign(
    requireUuid(req.params.taskId, "taskId"),
    req.body?.employeeId,
    req.body?.dueDate,
  );
  res.status(201).json({ success: true, data: assignment });
}

export async function assignTaskBulk(req, res) {
  const taskId = requireUuid(req.params.taskId, "taskId");
  await findTask(taskId, false);
  const employeeIds = req.body?.employeeIds;
  if (!Array.isArray(employeeIds) || !employeeIds.length) {
    throw new ApiError(400, "employeeIds must be a non-empty array");
  }
  const uniqueIds = [...new Set(employeeIds)];
  const dueDate = parseDate(req.body?.dueDate);
  const results = await Promise.allSettled(
    uniqueIds.map((id) => assign(taskId, id, dueDate)),
  );
  const assigned = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const failed = results
    .map((result, index) => ({ result, employeeId: uniqueIds[index] }))
    .filter(({ result }) => result.status === "rejected")
    .map(({ result, employeeId }) => ({
      employeeId,
      message: result.reason.message,
    }));
  res.status(assigned.length ? 201 : 409).json({
    success: failed.length === 0,
    data: { assigned, failed },
  });
}

export async function getEmployeeTasks(req, res) {
  const employee = await verifyEmployee(req.params.employeeId);
  const rows = await getAssignments(employee.id, req.query.status);
  res.json({ success: true, data: rows.map(mapAssignment) });
}

export async function getEmployeeProgress(req, res) {
  const employee = await verifyEmployee(req.params.employeeId);
  const rows = await getAssignments(employee.id);
  res.json({ success: true, data: progress(rows) });
}
