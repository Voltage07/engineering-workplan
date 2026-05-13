'use client'
// ==========================================================
// src/app/admin/page.tsx  —  COMPLETE VERSION
// ==========================================================
// Full CRUD: Create, Read (list), Update (edit modal), Delete
// Three tabs: Projects | Work Plans | Tasks
// ==========================================================

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createProject, updateProject, deleteProject } from '@/lib/actions/projects'
import { createWorkPlan, updateWorkPlan, deleteWorkPlan } from '@/lib/actions/workplans'
import { createTask, updateTask, deleteTask, updateTaskStatus } from '@/lib/actions/tasks'
import Modal from '@/components/ui/Modal'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import type { Project, TaskStatus } from '@/types'

type Tab = 'projects' | 'workplans' | 'tasks'

const inp = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white"
const lbl = "block text-xs font-medium text-gray-600 mb-1"

// ── Toast notification ────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success'
        ? <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        : <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      }
      {msg}
    </div>
  )
}

// ── Icon buttons ──────────────────────────────────────────
const EditBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} title="Edit"
    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  </button>
)

const DelBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} title="Delete"
    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>
)

// ── Modal action buttons ───────────────────────────────────
const ModalActions = ({ onCancel, saving, label = 'Save changes' }: { onCancel: () => void; saving: boolean; label?: string }) => (
  <div className="flex gap-3 pt-3 border-t border-gray-100 mt-4">
    <button type="button" onClick={onCancel}
      className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
      Cancel
    </button>
    <button disabled={saving}
      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
      {saving ? 'Saving...' : label}
    </button>
  </div>
)

