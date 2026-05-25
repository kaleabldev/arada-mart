import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useListings(filters = {}) {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchListings()
  }, [JSON.stringify(filters), user])

  const fetchListings = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('listings')
        .select(`
          *,
          profiles:seller_id (name, telegram_handle)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice)
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice)
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition)
      }
      if (filters.negotiable !== undefined) {
        query = query.eq('negotiable', filters.negotiable)
      }
      if (filters.location) {
        query = query.ilike('location_text', `%${filters.location}%`)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      if (filters.sort === 'price_asc') {
        query = query.order('price', { ascending: true })
      } else if (filters.sort === 'price_desc') {
        query = query.order('price', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      setListings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { listings, loading, error, refetch: fetchListings }
}

export function useListing(id) {
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) fetchListing()
  }, [id])

  const fetchListing = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:seller_id (name, telegram_handle, phone)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setListing(data)

      // Increment view count
      await supabase
        .from('listings')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { listing, loading, error, refetch: fetchListing }
}

export function useUserListings(status = 'active') {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) fetchUserListings()
  }, [user, status])

  const fetchUserListings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error
      setListings(data)
    } catch (err) {
      console.error('Error fetching user listings:', err)
    } finally {
      setLoading(false)
    }
  }

  return { listings, loading, refetch: fetchUserListings }
}
