import { Search, Filter, X } from 'lucide-react'

const CATEGORIES = ['All', 'Phones', 'Laptops', 'Tablets', 'Headphones', 'Accessories', 'Other']
const CONDITIONS = ['All', 'new', 'like_new', 'good', 'fair']
const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

export default function SearchFilters({ filters, onFiltersChange, onReset }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <Filter size={20} className="mr-2" />
          Filters
        </h3>
        <button
          onClick={onReset}
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center"
        >
          <X size={16} className="mr-1" />
          Reset
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search listings..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Category
          </label>
          <select
            value={filters.category || 'All'}
            onChange={(e) => handleFilterChange('category', e.target.value === 'All' ? null : e.target.value)}
            className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Condition
          </label>
          <select
            value={filters.condition || 'All'}
            onChange={(e) => handleFilterChange('condition', e.target.value === 'All' ? null : e.target.value)}
            className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond === 'All' ? 'All' : CONDITION_LABELS[cond]}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Sort By
          </label>
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Min Price (ETB)
          </label>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Max Price (ETB)
          </label>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Negotiable */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Negotiable
          </label>
          <select
            value={filters.negotiable !== undefined ? String(filters.negotiable) : 'all'}
            onChange={(e) => handleFilterChange('negotiable', e.target.value === 'all' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Location */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Location
          </label>
          <input
            type="text"
            placeholder="e.g., Bole, Addis Ababa"
            value={filters.location || ''}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  )
}
