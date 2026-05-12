'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  SquaresFour,
  UserCircle,
  EnvelopeSimple,
  Star,
  ChartLineUp,
  Gear,
  Eye,
  TrendUp,
  TrendDown,
  Globe,
  Phone,
  User,
  Plus,
  ArrowRight,
  Check,
  X,
  Buildings,
  MapPin,
  PencilSimple,
  Trash,
  ShieldCheck,
  Upload,
  ChatCircleText,
  Clock,
  BookOpen,
  List,
  SignOut,
  Users,
  ImageSquare,
  CaretDown
} from "@phosphor-icons/react";
import { useUser } from '@/lib/context/UserContext';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

// ════════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════════════════════

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

const SIDEBAR_OPTIONS = [
  { id: 'overview', label: 'Overview', icon: SquaresFour },
  { id: 'profile', label: 'My Profile', icon: UserCircle },
  { id: 'inbox', label: 'Inbox', icon: EnvelopeSimple },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'analytics', label: 'Analytics', icon: ChartLineUp },
  { id: 'settings', label: 'Settings', icon: Gear },
];

interface KPIStats {
  views: number;
  viewsTrend: number;
  inquiries: number;
  unreadInquiries: number;
  rating: number;
  reviewCount: number;
  plan: 'STANDARD' | 'PREMIUM';
  sparklineData: number[];
  marketTotal: number;
}

interface Inquiry {
  id: string;
  guest_name: string;
  guest_email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'closed';
  created_at: string;
  hotel_name?: string;
}

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  hotel_name?: string;
  response?: string;
  response_at?: string;
}

interface VendorProfile {
  id: string;
  company_name: string;
  tagline: string;
  description: string;
  logo_url: string;
  website: string;
  category_ids: string[];
  vendor_locations: any[];
  vendor_contacts: any[];
}

// ════════════════════════════════════════════════════════════════════════════════
// MODERN UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════════

