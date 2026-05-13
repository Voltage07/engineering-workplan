// ==========================================================
// src/components/ui/Badge.tsx
// ==========================================================

import type { ProjectStatus, TaskStatus, TaskPriority } from '@/types'

// Maps each status to a Tailwind class pair
const statusStyles: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-700',
  ongoing:     'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  paused:      'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  cancelled:   'bg-red-100 text-red-700',
}

const priorityStyles: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  normal: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: ProjectStatus | TaskStatus | string }) {
  const cls = statusStyles[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority | string }) {
  const cls = priorityStyles[priority] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {priority}
    </span>
  )
}
