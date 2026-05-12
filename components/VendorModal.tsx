'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  MapPin, 
  EnvelopeSimple, 
  Star, 
  Buildings,
  CheckCircle,
  Tag,
  Globe,
  ChatCircleText,
  User as UserIcon,
  PaperPlaneTilt,
  Lock
} from "@phosphor-icons/react";
import { useUser } from '@/lib/context/UserContext';
import Link from 'next/link';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    id: string;
    company_name: string;
    tagline?: string;
    description?: string;
    image_url: string;
    average_rating?: number;
    review_count?: number;
    city: string;
    state: string;
    country?: string;
    is_featured?: boolean;
    categories?: { name: string; slug: string }[];
    phone?: string;
  };
}

export default function VendorModal({ isOpen, onClose, vendor }: VendorModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'inquiry'>('overview');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, content: '' });
  const [inquiryMessage, setInquiryMessage] = useState(`Hi ${vendor.company_name},\n\nI am interested in your services listed on HotelVendors.com. Please provide more information.`);
  const { user } = useUser();

  useEffect(() => {
    if (isOpen && activeTab === 'reviews') {
      fetchReviews();
    }
  }, [isOpen, activeTab, vendor.id]);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInquirySent(false);
      setActiveTab('overview');
    }
  }, [isOpen]);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?vendor_id=${vendor.id}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'hotel_owner') return;

    setSubmittingInquiry(true);
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendor.id,
          message: inquiryMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setInquirySent(true);
      } else {
        alert(data.message || 'Failed to send inquiry');
      }
    } catch (err) {
      console.error('Error sending inquiry:', err);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'hotel_owner') return;
    
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendor.id,
          rating: newReview.rating,
          content: newReview.content
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewReview({ rating: 5, content: '' });
        fetchReviews();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen) return null;

  const hasValidLogo = vendor.image_url && 
    vendor.image_url.length > 5 &&
    !vendor.image_url.includes('admin_assets/img/location.svg') && 
    !vendor.image_url.includes('placeholder.png');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
      <div 
        className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-50 p-2.5 bg-white/80 backdrop-blur-md hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-600 shadow-sm border border-gray-100"
        >
          <X size={18} weight="bold" />
        </button>

        {/* Left Side: Visuals */}
        <div className="md:w-5/12 bg-[#FAF9F6] p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
          <div className="relative w-full aspect-square bg-white rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-center p-8">
            {hasValidLogo ? (
              <Image 
                src={vendor.image_url} 
                alt={vendor.company_name}
                fill
                className="object-contain p-8"
                unoptimized={true}
              />
            ) : (
              <Buildings size={80} weight="light" className="text-gray-200" />
            )}
          </div>
          
          {vendor.review_count && vendor.review_count > 0 ? (
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Star size={20} weight="fill" className="text-[#D8994E]" />
                <span className="text-xl font-bold text-gray-800">{vendor.average_rating || '4.5'}</span>
              </div>
              <span className="text-gray-400 text-sm font-medium">({vendor.review_count} verified reviews)</span>
            </div>
          ) : null}

          {vendor.is_featured && (
            <div className="mt-6 flex items-center gap-2 bg-[#4F7575]/10 text-[#4F7575] px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#4F7575]/20">
              <CheckCircle size={14} weight="fill" />
              Top Verified Vendor
            </div>
          )}
        </div>

        {/* Right Side: Content */}
        <div className="md:w-7/12 p-10 flex flex-col overflow-hidden">
          <div className="mb-6 pr-12">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2 leading-tight">{vendor.company_name}</h2>
            {vendor.tagline && (
              <p className="text-sm text-[#4F7575] font-medium italic">
                "{vendor.tagline}"
              </p>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-8 border-b border-gray-100 mb-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'overview' ? 'text-[#4F7575]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Overview
              {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F7575]" />}
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'reviews' ? 'text-[#4F7575]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Reviews ({vendor.review_count || 0})
              {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F7575]" />}
            </button>
            <button 
              onClick={() => setActiveTab('inquiry')}
              className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'inquiry' ? 'text-[#4F7575]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Send Inquiry
              {activeTab === 'inquiry' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F7575]" />}
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'overview' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <MapPin size={20} weight="light" className="text-[#4F7575]" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                      <p className="text-xs font-bold text-gray-700">{vendor.city}, {vendor.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <Globe size={20} weight="light" className="text-[#4F7575]" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Country</p>
                      <p className="text-xs font-bold text-gray-700">{vendor.country || 'USA'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {vendor.categories?.map((cat) => (
                    <span key={cat.slug} className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-gray-200">
                      {cat.name}
                    </span>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">About Vendor</p>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {vendor.description || 'No description available for this vendor.'}
                  </p>
                </div>
              </div>
            ) : activeTab === 'reviews' ? (
              <div className="space-y-8 pb-4">
                {user?.role === 'hotel_owner' ? (
                  <form onSubmit={submitReview} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4">Write a Review</h3>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button 
                          key={s} 
                          type="button"
                          onClick={() => setNewReview(prev => ({ ...prev, rating: s }))}
                        >
                          <Star size={20} weight={s <= newReview.rating ? 'fill' : 'light'} className={s <= newReview.rating ? 'text-[#D8994E]' : 'text-gray-300'} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Share your experience with this vendor..."
                      className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#4F7575] transition-all min-h-[100px] mb-4"
                      value={newReview.content}
                      onChange={e => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                      required
                    />
                    <button 
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-[#4F7575] text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#3d5a5a] transition-all disabled:opacity-50"
                    >
                      <PaperPlaneTilt size={16} />
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-blue-50 text-blue-700 p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
                    <Lock size={32} className="mb-3 opacity-50" />
                    <p className="text-xs font-bold uppercase tracking-widest mb-4">Verification Required</p>
                    <p className="text-xs mb-6 opacity-80">Only verified property owners can review vendors. Please sign in to share your experience.</p>
                    <Link href="/auth" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Sign In Now</Link>
                  </div>
                )}

                <div className="space-y-6">
                  {loadingReviews ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Loading reviews...</div>
                  ) : reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-gray-100 pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#4F7575]/10 flex items-center justify-center text-[#4F7575]">
                              <UserIcon size={16} weight="bold" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{rev.profiles?.first_name ? `${rev.profiles.first_name} ${rev.profiles.last_name || ''}` : 'Hotel Owner'}</p>
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">Verified Property Owner</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} weight={s <= rev.rating ? 'fill' : 'light'} className={s <= rev.rating ? 'text-[#D8994E]' : 'text-gray-200'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed italic">"{rev.content}"</p>
                        <p className="text-[9px] text-gray-300 mt-3 font-medium uppercase tracking-tighter">
                          Posted {new Date(rev.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <ChatCircleText size={40} weight="light" className="text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400">No reviews yet for this vendor.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {inquirySent ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 border border-green-100">
                      <CheckCircle size={40} weight="fill" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Inquiry Sent!</h3>
                    <p className="text-sm text-gray-500 max-w-[280px]">Your message has been proxied to ${vendor.company_name}. They will reply directly to your email.</p>
                    <button 
                      onClick={() => { setInquirySent(false); setActiveTab('overview'); }}
                      className="mt-8 text-[10px] font-bold text-[#4F7575] uppercase tracking-widest hover:underline"
                    >
                      Back to Overview
                    </button>
                  </div>
                ) : user?.role === 'hotel_owner' ? (
                  <form onSubmit={handleSendInquiry} className="space-y-6 animate-fade-in">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Direct Message to Vendor</p>
                      <textarea 
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-6 text-sm focus:outline-none focus:border-[#4F7575] focus:bg-white transition-all min-h-[200px]"
                        value={inquiryMessage}
                        onChange={e => setInquiryMessage(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 italic">Note: To protect vendor privacy, your message will be sent through our secure proxy. The vendor will see your name and email address to reply.</p>
                    <button 
                      type="submit"
                      disabled={submittingInquiry}
                      className="w-full bg-[#4F7575] text-white font-bold py-5 rounded-2xl text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#3d5a5a] transition-all disabled:opacity-50 shadow-xl shadow-[#4F7575]/20"
                    >
                      <PaperPlaneTilt size={20} weight="bold" />
                      {submittingInquiry ? 'Sending...' : 'Deliver Inquiry'}
                    </button>
                  </form>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-[#FAF9F6] rounded-[32px] border border-gray-100">
                    <Lock size={48} className="text-[#4F7575] mb-6 opacity-30" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Registration Required</h3>
                    <p className="text-sm text-gray-500 mb-8 max-w-[280px]">Only logged-in property owners can send direct inquiries to vendors in our marketplace.</p>
                    <div className="flex flex-col w-full gap-3">
                      <Link href="/auth" className="bg-[#4F7575] text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-[#3d5a5a] transition-all">Sign In / Join Now</Link>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-2">Free for all property owners</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
