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
  MessageCircle
} from 'lucide-react'

const CONDITION_LABELS = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' }
const CONDITION_COLORS = { new: 'bg-green-500', like_new: 'bg-blue-500', good: 'bg-yellow-500', fair: 'bg-orange-500' }

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { listing, loading, error, refetch } = useListing(id)
  const { user, profile, refreshProfile } = useAuth()
  const { createConversation } = useCreateConversation()
  const [contacting, setContacting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const isOwner = user && listing && user.id === listing.seller_id
  const daysLeft = listing ? getDaysUntilExpiration(listing.expires_at) : 0
  const isExpired = listing?.status === 'expired' || (listing?.status === 'active' && daysLeft <= 0)

  const handleRenew = async () => {
    if (!profile || (profile.free_listings_used >= 1 && (profile.credits || 0) <= 0)) {
      setActionError('Renewal requires 1 credit.')
      return
    }

    if (!confirm('Renew this listing for 1 credit (or free slot)?')) return

    setActionLoading(true)
    setActionError('')

    try {
      // Logic Check: Calling the secure unified RPC
      const { error: renewError } = await supabase.rpc('renew_listing', {
        target_listing_id: id
      })

      if (renewError) throw renewError

      await refreshProfile()
      refetch()
    } catch (err) {
      setActionError(err.message || 'Failed to renew listing')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkSold = async () => {
    if (!confirm('Mark as sold?')) return
    setActionLoading(true)
    try {
      const { error } = await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
      if (error) throw error
      refetch()
    } catch (err) {
      setActionError('Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-primary-500" size={48} /></div>
  if (error || !listing) return <div className="p-4 bg-red-500/10 text-red-500 rounded-md">Listing not found</div>

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Link to="/" className="inline-flex items-center text-slate-400 hover:text-slate-300 mb-6 transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Back to marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-slate-800 rounded-lg overflow-hidden relative border border-slate-700 shadow-xl">
            <img src={listing.images?.[0] || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
            {listing.status === 'sold' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-green-600 text-white px-6 py-2 rounded-full text-2xl font-bold uppercase tracking-widest -rotate-12 border-4 border-white">Sold</span>
              </div>
            )}
            {isExpired && listing.status !== 'sold' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="bg-red-600 text-white px-6 py-2 rounded-full text-2xl font-bold uppercase tracking-widest -rotate-12 border-4 border-white">Expired</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <span className={`text-xs text-white px-3 py-1 rounded-full font-bold uppercase tracking-tighter ${CONDITION_COLORS[listing.condition]}`}>{CONDITION_LABELS[listing.condition]}</span>
            <h1 className="text-3xl font-bold mt-2 text-slate-100">{listing.title}</h1>
            <p className="text-4xl font-black text-primary-500 mt-2">{formatPrice(listing.price)}</p>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4 shadow-inner">
            <h3 className="font-bold text-slate-200 border-b border-slate-700 pb-2">Seller Contact</h3>
            <p className="text-slate-300 flex items-center hover:text-primary-400 transition-colors"><MessageCircle size={18} className="mr-3 text-primary-400" /> @{listing.profiles?.telegram_handle || 'Not provided'}</p>
            <p className="text-slate-300 flex items-center"><MapPin size={18} className="mr-3 text-primary-400" /> {listing.location_text}</p>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
            <span className="flex items-center bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700"><Eye size={16} className="mr-2 text-primary-400" /> {listing.view_count || 0} views</span>
            <span className="flex items-center bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
              {isExpired ? <span className="text-red-400">Expired</span> : <span className="text-slate-300">{daysLeft} days remaining</span>}
            </span>
          </div>

          <div className="space-y-4 pt-4">
            {actionError && <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium">{actionError}</div>}

            {isOwner ? (
              <div className="grid grid-cols-1 gap-4">
                {listing.status === 'active' && !isExpired && (
                  <>
                    <Link to={`/edit-listing/${id}`} className="w-full py-4 bg-slate-700 text-white rounded-xl text-center hover:bg-slate-600 font-bold transition-all shadow-lg">Edit Listing</Link>
                    <button onClick={handleMarkSold} disabled={actionLoading} className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-black transition-all shadow-lg">Mark as Sold</button>
                  </>
                )}
                {isExpired && listing.status !== 'sold' && (
                  <button onClick={handleRenew} disabled={actionLoading} className="w-full py-5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-black flex items-center justify-center transition-all shadow-xl hover:scale-[1.02] active:scale-95">
                    {actionLoading ? <RefreshCw className="animate-spin mr-3" /> : <RefreshCw className="mr-3" />}
                    Renew Listing (1 Credit)
                  </button>
                )}
                <button onClick={() => {/* delete */}} className="w-full py-3 text-red-500 hover:text-red-400 text-sm font-medium transition-colors">Delete Listing Permanently</button>
              </div>
            ) : (
              listing.status === 'active' && !isExpired && (
                <button onClick={() => navigate('/chat')} className="w-full py-5 bg-primary-600 text-white rounded-xl font-black hover:bg-primary-700 transition-all shadow-xl hover:scale-[1.02] active:scale-95">Contact Seller</button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
