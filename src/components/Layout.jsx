import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Plus, MessageSquare, User, LogOut, Menu, X, Shield } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
  const { user, signOut, profile, isAdmin } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-500">Arada Mart</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'bg-slate-700 text-primary-400' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/create-listing"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/create-listing') ? 'bg-slate-700 text-primary-400' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Plus size={18} />
                    <span>Post</span>
                  </Link>
                  <Link
                    to="/chats"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/chats') ? 'bg-slate-700 text-primary-400' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <MessageSquare size={18} />
                    <span>Chats</span>
                  </Link>
                  <Link
                    to="/profile"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/profile') ? 'bg-slate-700 text-primary-400' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/admin') ? 'bg-slate-700 text-primary-400' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Shield size={18} />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={signOut}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-slate-300 hover:bg-slate-700"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700 bg-slate-800">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'bg-slate-700 text-primary-400' : 'text-slate-300'
                }`}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/create-listing"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/create-listing') ? 'bg-slate-700 text-primary-400' : 'text-slate-300'
                    }`}
                  >
                    <Plus size={18} />
                    <span>Post Listing</span>
                  </Link>
                  <Link
                    to="/chats"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/chats') ? 'bg-slate-700 text-primary-400' : 'text-slate-300'
                    }`}
                  >
                    <MessageSquare size={18} />
                    <span>Chats</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive('/profile') ? 'bg-slate-700 text-primary-400' : 'text-slate-300'
                    }`}
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/admin') ? 'bg-slate-700 text-primary-400' : 'text-slate-300'
                      }`}
                    >
                      <Shield size={18} />
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-slate-300 w-full text-left"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-slate-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium bg-primary-600 text-white text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 z-50">
          <div className="flex justify-around items-center h-16">
            <Link
              to="/"
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive('/') ? 'text-primary-400' : 'text-slate-400'
              }`}
            >
              <Home size={20} />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              to="/create-listing"
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive('/create-listing') ? 'text-primary-400' : 'text-slate-400'
              }`}
            >
              <Plus size={20} />
              <span className="text-xs mt-1">Post</span>
            </Link>
            <Link
              to="/chats"
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive('/chats') ? 'text-primary-400' : 'text-slate-400'
              }`}
            >
              <MessageSquare size={20} />
              <span className="text-xs mt-1">Chats</span>
            </Link>
            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive('/profile') ? 'text-primary-400' : 'text-slate-400'
              }`}
            >
              <User size={20} />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  )
}
