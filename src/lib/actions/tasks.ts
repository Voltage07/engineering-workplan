'use server'
// ==========================================================
// src/lib/actions/tasks.ts
// ==========================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateTaskInput, TaskStatus } from '@/types'

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tasks')
    .insert({ ...input, created_by: user.id })

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  revalidatePath('/')
  return { success: true }
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  revalidatePath('/')
  revalidatePath('/reports')
  return { success: true }
}

export async function updateTask(id: string, input: Partial<CreateTaskInput>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  return { success: true }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/tasks')
  revalidatePath('/')
  return { success: true }
}

export async function getTasks() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(id, name)
    `)
    // This is a Supabase "join" using select syntax.
    // "project:projects(id, name)" means:
    //   fetch the related project's id and name,
    //   and return it nested as "project" inside each task.
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
