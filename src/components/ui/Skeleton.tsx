// ==========================================================
// src/components/ui/Skeleton.tsx
// ==========================================================
// Animated loading placeholders shown while data fetches.
// Uses a CSS "shimmer" animation to indicate loading state.
// ==========================================================

interface SkeletonProps {
  className?: string
}

// Single skeleton block — just an animated grey bar
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-100 rounded ${className}`}
      aria-hidden="true"
    />
  )
}

// Skeleton for a stat card (like the dashboard summary cards)
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}

// Skeleton for a table row
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 ${i === 0 ? 'w-36' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  )
}

// Skeleton for a full table section
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <Skeleton className="h-4 w-32" />
      </div>
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left bg-gray-50 border-b border-gray-100">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
