// ==========================================================
// src/components/ui/index.ts
// ==========================================================
// Barrel export — import all UI components from one place.
// e.g. import { Badge, Button } from '@/components/ui'
// ==========================================================

export { default as Modal } from './Modal'
export { Skeleton, StatCardSkeleton, TableRowSkeleton, TableSkeleton } from './Skeleton'
export { StatusBadge, PriorityBadge } from './Badge'

// ---- StatusBadge & PriorityBadge are defined in Badge.tsx below ----
