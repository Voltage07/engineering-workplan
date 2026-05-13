'use client'
// ==========================================================
// src/app/(dashboard)/reports/page.tsx
// ==========================================================

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function ReportsPage() {
  const [projects, setProjects]   = useState<any[]>([])
  const [tasks, setTasks]         = useState<any[]>([])
  const [workplans, setWorkplans] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const sb = createClient()
      const [{ data: p }, { data: t }, { data: w }] = await Promise.all([
        sb.from('projects').select('*').order('name'),
        sb.from('tasks').select('*, project:projects(name)').order('created_at', { ascending: false }),
        sb.from('workplans').select('*, project:projects(name)').order('created_at', { ascending: false }),
      ])
      setProjects(p ?? [])
      setTasks(t ?? [])
      setWorkplans(w ?? [])
      setLoading(false)
    }
    init()
  }, [])

  // ── PDF generator ─────────────────────────────────────────
  const generatePDF = async (type: 'projects' | 'workplans' | 'progress') => {
    setGenerating(type)
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape' })

    const NAVY = [26, 79, 138] as [number, number, number]
    const GREY = [248, 249, 250] as [number, number, number]
    const now  = format(new Date(), 'MMMM d, yyyy')

    // ── Header ──
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, 297, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)

    const titles: Record<string, string> = {
      projects:  'Project Status Report',
      workplans: 'Work Plan Schedule Report',
      progress:  'Task Progress Report',
    }
    doc.text('Road WorkPlan System  —  ' + titles[type], 10, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Generated: ' + now, 237, 14)

    let y = 32

    // ── Column helper ──
    const cols = (row: string[], widths: number[], x0 = 10, rowY = y, isHeader = false) => {
      if (isHeader) {
        doc.setFillColor(...NAVY)
        doc.rect(x0, rowY - 5, widths.reduce((a,b)=>a+b,0), 8, 'F')
        doc.setTextColor(255,255,255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
      } else {
        doc.setTextColor(30,30,30)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
      }
      let x = x0
      row.forEach((cell, i) => {
        doc.text(String(cell ?? '—'), x + 2, rowY)
        x += widths[i]
      })
    }

    // ── Row stripe ──
    const stripe = (rowY: number, totalW: number, x0 = 10, even = true) => {
      if (even) {
        doc.setFillColor(...GREY)
        doc.rect(x0, rowY - 5, totalW, 8, 'F')
      }
    }

    // ══════════════ PROJECTS REPORT ══════════════
    if (type === 'projects') {
      const widths = [80, 55, 45, 30, 35, 35]
      const total  = widths.reduce((a,b)=>a+b,0)
      cols(['Project Name', 'Location', 'Budget (₦)', 'Status', 'Start Date', 'End Date'], widths, 10, y, true)
      y += 10

      projects.forEach((p, i) => {
        if (y > 185) { doc.addPage(); y = 20 }
        stripe(y, total, 10, i % 2 === 0)
        cols([
          p.name,
          p.location,
          '₦' + Number(p.budget).toLocaleString('en-NG'),
          p.status,
          p.start_date ? format(new Date(p.start_date), 'MMM d, yyyy') : '—',
          p.end_date ? format(new Date(p.end_date), 'MMM d, yyyy') : '—',
        ], widths)
        y += 8
      })

      // Summary
      y += 6
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(26,79,138)
      doc.text(`Total projects: ${projects.length}`, 10, y)
      doc.text(`Ongoing: ${projects.filter(p=>p.status==='ongoing').length}`, 60, y)
      doc.text(`Completed: ${projects.filter(p=>p.status==='completed').length}`, 110, y)
    }

    // ══════════════ WORK PLAN REPORT ══════════════
    if (type === 'workplans') {
      const widths = [70, 70, 55, 40, 40]
      const total  = widths.reduce((a,b)=>a+b,0)
      cols(['Activity', 'Road', 'Project', 'Start Date', 'End Date'], widths, 10, y, true)
      y += 10

      workplans.forEach((w, i) => {
        if (y > 185) { doc.addPage(); y = 20 }
        stripe(y, total, 10, i % 2 === 0)
        cols([
          w.activity,
          w.road,
          w.project?.name ?? '—',
          w.start_date ? format(new Date(w.start_date), 'MMM d, yyyy') : '—',
          w.end_date ? format(new Date(w.end_date), 'MMM d, yyyy') : '—',
        ], widths)
        y += 8
      })

      y += 6
      doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(26,79,138)
      doc.text(`Total activities: ${workplans.length}`, 10, y)
    }

    // ══════════════ PROGRESS REPORT ══════════════
    if (type === 'progress') {
      const completed  = tasks.filter(t=>t.status==='completed').length
      const rate       = tasks.length ? Math.round(completed/tasks.length*100) : 0

      // Summary box
      doc.setFillColor(235, 243, 255)
      doc.roundedRect(10, y-5, 275, 18, 3, 3, 'F')
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(26,79,138)
      doc.text(`Completion rate: ${rate}%`, 15, y+4)
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(60,60,60)
      doc.text(`Total: ${tasks.length}  |  Completed: ${completed}  |  In Progress: ${tasks.filter(t=>t.status==='in_progress').length}  |  Pending: ${tasks.filter(t=>t.status==='pending').length}`, 15, y+11)
      y += 24

      const widths = [55, 70, 45, 35, 25, 30, 35]
      const total  = widths.reduce((a,b)=>a+b,0)
      cols(['Worker', 'Task', 'Project', 'Supervisor', 'Priority', 'Status', 'Due Date'], widths, 10, y, true)
      y += 10

      tasks.forEach((t, i) => {
        if (y > 185) { doc.addPage(); y = 20 }
        stripe(y, total, 10, i % 2 === 0)
        cols([
          t.worker_name,
          t.task.slice(0, 35) + (t.task.length > 35 ? '…' : ''),
          t.project?.name ?? '—',
          t.supervisor,
          t.priority,
          t.status.replace('_', ' '),
          t.due_date ? format(new Date(t.due_date), 'MMM d, yyyy') : '—',
        ], widths)
        y += 8
      })
    }

    // Footer on each page
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(150,150,150)
      doc.text('Road WorkPlan System — Engineer Co-ordinating Unit', 10, 202)
      doc.text(`Page ${i} of ${pageCount}`, 270, 202)
    }

    doc.save(`${type}-report-${Date.now()}.pdf`)
    setGenerating(null)
  }

  // ── Stats ─────────────────────────────────────────────────
  const completed    = tasks.filter(t => t.status === 'completed').length
  const inProgress   = tasks.filter(t => t.status === 'in_progress').length
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  const statusCounts = {
    pending:   projects.filter(p => p.status === 'pending').length,
    ongoing:   projects.filter(p => p.status === 'ongoing').length,
    completed: projects.filter(p => p.status === 'completed').length,
    paused:    projects.filter(p => p.status === 'paused').length,
  }

  const reports = [
    { key: 'projects',  title: 'Project Report',   desc: 'All projects with location, budget, and status.', count: `${projects.length} projects`,  color: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'workplans', title: 'Work Plan Report',  desc: 'All scheduled activities and their timelines.',   count: `${workplans.length} activities`, color: 'bg-purple-600 hover:bg-purple-700' },
    { key: 'progress',  title: 'Progress Report',   desc: 'Task assignments with completion status.',         count: `${tasks.length} tasks`,         color: 'bg-green-600 hover:bg-green-700' },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate and download PDF reports</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: projects.length, color: 'text-blue-700' },
          { label: 'Work Plans', value: workplans.length, color: 'text-purple-700' },
          { label: 'Tasks', value: tasks.length, color: 'text-amber-700' },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${s.color}`}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Task progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-gray-900">Task Completion</h2>
          <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-700"
            style={{ width: `${completionRate}%` }} />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>Completed: {completed}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"/>In progress: {inProgress}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/>Pending: {tasks.filter(t=>t.status==='pending').length}</span>
        </div>
      </div>

      {/* Download cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map(r => (
          <div key={r.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900">{r.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
            <p className="text-xs text-gray-400 mt-2">{loading ? 'Loading...' : r.count}</p>
            <button
              onClick={() => generatePDF(r.key)}
              disabled={loading || generating !== null}
              className={`mt-4 w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${r.color}`}>
              {generating === r.key ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Project status breakdown table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Project Status Breakdown</h2>
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"/>Ongoing: {statusCounts.ongoing}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"/>Done: {statusCounts.completed}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Project</th><th>Location</th><th>Budget (₦)</th><th>Status</th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">Loading...</td></tr>
                : projects.length === 0
                  ? <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No data yet</td></tr>
                  : projects.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium text-gray-900">{p.name}</td>
                      <td className="text-gray-500">{p.location}</td>
                      <td className="font-mono text-sm">₦{Number(p.budget).toLocaleString('en-NG')}</td>
                      <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
