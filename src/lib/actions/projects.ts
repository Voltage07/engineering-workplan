'use server'
// ==========================================================
// src/lib/actions/projects.ts
// ==========================================================
//
// 'use server' marks this as a SERVER ACTION file.
// Server Actions are functions that run on the server
// but can be called from client components.
//
// WHY SERVER ACTIONS?
// Instead of building a separate API (like /api/projects),
// Next.js lets you write server functions and call them
// directly from your React components. Next.js handles
// the network request behind the scenes.
//
// KEY BENEFIT: The Supabase service-role key (if we had one)
// would stay on the server. For now we use the anon key
// with RLS for security.
// ==========================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateProjectInput } from '@/types'

// ----------------------------------------------------------
// CREATE PROJECT
// ----------------------------------------------------------
// Called when the admin submits the "New Project" form.

export async function createProject(input: CreateProjectInput) {
  const supabase = await createClient()

  // Get the current user — we need their ID as "created_by"
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
    // Return an error object instead of throwing — easier to handle in UI
  }

  const { error } = await supabase
    .from('projects')
    .insert({
      ...input,
      // The spread operator "..." copies all fields from input
      created_by: user.id,
    })

  if (error) {
    return { error: error.message }
  }

  // revalidatePath tells Next.js to re-fetch and re-render
  // the /projects page so the new project appears immediately.
  revalidatePath('/projects')
  revalidatePath('/')    // Dashboard also shows projects
  
  return { success: true }
}

// ----------------------------------------------------------
// UPDATE PROJECT
// ----------------------------------------------------------

export async function updateProject(id: string, input: Partial<CreateProjectInput>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .update(input)
    .eq('id', id)
    // .eq('id', id) = WHERE id = id

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  revalidatePath('/')
  return { success: true }
}

// ----------------------------------------------------------
// DELETE PROJECT
// ----------------------------------------------------------

export async function deleteProject(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  // "ON DELETE CASCADE" in the schema means this also deletes
  // all workplans and tasks linked to this project.

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/projects')
  revalidatePath('/')
  return { success: true }
}

// ----------------------------------------------------------
// GET ALL PROJECTS
// ----------------------------------------------------------
// Used on the projects list page.

export async function getProjects() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    // Show newest first

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
