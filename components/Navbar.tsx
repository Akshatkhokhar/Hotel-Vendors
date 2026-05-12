'use client';

import Link from 'next/link';
import { 
  User, 
  CaretDown, 
  List, 
  X, 
  SquaresFour, 
  UserCircle, 
  SignOut, 
  CheckCircle, 
  XCircle, 
  Warning, 
  Info,
  Buildings,
  Bed,
  MapPin,
  Camera,
  Trash,
  Heart
} from "@phosphor-icons/react";
import { useUser } from '@/lib/context/UserContext';
import { useSavedVendors } from '@/lib/context/SavedVendorsContext';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, setUser, loading } = useUser();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success' | 'error' | 'info' | 'warning'}[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    
    // Check for login success flag
    const loginSuccess = localStorage.getItem('hv_login_success');
    if (loginSuccess) {
      addToast('Log in successfully', 'success');
      localStorage.removeItem('hv_login_success');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 20);
      
      if (currentY <= 10) {
        setVisible(true);
      } else if (currentY > lastScrollY.current && currentY > 100) {
        setVisible(false); // scrolling down
      } else {
        setVisible(true); // scrolling up
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [hotelInfo, setHotelInfo] = useState({
    hotel_name: '',
    hotel_type: 'Hotel',
    num_rooms: '',
    city: '',
    state: '',
    avatar_url: ''
  });

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000); // 3s visible + 1s buffer
  };

  useEffect(() => {
    if (user && user.role === 'hotel_owner') {
      // Load existing hotel info if available
      const stored = localStorage.getItem(`hotel_info_${user.id}`);
      if (stored) {
        setHotelInfo(JSON.parse(stored));
      }
    }
  }, [user]);

  const handleHotelInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHotelInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Image too large. Please select an image under 5MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setHotelInfo(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarRemove = () => {
    setHotelInfo(prev => ({ ...prev, avatar_url: '' }));
  };

  const saveHotelInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      localStorage.setItem(`hotel_info_${user.id}`, JSON.stringify(hotelInfo));
      // Optionally update user context if needed
      setUser({ ...user, company: hotelInfo.hotel_name });
      setShowProfileModal(false);
      addToast('Profile updated successfully!', 'success');
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', active: pathname === '/' },
    { href: '/vendors', label: 'Categories', active: pathname?.startsWith('/vendors') },
    { href: '/deals', label: 'Deals', active: pathname?.startsWith('/deals') },
    { href: '/blog', label: 'Blog', active: pathname?.startsWith('/blog') },
  ];

    const { savedCount } = useSavedVendors();

    return (
    <>
      <nav className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out
        ${visible ? 'translate-y-0' : '-translate-y-full'}
        ${scrolled 
          ? 'bg-white/95 dark:bg-surface/95 backdrop-blur-xl border-b border-outline/10 shadow-lg shadow-primary/5' 
          : 'bg-transparent'
        }
      `}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link 
              href="/" 
              className="group flex items-center space-x-3 transition-transform duration-300 hover:scale-105"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-muted-teal rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-display font-bold text-lg">H</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-muted-teal rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
              </div>
              <span className={`font-display font-semibold text-2xl tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-foreground' : 'text-white'
              }`}>
                HotelVendors
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 group
                    ${link.active 
                      ? scrolled 
                        ? 'text-primary bg-primary/10' 
                        : 'text-white bg-white/20'
                      : scrolled 
                        ? 'text-foreground/70 hover:text-primary hover:bg-primary/5' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className="relative z-10">{link.label}</span>
                  {link.active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-muted-teal/20 rounded-xl"></div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-muted-teal/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              
              {/* Login/CTA Section (Guarded for Hydration & Loading) */}
              {(!isMounted || loading) ? (
                <>
                  <div className="w-8 h-8 bg-primary/10 rounded-full animate-pulse" />
                  <div className="w-32 h-10 bg-primary/20 rounded-xl animate-pulse" />
                </>
              ) : (
                <>
                  {/* Saved Vendors Button */}
                  <Link 
                    href="/saved-vendors"
                    className={`
                      relative p-2 rounded-xl transition-all duration-300 hover:scale-110 group
                      ${scrolled 
                        ? 'text-foreground/70 hover:text-rose-500 hover:bg-rose-50' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                      }
                    `}
                    title="Saved Vendors"
                  >
                    <Heart size={24} weight={savedCount > 0 ? "fill" : "light"} className={`transition-all duration-300 ${savedCount > 0 ? 'text-rose-500' : ''}`} />
                    {savedCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {savedCount}
                      </span>
                    )}
                  </Link>

                  {!user ? (
                    <Link 
                      href="/auth?register=true" 
                      className="group relative px-6 py-3 bg-gradient-to-r from-primary to-muted-teal text-white font-semibold text-sm rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 overflow-hidden"
                    >
                      <span className="relative z-10">List Your Business</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-muted-teal to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Link>
                  ) : (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`
                          flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105
                          ${scrolled 
                            ? 'text-foreground/70 hover:text-primary hover:bg-primary/5' 
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gradient-to-br from-[#4F7575] to-[#86A39E] flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-105">
                          {(user.role === 'hotel_owner' && hotelInfo.avatar_url) ? (
                            <img src={hotelInfo.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} weight="light" />
                          )}
                        </div>
                        <span>{user.name?.split(' ')[0]}</span>
                        <CaretDown size={16} weight="light" className={`transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Profile Dropdown Content */}
                      {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface rounded-2xl shadow-elegant border border-outline/10 overflow-hidden animate-fade-in-up py-2 z-[60]">
                          <div className="px-4 py-3 border-b border-outline/5">
                            <p className="text-xs font-bold text-muted-teal uppercase tracking-widest mb-1">Signed in as</p>
                            <p className="text-sm font-semibold truncate">{user.email}</p>
                            <p className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block mt-1 font-bold">
                              {user.role === 'hotel_owner' ? 'Hotel Owner' : user.role === 'vendor' ? 'Vendor' : 'Admin'}
                            </p>
                          </div>
                          
                          {user.role === 'vendor' && (
                            <Link 
                              href="/dashboard/vendor"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-sm text-foreground/70 hover:text-primary hover:bg-primary/5 transition-colors"
                            >
                              <SquaresFour size={18} weight="light" />
                              <span>Dashboard</span>
                            </Link>
                          )}

                          <button
                            onClick={() => {
                              setShowProfileModal(true);
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-foreground/70 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <UserCircle size={18} weight="light" />
                            <span>Edit Profile</span>
                          </button>

                          <div className="h-px bg-outline/5 my-1" />

                          <button
                            onClick={() => {
                              addToast('Log out successfully', 'info');
                              logout();
                              setIsProfileOpen(false);
                              router.push('/');
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <SignOut size={18} weight="light" />
                            <span>Logout</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`
                lg:hidden relative w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105
                ${scrolled 
                  ? 'text-foreground hover:bg-primary/5' 
                  : 'text-white hover:bg-white/10'
                }
              `}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {isMenuOpen ? (
                  <X size={24} weight="light" />
                ) : (
                  <List size={24} weight="light" />
                )}
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`
        fixed inset-0 z-40 lg:hidden transition-all duration-500 ease-out
        ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
      `}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        
        <div className={`
          absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-surface shadow-2xl transition-transform duration-500 ease-out
          ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-6 border-b border-outline/10">
              <span className="font-display font-semibold text-xl text-foreground">Menu</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-lg text-foreground/60 hover:text-foreground hover:bg-primary/5 transition-colors duration-200 flex items-center justify-center"
              >
                <X size={20} weight="light" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 px-6 py-8 space-y-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    block px-4 py-4 rounded-xl font-medium transition-all duration-300 group
                    ${link.active 
                      ? 'text-primary bg-primary/10 border-l-4 border-primary' 
                      : 'text-foreground/70 hover:text-primary hover:bg-primary/5'
                    }
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-lg">{link.label}</span>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-outline/10 mt-6 space-y-2">


                {!isMounted ? (
                   <Link 
                     href="/auth"
                     onClick={() => setIsMenuOpen(false)}
                     className="block px-4 py-4 rounded-xl font-medium text-lg text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                   >
                     Login
                   </Link>
                ) : user ? (
                  <>
                      <Link 
                        href="/dashboard/vendor"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-4 rounded-xl font-medium text-lg text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                      >
                        Dashboard
                      </Link>
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-4 rounded-xl font-medium text-lg text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        addToast('Log out successfully', 'info');
                        logout();
                        setIsMenuOpen(false);
                        router.push('/');
                      }}
                      className="block w-full text-left px-4 py-4 rounded-xl font-medium text-lg text-rose-500 hover:bg-rose-500/10 transition-all duration-300"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-4 rounded-xl font-medium text-lg text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all duration-300"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="p-6 border-t border-outline/10">
              <Link 
                href="/auth?register=true"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full px-6 py-4 bg-gradient-to-r from-primary to-muted-teal text-white font-semibold text-center rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                List Your Business
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        user={user}
        hotelInfo={hotelInfo}
        onChange={handleHotelInfoChange}
        onAvatarUpload={handleAvatarUpload}
        onAvatarRemove={handleAvatarRemove}
        onSave={saveHotelInfo}
      />

      {/* Global Toast Container */}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4">
         {toasts.map(toast => (
           <ToastNotification 
             key={toast.id} 
             toast={toast} 
             onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
           />
         ))}
      </div>
    </>
  );
}

function ToastNotification({ toast, onClose }: { 
  toast: {id: string, message: string, type: 'success' | 'error' | 'info' | 'warning'}, 
  onClose: () => void 
}) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    const autoHide = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 3500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(autoHide);
    };
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-primary'
  };

  const icons = {
    success: <CheckCircle size={20} weight="light" />,
    error: <XCircle size={20} weight="light" />,
    warning: <Warning size={20} weight="light" />,
    info: <Info size={20} weight="light" />
  };

  return (
    <div className={`
      flex items-center gap-4 bg-white/90 backdrop-blur-xl border border-outline/10 p-5 rounded-[24px] modern-shadow transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
      ${visible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
    `}>
       <div className={`w-10 h-10 rounded-2xl ${colors[toast.type]} text-white flex items-center justify-center shadow-lg`}>
          {icons[toast.type]}
       </div>
       <div className="flex-1 min-w-[200px]">
          <p className="text-xs font-bold text-foreground leading-none mb-1 capitalize">{toast.type}</p>
          <p className="text-sm text-muted-teal leading-tight">{toast.message}</p>
       </div>
       <button 
         onClick={() => { setVisible(false); setTimeout(onClose, 500); }}
         className="w-8 h-8 rounded-xl hover:bg-black/5 transition-colors flex items-center justify-center text-muted-teal"
       >
          <X size={16} weight="light" />
       </button>
       {/* Progress Bar */}
       <div className="absolute bottom-0 left-5 right-5 h-[2px] bg-outline/5 overflow-hidden rounded-full">
          <div className={`h-full ${colors[toast.type]} animate-toast-progress`} />
       </div>
    </div>
  );
}

