import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserListings } from '../hooks/useListings'
import { Link } from 'react-router-dom'
import { formatPrice, formatDate, getDaysUntilExpiration } from '../lib/utils'
import { 
  User, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  Coins, 
  Package,
  Loader2,
  Save,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user, profile, updateProfile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('listings')
  const [listingsStatus, setListingsStatus] = useState('active')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    telegram_handle: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { listings, loading, refetch } = useUserListings(listingsStatus)

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        telegram_handle: profile.telegram_handle || '',
      })
    }
  }, [profile])

  const handleEditProfile = () => {
    setEditing(true)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await updateProfile(formData)

    if (error) {
      setError(error.message || 'Failed to update profile')
    } else {
      setSuccess('Profile updated successfully')
      setEditing(false)
      await refreshProfile()
    }

    setSaving(false)
  }

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error
      refetch()
    } catch (err) {
      setError('Failed to delete listing')
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700 shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-2 border-primary-500/20">
              <User size={32} className="text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-slate-400 flex items-center text-sm">
                <Mail size={14} className="mr-1" />
                {profile.email}
              </p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 flex items-center transition-colors"
            >
              <Edit size={16} className="mr-2" />
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 bg-slate-900/50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+251..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Telegram Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input
                    type="text"
                    value={formData.telegram_handle?.replace('@', '')}
                    onChange={(e) => setFormData({ ...formData, telegram_handle: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center disabled:opacity-50 font-medium"
              >
                {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center text-slate-300 bg-slate-700/30 p-3 rounded-md">
              <Phone size={18} className="mr-3 text-primary-400" />
              <span>{profile.phone || 'No phone added'}</span>
            </div>
            <div className="flex items-center text-slate-300 bg-slate-700/30 p-3 rounded-md">
              <MessageCircle size={18} className="mr-3 text-primary-400" />
              <span>{profile.telegram_handle ? `@${profile.telegram_handle.replace('@', '')}` : 'No Telegram added'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Credits Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 mb-8 border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center mb-1">
              <Coins size={20} className="mr-2 text-amber-500" />
              Listing Credits
            </h3>
            <p className="text-4xl font-bold text-primary-500">{profile.credits || 0}</p>
            <p className="text-slate-400 text-sm mt-1">Available for new listings or renewals</p>
          </div>
          <div className="text-right bg-slate-700/30 p-4 rounded-lg">
            <p className="text-slate-300 text-sm font-medium">
              Free Plan: <span className="text-primary-400">{profile.free_listings_used || 0}/1</span>
            </p>
            <p className="text-slate-500 text-xs mt-2 max-w-[200px]">
              You get 1 free listing. Subsequent listings require 1 credit each.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('listings'); setListingsStatus('active'); }}
          className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
            activeTab === 'listings' && listingsStatus === 'active'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Active Listings
        </button>
        <button
          onClick={() => { setActiveTab('listings'); setListingsStatus('sold'); }}
          className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
            activeTab === 'listings' && listingsStatus === 'sold'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Sold
        </button>
        <button
          onClick={() => { setActiveTab('listings'); setListingsStatus('expired'); }}
          className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
            activeTab === 'listings' && listingsStatus === 'expired'
              ? 'text-primary-400 border-b-2 border-primary-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Expired
        </button>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
          <Package size={64} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No {listingsStatus} listings found</p>
          <Link to="/create-listing" className="mt-4 inline-block text-primary-500 hover:underline font-medium">
            Post your first item now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {listings.map((listing) => {
            const daysLeft = getDaysUntilExpiration(listing.expires_at)
            const isActuallyExpired = listing.status === 'expired' || (listing.status === 'active' && daysLeft <= 0)

            return (
              <div
                key={listing.id}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all flex flex-col md:flex-row gap-4"
              >
                <div className="w-full md:w-32 h-32 bg-slate-700 rounded-md overflow-hidden flex-shrink-0 relative">
                  <img
                    src={listing.images?.[0] || '/placeholder-image.png'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  {listing.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded font-bold uppercase">Sold</span>
                    </div>
                  )}
                  {isActuallyExpired && listing.status !== 'sold' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold uppercase">Expired</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <Link
                      to={`/listing/${listing.id}`}
                      className="font-bold text-lg text-slate-100 hover:text-primary-400 truncate block"
                    >
                      {listing.title}
                    </Link>
                  </div>
                  <p className="text-2xl font-black text-primary-500 mt-1">
                    {formatPrice(listing.price)}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center"><Package size={14} className="mr-1" /> {listing.category}</span>
                    <span className="flex items-center"><CheckCircle size={14} className="mr-1" /> {listing.condition}</span>
                    <span className="flex items-center">
                      {isActuallyExpired ? (
                        <span className="text-red-400 flex items-center"><AlertCircle size={14} className="mr-1" /> Expired</span>
                      ) : (
                        <span className="flex items-center"><RefreshCw size={14} className="mr-1" /> {daysLeft} days left</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 justify-end">
                  {listing.status === 'active' && !isActuallyExpired && (
                    <Link
                      to={`/edit-listing/${listing.id}`}
                      className="flex-1 md:flex-none px-4 py-2 bg-slate-700 text-white rounded text-sm hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                      <Edit size={14} className="mr-2" />
                      Edit
                    </Link>
                  )}
                  {isActuallyExpired && listing.status !== 'sold' && (
                    <Link
                      to={`/listing/${listing.id}`}
                      className="flex-1 md:flex-none px-4 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 flex items-center justify-center transition-colors font-medium"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Renew
                    </Link>
                  )}
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="flex-1 md:flex-none px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded text-sm hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
