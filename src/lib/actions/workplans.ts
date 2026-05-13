'use server'
// ==========================================================
// src/lib/actions/workplans.ts
// ==========================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateWorkPlanInput } from '@/types'

export async function createWorkPlan(input: CreateWorkPlanInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('workplans').insert(input)
  if (error) return { error: error.message }

  revalidatePath('/workplan')
  revalidatePath('/')
  return { success: true }
}

export async function updateWorkPlan(id: string, input: Partial<CreateWorkPlanInput>) {
  const supabase = await createClient()
  const { error } = await supabase.from('workplans').update(input).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/workplan')
  return { success: true }
}

export async function deleteWorkPlan(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('workplans').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/workplan')
  revalidatePath('/')
  return { success: true }
}

export async function getWorkPlans() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workplans')
    .select(`
      *,
      project:projects(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
