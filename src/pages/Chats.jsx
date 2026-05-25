import { useConversations } from '../hooks/useChat'
import { Link } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import { MessageSquare, Loader2, User } from 'lucide-react'

export default function Chats() {
  const { conversations, loading } = useConversations()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={64} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No conversations yet</p>
          <p className="text-slate-500 text-sm mt-2">
            Start a conversation by contacting a seller from a listing
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const otherUser = conversation.buyer_id === conversation.buyer?.id
              ? conversation.seller
              : conversation.buyer

            return (
              <Link
                key={conversation.id}
                to={`/chat/${conversation.id}`}
                className="block bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                    <User size={24} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-100 truncate">
                        {otherUser?.name || 'Unknown'}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {conversation.listings?.title || 'Unknown listing'}
                    </p>
                  </div>
                  <MessageSquare size={20} className="text-slate-400" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
