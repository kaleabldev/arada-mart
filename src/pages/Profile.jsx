import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserListings } from '../hooks/useListings'
import { Link } from 'react-router-dom'
import { formatPrice, formatDate } from '../lib/utils'
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
  MessageCircle
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

  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        telegram_handle: profile.telegram_handle || '',
      })
    }
  }, [profile])

  const handleEditProfile = () => {
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      telegram_handle: profile.telegram_handle || '',
    })
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
              <User size={32} className="text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile.name}</h2>
              <p className="text-slate-400 flex items-center">
                <Mail size={16} className="mr-1" />
                {profile.email}
              </p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={handleEditProfile}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 flex items-center"
            >
              <Edit size={16} className="mr-2" />
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-md">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Name
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
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Telegram Handle (Optional)
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={formData.telegram_handle}
                  onChange={(e) => setFormData({ ...formData, telegram_handle: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            {profile.phone && (
              <p className="text-slate-300 flex items-center">
                <Phone size={16} className="mr-2" />
                {profile.phone}
              </p>
            )}
            {profile.telegram_handle && (
              <p className="text-slate-300 flex items-center">
                <MessageCircle size={16} className="mr-2" />
                @{profile.telegram_handle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Credits Card */}
      <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
        <h3 className="font-semibold mb-4 flex items-center">
          <Coins size={20} className="mr-2 text-primary-500" />
          Listing Credits
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary-500">{profile.listing_credits || 0}</p>
            <p className="text-slate-400 text-sm">Credits available</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">
              Free listings used: {profile.free_listings_used || 0}/1
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Each credit allows 1 additional listing
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'listings'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Package size={18} className="inline mr-2" />
            My Listings
          </button>
        </nav>
      </div>

      {/* Listings */}
      {activeTab === 'listings' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setListingsStatus('active')}
              className={`px-4 py-2 rounded-md ${
                listingsStatus === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setListingsStatus('sold')}
              className={`px-4 py-2 rounded-md ${
                listingsStatus === 'sold'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Sold
            </button>
            <button
              onClick={() => setListingsStatus('expired')}
              className={`px-4 py-2 rounded-md ${
                listingsStatus === 'expired'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Expired
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Package size={64} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg">No {listingsStatus} listings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-slate-700 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={listing.images?.[0] || '/placeholder-image.png'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/listing/${listing.id}`}
                        className="font-semibold text-slate-100 hover:text-primary-400"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-xl font-bold text-primary-500 mt-1">
                        {formatPrice(listing.price)}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Posted {formatDate(listing.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/edit-listing/${listing.id}`}
                        className="px-3 py-1 bg-slate-700 text-white rounded text-sm hover:bg-slate-600 flex items-center"
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
