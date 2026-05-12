'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { getVendorBySlug } from '@/lib/api';
import { useSavedVendors } from '@/lib/context/SavedVendorsContext';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Phone, 
  EnvelopeSimple, 
  Globe, 
  BookmarkSimple, 
  Star, 
  CaretRight,
  ShieldCheck,
  CheckCircle,
  ChatCircleText,
  Buildings
} from "@phosphor-icons/react";

export default function VendorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [activeTab, setActiveTab] = useState('overview');
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isVendorSaved, toggleSaveVendor } = useSavedVendors();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await getVendorBySlug(slug);
        if (res.success) setVendor(res.data);
      } catch (error) {
        console.error('Error fetching vendor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4F7575]"></div>
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <h1 className="text-3xl font-display font-bold text-[#4F7575]">Vendor not found</h1>
      </div>
      <Footer />
    </div>
  );

  const hasValidLogo = vendor.image_url && 
    vendor.image_url.length > 5 &&
    !vendor.image_url.includes('admin_assets/img/location.svg') && 
    !vendor.image_url.includes('placeholder.png');

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] font-body text-[#1A1A1A]">
      <Navbar />

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6" onClick={() => setShowLimitModal(false)}>
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mx-auto mb-6">
              <BookmarkSimple size={32} weight="fill" className="text-[#D8994E]" />
            </div>
            <h3 className="text-2xl font-display text-[#1A1A1A] mb-3 font-bold">Save Limit Reached</h3>
            <p className="text-[#86A39E] text-sm mb-8 leading-relaxed font-medium">
              You've saved 10 vendors — the maximum for guest users. Sign up for a free account to unlock unlimited saves and more features.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/auth?register=true')}
                className="w-full bg-[#4F7575] hover:bg-[#3d5a5a] text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#4F7575]/20"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full text-[#86A39E] hover:text-[#4F7575] py-3 text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {/* Premium Hero Section */}
        <div className="relative w-full h-[500px]">
          <Image 
            src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=2000" 
            alt="Vendor Header Background" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#4F7575]/40 to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-end max-w-7xl mx-auto px-6 pb-24">
            <div className="flex flex-col md:flex-row items-end justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
                {/* Fixed Logo Display */}
                <div className="w-40 h-40 md:w-56 md:h-56 bg-white rounded-[40px] shadow-2xl border border-white/20 flex items-center justify-center p-8 overflow-hidden relative group">
                  {hasValidLogo ? (
                    <Image 
                      src={vendor.image_url} 
                      alt={vendor.company_name} 
                      fill 
                      className="object-contain p-8 group-hover:scale-105 transition-transform duration-700"
                      unoptimized={true}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-[#4F7575]/20">
                      <Buildings size={64} weight="light" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Brand Image</span>
                    </div>
                  )}
                </div>
                
                <div className="text-center md:text-left pb-4">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                    <span className="bg-[#D8994E] text-white text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-[#D8994E]/20 flex items-center gap-2">
                      <ShieldCheck size={14} weight="fill" />
                      Verified Partner
                    </span>
                    {vendor.categories?.map((cat: any) => (
                      <span key={cat.slug} className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/30">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight drop-shadow-sm">{vendor.company_name}</h1>
                  <p className="text-white/80 mt-4 text-sm font-bold uppercase tracking-[0.3em] font-body flex items-center justify-center md:justify-start gap-3">
                    <MapPin size={18} weight="light" className="text-[#D8994E]" />
                    {vendor.city}, {vendor.state}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pb-4">
                <button
                  onClick={() => {
                    const result = toggleSaveVendor({
                      id: vendor.id,
                      slug: vendor.slug,
                      company_name: vendor.company_name,
                      image_url: vendor.image_url,
                      city: vendor.city,
                      state: vendor.state,
                      contact_name: vendor.contact_name,
                      phone: vendor.phone,
                      categories: vendor.categories,
                    });
                    if (!result.success && result.limitReached) {
                      setShowLimitModal(true);
                    }
                  }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                    isVendorSaved(vendor.id)
                      ? 'bg-[#D8994E] text-white shadow-[#D8994E]/20'
                      : 'bg-white text-[#4F7575] hover:bg-[#4F7575] hover:text-white shadow-black/5'
                  }`}
                >
                  <BookmarkSimple size={24} weight={isVendorSaved(vendor.id) ? 'fill' : 'light'} />
                </button>
                <button className="bg-[#4F7575] hover:bg-[#3d5a5a] text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#4F7575]/20 active:scale-95 flex items-center gap-3">
                  <ChatCircleText size={20} weight="light" />
                  Inquire Now
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Sidebar Stats */}
            <div className="lg:col-span-4 space-y-10">
              <div className="bg-white rounded-[40px] p-10 shadow-xl border border-[#E8E0D8]/40 space-y-10">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest">Network Authority</p>
                  <div className="flex items-center gap-2 text-3xl font-display font-bold text-[#1A1A1A]">
                    {vendor.average_rating || '4.9'}
                    <Star size={24} weight="fill" className="text-[#D8994E]" />
                  </div>
                  <p className="text-[10px] font-bold text-[#D8994E] uppercase tracking-widest">Based on {vendor.review_count || '24'} Global Reviews</p>
                </div>

                <div className="w-full h-[1px] bg-[#E8E0D8]/40" />

                <div className="grid grid-cols-1 gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-[#4F7575]">
                      <Globe size={24} weight="light" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest leading-none mb-1">HQ Origin</p>
                      <p className="text-sm font-bold text-[#1A1A1A]">{vendor.city}, {vendor.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-[#4F7575]">
                      <User size={24} weight="light" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest leading-none mb-1">Direct Rep</p>
                      <p className="text-sm font-bold text-[#1A1A1A]">
                        {vendor.contact_name && !vendor.contact_name.includes('@') 
                          ? vendor.contact_name 
                          : 'Inquiry Required'}
                      </p>
                      {vendor.designation && <p className="text-[9px] text-[#86A39E] font-medium">{vendor.designation}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center text-[#4F7575]">
                      <Phone size={24} weight="light" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#86A39E] uppercase tracking-widest leading-none mb-1">Primary Line</p>
                      <p className="text-sm font-bold text-[#1A1A1A]">{vendor.phone || '+1 Inquire Now'}</p>
                    </div>
                  </div>
                </div>

                {vendor.website && (
                  <a 
                    href={vendor.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-6 bg-[#FAF9F6] rounded-3xl border border-[#E8E0D8]/40 group hover:border-[#4F7575] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Globe size={20} weight="light" className="text-[#4F7575]" />
                      <span className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Visit Website</span>
                    </div>
                    <CaretRight size={16} weight="bold" className="text-[#86A39E] group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>

              {/* Verified Badge */}
              <div className="bg-[#4F7575] rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
                 <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-3">
                   <ShieldCheck size={24} weight="fill" className="text-[#D8994E]" />
                   Verified Vendor
                 </h3>
                 <p className="text-white/60 text-xs leading-relaxed mb-6">This vendor has undergone our 4-point verification process for hospitality standards and financial stability.</p>
                 <ul className="space-y-3">
                   {['Manufacturing Audit', 'Review Validation', 'Response Reliability', 'Asset Insurance'].map(item => (
                     <li key={item} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                       <CheckCircle size={14} weight="fill" className="text-green-400" />
                       {item}
                     </li>
                   ))}
                 </ul>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-16">
              {/* Tabs */}
              <div className="flex gap-10 border-b border-[#E8E0D8]/40">
                {['Overview', 'Capabilities', 'Reviews', 'Assets'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`pb-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${
                      activeTab === tab.toLowerCase() ? 'text-[#4F7575]' : 'text-[#86A39E] hover:text-[#4F7575]'
                    }`}
                  >
                    {tab}
                    {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4F7575] rounded-full" />}
                  </button>
                ))}
              </div>

              <div className="animate-fade-in">
                {activeTab === 'overview' && (
                  <div className="space-y-12">
                    <div className="space-y-8">
                      <h2 className="text-3xl md:text-4xl font-display font-bold text-[#1A1A1A] leading-tight">
                        {vendor.tagline || `Elite Solutions for Modern Hospitality`}
                      </h2>
                      <div className="text-[#1A1A1A]/70 leading-relaxed space-y-6 text-sm font-medium">
                        {vendor.description ? (
                          <div dangerouslySetInnerHTML={{ __html: vendor.description.replace(/\n/g, '<br/>') }} />
                        ) : (
                          <p>
                            With decades of experience serving the world's most prestigious hotel brands, {vendor.company_name} is a global leader in hospitality excellence. We specialize in high-performance solutions that combine aesthetic beauty with the durability required for high-traffic commercial environments.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="relative h-72 rounded-[40px] overflow-hidden shadow-xl border border-[#E8E0D8]/40">
                         <Image src="https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=1200" alt="Texture" fill className="object-cover" />
                      </div>
                      <div className="bg-[#FAF9F6] rounded-[40px] p-10 border border-[#E8E0D8]/40 flex flex-col justify-center">
                         <h3 className="text-2xl font-display font-bold text-[#4F7575] mb-4">Market Presence</h3>
                         <p className="text-xs text-[#86A39E] font-medium leading-relaxed">Active in {vendor.city} and surrounding regions, supporting both boutique projects and large-scale resort developments with direct procurement options.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab !== 'overview' && (
                  <div className="py-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-[#FAF9F6] rounded-full flex items-center justify-center mx-auto text-[#4F7575]">
                       <Buildings size={40} weight="light" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-[#4F7575]">Expansion Pending</h3>
                    <p className="text-sm text-[#86A39E] max-w-sm mx-auto font-medium">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} data is currently being verified and will be available shortly.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
