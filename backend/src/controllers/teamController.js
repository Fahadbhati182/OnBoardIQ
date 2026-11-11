import supabase from "../config/supabase.js";
import ApiError from "../utils/ApiError.js";
import {
  EMPLOYEE_LIST_CACHE_NAMESPACE,
  invalidateCacheGeneration,
} from "../utils/cache.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuid(value, field) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a valid UUID`);
  }
  return value;
}

async function findTeam(teamId) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, description")
    .eq("id", uuid(teamId, "teamId"))
    .maybeSingle();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  if (!data) throw new ApiError(404, "Team was not found");
  return data;
}

export async function listTeams(_req, res) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, description, created_at, updated_at")
    .order("name", { ascending: true });
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.json({ success: true, data: data || [] });
}

function parseTeamInput(body, partial = false) {
  const input = {};
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      throw new ApiError(400, "Team name is required");
    }
    const name = body.name.trim();
    if (name.length > 100) {
      throw new ApiError(400, "Team name must be 100 characters or fewer");
    }
    input.name = name;
  }
  if (!partial || body.description !== undefined) {
    if (
      body.description !== undefined &&
      body.description !== null &&
      typeof body.description !== "string"
    ) {
      throw new ApiError(400, "Team description must be a string");
    }
    const description = body.description?.trim() || null;
    if (description && description.length > 10000) {
      throw new ApiError(400, "Team description is too long");
    }
    input.description = description;
  }
  if (partial && Object.keys(input).length === 0) {
    throw new ApiError(400, "Provide a team name or description to update");
  }
  return input;
}

function handleTeamWriteError(error) {
  if (error.code === "23505") {
    throw new ApiError(409, "A team with this name already exists");
  }
  if (error.code === "23503") {
    throw new ApiError(409, "Team is still referenced by other records");
  }
  throw new ApiError(500, "An unexpected database error occurred");
}

export async function createTeam(req, res) {
  const input = parseTeamInput(req.body ?? {});
  const { data, error } = await supabase
    .from("teams")
    .insert(input)
    .select("id, name, description, created_at, updated_at")
    .single();
  if (error) handleTeamWriteError(error);
  res.status(201).json({ success: true, data });
}

export async function updateTeam(req, res) {
  const teamId = uuid(req.params.teamId, "teamId");
  const input = parseTeamInput(req.body ?? {}, true);
  const { data, error } = await supabase
    .from("teams")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", teamId)
    .select("id, name, description, created_at, updated_at")
    .maybeSingle();
  if (error) handleTeamWriteError(error);
  if (!data) throw new ApiError(404, "Team was not found");
  res.json({ success: true, data });
}

export async function deleteTeam(req, res) {
  const teamId = uuid(req.params.teamId, "teamId");
  const { data, error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .select("id")
    .maybeSingle();
  if (error) handleTeamWriteError(error);
  if (!data) throw new ApiError(404, "Team was not found");
  res.json({ success: true, data: { id: data.id } });
}

export async function assignEngineerToTeam(req, res) {
  const employeeId = uuid(req.params.employeeId, "employeeId");
  const teamId = uuid(req.body?.teamId, "teamId");
  await findTeam(teamId);

  const { data: employee, error: employeeError } = await supabase
    .from("users")
    .select("id, name, email, role, team_id, is_active")
    .eq("id", employeeId)
    .maybeSingle();
  if (employeeError)
    throw new ApiError(500, "An unexpected database error occurred");
  if (!employee) throw new ApiError(404, "Employee was not found");
  if (employee.role !== "ENGINEER")
    throw new ApiError(400, "Only engineers can be assigned to teams");
  if (!employee.is_active)
    throw new ApiError(409, "Employee account is inactive");

  const { data, error } = await supabase
    .from("users")
    .update({ team_id: teamId, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("role", "ENGINEER")
    .select("id, name, email, role, team_id, is_active")
    .single();
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  await invalidateCacheGeneration(EMPLOYEE_LIST_CACHE_NAMESPACE);
  res.json({ success: true, data });
}
