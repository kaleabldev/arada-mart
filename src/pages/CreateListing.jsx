import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useListing } from '../hooks/useListings'
import { X, Plus, MapPin, Upload, AlertCircle } from 'lucide-react'
import { STORAGE_BUCKET } from '../lib/supabase'

const CATEGORIES = ['Phones', 'Laptops', 'Tablets', 'Headphones', 'Accessories', 'Other']
const CONDITIONS = ['new', 'like_new', 'good', 'fair']
const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

export default function CreateListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { listing, loading: listingLoading } = useListing(id)
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    negotiable: false,
    condition: 'good',
    category: 'Other',
    location_text: '',
    latitude: null,
    longitude: null,
  })

  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [creditError, setCreditError] = useState('')

  useEffect(() => {
    if (isEditing && listing) {
      setFormData({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        negotiable: listing.negotiable,
        condition: listing.condition,
        category: listing.category,
        location_text: listing.location_text,
        latitude: listing.latitude,
        longitude: listing.longitude,
      })
      setImages(listing.images || [])
    }
  }, [isEditing, listing])

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed')
      return
    }

    setUploading(true)
    setError('')

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath)

        return publicUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...uploadedUrls])
    } catch (err) {
      setError('Failed to upload images')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }))
        },
        (error) => {
          setError('Failed to get location. Please enable location services.')
        }
      )
    } else {
      setError('Geolocation is not supported by your browser')
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required'
    if (formData.title.length < 5) return 'Title must be at least 5 characters'
    if (!formData.description.trim()) return 'Description is required'
    if (formData.description.length < 20) return 'Description must be at least 20 characters'
    if (!formData.category) return 'Category is required'
    if (!formData.price || formData.price <= 0) return 'Valid price is required'
    if (images.length === 0) return 'At least one image is required'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCreditError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!isEditing) {
      // Check listing limit based on credits and free_listings_used
      const freeUsed = profile?.free_listings_used || 0
      const credits = profile?.credits || 0

      if (freeUsed >= 1 && credits <= 0) {
        setCreditError('You have used your free listing. Purchase credits to post more listings.')
        return
      }
    }

    setSubmitting(true)

    try {
      const listingData = {
        ...formData,
        price: parseInt(formData.price),
        images,
      }

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('listings')
          .update(listingData)
          .eq('id', id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('listings')
          .insert({
            ...listingData,
            seller_id: user.id,
          })
        if (insertError) throw insertError
      }

      await refreshProfile()
      navigate(isEditing ? `/listing/${id}` : '/profile')
    } catch (err) {
      setError(err.message || 'Failed to save listing')
    } finally {
      setSubmitting(false)
    }
  }

  if (listingLoading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? 'Edit Listing' : 'Create New Listing'}
      </h1>

      {creditError && (
        <div className="bg-amber-500/10 border border-amber-500 text-amber-500 px-4 py-3 rounded-md mb-6">
          <div className="flex items-start">
            <AlertCircle className="mr-2 mt-0.5" size={20} />
            <div>
              <p className="font-medium">Listing Limit Reached</p>
              <p className="text-sm mt-1">{creditError}</p>
              <p className="text-sm mt-2">Current credits: {profile?.credits || 0}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Title * (Min 5 characters)
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., iPhone 13 Pro Max - Excellent Condition"
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description * (Min 20 characters)
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe your item in detail..."
            maxLength={2000}
          />
        </div>

        {/* Price and Negotiable */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price (ETB) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 25000"
            />
          </div>
          <div className="flex items-center pt-8">
            <input
              type="checkbox"
              id="negotiable"
              checked={formData.negotiable}
              onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="negotiable" className="ml-2 text-sm text-slate-300">
              Price is negotiable
            </label>
          </div>
        </div>

        {/* Category and Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Condition *
            </label>
            <select
              required
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CONDITIONS.map((cond) => (
                <option key={cond} value={cond}>
                  {CONDITION_LABELS[cond]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Location *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={formData.location_text}
              onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
              className="flex-1 px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Bole, Addis Ababa"
            />
            <button
              type="button"
              onClick={handleLocationClick}
              className="px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center"
              title="Use my current location"
            >
              <MapPin size={20} />
            </button>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Images * (up to 5)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center px-4 py-3 border border-slate-600 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer">
              <Upload size={20} className="mr-2" />
              <span>Upload Images</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading || images.length >= 5}
              />
            </label>
            <span className="text-sm text-slate-400">
              {images.length}/5 images
            </span>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mt-4">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <p className="text-sm text-slate-400 mt-2">Uploading images...</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full py-3 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : isEditing ? 'Update Listing' : 'Create Listing'}
        </button>
      </form>
    </div>
  )
}
