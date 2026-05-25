import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { 
  Shield, 
  Coins, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Loader2,
  Users,
  Package
} from 'lucide-react'

export default function AdminPanel() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('credits')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Credit management state
  const [creditEmail, setCreditEmail] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [userProfiles, setUserProfiles] = useState([])

  // Reports state
  const [reports, setReports] = useState([])

  // Flagged content state
  const [flaggedListings, setFlaggedListings] = useState([])
  const [flaggedMessages, setFlaggedMessages] = useState([])

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserProfiles(data)
    } catch (err) {
      console.error('Error fetching profiles:', err)
    }
  }

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:reporter_id (name, email)
        `)
        .eq('resolved', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data)
    } catch (err) {
      console.error('Error fetching reports:', err)
    }
  }

  const fetchFlaggedMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (name, email),
          conversation:conversation_id (
            listing_id,
            buyer_id,
            seller_id
          )
        `)
        .eq('is_reported', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFlaggedMessages(data)
    } catch (err) {
      console.error('Error fetching flagged messages:', err)
    }
  }

  useState(() => {
    if (activeTab === 'credits') fetchUserProfiles()
    if (activeTab === 'reports') fetchReports()
    if (activeTab === 'flagged') {
      fetchFlaggedMessages()
    }
  }, [activeTab])

  const handleAddCredits = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', creditEmail)
        .single()

      if (profileError || !profile) {
        setError('User not found with that email')
        setLoading(false)
        return
      }

      // Update credits
      const newCredits = (profile.listing_credits || 0) + parseInt(creditAmount)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ listing_credits: newCredits })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Record transaction
      await supabase.from('credit_transactions').insert({
        user_id: profile.id,
        amount: parseInt(creditAmount),
        reason: 'admin_grant',
      })

      setSuccess(`Successfully added ${creditAmount} credits to ${profile.name}`)
      setCreditEmail('')
      setCreditAmount('')
      fetchUserProfiles()
    } catch (err) {
      setError('Failed to add credits')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveReport = async (reportId) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ resolved: true })
        .eq('id', reportId)

      if (error) throw error
      fetchReports()
    } catch (err) {
      setError('Failed to resolve report')
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error
      setSuccess('Listing deleted successfully')
    } catch (err) {
      setError('Failed to delete listing')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
      setSuccess('Message deleted successfully')
      fetchFlaggedMessages()
    } catch (err) {
      setError('Failed to delete message')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Shield size={32} className="mr-3 text-primary-500" />
        Admin Panel
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'credits'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Coins size={18} className="inline mr-2" />
            Manage Credits
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'reports'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <AlertTriangle size={18} className="inline mr-2" />
            Reports
          </button>
          <button
            onClick={() => setActiveTab('flagged')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'flagged'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <AlertTriangle size={18} className="inline mr-2" />
            Flagged Content
          </button>
        </nav>
      </div>

      {/* Credits Tab */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Add Credits to User</h2>
            <form onSubmit={handleAddCredits} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={creditEmail}
                  onChange={(e) => setCreditEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-600 rounded-md bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin inline" size={20} />
                ) : (
                  'Add Credits'
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users size={20} className="mr-2" />
              User Profiles
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Name</th>
                    <th className="text-left py-3 px-4 text-slate-400">Email</th>
                    <th className="text-left py-3 px-4 text-slate-400">Credits</th>
                    <th className="text-left py-3 px-4 text-slate-400">Free Listings</th>
                    <th className="text-left py-3 px-4 text-slate-400">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {userProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-slate-700">
                      <td className="py-3 px-4">{profile.name}</td>
                      <td className="py-3 px-4">{profile.email}</td>
                      <td className="py-3 px-4 font-semibold text-primary-500">
                        {profile.listing_credits || 0}
                      </td>
                      <td className="py-3 px-4">{profile.free_listings_used || 0}/1</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          profile.role === 'admin' ? 'bg-purple-600' : 'bg-slate-600'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">User Reports</h2>
          {reports.length === 0 ? (
            <p className="text-slate-400">No unresolved reports</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{report.target_type}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        Reported by: {report.reporter?.name} ({report.reporter?.email})
                      </p>
                      <p className="text-slate-300 mt-2">{report.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flagged Content Tab */}
      {activeTab === 'flagged' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              Flagged Messages
            </h2>
            {flaggedMessages.length === 0 ? (
              <p className="text-slate-400">No flagged messages</p>
            ) : (
              <div className="space-y-4">
                {flaggedMessages.map((msg) => (
                  <div key={msg.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{msg.sender?.name}</p>
                        <p className="text-slate-400 text-sm">{msg.sender?.email}</p>
                        <p className="text-slate-300 mt-2 bg-slate-800 p-3 rounded">
                          {msg.content}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
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
        </div>
      )}
    </div>
  )
}
