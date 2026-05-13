'use client'
// ==========================================================
// src/app/(dashboard)/workplan/page.tsx
// ==========================================================

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, differenceInDays, isAfter, isBefore, isToday } from 'date-fns'
import Link from 'next/link'
import { TableSkeleton } from '@/components/ui/Skeleton'

const PAGE_SIZE = 10

function ScheduleTag({ start, end }: { start: string | null; end: string | null }) {
  // Shows how the activity is progressing relative to today
  if (!start || !end) return <span className="text-gray-400 text-xs">—</span>

  const now   = new Date()
  const s     = new Date(start)
  const e     = new Date(end)

  if (isAfter(s, now)) {
    const days = differenceInDays(s, now)
    return <span className="text-xs text-blue-600 font-medium">Starts in {days}d</span>
  }
  if (isBefore(e, now)) {
    return <span className="text-xs text-gray-400 font-medium">Ended</span>
  }
  const remaining = differenceInDays(e, now)
  return <span className="text-xs text-green-600 font-medium">Active · {remaining}d left</span>
}

export default function WorkPlanPage() {
  const [workplans, setWorkplans] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [projectFilter, setProject] = useState('')
  const [projects, setProjects]   = useState<any[]>([])
  const [page, setPage]           = useState(1)
  const [isAdmin, setIsAdmin]     = useState(false)

  useEffect(() => {
    const init = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: w }, { data: p }] = await Promise.all([
        sb.from('profiles').select('role').eq('id', user.id).single(),
        sb.from('workplans').select('*, project:projects(id,name)').order('created_at', { ascending: false }),
        sb.from('projects').select('id, name').order('name'),
      ])
      setIsAdmin(prof?.role === 'admin')
      setWorkplans(w ?? [])
      setProjects(p ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = useMemo(() => workplans.filter(w => {
    const q = search.toLowerCase()
    const matchQ = !q || w.activity.toLowerCase().includes(q) || w.road.toLowerCase().includes(q)
    const matchP = !projectFilter || w.project?.id === projectFilter
    return matchQ && matchP
  }), [workplans, search, projectFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const setQ = (v: string) => { setSearch(v); setPage(1) }
  const setPF = (v: string) => { setProject(v); setPage(1) }

  if (loading) return <TableSkeleton rows={8} cols={5} />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Work Plan</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {workplans.length} activities</p>
        </div>
        {isAdmin && (
          <Link href="/admin" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            + New work plan
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setQ(e.target.value)} placeholder="Search activity or road..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white" />
        </div>
        <select value={projectFilter} onChange={e => setPF(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option value="">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {paginated.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>
                  <th>Activity</th><th>Road</th><th>Project</th>
                  <th>Start Date</th><th>End Date</th><th>Schedule</th>
                </tr></thead>
                <tbody>
                  {paginated.map(w => (
                    <tr key={w.id}>
                      <td className="font-medium text-gray-900">{w.activity}</td>
                      <td className="text-gray-600">{w.road}</td>
                      <td className="text-gray-500 text-sm">{w.project?.name ?? '—'}</td>
                      <td className="text-gray-500 text-sm whitespace-nowrap">
                        {w.start_date ? format(new Date(w.start_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="text-gray-500 text-sm whitespace-nowrap">
                        {w.end_date ? format(new Date(w.end_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td><ScheduleTag start={w.start_date} end={w.end_date} /></td>
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
            <p className="text-sm text-gray-400">{search||projectFilter ? 'No work plans match your filters.' : 'No work plans yet.'}</p>
            {(search||projectFilter) && <button onClick={()=>{setQ('');setPF('')}} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>}
          </div>
        )}
      </div>
    </div>
  )
}
