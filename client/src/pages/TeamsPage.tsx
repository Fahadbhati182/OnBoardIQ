import React, { useEffect, useMemo, useState } from "react";
import { Building2, Edit2, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { Team, TeamInput, teamApi } from "../services/teamApi";
import { useApp } from "../context/AppContext";

const emptyForm: TeamInput = { name: "", description: "" };

export const TeamsPage: React.FC = () => {
  const { addToast } = useApp();
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTeams = () => {
    setLoading(true);
    teamApi.list()
      .then(setTeams)
      .catch((error: unknown) =>
        addToast(error instanceof Error ? error.message : "Unable to load teams", "error"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) =>
      `${team.name} ${team.description || ""}`.toLowerCase().includes(query),
    );
  }, [search, teams]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditing(team);
    setForm({ name: team.name, description: team.description || "" });
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const input = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
      };
      const saved = editing
        ? await teamApi.update(editing.id, input)
        : await teamApi.create(input);
      setTeams((current) =>
        editing
          ? current.map((team) => (team.id === saved.id ? saved : team))
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      addToast(editing ? "Team updated successfully" : "Team created successfully", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to save team", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeTeam = async (team: Team) => {
    if (!window.confirm(`Delete the "${team.name}" team?`)) return;
    setDeletingId(team.id);
    try {
      await teamApi.delete(team.id);
      setTeams((current) => current.filter((item) => item.id !== team.id));
      addToast("Team deleted successfully", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to delete team", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container teams-page">
      <div className="employee-breadcrumb">Admin <span>/</span> Teams</div>
      <div className="employee-page-header">
        <div>
          <h1>Teams</h1>
          <p>Create and manage teams across your organization.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add team
        </button>
      </div>

      {formOpen && (
        <section className="employee-assignment-panel employee-create-panel">
          <div className="employee-panel-heading">
            <div>
              <strong>{editing ? "Update team" : "Create a team"}</strong>
              <span>Team details are used when assigning employees and documents.</span>
            </div>
            <button type="button" aria-label="Close team form" onClick={() => setFormOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <form className="task-create-form" onSubmit={(event) => void submit(event)}>
            <label className="task-create-field">
              <span>Team name <b>*</b></span>
              <input
                required
                maxLength={100}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                autoFocus
              />
            </label>
            <label className="task-create-field">
              <span>Description</span>
              <textarea
                rows={3}
                maxLength={10000}
                value={form.description || ""}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
            <div className="task-create-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving || !form.name.trim()}>
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? "Saving..." : editing ? "Save changes" : "Create team"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="employee-table-card teams-table-card">
        <div className="employee-table-heading">
          <div className="employee-section-title">
            <div><Building2 size={19} /></div>
            <span>
              <strong>All teams</strong>
              <small>{teams.length} {teams.length === 1 ? "team" : "teams"}</small>
            </span>
          </div>
          <label className="employee-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teams..."
              aria-label="Search teams"
            />
          </label>
        </div>
        <div className="teams-table-scroll">
          <table className="teams-table">
            <thead>
              <tr><th>Team</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="teams-empty"><Loader2 size={18} className="animate-spin" /> Loading teams...</td></tr>
              ) : filteredTeams.length === 0 ? (
                <tr><td colSpan={3} className="teams-empty">{search ? "No teams match your search." : "No teams have been created yet."}</td></tr>
              ) : filteredTeams.map((team) => (
                <tr key={team.id}>
                  <td><strong>{team.name}</strong></td>
                  <td>{team.description || <span className="teams-muted">No description</span>}</td>
                  <td>
                    <div className="teams-actions">
                      <button type="button" className="teams-icon-button" onClick={() => openEdit(team)} aria-label={`Edit ${team.name}`}>
                        <Edit2 size={15} /> <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="teams-icon-button danger"
                        onClick={() => void removeTeam(team)}
                        disabled={deletingId === team.id}
                        aria-label={`Delete ${team.name}`}
                      >
                        {deletingId === team.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        <span>{deletingId === team.id ? "Deleting..." : "Delete"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
