// ==========================================================
// src/app/(dashboard)/page.tsx
// ==========================================================
//
// The main dashboard page. URL: "/"
//
// This is a SERVER COMPONENT — it fetches all data directly
// from Supabase before rendering. No loading spinners needed;
// the page appears fully populated.
// ==========================================================

import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

// Small helper to calculate completion rate
function calcCompletionRate(tasks: { status: string }[]) {
  if (tasks.length === 0) return 0
  const completed = tasks.filter(t => t.status === 'completed').length
  return Math.round((completed / tasks.length) * 100)
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Run multiple queries in parallel using Promise.all
  // This is faster than running them one after another.
  const [
    { data: projects, count: projectCount },
    { data: workplans, count: workplanCount },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
    supabase.from('workplans').select('*', { count: 'exact' }),
    supabase.from('tasks').select('id, status'),
  ])
  // select('*', { count: 'exact' }) fetches all columns AND returns
  // the total row count (without fetching all rows for pagination later)

  const completionRate = calcCompletionRate(tasks ?? [])
  const completedTasks = (tasks ?? []).filter(t => t.status === 'completed').length

  // Summary cards data — makes the JSX below cleaner
  const stats = [
    {
      label: 'Total Projects',
      value: projectCount ?? 0,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: 'Work Plans',
      value: workplanCount ?? 0,
      color: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Task Assignments',
      value: tasks?.length ?? 0,
      color: 'bg-amber-50 text-amber-700',
      iconColor: 'text-amber-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      color: 'bg-green-50 text-green-700',
      iconColor: 'text-green-500',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  // Status color mapping for badges
  const statusColors: Record<string, string> = {
    pending:   'bg-gray-100 text-gray-600',
    ongoing:   'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    paused:    'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of all road construction activities</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <span className={stat.iconColor}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900">Overall Task Completion</h2>
          <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completedTasks} of {tasks?.length ?? 0} tasks completed
        </p>
      </div>

      {/* Recent projects table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900">Recent Projects</h2>
          <a href="/projects" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </a>
        </div>

        {projects && projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Budget (₦)</th>
                  <th>Status</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((project) => (
                  // .slice(0, 8) shows only the most recent 8 projects
                  <tr key={project.id}>
                    <td className="font-medium text-gray-900">{project.name}</td>
                    <td className="text-gray-500">{project.location}</td>
                    <td className="text-gray-900">
                      {Number(project.budget).toLocaleString('en-NG')}
                      {/* toLocaleString formats: 1500000 → "1,500,000" */}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="text-gray-500">
                      {project.start_date
                        ? format(new Date(project.start_date), 'MMM d, yyyy')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Empty state
          <div className="py-12 text-center">
            <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="mt-2 text-sm text-gray-400">No projects yet.</p>
            <a href="/admin" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
              Add one in Admin →
            </a>
          </div>
        )}
      </div>

    </div>
  )
}
