'use client'
// ==========================================================
// src/app/(dashboard)/projects/page.tsx
// ==========================================================

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import type { Project } from '@/types'

const PAGE_SIZE = 10

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]         = useState(1)
  const [isAdmin, setIsAdmin]   = useState(false)

  useEffect(() => {
    const init = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: projs }] = await Promise.all([
        sb.from('profiles').select('role').eq('id', user.id).single(),
        sb.from('projects').select('*').order('created_at', { ascending: false }),
      ])
      setIsAdmin(prof?.role === 'admin')
      setProjects(projs ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = useMemo(() => projects.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
    const matchS = !statusFilter || p.status === statusFilter
    return matchQ && matchS
  }), [projects, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const setQ = (v: string) => { setSearch(v); setPage(1) }
  const setS = (v: string) => { setStatus(v); setPage(1) }

  if (loading) return <TableSkeleton rows={8} cols={6} />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {projects.length} projects</p>
        </div>
        {isAdmin && (
          <Link href="/admin" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            + New project
          </Link>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setQ(e.target.value)} placeholder="Search name or location..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setS(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {paginated.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr>
                  <th>Project Name</th><th>Location</th><th>Budget (₦)</th>
                  <th>Status</th><th>Start Date</th><th>End Date</th>
                </tr></thead>
                <tbody>
                  {paginated.map(p => (
                    <tr key={p.id}>
                      <td className="font-medium text-gray-900">{p.name}</td>
                      <td className="text-gray-500">{p.location}</td>
                      <td className="font-mono text-sm text-gray-900">₦{Number(p.budget).toLocaleString('en-NG')}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-gray-500 text-sm">{p.start_date ? format(new Date(p.start_date), 'MMM d, yyyy') : '—'}</td>
                      <td className="text-gray-500 text-sm">{p.end_date ? format(new Date(p.end_date), 'MMM d, yyyy') : '—'}</td>
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
            <p className="text-sm text-gray-400">{search||statusFilter ? 'No projects match your filters.' : 'No projects yet.'}</p>
            {(search||statusFilter) && <button onClick={()=>{setQ('');setS('')}} className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>}
          </div>
        )}
      </div>
    </div>
  )
}
