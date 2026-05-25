import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { sendNewMessageEmail } from '../lib/resend'

export function useConversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listings:listing_id (title, images),
          buyer:buyer_id (name, email),
          seller:seller_id (name, email)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      setConversations(data)
    } catch (err) {
      console.error('Error fetching conversations:', err)
    } finally {
      setLoading(false)
    }
  }

  return { conversations, loading, refetch: fetchConversations }
}

export function useMessages(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (conversationId) {
      fetchMessages()
      subscribeToMessages()
    }
  }, [conversationId])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const sendMessage = async (content, recipientEmail, recipientName, listingTitle) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        })
        .select()
        .single()

      if (error) throw error

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)

      // Send email notification
      await sendNewMessageEmail(recipientEmail, recipientName, user.profile?.name || 'Someone', listingTitle)

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const reportMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_reported: true })
        .eq('id', messageId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return { messages, loading, sendMessage, reportMessage }
}

export function useCreateConversation() {
  const { user } = useAuth()

  const createConversation = async (listingId, sellerId) => {
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .single()

      if (existing) {
        return { data: existing, error: null }
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return { createConversation }
}
