import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMessages } from '../hooks/useChat'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { 
  Send, 
  ArrowLeft, 
  AlertTriangle, 
  User, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react'

export default function ChatDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { messages, loading, sendMessage, reportMessage } = useMessages(id)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchConversation()
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listings:listing_id (title, images),
          buyer:buyer_id (name, email),
          seller:seller_id (name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setConversation(data)
    } catch (err) {
      setError('Failed to load conversation')
      console.error(err)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    setError('')

    const recipientEmail = conversation.buyer_id === user.id
      ? conversation.seller?.email
      : conversation.buyer?.email

    const recipientName = conversation.buyer_id === user.id
      ? conversation.seller?.name
      : conversation.buyer?.name

    const { error } = await sendMessage(
      message.trim(),
      recipientEmail,
      recipientName,
      conversation.listings?.title
    )

    if (error) {
      setError('Failed to send message')
    } else {
      setMessage('')
    }

    setSending(false)
  }

  const handleReport = async (messageId) => {
    if (!confirm('Are you sure you want to report this message?')) return

    const { error } = await reportMessage(messageId)
    if (error) {
      setError('Failed to report message')
    } else {
      alert('Message reported successfully')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Conversation not found</p>
      </div>
    )
  }

  const otherUser = conversation.buyer_id === user.id
    ? conversation.seller
    : conversation.buyer

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 rounded-t-lg p-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <Link to="/chats" className="text-slate-400 hover:text-slate-300">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <User size={20} className="text-slate-400" />
            </div>
            <div>
              <h2 className="font-semibold">{otherUser?.name || 'Unknown'}</h2>
              <p className="text-sm text-slate-400 truncate">
                {conversation.listings?.title || 'Unknown listing'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-900 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No messages yet</p>
            <p className="text-slate-500 text-sm mt-2">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user.id
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {formatDate(msg.created_at)}
                    </span>
                    {!isOwn && (
                      <button
                        onClick={() => handleReport(msg.id)}
                        className="ml-2 text-xs opacity-70 hover:opacity-100 flex items-center"
                        title="Report message"
                      >
                        <AlertTriangle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-800 rounded-b-lg p-4 border-t border-slate-700">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-md mb-3">
            {error}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
