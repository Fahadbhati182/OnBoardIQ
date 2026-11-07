import supabase from "../config/supabase.js";
import ApiError from "../utils/ApiError.js";

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
    .select("id, name, description")
    .order("name", { ascending: true });
  if (error) throw new ApiError(500, "An unexpected database error occurred");
  res.json({ success: true, data: data || [] });
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
  res.json({ success: true, data });
}