// ════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [tab, setTab]             = useState<Tab>('projects')
  const [projects, setProjects]   = useState<Project[]>([])
  const [workplans, setWorkplans] = useState<any[]>([])
  const [tasks, setTasks]         = useState<any[]>([])
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Edit modal state
  const [editProject,  setEditProject]  = useState<Project | null>(null)
  const [editWorkplan, setEditWorkplan] = useState<any | null>(null)
  const [editTask,     setEditTask]     = useState<any | null>(null)

  // Create form defaults
  const emptyP = { name: '', location: '', budget: '', status: 'pending', start_date: '', end_date: '' }
  const emptyW = { project_id: '', activity: '', road: '', start_date: '', end_date: '' }
  const emptyT = { project_id: '', workplan_id: '', worker_name: '', task: '', supervisor: '', status: 'pending', priority: 'normal', due_date: '' }

  const [pForm, setPForm] = useState(emptyP)
  const [wForm, setWForm] = useState(emptyW)
  const [tForm, setTForm] = useState(emptyT)

  // ── Data loader ───────────────────────────────────────────
  const load = useCallback(async () => {
    const sb = createClient()
    const [{ data: p }, { data: w }, { data: t }] = await Promise.all([
      sb.from('projects').select('*').order('created_at', { ascending: false }),
      sb.from('workplans').select('*, project:projects(id,name)').order('created_at', { ascending: false }),
      sb.from('tasks').select('*, project:projects(id,name)').order('created_at', { ascending: false }),
    ])
    setProjects(p ?? [])
    setWorkplans(w ?? [])
    setTasks(t ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  // ── Helpers ───────────────────────────────────────────────
  const flash = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const run = async (fn: () => Promise<{ error?: string; success?: boolean }>) => {
    setSaving(true)
    const r = await fn()
    setSaving(false)
    if (r.error) { flash(r.error, 'error'); return false }
    await load()
    return true
  }

  // ══════════════════════════════════════════════════════════
  // PROJECT HANDLERS
  // ══════════════════════════════════════════════════════════
  const onCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await run(() => createProject({
      name: pForm.name, location: pForm.location,
      budget: parseFloat(pForm.budget) || 0,
      status: pForm.status as any,
      start_date: pForm.start_date || null,
      end_date: pForm.end_date || null,
    }))
    if (ok) { flash('Project created!'); setPForm(emptyP) }
  }

  const onUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProject) return
    const ok = await run(() => updateProject(editProject.id, {
      name: editProject.name, location: editProject.location,
      budget: Number(editProject.budget), status: editProject.status,
      start_date: editProject.start_date, end_date: editProject.end_date,
    }))
    if (ok) { flash('Project updated!'); setEditProject(null) }
  }

  const onDeleteProject = async (id: string) => {
    if (!confirm('Delete this project AND all its work plans and tasks?\nThis cannot be undone.')) return
    const ok = await run(() => deleteProject(id))
    if (ok) flash('Project deleted')
  }

  // ══════════════════════════════════════════════════════════
  // WORKPLAN HANDLERS
  // ══════════════════════════════════════════════════════════
  const onCreateWorkplan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wForm.project_id) return flash('Select a project first', 'error')
    const ok = await run(() => createWorkPlan({
      project_id: wForm.project_id, activity: wForm.activity, road: wForm.road,
      start_date: wForm.start_date || null, end_date: wForm.end_date || null,
    }))
    if (ok) { flash('Work plan created!'); setWForm(emptyW) }
  }

  const onUpdateWorkplan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editWorkplan) return
    const ok = await run(() => updateWorkPlan(editWorkplan.id, {
      project_id: editWorkplan.project_id, activity: editWorkplan.activity,
      road: editWorkplan.road,
      start_date: editWorkplan.start_date || null,
      end_date: editWorkplan.end_date || null,
    }))
    if (ok) { flash('Work plan updated!'); setEditWorkplan(null) }
  }

  const onDeleteWorkplan = async (id: string) => {
    if (!confirm('Delete this work plan and all its tasks?')) return
    const ok = await run(() => deleteWorkPlan(id))
    if (ok) flash('Work plan deleted')
  }

  // ══════════════════════════════════════════════════════════
  // TASK HANDLERS
  // ══════════════════════════════════════════════════════════
  const onCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await run(() => createTask({
      project_id: tForm.project_id || null,
      workplan_id: tForm.workplan_id || null,
      worker_name: tForm.worker_name, task: tForm.task,
      supervisor: tForm.supervisor,
      status: tForm.status as any, priority: tForm.priority as any,
      due_date: tForm.due_date || null,
    }))
    if (ok) { flash('Task assigned!'); setTForm(emptyT) }
  }

  const onUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTask) return
    const ok = await run(() => updateTask(editTask.id, {
      project_id: editTask.project_id || null,
      workplan_id: editTask.workplan_id || null,
      worker_name: editTask.worker_name, task: editTask.task,
      supervisor: editTask.supervisor, status: editTask.status,
      priority: editTask.priority, due_date: editTask.due_date || null,
    }))
    if (ok) { flash('Task updated!'); setEditTask(null) }
  }

  const onDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    const ok = await run(() => deleteTask(id))
    if (ok) flash('Task deleted')
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'projects', label: `Projects (${projects.length})` },
    { key: 'workplans', label: `Work Plans (${workplans.length})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
  ]

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create, edit and manage all records</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════ PROJECTS ═══════════ */}
      {tab === 'projects' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Create form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">New Project</h2>
            <form onSubmit={onCreateProject} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Project name *</label>
                  <input required className={inp} value={pForm.name} placeholder="e.g. Diobu Road Reconstruction"
                    onChange={e => setPForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Location *</label>
                  <input required className={inp} value={pForm.location} placeholder="e.g. Port Harcourt, Rivers State"
                    onChange={e => setPForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Budget (₦) *</label>
                  <input required type="number" min="0" className={inp} value={pForm.budget} placeholder="0.00"
                    onChange={e => setPForm(p => ({ ...p, budget: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select className={inp} value={pForm.status} onChange={e => setPForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Start date</label>
                  <input type="date" className={inp} value={pForm.start_date}
                    onChange={e => setPForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>End date</label>
                  <input type="date" className={inp} value={pForm.end_date}
                    onChange={e => setPForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <button disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors mt-1">
                {saving ? 'Saving...' : 'Create project'}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">All Projects</h2>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50" style={{ maxHeight: 480 }}>
              {projects.length === 0
                ? <p className="text-sm text-gray-400 text-center py-12">No projects yet. Create one →</p>
                : projects.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.location}</p>
                    </div>
                    <StatusBadge status={p.status} />
                    <EditBtn onClick={() => setEditProject({ ...p })} />
                    <DelBtn onClick={() => onDeleteProject(p.id)} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ WORK PLANS ═══════════ */}
      {tab === 'workplans' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">New Work Plan</h2>
            <form onSubmit={onCreateWorkplan} className="space-y-3">
              <div>
                <label className={lbl}>Project *</label>
                <select required className={inp} value={wForm.project_id}
                  onChange={e => setWForm(p => ({ ...p, project_id: e.target.value }))}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Activity *</label>
                <input required className={inp} value={wForm.activity} placeholder="e.g. Asphalt laying"
                  onChange={e => setWForm(p => ({ ...p, activity: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Road *</label>
                <input required className={inp} value={wForm.road} placeholder="e.g. Abuja-Keffi Road"
                  onChange={e => setWForm(p => ({ ...p, road: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Start date</label>
                  <input type="date" className={inp} value={wForm.start_date}
                    onChange={e => setWForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>End date</label>
                  <input type="date" className={inp} value={wForm.end_date}
                    onChange={e => setWForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <button disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Create work plan'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">All Work Plans</h2>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50" style={{ maxHeight: 480 }}>
              {workplans.length === 0
                ? <p className="text-sm text-gray-400 text-center py-12">No work plans yet.</p>
                : workplans.map(w => (
                  <div key={w.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{w.activity}</p>
                      <p className="text-xs text-gray-400 truncate">{w.road} · {w.project?.name}</p>
                    </div>
                    <EditBtn onClick={() => setEditWorkplan({ ...w, project_id: w.project?.id ?? w.project_id })} />
                    <DelBtn onClick={() => onDeleteWorkplan(w.id)} />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TASKS ═══════════ */}
      {tab === 'tasks' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Assign New Task</h2>
            <form onSubmit={onCreateTask} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Project</label>
                  <select className={inp} value={tForm.project_id}
                    onChange={e => setTForm(p => ({ ...p, project_id: e.target.value, workplan_id: '' }))}>
                    <option value="">Any project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Work Plan</label>
                  <select className={inp} value={tForm.workplan_id}
                    onChange={e => setTForm(p => ({ ...p, workplan_id: e.target.value }))}>
                    <option value="">Any work plan...</option>
                    {workplans
                      .filter(w => !tForm.project_id || w.project?.id === tForm.project_id)
                      .map(w => <option key={w.id} value={w.id}>{w.activity} — {w.road}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Worker name *</label>
                  <input required className={inp} value={tForm.worker_name} placeholder="Full name"
                    onChange={e => setTForm(p => ({ ...p, worker_name: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Task description *</label>
                  <input required className={inp} value={tForm.task} placeholder="What needs to be done?"
                    onChange={e => setTForm(p => ({ ...p, task: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Supervisor *</label>
                  <input required className={inp} value={tForm.supervisor} placeholder="Supervisor's name"
                    onChange={e => setTForm(p => ({ ...p, supervisor: e.target.value }))} />
                </div>
                <div>
                  <label className={lbl}>Priority</label>
                  <select className={inp} value={tForm.priority} onChange={e => setTForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Due date</label>
                  <input type="date" className={inp} value={tForm.due_date}
                    onChange={e => setTForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              </div>
              <button disabled={saving}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Assign task'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">All Tasks</h2>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50" style={{ maxHeight: 520 }}>
              {tasks.length === 0
                ? <p className="text-sm text-gray-400 text-center py-12">No tasks yet.</p>
                : tasks.map(t => (
                  <div key={t.id} className="px-5 py-3 hover:bg-gray-50/60">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.worker_name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{t.task}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.project?.name ?? 'No project'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Inline status toggle */}
                        <select value={t.status}
                          onChange={async e => {
                            await updateTaskStatus(t.id, e.target.value as TaskStatus)
                            load()
                          }}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-300 bg-white">
                          <option value="pending">Pending</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <PriorityBadge priority={t.priority} />
                        <EditBtn onClick={() => setEditTask({ ...t })} />
                        <DelBtn onClick={() => onDeleteTask(t.id)} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EDIT MODALS ═══════════ */}

      {/* Edit Project */}
      <Modal open={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        {editProject && (
          <form onSubmit={onUpdateProject} className="space-y-3">
            <div>
              <label className={lbl}>Project name *</label>
              <input required className={inp} value={editProject.name}
                onChange={e => setEditProject(p => p && ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Location *</label>
              <input required className={inp} value={editProject.location}
                onChange={e => setEditProject(p => p && ({ ...p, location: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Budget (₦)</label>
                <input type="number" min="0" className={inp} value={editProject.budget}
                  onChange={e => setEditProject(p => p && ({ ...p, budget: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={inp} value={editProject.status}
                  onChange={e => setEditProject(p => p && ({ ...p, status: e.target.value as any }))}>
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Start date</label>
                <input type="date" className={inp} value={editProject.start_date ?? ''}
                  onChange={e => setEditProject(p => p && ({ ...p, start_date: e.target.value || null }))} />
              </div>
              <div>
                <label className={lbl}>End date</label>
                <input type="date" className={inp} value={editProject.end_date ?? ''}
                  onChange={e => setEditProject(p => p && ({ ...p, end_date: e.target.value || null }))} />
              </div>
            </div>
            <ModalActions onCancel={() => setEditProject(null)} saving={saving} />
          </form>
        )}
      </Modal>

      {/* Edit Work Plan */}
      <Modal open={!!editWorkplan} onClose={() => setEditWorkplan(null)} title="Edit Work Plan">
        {editWorkplan && (
          <form onSubmit={onUpdateWorkplan} className="space-y-3">
            <div>
              <label className={lbl}>Project *</label>
              <select required className={inp} value={editWorkplan.project_id ?? ''}
                onChange={e => setEditWorkplan((w: any) => w && ({ ...w, project_id: e.target.value }))}>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Activity *</label>
              <input required className={inp} value={editWorkplan.activity}
                onChange={e => setEditWorkplan((w: any) => w && ({ ...w, activity: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Road *</label>
              <input required className={inp} value={editWorkplan.road}
                onChange={e => setEditWorkplan((w: any) => w && ({ ...w, road: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Start date</label>
                <input type="date" className={inp} value={editWorkplan.start_date ?? ''}
                  onChange={e => setEditWorkplan((w: any) => w && ({ ...w, start_date: e.target.value || null }))} />
              </div>
              <div>
                <label className={lbl}>End date</label>
                <input type="date" className={inp} value={editWorkplan.end_date ?? ''}
                  onChange={e => setEditWorkplan((w: any) => w && ({ ...w, end_date: e.target.value || null }))} />
              </div>
            </div>
            <ModalActions onCancel={() => setEditWorkplan(null)} saving={saving} />
          </form>
        )}
      </Modal>

      {/* Edit Task */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && (
          <form onSubmit={onUpdateTask} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Project</label>
                <select className={inp} value={editTask.project_id ?? ''}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, project_id: e.target.value || null, workplan_id: null }))}>
                  <option value="">Any project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Work Plan</label>
                <select className={inp} value={editTask.workplan_id ?? ''}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, workplan_id: e.target.value || null }))}>
                  <option value="">Any work plan...</option>
                  {workplans
                    .filter(w => !editTask.project_id || w.project?.id === editTask.project_id)
                    .map(w => <option key={w.id} value={w.id}>{w.activity} — {w.road}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Worker name *</label>
                <input required className={inp} value={editTask.worker_name}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, worker_name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Task description *</label>
                <input required className={inp} value={editTask.task}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, task: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Supervisor *</label>
                <input required className={inp} value={editTask.supervisor}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, supervisor: e.target.value }))} />
              </div>
              <div>
                <label className={lbl}>Status</label>
                <select className={inp} value={editTask.status}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Priority</label>
                <select className={inp} value={editTask.priority}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Due date</label>
                <input type="date" className={inp} value={editTask.due_date ?? ''}
                  onChange={e => setEditTask((t: any) => t && ({ ...t, due_date: e.target.value || null }))} />
              </div>
            </div>
            <ModalActions onCancel={() => setEditTask(null)} saving={saving} />
          </form>
        )}
      </Modal>

    </div>
  )
}
