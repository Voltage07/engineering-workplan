'use client'
// ==========================================================
// src/app/(dashboard)/tasks/page.tsx
// ==========================================================

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'

const PAGE_SIZE = 10

export default function TasksPage() {
  const [tasks, setTasks]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [priorityFilter, setPriority] = useState('')
  const [page, setPage]         = useState(1)
  const [isAdmin, setIsAdmin]   = useState(false)

  useEffect(() => {
    const init = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: t }] = await Promise.all([
        sb.from('profiles').select('role').eq('id', user.id).single(),
        sb.from('tasks').select('*, project:projects(id,name)').order('created_at', { ascending: false }),
      ])
      setIsAdmin(prof?.role === 'admin')
      setTasks(t ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = useMemo(() => tasks.filter(t => {
    const q = search.toLowerCase()
    const matchQ = !q || t.worker_name.toLowerCase().includes(q) || t.task.toLowerCase().includes(q) || t.supervisor.toLowerCase().includes(q)
    const matchS = !statusFilter || t.status === statusFilter
    const matchP = !priorityFilter || t.priority === priorityFilter
    return matchQ && matchS && matchP
  }), [tasks, search, statusFilter, priorityFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const setQ = (v: string) => { setSearch(v); setPage(1) }
  const setS = (v: string) => { setStatus(v); setPage(1) }
  const setP = (v: string) => { setPriority(v); setPage(1) }

  // Completion stats
  const completed  = tasks.filter(t => t.status === 'completed').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const pending    = tasks.filter(t => t.status === 'pending').length

  if (loading) return <TableSkeleton rows={8} cols={7} />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Task Assignments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {tasks.length} tasks</p>
        </div>
        {isAdmin && (
          <Link href="/admin?tab=tasks" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            + Assign task
          </Link>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: pending, color: 'text-gray-700 bg-gray-50 border-gray-100' },
          { label: 'In Progress', count: inProgress, color: 'text-purple-700 bg-purple-50 border-purple-100' },
          { label: 'Completed', count: completed, color: 'text-green-700 bg-green-50 border-green-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-semibold">{s.count}</p>
            <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setQ(e.target.value)} placeholder="Search worker, task, supervisor..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setS(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={priorityFilter} onChange={e => setP(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {paginated.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>
                  <th>Worker</th><th>Task</th><th>Project</th>
                  <th>Supervisor</th><th>Priority</th><th>Status</th><th>Due Date</th>
                </tr></thead>
                <tbody>
                  {paginated.map(t => (
                    <tr key={t.id}>
                      <td className="font-medium text-gray-900">{t.worker_name}</td>
                      <td className="text-gray-700 max-w-xs">
                        <span className="line-clamp-2">{t.task}</span>
                      </td>
                      <td className="text-gray-500 text-sm">{t.project?.name ?? '—'}</td>
                      <td className="text-gray-500">{t.supervisor}</td>
                      <td><PriorityBadge priority={t.priority} /></td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="text-gray-500 text-sm whitespace-nowrap">
                        {t.due_date ? format(new Date(t.due_date), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-400">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  {Array.from({length: totalPages},(_,i)=>i+1).map(n=>(
                    <button key={n} onClick={()=>setPage(n)}
                      className={`px-3 py-1.5 text-xs border rounded-lg ${page===n?'bg-blue-600 text-white border-blue-600':'border-gray-200 hover:bg-gray-50'}`}>{n}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">{search||statusFilter||priorityFilter ? 'No tasks match your filters.' : 'No tasks yet.'}</p>
            {(search||statusFilter||priorityFilter) && (
              <button onClick={()=>{setQ('');setS('');setP('')}} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