function ProfileModal({ isOpen, onClose, user, hotelInfo, onChange, onAvatarUpload, onAvatarRemove, onSave }: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any; 
  hotelInfo: any; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; 
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarRemove: () => void;
  onSave: (e: React.FormEvent) => void; 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="bg-[#FAF8F5] w-full max-w-xl rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.15)] overflow-hidden animate-scale-up border border-white/20">
        {/* Elegant Header */}
        <div className="p-10 border-b border-[#E8E0D8] bg-white/50 backdrop-blur-sm flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-display font-bold text-[#4F7575] leading-tight mb-1">Property Profile</h2>
            <p className="text-xs font-bold text-[#86A39E] uppercase tracking-[0.2em] opacity-60">Identity & Property Specifications</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-[#FAF8F5] border border-[#E8E0D8] rounded-2xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all duration-300 group">
            <X size={20} weight="light" className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <form onSubmit={onSave} className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-6 pb-4 border-b border-[#E8E0D8]/50">
             <div className="relative group">
                <div className="w-32 h-32 rounded-[32px] bg-white border-2 border-[#E8E0D8] overflow-hidden modern-shadow transition-transform duration-500 group-hover:scale-105">
                   {hotelInfo.avatar_url ? (
                      <img src={hotelInfo.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#4F7575]/5 to-[#86A39E]/5 text-[#4F7575]/20">
                         <User size={48} weight="light" className="mb-2" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                      </div>
                   )}
                   {/* Overlay */}
                   <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                      <div className="text-white flex flex-col items-center gap-2">
                         <Camera size={24} weight="light" />
                         <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Upload Photo</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
                   </label>
                </div>
                {hotelInfo.avatar_url && (
                   <button 
                     type="button"
                     onClick={onAvatarRemove}
                     className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                   >
                      <Trash size={16} weight="light" />
                   </button>
                )}
             </div>
             <div className="text-center">
                <p className="text-[10px] font-bold text-[#4F7575] uppercase tracking-[0.2em] mb-1">Business Avatar</p>
                <p className="text-[9px] text-[#86A39E] font-medium tracking-wide">Recommended: Square PNG/JPG (Max 5MB)</p>
             </div>
          </div>

          <div className="space-y-8">
            {/* Field: Hotel Name */}
            <div className="space-y-3 group">
              <label className="block text-[11px] font-bold text-[#4F7575] uppercase tracking-widest opacity-60 transition-opacity group-focus-within:opacity-100">Hotel / Motel Designation</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4F7575]/30">
                   <Buildings size={20} weight="light" />
                </div>
                <input
                  type="text"
                  name="hotel_name"
                  value={hotelInfo.hotel_name}
                  onChange={onChange}
                  required
                  className="w-full bg-white border border-[#E8E0D8] pl-14 pr-6 py-5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F7575]/10 focus:border-[#4F7575] font-body text-sm text-[#4F7575] transition-all modern-shadow placeholder:text-[#4F7575]/20"
                  placeholder="e.g. The Ritz-Carlton Grand Palace"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Field: Hotel Type */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-[#4F7575] uppercase tracking-widest opacity-60">Property Type</label>
                <div className="relative">
                  <select
                    name="hotel_type"
                    value={hotelInfo.hotel_type}
                    onChange={onChange}
                    className="w-full bg-white border border-[#E8E0D8] px-6 py-5 rounded-2xl focus:outline-none focus:border-[#4F7575] font-body text-sm text-[#4F7575] transition-all modern-shadow appearance-none"
                  >
                    <option>Hotel</option>
                    <option>Motel</option>
                    <option>Resort</option>
                    <option>B&B</option>
                    <option>Boutique</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#4F7575]/30">
                    <CaretDown size={16} weight="light" />
                  </div>
                </div>
              </div>

              {/* Field: Number of Rooms */}
              <div className="space-y-3 group">
                <label className="block text-[11px] font-bold text-[#4F7575] uppercase tracking-widest opacity-60">Room Inventory</label>
                <div className="relative">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4F7575]/30">
                      <Bed size={20} weight="light" />
                   </div>
                  <input
                    type="number"
                    name="num_rooms"
                    value={hotelInfo.num_rooms}
                    onChange={onChange}
                    className="w-full bg-white border border-[#E8E0D8] pl-14 pr-6 py-5 rounded-2xl focus:outline-none focus:border-[#4F7575] font-body text-sm text-[#4F7575] transition-all modern-shadow placeholder:text-[#4F7575]/20"
                    placeholder="120"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Field: City */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-[#4F7575] uppercase tracking-widest opacity-60">City / Municipality</label>
                <input
                  type="text"
                  name="city"
                  value={hotelInfo.city}
                  onChange={onChange}
                  className="w-full bg-white border border-[#E8E0D8] px-6 py-5 rounded-2xl focus:outline-none focus:border-[#4F7575] font-body text-sm text-[#4F7575] transition-all modern-shadow placeholder:text-[#4F7575]/20"
                  placeholder="New York"
                />
              </div>
              {/* Field: State */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-[#4F7575] uppercase tracking-widest opacity-60">State / Province</label>
                <input
                  type="text"
                  name="state"
                  value={hotelInfo.state}
                  onChange={onChange}
                  className="w-full bg-white border border-[#E8E0D8] px-6 py-5 rounded-2xl focus:outline-none focus:border-[#4F7575] font-body text-sm text-[#4F7575] transition-all modern-shadow placeholder:text-[#4F7575]/20"
                  placeholder="NY"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 border border-[#E8E0D8] rounded-full font-bold text-[11px] uppercase tracking-widest text-[#4F7575] hover:bg-white transition-all active:scale-95"
            >
              Cancel Update
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-5 bg-[#4F7575] text-white rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-[#3d5a5a] hover-shine transition-all active:scale-95 shadow-xl shadow-[#4F7575]/20"
            >
              Verify & Save →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
