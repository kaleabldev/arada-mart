import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useListing } from '../hooks/useListings'
import { useAuth } from '../context/AuthContext'
import { useCreateConversation } from '../hooks/useChat'
import { formatPrice, formatDate, getDaysUntilExpiration } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { 
  MapPin, 
  Eye, 
  Calendar, 
  MessageSquare, 
  Edit, 
  Trash2, 
  CheckCircle,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Send,
  MessageCircle
} from 'lucide-react'

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

const CONDITION_COLORS = {
  new: 'bg-green-500',
  like_new: 'bg-blue-500',
  good: 'bg-yellow-500',
  fair: 'bg-orange-500',
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { listing, loading, error, refetch } = useListing(id)
  const { user, profile } = useAuth()
  const { createConversation } = useCreateConversation()
  const [contacting, setContacting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const isOwner = user && listing && user.id === listing.seller_id
  const daysLeft = listing ? getDaysUntilExpiration(listing.expires_at) : 0
  const isExpired = daysLeft <= 0

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (isOwner) {
      setActionError('You cannot contact yourself')
      return
    }

    setContacting(true)
    setActionError('')

    try {
      const { data, error } = await createConversation(id, listing.seller_id)
      if (error) throw error
      navigate(`/chat/${data.id}`)
    } catch (err) {
      setActionError('Failed to start conversation')
    } finally {
      setContacting(false)
    }
  }

  const handleMarkSold = async () => {
    if (!confirm('Are you sure you want to mark this item as sold?')) return

    setActionLoading(true)
    setActionError('')

    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', id)

      if (error) throw error
      refetch()
    } catch (err) {
      setActionError('Failed to mark as sold')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRenew = async () => {
    if (!profile || profile.listing_credits <= 0) {
      setActionError('Renewal requires 1 credit. Contact admin to add credits.')
      return
    }

    if (!confirm('Renewing will use 1 credit. Continue?')) return

    setActionLoading(true)
    setActionError('')

    try {
      // Deduct credit
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ listing_credits: profile.listing_credits - 1 })
        .eq('id', user.id)

      if (creditError) throw creditError

      // Record transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -1,
        reason: 'renewal_fee',
      })

      // Renew listing
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      refetch()
      // Refresh profile to show updated credits
      await profile.refreshProfile?.()
    } catch (err) {
      setActionError('Failed to renew listing')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return

    setActionLoading(true)
    setActionError('')

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (error) throw error
      navigate('/profile')
    } catch (err) {
      setActionError('Failed to delete listing')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md">
        {error || 'Listing not found'}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/" className="inline-flex items-center text-slate-400 hover:text-slate-300 mb-6">
        <ArrowLeft size={20} className="mr-2" />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden mb-4">
            <img
              src={listing.images?.[0] || '/placeholder-image.png'}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/placeholder-image.png'
              }}
            />
          </div>
          {listing.images && listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {listing.images.slice(1).map((img, index) => (
                <div key={index} className="aspect-square bg-slate-800 rounded-lg overflow-hidden">
                  <img
                    src={img}
                    alt={`${listing.title} ${index + 2}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                    onClick={() => {
                      // Could implement lightbox here
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`text-xs text-white px-2 py-1 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
                {CONDITION_LABELS[listing.condition]}
              </span>
              <h1 className="text-3xl font-bold mt-2">{listing.title}</h1>
            </div>
            {listing.negotiable && (
              <span className="bg-primary-600 text-white text-sm px-3 py-1 rounded-full">
                Negotiable
              </span>
            )}
          </div>

          <p className="text-4xl font-bold text-primary-500 mb-6">
            {formatPrice(listing.price)}
          </p>

          {/* Seller Info */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Seller Information</h3>
            <p className="text-slate-300 mb-2">
              <span className="text-slate-400">Name:</span> {listing.profiles?.name}
            </p>
            {listing.profiles?.telegram_handle && (
              <p className="text-slate-300 mb-2 flex items-center">
                <MessageCircle size={16} className="mr-2" />
                <span className="text-slate-400">Telegram:</span> @{listing.profiles.telegram_handle}
              </p>
            )}
            <p className="text-slate-300 flex items-center">
              <MapPin size={16} className="mr-2" />
              {listing.location_text}
            </p>
          </div>

          {/* Description */}
          <div className="bg-slate-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Description</h3>
            <p className="text-slate-300 whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-slate-400 mb-6">
            <div className="flex items-center">
              <Eye size={16} className="mr-1" />
              <span>{listing.view_count || 0} views</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>Posted {formatDate(listing.created_at)}</span>
            </div>
            {isExpired ? (
              <div className="flex items-center text-red-400">
                <AlertCircle size={16} className="mr-1" />
                <span>Expired</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                <span>{daysLeft} days left</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {actionError && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md">
                {actionError}
              </div>
            )}

            {!isOwner && listing.status === 'active' && !isExpired && (
              <button
                onClick={handleContactSeller}
                disabled={contacting}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {contacting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <MessageSquare size={20} className="mr-2" />
                    Contact Seller
                  </>
                )}
              </button>
            )}

            {isOwner && (
              <div className="space-y-3">
                {listing.status === 'active' && !isExpired && (
                  <>
                    <Link
                      to={`/edit-listing/${id}`}
                      className="w-full py-3 px-4 bg-slate-700 text-white rounded-md font-medium hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center"
                    >
                      <Edit size={20} className="mr-2" />
                      Edit Listing
                    </Link>
                    <button
                      onClick={handleMarkSold}
                      disabled={actionLoading}
                      className="w-full py-3 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {actionLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle size={20} className="mr-2" />
                          Mark as Sold
                        </>
                      )}
                    </button>
                  </>
                )}

                {listing.status === 'expired' && (
                  <button
                    onClick={handleRenew}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-amber-600 text-white rounded-md font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <RefreshCw size={20} className="mr-2" />
                        Renew (requires 1 credit)
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 size={20} className="mr-2" />
                      Delete Listing
                    </>
                  )}
                </button>
              </div>
            )}

            {listing.status === 'sold' && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-md text-center">
                This item has been sold
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
