import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Building2, Check, CheckSquare, Clock3, FileText, FolderOpen,
  Lightbulb, Loader2, Tag, UsersRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authApi, DepartmentSummary } from '../services/authApi';
import { taskApi, TaskDefinitionInput } from '../services/taskApi';

const initialForm: TaskDefinitionInput & { departmentId: string } = {
  title: '',
  description: '',
  departmentId: '',
  required: true,
  estimatedMinutes: 15,
};

const tips = [
  { icon: <UsersRound size={19} />, title: 'Be clear and specific', text: 'Use a concise title and description so employees know exactly what to do.' },
  { icon: <Clock3 size={19} />, title: 'Set a realistic duration', text: 'Estimate the time needed to complete the task.' },
  { icon: <Building2 size={19} />, title: 'Assign to the right department', text: 'Choose the relevant department or keep it for all employees.' },
  { icon: <Tag size={19} />, title: 'Mark as required if important', text: 'Required tasks will be included in the employee’s onboarding progress.' },
  { icon: <FolderOpen size={19} />, title: 'Add helpful resources', text: 'You can later attach documents or links to guide the employee.' },
];

export const TaskCreatePage: React.FC = () => {
  const { addToast, setCurrentPage } = useApp();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departments, setDepartments] = useState<DepartmentSummary[]>([]);

  useEffect(() => {
    authApi.departments()
      .then(setDepartments)
      .catch((error: unknown) => addToast(error instanceof Error ? error.message : 'Unable to load departments', 'error'))
      .finally(() => setLoadingDepartments(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await taskApi.createDefinition({
        ...form,
        departmentId: form.departmentId || null,
      });
      addToast('Task definition created', 'success');
      setCurrentPage('task-admin');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container task-create-page">
      <div className="task-create-breadcrumb">HR Admin <span>/</span> Onboarding tasks <span>/</span> <b>Create task</b></div>
      <button type="button" className="task-create-back" onClick={() => setCurrentPage('task-admin')}>
        <ArrowLeft size={16} /> Back to onboarding tasks
      </button>

      <div className="task-create-heading">
        <div className="task-create-heading-icon"><CheckSquare size={28} /></div>
        <div><h1>Create onboarding task</h1><p>Add an onboarding task that can be assigned to employees.</p></div>
      </div>

      <div className="task-create-layout">
        <form onSubmit={(event) => void submit(event)} className="task-create-form">
          <label className="task-create-field task-create-full">
            <span><FileText size={14} /> Task title <b>*</b></span>
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Complete security training" />
          </label>

          <label className="task-create-field task-create-full">
            <span><FileText size={14} /> Description <b>*</b></span>
            <textarea required maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Explain what the employee needs to complete, any important instructions, and links if relevant..." />
            <em>{form.description?.length || 0}/500</em>
          </label>

          <label className="task-create-field">
            <span><UsersRound size={14} /> Department <b>*</b></span>
            <div className="task-create-select-wrap">
              <Building2 size={16} />
              <select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })} disabled={loadingDepartments}>
                <option value="">{loadingDepartments ? 'Loading departments...' : 'All departments'}</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </div>
            <small>
              {departments.find((department) => department.id === form.departmentId)?.description
                || 'Select the department this task is for.'}
            </small>
          </label>

          <label className="task-create-field">
            <span><Clock3 size={14} /> Estimated duration (minutes) <b>*</b></span>
            <div className="task-create-input-icon"><Clock3 size={16} /><input type="number" min="1" required value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} /></div>
            <small>Approximate time required to complete this task.</small>
          </label>

          <label className="task-create-field">
            <span><Tag size={14} /> Task category <i>(optional)</i></span>
            <div className="task-create-select-wrap"><Tag size={16} /><select disabled><option>Select a category</option></select></div>
            <small>Helps in organizing and filtering tasks.</small>
          </label>

          <label className="task-create-required">
            <input type="checkbox" checked={form.required} onChange={(event) => setForm({ ...form, required: event.target.checked })} />
            <span className="task-create-check"><Check size={14} /></span>
            <span><strong>Required task</strong><small>Mark this task as mandatory for the employee.</small></span>
          </label>

          <div className="task-create-actions">
            <button type="button" className="btn-secondary" onClick={() => setCurrentPage('task-admin')} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? <Loader2 size={16} className="animate-spin" /> : <span className="text-lg">+</span>}{submitting ? 'Creating task...' : 'Create task'}</button>
          </div>
        </form>

        <aside className="task-create-tips">
          <div className="task-tips-heading"><div><Lightbulb size={20} /></div><span><strong>Before you publish</strong><small>Keep these points in mind to create effective onboarding tasks.</small></span></div>
          <div className="task-tips-list">{tips.map((tip) => <div className="task-tip" key={tip.title}><div>{tip.icon}</div><span><strong>{tip.title}</strong><small>{tip.text}</small></span></div>)}</div>
        </aside>
      </div>
    </div>
  );
};
