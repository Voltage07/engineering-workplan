'use server'
// ==========================================================
// src/lib/actions/messages.ts
// ==========================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateMessageInput } from '@/types'

export async function sendMessage(input: CreateMessageInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('messages').insert({
    sender_id: user.id,
    recipient_id: input.recipient_id,
    body: input.body,
  })

  if (error) return { error: error.message }
  revalidatePath('/inbox')
  return { success: true }
}

export async function markAsRead(messageId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getUnreadCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { count: 0 }

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    // head: true = don't return rows, just the count (faster)
    .eq('recipient_id', user.id)
    .eq('is_read', false)

  return { count: count ?? 0 }
}
