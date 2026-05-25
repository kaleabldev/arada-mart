import { useState } from 'react'
import { useListings } from '../hooks/useListings'
import ListingCard from '../components/ListingCard'
import SearchFilters from '../components/SearchFilters'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [filters, setFilters] = useState({
    search: '',
    category: null,
    condition: null,
    minPrice: null,
    maxPrice: null,
    negotiable: undefined,
    location: '',
    sort: 'newest',
  })
  const { listings, loading, error, refetch } = useListings(filters)

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: null,
      condition: null,
      minPrice: null,
      maxPrice: null,
      negotiable: undefined,
      location: '',
      sort: 'newest',
    })
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Welcome to Arada Mart</h1>
        <p className="text-lg text-primary-100">
          Buy and sell used electronics in Ethiopia
        </p>
      </div>

      {/* Search Filters */}
      <SearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md">
          Error loading listings: {error}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No listings found</p>
          <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <p className="text-slate-400 mb-4">
            {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
