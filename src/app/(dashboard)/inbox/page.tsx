'use client'
// ==========================================================
// src/app/(dashboard)/inbox/page.tsx
// ==========================================================
//
// The inbox replaces the fake hardcoded HTML from the original.
// This uses Supabase REALTIME — when someone sends a message,
// it appears instantly without refreshing the page.
//
// HOW REALTIME WORKS:
// 1. We subscribe to the "messages" table
// 2. Supabase opens a WebSocket connection (persistent connection)
// 3. When a new row is inserted, Supabase pushes it to us
// 4. We update React state → UI updates instantly
// ==========================================================

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Profile } from '@/types'

interface MessageRow {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  is_read: boolean
  created_at: string
  sender: { full_name: string | null }
}

export default function InboxPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])         // All users to send TO
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)  // Selected sender ID
  const [newMessage, setNewMessage] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // ---- Initial load ----
  useEffect(() => {
    const init = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)

      // Get current user's profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(myProfile)

      // Get all other users (for the "To:" dropdown when sending)
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)   // neq = NOT EQUAL — exclude yourself
      setProfiles(allProfiles ?? [])

      // Load all messages for this user (sent OR received)
      const { data: msgs } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(full_name)
        `)
        // This join uses the foreign key name explicitly
        // because the messages table has TWO foreign keys to profiles
        // (sender_id and recipient_id), so Supabase needs help knowing which one.
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        // .or() = WHERE sender_id = me OR recipient_id = me
        .order('created_at', { ascending: true })

      setMessages(msgs ?? [])
      setLoading(false)
    }
    init()
  }, [])

  // ---- Supabase Realtime subscription ----
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('inbox-realtime')
      // A "channel" is like a subscription group.
      // We give it a name so we can unsubscribe later.
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          // Only listen for new rows (INSERT), not updates/deletes
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUser.id}`,
          // Only receive messages WHERE recipient_id = my ID
          // (sender gets it via optimistic UI — see handleSend below)
        },
        async (payload) => {
          // payload.new is the newly inserted row
          // We need to fetch the sender's name since it's a join
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg = {
            ...payload.new,
            sender: { full_name: senderProfile?.full_name ?? 'Unknown' },
          } as MessageRow

          setMessages(prev => [...prev, newMsg])
          // Spread previous messages + add the new one at the end
        }
      )
      .subscribe()
      // .subscribe() opens the WebSocket connection

    // Cleanup: unsubscribe when the component unmounts
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // ---- Auto-scroll to bottom when new messages arrive ----
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedThread])

  // ---- Mark messages as read when opening a thread ----
  const openThread = async (senderId: string) => {
    setSelectedThread(senderId)

    // Mark unread messages in this thread as read
    if (!currentUser) return
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false)

    // Update local state so the unread badge disappears immediately
    setMessages(prev =>
      prev.map(m =>
        m.sender_id === senderId && m.recipient_id === currentUser.id
          ? { ...m, is_read: true }
          : m
      )
    )
  }

  // ---- Send a message ----
  const handleSend = async () => {
    const target = selectedThread || recipientId
    if (!target || !newMessage.trim() || !currentUser) return
    setSending(true)

    const msgBody = newMessage.trim()
    setNewMessage('')  // Clear input immediately (optimistic)

    // Optimistic update: add message to UI before the DB confirms
    const optimistic: MessageRow = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.id,
      recipient_id: target,
      body: msgBody,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: { full_name: profile?.full_name ?? 'Me' },
    }
    setMessages(prev => [...prev, optimistic])

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUser.id,
        recipient_id: target,
        body: msgBody,
      })

    if (error) {
      // Roll back optimistic update if it failed
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      alert('Failed to send: ' + error.message)
    }

    setSending(false)
    if (!selectedThread) setSelectedThread(target)
  }

  // ---- Helpers ----

  // Get distinct "conversation partners" for the thread list
  const threads = (() => {
    if (!currentUser) return []
    const partnerIds = new Set<string>()
    messages.forEach(m => {
      if (m.sender_id !== currentUser.id) partnerIds.add(m.sender_id)
      if (m.recipient_id !== currentUser.id) partnerIds.add(m.recipient_id)
    })
    return Array.from(partnerIds)
  })()

  const getPartnerName = (id: string) => {
    return profiles.find(p => p.id === id)?.full_name ?? 'Unknown'
  }

  const getUnreadCount = (senderId: string) => {
    if (!currentUser) return 0
    return messages.filter(
      m => m.sender_id === senderId && m.recipient_id === currentUser.id && !m.is_read
    ).length
  }

  const threadMessages = selectedThread
    ? messages.filter(
        m =>
          (m.sender_id === currentUser?.id && m.recipient_id === selectedThread) ||
          (m.sender_id === selectedThread && m.recipient_id === currentUser?.id)
      )
    : []

  // ---- Render ----
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time messaging</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex h-[600px] overflow-hidden">

        {/* LEFT: Thread list */}
        <div className="w-64 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-8">Loading...</p>
            ) : threads.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">No messages yet</p>
            ) : (
              threads.map(partnerId => {
                const unread = getUnreadCount(partnerId)
                return (
                  <button
                    key={partnerId}
                    onClick={() => openThread(partnerId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                      selectedThread === partnerId ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-white">
                        {getPartnerName(partnerId)?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getPartnerName(partnerId)}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* New conversation button */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => setSelectedThread(null)}
              className="w-full py-2 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + New message
            </button>
          </div>
        </div>

        {/* RIGHT: Message thread or compose */}
        <div className="flex-1 flex flex-col">

          {selectedThread ? (
            <>
              {/* Thread header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {getPartnerName(selectedThread)?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {getPartnerName(selectedThread)}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.map((m) => {
                  const isMe = m.sender_id === currentUser?.id
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p>{m.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {format(new Date(m.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message... (Enter to send)"
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            // Compose new message
            <div className="flex-1 flex flex-col p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">New Message</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To:</label>
                  <select
                    value={recipientId}
                    onChange={e => setRecipientId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
                  >
                    <option value="">Select recipient...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Message:</label>
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    rows={5}
                    placeholder="Write your message..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300 resize-none"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim() || !recipientId}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                >
                  {sending ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