const CountUp = ({ end, decimals = 0, duration = 1000 }: { end: number, decimals?: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(progress * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <>{count.toFixed(decimals)}</>;
};

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="opacity-40"
      />
    </svg>
  );
};

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-shimmer bg-gradient-to-r from-outline/5 via-outline/15 to-outline/5 bg-[length:200%_100%] rounded-lg ${className}`} />
);

const EmptyState = ({ icon, title, description, actionText, actionLink }: {
  icon: React.ReactNode, title: string, description: string, actionText?: string, actionLink?: string
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
    <div className="mb-6 text-primary/40 scale-125">{icon}</div>
    <h4 className="font-body font-bold text-lg text-foreground mb-2">{title}</h4>
    <p className="text-sm text-muted-teal max-w-[280px] leading-relaxed mb-8">{description}</p>
    {actionText && actionLink && (
      <Link href={actionLink} className="bg-primary hover-shine text-white font-bold px-8 py-3 rounded-full text-xs tracking-widest uppercase transition-all active:scale-95">
        {actionText}
      </Link>
    )}
  </div>
);

const ErrorState = ({ message, retry }: { message: string, retry: () => void }) => (
  <div className="p-12 text-center bg-terracotta/5 rounded-3xl border border-terracotta/10">
    <p className="text-sm font-bold text-terracotta mb-4">{message}</p>
    <button onClick={retry} className="text-xs font-bold text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">Try Again</button>
  </div>
);

const StarRow = ({ rating, size = "w-4 h-4" }: { rating: number, size?: string }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={16} weight={s <= rating ? 'fill' : 'light'} className={`${s <= rating ? 'text-[#D8994E]' : 'text-gray-200'} ${size}`} />
    ))}
  </div>
);

// ════════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════════

export default function VendorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { user, logout, loading: authLoading } = useUser();
  const supabase = useMemo(() => createSupabaseClient(), []);

  // States
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [completeness, setCompleteness] = useState(0);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [loadingInquiry, setLoadingInquiry] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sectorInput, setSectorInput] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [previewProfile, setPreviewProfile] = useState<any>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'warning') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Auth Guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const token = localStorage.getItem('hv_token');
      if (!token) router.push('/');
    } else if (user.role !== 'vendor') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, profRes, inqRes, catRes] = await Promise.all([
        apiFetch('/api/dashboard/vendor'),
        apiFetch('/api/dashboard/vendor/profile'),
        apiFetch('/api/inquiries?limit=50'),
        apiFetch('/api/categories')
      ]);

      if (dashRes?.success) {
        const d = dashRes.data;
        setCompleteness(d.completeness || 0);
        setStats({
          views: d.stats?.views?.last30Days || 0,
          viewsTrend: d.stats?.views?.trend || 0,
          inquiries: d.stats?.inquiries?.total || 0,
          unreadInquiries: d.stats?.inquiries?.unread || 0,
          rating: d.stats?.reviews?.average || 0,
          reviewCount: d.stats?.reviews?.total || 0,
          plan: d.subscription?.status === 'active' ? 'PREMIUM' : 'STANDARD',
          sparklineData: d.stats?.views?.sparkline || [],
          marketTotal: d.stats?.marketTotal || 0
        });
        setRecentInquiries(d.recentInquiries || []);
        setRecentReviews(d.recentReviews || []);
      } else {
        setError(dashRes?.message || 'Failed to load dashboard');
      }

      if (profRes?.success) {
        setProfile(profRes.data);
        if (profRes.data.logo_url) setLogoPreview(profRes.data.logo_url);
        if (profRes.data.tagline) {
          const tags = profRes.data.tagline.split(',').map((s: string) => s.trim()).filter(Boolean);
          setSectors(tags);
        }
      }

      if (inqRes?.success) setAllInquiries(inqRes.data || []);
      if (catRes?.success) setCategories(catRes.data.parent_categories || []);

      // Fetch all reviews if vendor exists
      if (profRes?.data?.id) {
        const revRes = await apiFetch(`/api/reviews?vendor_id=${profRes.data.id}&limit=50`);
        if (revRes?.success) {
          setAllReviews(revRes.data.reviews || []);
        }
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/dashboard/vendor/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hv_token')}`
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (!data.success) {
        console.error('Upload Error:', data.message);
        return null;
      }
      
      return data.data.url;
    } catch (err) {
      console.error('Exception during upload:', err);
      return null;
    }
  };

  const handleFormSubmitToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const data = {
      company_name: formData.get('company_name'),
      city: formData.get('city'),
      state: formData.get('state'),
      contact_name: formData.get('contact_name'),
      contact_email: formData.get('contact_email'),
      phone: formData.get('phone')
    };
    setPreviewProfile(data);
    setShowCardPreview(true);
    addToast('Business card generated! Review and submit below.', 'success');
  };

  const handleSaveProfile = async () => {
    if (!formRef.current) return;
    setSavingProfile(true);

    try {
      const formData = new FormData(formRef.current);
      let logo_url = profile?.logo_url;
      if (logoFile) {
        const uploadedUrl = await uploadLogo(logoFile);
        if (uploadedUrl) {
          logo_url = uploadedUrl;
        } else {
          addToast('Logo upload failed. Please try again or check storage permissions.', 'error');
          setSavingProfile(false);
          return;
        }
      }
      const payload = {
        company_name: formData.get('company_name') as string,
        tagline: sectors.join(', '),
        description: formData.get('description') as string,
        logo_url,
        category_ids: formData.get('category_id') === 'other' ? [] : [formData.get('category_id') as string].filter(Boolean),
        custom_category: formData.get('category_id') === 'other' ? formData.get('custom_category') as string : null,
        locations: [{ 
          address_line_1: formData.get('address_line_1') as string,
          city: formData.get('city') as string, 
          state: formData.get('state') as string, 
          postal_code: formData.get('postal_code') as string,
          is_primary: true 
        }],
        contacts: [{ 
          contact_name: formData.get('contact_name') as string, 
          email: formData.get('contact_email') as string, 
          phone: formData.get('phone') as string, 
          is_primary: true 
        }]
      };
      const res = await apiFetch('/api/dashboard/vendor/profile', { method: 'PUT', body: JSON.stringify(payload) });
      if (res?.success) {
        addToast('Card submitted to marketplace successfully!', 'success');
        setProfile(res.data);
        setCompleteness(100);
      } else {
        addToast(res?.message || 'Synchronization failed', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'A network error occurred', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleViewInquiry = async (inquiryId: string) => {
    setSelectedInquiryId(inquiryId);
    setLoadingInquiry(true);
    try {
      const res = await apiFetch(`/api/inquiries/${inquiryId}`);
      if (res.success) {
        setSelectedInquiry(res.data);
        // Update local list to mark as read
        setAllInquiries(prev => prev.map(inq => inq.id === inquiryId ? { ...inq, status: 'read' } : inq));
      } else {
        addToast(res.message || 'Failed to load message thread', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'An error occurred', 'error');
    } finally {
      setLoadingInquiry(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiryId || !replyMessage.trim()) return;
    setSendingReply(true);
    try {
      const res = await apiFetch(`/api/inquiries/${selectedInquiryId}`, {
        method: 'POST',
        body: JSON.stringify({ body: replyMessage })
      });
      if (res.success) {
        addToast('Reply sent successfully!', 'success');
        setReplyMessage('');
        // Refresh the thread
        const updated = await apiFetch(`/api/inquiries/${selectedInquiryId}`);
        if (updated.success) setSelectedInquiry(updated.data);
      } else {
        addToast(res.message || 'Failed to send reply', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'An error occurred', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!confirm('Are you sure? This will hide your business from all hotel owners.')) return;
    setSavingProfile(true);
    try {
      const res = await apiFetch('/api/dashboard/vendor/profile', { method: 'DELETE' });
      if (res.success) {
        addToast('Card removed from marketplace', 'success');
        setProfile(null);
        setSectors([]);
        setLogoPreview(null);
        setCompleteness(0);
        if (formRef.current) formRef.current.reset();
      } else {
        addToast(res.message || 'Failed to remove card', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'An error occurred', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  // Sync logo preview when profile changes
  useEffect(() => {
    if (profile?.logo_url && !logoFile) {
      setLogoPreview(profile.logo_url);
    }
  }, [profile, logoFile]);

  const handleTabChange = (tab: string) => {
    router.push(`/dashboard/vendor?tab=${tab}`);
  };

  const userName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'Vendor';

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] font-body text-[#1A1A1A] selection:bg-[#4F7575]/10 overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#4F7575] text-white transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'}`}>
        <div className={`p-8 flex items-center justify-between ${!sidebarOpen && 'lg:justify-center lg:px-0'}`}>
          <Link href="/" className={`font-display font-bold transition-all duration-300 ${sidebarOpen ? 'text-2xl' : 'text-0 opacity-0 lg:text-xl lg:opacity-100'}`}>
            {sidebarOpen ? 'HotelVendors' : 'HV'}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white/60 hover:text-white">
            <X size={24} weight="light" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {SIDEBAR_OPTIONS.map((option) => (
            <button key={option.id} onClick={() => handleTabChange(option.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${activeTab === option.id ? 'bg-white/10 text-white shadow-lg' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
              {activeTab === option.id && <div className="absolute left-0 w-1.5 h-6 bg-[#D8994E] rounded-full" />}
              <option.icon size={20} weight={activeTab === option.id ? 'fill' : 'light'} />
              <span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>{option.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/10">
          <button onClick={logout} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/60 hover:bg-white/5 hover:text-white transition-all duration-300 ${!sidebarOpen && 'lg:justify-center lg:px-0'}`}>
            <SignOut size={20} weight="light" />
            <span className={`text-sm font-medium transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:hidden'}`}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-[#E8E0D8]/40 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2.5 bg-[#FAF9F6] text-[#4F7575] rounded-xl hover:bg-[#4F7575] hover:text-white transition-all shadow-sm">
              <List size={20} weight="light" />
            </button>
            <h2 className="text-xl font-display font-bold text-[#4F7575] hidden sm:block">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 bg-[#FAF9F6] px-4 py-2 rounded-2xl border border-[#E8E0D8]/40">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-[#4F7575] uppercase tracking-widest">System Active</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#1A1A1A] leading-none">{userName}</p>
                <p className="text-[10px] font-bold text-[#D8994E] uppercase tracking-tighter mt-1">Vendor Partner</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F7575] to-[#86A39E] flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white ring-1 ring-[#4F7575]/10">
                {userName[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 pb-32 max-w-[1600px] mx-auto w-full">
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-fade-in">
              <div className="relative bg-[#4F7575] rounded-[40px] p-10 md:p-14 text-white overflow-hidden shadow-2xl group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                  <div className="flex-1 space-y-6">
                    <span className="inline-block bg-white/10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">Growth Engine</span>
                    <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">Elevate your <span className="text-[#D8994E]">hospitality presence</span> to the next tier.</h1>
                    <p className="text-white/60 text-sm max-w-lg leading-relaxed">Your profile is {completeness}% complete. Achieving 100% visibility increases your chances of being shortlisted by hotel groups by up to 3x.</p>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => handleTabChange('profile')} className="bg-[#D8994E] hover:bg-[#C4883F] text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#D8994E]/20 transition-all active:scale-95">Complete Setup</button>
                      <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md transition-all">View Trends</button>
                    </div>
                  </div>
                  <div className="w-48 h-48 md:w-64 md:h-64 relative flex-shrink-0">
                    <svg className="w-full h-full text-white/5" viewBox="0 0 200 200" fill="currentColor"><circle cx="100" cy="100" r="80" /></svg>
                    <div className="absolute inset-0 flex items-center justify-center"><div className="text-5xl font-display font-bold">{completeness}%</div></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Market Reach', value: stats?.marketTotal || 0, color: '#4F7575', icon: Users },
                  { label: 'Active Inquiries', value: stats?.inquiries || 0, badge: stats?.unreadInquiries, color: '#D8994E', icon: EnvelopeSimple },
                  { label: 'Network Rating', value: stats?.rating || 0, decimals: 1, color: '#9C5836', icon: Star },
                  { label: 'Account Tier', value: stats?.plan || 'STANDARD', isText: true, color: '#86A39E', icon: ShieldCheck },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[32px] border border-[#E8E0D8]/40 shadow-sm hover:shadow-xl transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-[#FAF9F6] rounded-2xl text-[#4F7575] group-hover:bg-[#4F7575] group-hover:text-white transition-all"><item.icon size={20} weight="light" /></div>
                      {item.badge ? <span className="bg-[#D8994E]/10 text-[#D8994E] text-[10px] font-bold px-3 py-1 rounded-full uppercase">New</span> : null}
                    </div>
                    <p className="text-[10px] font-bold text-[#86A39E] uppercase tracking-[0.2em] mb-1">{item.label}</p>
                    <h3 className="text-3xl font-display font-bold text-[#1A1A1A]">{item.isText ? item.value : <CountUp end={Number(item.value)} decimals={item.decimals} />}</h3>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[40px] border border-[#E8E0D8]/40 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-[#E8E0D8]/40 flex justify-between items-center">
                    <h3 className="text-xl font-display font-bold text-[#4F7575]">Latest Inquiries</h3>
                    <button onClick={() => handleTabChange('inbox')} className="text-[10px] font-bold text-[#D8994E] uppercase tracking-widest hover:underline">View All</button>
                  </div>
                  <div className="p-2">
                    {loading ? <div className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : recentInquiries.length === 0 ? <div className="p-12 text-center text-gray-400 italic text-sm">No new inquiries.</div> : (
                      <div className="space-y-1">
                        {recentInquiries.map(inq => (
                          <div key={inq.id} className="p-6 rounded-3xl hover:bg-[#FAF9F6] transition-colors flex items-center gap-6 group">
                            <div className="w-12 h-12 rounded-2xl bg-[#4F7575]/5 text-[#4F7575] flex items-center justify-center font-bold text-lg">{inq.guest_name[0].toUpperCase()}</div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-bold text-[#1A1A1A]">{inq.guest_name}</p>
                                <span className="text-[10px] text-gray-400 font-bold">{new Date(inq.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-1">{inq.subject}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${inq.status === 'new' ? 'bg-[#D8994E]' : 'bg-transparent'}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-[#FAF9F6] rounded-[40px] p-8 border border-[#E8E0D8]/40">
                  <h3 className="text-lg font-display font-bold text-[#4F7575] mb-6">Partner Feedback</h3>
                  {recentReviews.length === 0 ? <div className="p-6 bg-white rounded-3xl border border-[#E8E0D8]/40 italic text-sm text-gray-400 text-center">Awaiting your first review.</div> : (
                    <div className="space-y-4">{recentReviews.map(rev => (
                      <div key={rev.id} className="p-6 bg-white rounded-3xl shadow-sm border border-[#E8E0D8]/40">
                        <StarRow rating={rev.rating} size="w-3 h-3" />
                        <p className="text-xs text-gray-600 mt-4 line-clamp-3 italic leading-relaxed">"{rev.content}"</p>
                        <p className="text-[10px] font-bold text-[#4F7575] uppercase tracking-widest mt-4">By {rev.profiles.first_name}</p>
                      </div>
                    ))}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* INBOX TAB: Allows vendors to manage inquiries and message threads */}
          {activeTab === 'inbox' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)] animate-fade-in">
              {/* Sidebar: List of all received inquiries */}
              <div className="bg-white rounded-[32px] border border-[#E8E0D8]/40 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-[#E8E0D8]/40 bg-[#FAF9F6]/50">
                  <h3 className="text-lg font-display font-bold text-[#4F7575]">Message Inbox</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {allInquiries.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic text-sm">No messages yet.</div>
                  ) : (
                    allInquiries.map(inq => (
                      <button 
                        key={inq.id} 
                        onClick={() => handleViewInquiry(inq.id)}
                        className={`w-full p-6 rounded-2xl flex items-start gap-4 transition-all text-left ${selectedInquiryId === inq.id ? 'bg-[#4F7575] text-white shadow-lg' : 'hover:bg-[#FAF9F6] text-[#1A1A1A]'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold ${selectedInquiryId === inq.id ? 'bg-white/20' : 'bg-[#4F7575]/5 text-[#4F7575]'}`}>
                          {inq.guest_name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className={`text-xs font-bold truncate ${selectedInquiryId === inq.id ? 'text-white' : 'text-[#1A1A1A]'}`}>{inq.guest_name}</p>
                            {inq.status === 'new' && <div className="w-2 h-2 rounded-full bg-[#D8994E]" />}
                          </div>
                          <p className={`text-[10px] font-medium truncate opacity-70 mb-2 ${selectedInquiryId === inq.id ? 'text-white/80' : 'text-gray-500'}`}>{inq.subject}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-tighter ${selectedInquiryId === inq.id ? 'text-white/60' : 'text-[#86A39E]'}`}>
                            {new Date(inq.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Main Content: Detailed message thread and reply interface */}
              <div className="lg:col-span-2 bg-white rounded-[32px] border border-[#E8E0D8]/40 shadow-sm flex flex-col overflow-hidden relative">
                {selectedInquiry ? (
                  <>
                    {/* Header: Inquiry details and status */}
                    <div className="p-6 border-b border-[#E8E0D8]/40 bg-[#FAF9F6]/50 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-display font-bold text-[#4F7575]">{selectedInquiry.subject}</h3>
                        <p className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest mt-1">From: {selectedInquiry.guest_name} ({selectedInquiry.guest_email})</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        selectedInquiry.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-[#D8994E]/10 text-[#D8994E]'
                      }`}>
                        {selectedInquiry.status}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FAF9F6]/30">
                      {selectedInquiry.inquiry_messages?.map((msg: any) => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-6 rounded-3xl shadow-sm ${
                            msg.sender_id === user?.id 
                              ? 'bg-[#4F7575] text-white rounded-br-none' 
                              : 'bg-white border border-[#E8E0D8]/40 text-[#1A1A1A] rounded-bl-none'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-tighter mt-3 opacity-60 ${msg.sender_id === user?.id ? 'text-white' : 'text-[#86A39E]'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 border-t border-[#E8E0D8]/40 bg-white">
                      <form onSubmit={handleSendReply} className="relative">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply to the hotel owner..."
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 pr-32 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium resize-none"
                          rows={3}
                        />
                        <button 
                          type="submit"
                          disabled={sendingReply || !replyMessage.trim()}
                          className="absolute right-3 bottom-3 bg-[#D8994E] hover:bg-[#C4883F] text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          {sendingReply ? 'Sending...' : 'Send Reply'}
                        </button>
                      </form>
                    </div>
                  </>
                ) : loadingInquiry ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12">
                    <div className="w-12 h-12 border-4 border-[#4F7575]/10 border-t-[#4F7575] rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-[#86A39E] uppercase tracking-widest">Loading Conversation...</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 bg-[#FAF9F6] rounded-full flex items-center justify-center text-[#4F7575]/20 mb-8">
                      <EnvelopeSimple size={48} weight="light" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-[#4F7575] mb-2">Select a Message</h3>
                    <p className="text-sm text-[#86A39E] max-w-xs mx-auto leading-relaxed">Choose an inquiry from the list to view the full message thread and send a direct reply.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS TAB: Displays verified feedback from property owners */}
          {activeTab === 'reviews' && (
            <div className="space-y-10 animate-fade-in">
              {/* Header: Summary stats and rating score */}
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-display font-bold text-[#4F7575]">Partner Reviews</h2>
                  <p className="text-[#86A39E] text-sm mt-2">Verified feedback from hotel owners and procurement managers.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-[#E8E0D8]/40 flex items-center gap-3">
                  <Star size={20} weight="fill" className="text-[#D8994E]" />
                  <span className="text-xl font-display font-bold text-[#1A1A1A]">{stats?.rating || 0}</span>
                  <span className="text-xs font-bold text-[#86A39E] uppercase tracking-widest">Average Score</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {allReviews.length === 0 ? (
                  <div className="md:col-span-2 p-20 text-center bg-white rounded-[40px] border border-[#E8E0D8]/40">
                    <div className="w-20 h-20 bg-[#FAF9F6] rounded-full flex items-center justify-center text-[#4F7575]/20 mx-auto mb-8">
                      <Star size={40} weight="light" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-[#4F7575] mb-2">No Reviews Yet</h3>
                    <p className="text-sm text-[#86A39E] max-w-md mx-auto leading-relaxed">Your professional reputation starts here. Reviews from hotel partners will appear as soon as they are submitted.</p>
                  </div>
                ) : (
                  allReviews.map(rev => (
                    <div key={rev.id} className="bg-white p-10 rounded-[40px] border border-[#E8E0D8]/40 shadow-sm hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] border border-[#E8E0D8]/40 flex items-center justify-center text-[#4F7575] font-bold text-lg shadow-sm">
                            {rev.profiles?.first_name ? rev.profiles.first_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1A1A1A]">{rev.profiles?.first_name} {rev.profiles?.last_name}</p>
                            <p className="text-[10px] font-bold text-[#D8994E] uppercase tracking-tighter">Verified Property Owner</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#86A39E] uppercase tracking-tighter">{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="mb-6">
                        <StarRow rating={rev.rating} size="w-3.5 h-3.5" />
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.content}"</p>
                      
                      {rev.response ? (
                        <div className="mt-8 p-6 bg-[#FAF9F6] rounded-3xl border border-[#E8E0D8]/40 relative">
                          <div className="absolute -top-3 left-6 px-3 py-1 bg-[#4F7575] text-white text-[8px] font-bold uppercase tracking-widest rounded-full">Your Response</div>
                          <p className="text-xs text-[#4F7575] leading-relaxed italic">{rev.response}</p>
                        </div>
                      ) : (
                        <button className="mt-8 text-[10px] font-bold text-[#4F7575] uppercase tracking-widest border-b-2 border-[#4F7575]/10 pb-1 hover:border-[#4F7575] transition-all opacity-0 group-hover:opacity-100">
                          Reply to Review
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 animate-fade-in">
              <div className="xl:col-span-2 space-y-10">
                <div className="bg-white p-10 md:p-14 rounded-[48px] shadow-xl border border-[#E8E0D8]/40">
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-display font-bold text-[#4F7575]">Corporate Profile</h2>
                    {profile && (
                      <button onClick={handleDeleteCard} className="text-[10px] font-bold text-red-500 uppercase tracking-widest border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">Remove Card</button>
                    )}
                  </div>

                  <form ref={formRef} onSubmit={handleFormSubmitToPreview} className="space-y-10">
                    <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-[#FAF9F6] rounded-[32px] border border-[#E8E0D8]/40">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl bg-white border-2 border-dashed border-[#E8E0D8] flex items-center justify-center overflow-hidden transition-all group-hover:border-[#4F7575]">
                          {logoPreview ? (
                            <Image 
                              src={logoPreview} 
                              alt="Logo Preview" 
                              width={128} 
                              height={128} 
                              className="object-contain" 
                              unoptimized={logoPreview.startsWith('blob:')}
                            />
                          ) : (
                            <Upload size={32} weight="light" className="text-[#E8E0D8]" />
                          )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h4 className="text-sm font-bold text-[#1A1A1A] mb-1">Company Logo</h4>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Images are stored in secure buckets. Recommended size 512x512px.</p>
                        <button type="button" className="relative text-[10px] font-bold text-[#4F7575] uppercase tracking-widest border-b-2 border-[#4F7575]/20 pb-1 hover:border-[#4F7575] transition-all">
                          Change Asset
                          <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Entity Name</label>
                        <input
                          name="company_name"
                          type="text"
                          defaultValue={profile?.company_name || ''}
                          required
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                          placeholder="e.g. Hotel-Vendor"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Primary Category</label>
                        <div className="relative group">
                          <select
                            name="category_id"
                            key={profile?.category_ids?.[0] || 'empty'}
                            defaultValue={profile?.category_ids?.[0] || ''}
                            onChange={(e) => setShowCustomCategory(e.target.value === 'other')}
                            required
                            className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium appearance-none"
                          >
                            <option value="">Select from list...</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                            <option value="other">+ Other (Type custom category...)</option>
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#86A39E]">
                            <CaretDown size={16} weight="bold" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {showCustomCategory && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-bold text-[#D8994E] uppercase tracking-widest ml-1">Type Your Custom Category</label>
                        <input
                          name="custom_category"
                          type="text"
                          required
                          className="w-full bg-[#FAF9F6] border border-[#D8994E]/30 p-5 rounded-2xl focus:outline-none focus:border-[#D8994E] transition-all text-sm font-medium placeholder:text-gray-300"
                          placeholder="e.g. Specialized Drone Logistics"
                        />
                        <p className="text-[9px] text-[#D8994E] font-medium ml-1">This will create a new category in our directory for you.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Official Website Removed as requested */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Specialized Sectors (Keywords)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={sectorInput}
                            onChange={(e) => setSectorInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (sectorInput.trim()) {
                                  setSectors([...sectors, sectorInput.trim()]);
                                  setSectorInput('');
                                }
                              }
                            }}
                            className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                            placeholder="Type a sector and press Enter"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 -mt-6 mb-3">
                      {sectors.map((s, i) => (
                        <span key={i} className="px-4 py-2 bg-[#4F7575] text-white text-[10px] font-bold rounded-xl flex items-center gap-3 shadow-md">
                          {s}
                          <button type="button" onClick={() => setSectors(sectors.filter((_, idx) => idx !== i))}>
                            <X size={14} weight="bold" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Street Address</label>
                      <input
                        name="address_line_1"
                        type="text"
                        defaultValue={profile?.vendor_locations?.[0]?.address_line_1 || ''}
                        required
                        className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                        placeholder="e.g. 123 Business Way, Suite 100"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Corporate City</label>
                        <input
                          name="city"
                          type="text"
                          defaultValue={profile?.vendor_locations?.[0]?.city || ''}
                          required
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                          placeholder="e.g. Atlanta"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">State / Province</label>
                        <input
                          name="state"
                          type="text"
                          defaultValue={profile?.vendor_locations?.[0]?.state || ''}
                          required
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                          placeholder="e.g. GA"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Postal Code</label>
                        <input
                          name="postal_code"
                          type="text"
                          defaultValue={profile?.vendor_locations?.[0]?.postal_code || ''}
                          required
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                          placeholder="e.g. 30301"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Contact Principal</label>
                        <input
                          name="contact_name"
                          type="text"
                          defaultValue={profile?.vendor_contacts?.[0]?.contact_name || ''}
                          required
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                          placeholder="e.g. Gary Gobin"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Direct Email</label>
                        <input
                          name="contact_email"
                          type="email"
                          defaultValue={profile?.vendor_contacts?.[0]?.email || ''}
                          required
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                          placeholder="e.g. gary@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Contact Phone</label>
                        <input
                          name="phone"
                          type="tel"
                          defaultValue={profile?.vendor_contacts?.[0]?.phone || ''}
                          required
                          className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium"
                          placeholder="e.g. +1 7702709398"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest ml-1">Description</label>
                      <textarea
                        name="description"
                        defaultValue={profile?.description || ''}
                        rows={6}
                        className="w-full bg-[#FAF9F6] border border-[#E8E0D8]/40 p-5 rounded-2xl focus:outline-none focus:border-[#4F7575] transition-all text-sm font-medium resize-none"
                        placeholder="Describe your expertise..."
                      />
                    </div>

                    <button type="submit" className="bg-[#4F7575] hover:bg-[#3d5a5a] text-white font-bold w-full py-5 rounded-2xl text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-[#4F7575]/20 active:scale-95">Create Business Card</button>
                  </form>
                </div>
              </div>

              <div className="space-y-8">
                <p className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest text-center">Cloud Preview</p>
                <div className="bg-white rounded-[40px] shadow-2xl border border-[#E8E0D8]/40 overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
                  <div className={`h-48 bg-[#FAF9F6] flex items-center justify-center p-10 border-b border-[#E8E0D8]/40 relative transition-opacity duration-500 ${!showCardPreview ? 'opacity-20 grayscale' : 'opacity-100'}`}>
                    {logoPreview ? (
                      <Image 
                        src={logoPreview} 
                        alt="Logo" 
                        width={140} 
                        height={140} 
                        className="object-contain" 
                        unoptimized={logoPreview.startsWith('blob:')}
                      />
                    ) : (
                      <div className="text-[#86A39E]/20 font-display italic text-3xl">Asset Pending</div>
                    )}
                    <div className="absolute top-6 right-6 bg-[#D8994E] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-[#D8994E]/20">Verified</div>
                  </div>
                  <div className={`p-10 space-y-8 transition-opacity duration-500 ${!showCardPreview ? 'opacity-20 blur-[2px]' : 'opacity-100'}`}>
                    <div>
                      <h4 className="text-2xl font-display font-bold text-[#4F7575] leading-tight mb-2">{previewProfile?.company_name || profile?.company_name || 'Business Identity'}</h4>
                      <div className="flex flex-wrap gap-2">{sectors.length > 0 ? sectors.map((s, i) => (<span key={i} className="text-[9px] font-bold text-[#D8994E] uppercase tracking-[0.15em] opacity-80 border border-[#D8994E]/20 px-2 py-0.5 rounded">{s}</span>)) : <span className="text-[10px] font-bold text-[#D8994E] uppercase tracking-[0.15em] opacity-80">Sectors Pending</span>}</div>
                    </div>
                    <div className="space-y-6 pt-4 border-t border-[#E8E0D8]/40">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#4F7575]/5 flex items-center justify-center text-[#4F7575]"><MapPin size={16} weight="light" /></div>
                        <span className="text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-widest">{previewProfile?.city ? `${previewProfile.city}, ${previewProfile.state}` : profile?.vendor_locations?.[0] ? `${profile.vendor_locations[0].city}, ${profile.vendor_locations[0].state}` : 'Location Pending'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#4F7575]/5 flex items-center justify-center text-[#4F7575]"><User size={16} weight="light" /></div>
                        <span className="text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-widest">{previewProfile?.contact_name || profile?.vendor_contacts?.[0]?.contact_name || 'Contact Principal'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#4F7575]/5 flex items-center justify-center text-[#4F7575]"><Phone size={16} weight="light" /></div>
                        <span className="text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-widest">{previewProfile?.phone || profile?.vendor_contacts?.[0]?.phone || 'Phone Pending'}</span>
                      </div>
                    </div>
                    <div className="pt-6">
                      <button onClick={handleSaveProfile} disabled={savingProfile || !showCardPreview} className={`w-full py-4 border rounded-full text-center text-[10px] font-bold uppercase tracking-widest transition-all ${savingProfile ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-[#D8994E] hover:bg-[#C4883F] border-[#D8994E] text-white shadow-lg shadow-[#D8994E]/20 active:scale-95'}`}>{savingProfile ? 'Publishing...' : 'Submit to Vendor List'}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Toasts */}
        <div className="fixed bottom-10 right-10 z-[60] flex flex-col gap-4">
          {toasts.map(toast => (
            <div key={toast.id} className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 border ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' : toast.type === 'error' ? 'bg-white border-red-100 text-red-800' : 'bg-white border-yellow-100 text-yellow-800'}`}>
              <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
              <p className="text-xs font-bold uppercase tracking-widest">{toast.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function apiFetch(url: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hv_token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  try {
    const res = await fetch(url, { ...options, headers });
    return await res.json();
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
}
