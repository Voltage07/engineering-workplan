'use server'
// ==========================================================
// src/lib/actions/settings.ts
// ==========================================================
// Server actions for reading and updating app settings.
// ==========================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface AppSettings {
  app_name: string
  org_name: string
}

// Fetch all settings as a plain object
export async function getSettings(): Promise<AppSettings> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('key, value')

  // Convert array of {key, value} rows into a plain object
  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }

  return {
    app_name: map['app_name'] ?? 'Road WorkPlan',
    org_name: map['org_name'] ?? 'Engineer Co-ordinating Unit',
  }
}

// Update a single setting value
export async function updateSetting(key: string, value: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)

  if (error) return { error: error.message }

  // Revalidate everywhere the setting is shown
  revalidatePath('/', 'layout')
  // 'layout' scope means the root layout and ALL pages under it refresh

  return { success: true }
}