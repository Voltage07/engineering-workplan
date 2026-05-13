// ==========================================================
// src/types/index.ts
// ==========================================================
//
// This file defines the "shape" of all our data.
// TypeScript uses these to catch mistakes before you run code.
//
// For example, if you try to do project.naem (typo),
// TypeScript will immediately tell you "naem doesn't exist".
//
// These types match EXACTLY the columns in our Supabase tables.
// ==========================================================

// ----------------------------------------------------------
// PROFILE
// ----------------------------------------------------------
// Represents a user in our system.
// Mirrors the "profiles" table in Supabase.

export type Role = 'admin' | 'staff'

export interface Profile {
  id: string           // UUID — matches Supabase Auth user ID
  full_name: string | null
  role: Role
  created_at: string   // ISO date string e.g. "2026-05-12T10:00:00Z"
}

// ----------------------------------------------------------
// PROJECT
// ----------------------------------------------------------

export type ProjectStatus = 'pending' | 'ongoing' | 'completed' | 'paused'

export interface Project {
  id: string
  name: string
  location: string
  budget: number
  status: ProjectStatus
  start_date: string | null    // "YYYY-MM-DD" or null if not set
  end_date: string | null
  created_by: string | null    // UUID of the admin who created it
  created_at: string
}

// ----------------------------------------------------------
// WORKPLAN
// ----------------------------------------------------------

export interface WorkPlan {
  id: string
  project_id: string   // links to a Project
  activity: string     // e.g. "Asphalt laying"
  road: string         // e.g. "Abuja-Keffi Road"
  start_date: string | null
  end_date: string | null
  created_at: string
}

// WorkPlan but with the project data joined in
// (useful when you want to show the project name alongside the workplan)
export interface WorkPlanWithProject extends WorkPlan {
  project: Pick<Project, 'id' | 'name'>
}

// ----------------------------------------------------------
// TASK
// ----------------------------------------------------------

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Task {
  id: string
  workplan_id: string | null
  project_id: string | null
  worker_name: string
  task: string
  supervisor: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_by: string | null
  created_at: string
}

// Task with project info joined
export interface TaskWithProject extends Task {
  project: Pick<Project, 'id' | 'name'> | null
}

// ----------------------------------------------------------
// MESSAGE
// ----------------------------------------------------------

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  is_read: boolean
  created_at: string
}

// Message with sender profile joined
export interface MessageWithSender extends Message {
  sender: Pick<Profile, 'id' | 'full_name'>
}

// ----------------------------------------------------------
// DASHBOARD STATS
// ----------------------------------------------------------
// A helper type for the dashboard summary cards.
// Not a database table — we compute this from other tables.

export interface DashboardStats {
  totalProjects: number
  totalWorkPlans: number
  totalTasks: number
  completedTasks: number
  completionRate: number    // e.g. 0.75 = 75%
  pendingTasks: number
}

// ----------------------------------------------------------
// FORM TYPES
// ----------------------------------------------------------
// These represent what the user fills in on forms.
// We use "Omit" to take a full type and remove fields
// that the database generates automatically (id, created_at, etc.)

export type CreateProjectInput = Omit<Project, 'id' | 'created_at' | 'created_by'>
export type CreateWorkPlanInput = Omit<WorkPlan, 'id' | 'created_at'>
export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'created_by'>
export type CreateMessageInput = Pick<Message, 'recipient_id' | 'body'>
