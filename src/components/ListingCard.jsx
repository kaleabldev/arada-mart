import { Link } from 'react-router-dom'
import { formatPrice, getDaysUntilExpiration, truncateText } from '../lib/utils'
import { MapPin, Eye, Clock } from 'lucide-react'

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

export default function ListingCard({ listing }) {
  const daysLeft = getDaysUntilExpiration(listing.expires_at)
  const mainImage = listing.images?.[0] || '/placeholder-image.png'

  return (
    <Link to={`/listing/${listing.id}`} className="block">
      <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-primary-500 transition-colors">
        {/* Image */}
        <div className="aspect-square relative bg-slate-700">
          <img
            src={mainImage}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-image.png'
            }}
          />
          {listing.negotiable && (
            <span className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
              Negotiable
            </span>
          )}
          <div className="absolute bottom-2 left-2 flex gap-2">
            <span className={`text-xs text-white px-2 py-1 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
              {CONDITION_LABELS[listing.condition]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-100 mb-2 line-clamp-2">
            {truncateText(listing.title, 50)}
          </h3>
          
          <p className="text-2xl font-bold text-primary-500 mb-2">
            {formatPrice(listing.price)}
          </p>

          <div className="flex items-center text-slate-400 text-sm mb-2">
            <MapPin size={16} className="mr-1" />
            <span className="truncate">{truncateText(listing.location_text, 20)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>{daysLeft} days left</span>
            </div>
            <div className="flex items-center">
              <Eye size={14} className="mr-1" />
              <span>{listing.view_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
