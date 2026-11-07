import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  Search,
  PlusCircle,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ShoppingBag,
  Layers,
  Shield,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/items?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/rentloop-logo.png"
                alt="RentLoop Logo"
                className="w-10 h-10 object-contain rounded-lg drop-shadow-xs group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-teal-600 font-black text-xl">RL</span>';
                }}
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                  Rent<span className="text-teal-600">Loop</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 -mt-1">
                  Peer-to-Peer Trust
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                to="/items"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/items') ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Browse Items
              </Link>

              {/* Consumer Renter / Owner Links ONLY (Hidden for System Administrator) */}
              {user && !isAdmin && (
                <>
                  <Link
                    to="/renter/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      location.pathname.startsWith('/renter')
                        ? 'text-teal-700 bg-teal-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Renting
                  </Link>
                  <Link
                    to="/owner/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      location.pathname.startsWith('/owner')
                        ? 'text-teal-700 bg-teal-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Listings
                  </Link>
                </>
              )}

              {/* Administrator Only Desk Link */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    location.pathname.startsWith('/admin')
                      ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-2xs'
                      : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Admin Desk</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tools, cameras, gear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm rounded-full border border-transparent focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </form>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Regular User: "+ List an Item" button */}
                {!isAdmin && (
                  <Link
                    to="/owner/dashboard?action=new"
                    className="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-teal-400" />
                    <span>List an Item</span>
                  </Link>
                )}

                {/* Administrator: Direct Control Room Access Button */}
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Control Room</span>
                  </Link>
                )}

                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link_url) {
                                  navigate(n.link_url);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.is_read ? 'bg-teal-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Menu ("downbar") */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ${
                      isAdmin ? 'bg-indigo-900 text-indigo-200 ring-indigo-500/40' : 'bg-slate-200 text-slate-700 ring-teal-500/20'
                    }`}>
                      {isAdmin ? 'AD' : (user.fullName ? user.fullName[0].toUpperCase() : 'U')}
                    </div>
                    <span className="hidden md:inline-block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                      {user.fullName ? user.fullName.split(' ')[0] : 'Account'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* USER DROPDOWN ("DOWNBAR") WITH STRICT RBAC */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      
                      {/* User Account Header */}
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                          {isAdmin && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>

                      {/* ROLE-AWARE ACTIONS */}
                      {isAdmin ? (
                        /* ================================================= */
                        /* SYSTEM ADMINISTRATOR ACTIONS ONLY                 */
                        /* (No consumer Renter / Owner / Verification links) */
                        /* ================================================= */
                        <div className="py-1">
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 font-bold transition-colors"
                          >
                            <Shield className="w-4 h-4 text-indigo-600" />
                            <span>Admin Control Center</span>
                          </Link>
                          <Link
                            to="/items"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                          >
                            <Search className="w-4 h-4 text-slate-400" />
                            <span>Browse Marketplace</span>
                          </Link>
                        </div>
                      ) : (
                        /* ================================================= */
                        /* REGULAR REGISTERED USER (Renter / Owner)          */
                        /* ================================================= */
                        <div className="py-1">
                          <Link
                            to="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span>Profile & Verification</span>
                          </Link>
                          <Link
                            to="/renter/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                            <span>Renter Dashboard</span>
                          </Link>
                          <Link
                            to="/owner/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                          >
                            <Layers className="w-4 h-4 text-slate-400" />
                            <span>Owner Dashboard</span>
                          </Link>
                        </div>
                      )}

                      {/* Sign Out Button */}
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <form onSubmit={handleSearchSubmit} className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-sm"
              />
            </div>
          </form>

          <Link
            to="/items"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Browse All Items
          </Link>

          {user && (
            <>
              {isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-indigo-700 bg-indigo-50"
                >
                  Admin Control Center
                </Link>
              ) : (
                <>
                  <Link
                    to="/renter/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Renter Dashboard
                  </Link>
                  <Link
                    to="/owner/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Owner Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Profile & Identity Verification
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      )}
    </nav>
  );
}
