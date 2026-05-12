'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Clock, 
  CaretLeft, 
  CaretRight, 
  X,
  Tag,
  Info
} from "@phosphor-icons/react";
import { apiFetch } from '@/lib/api';

interface Deal {
  id: string;
  vendor_id: string;
  vendor_slug: string;
  vendor_name: string;
  vendor_logo: string;
  vendor_city: string;
  vendor_state: string;
  category: string;
  category_slug: string;
  title: string;
  discount: string;
  description: string;
  badge: string;
  expires_at: string;
  days_left: number;
  minimum_order?: number;
  terms_conditions?: string;
  current_uses: number;
  maximum_uses?: number;
}

const categories = ['All', 'Textiles', 'Furniture', 'Amenities', 'Lighting', 'Technology', 'Housekeeping'];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    message: '',
    contact_email: '',
    contact_phone: '',
    hotel_id: ''
  });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const catSlug = activeCategory === 'All' ? undefined : activeCategory.toLowerCase().replace(/ /g, '-');
        const res = await apiFetch(`/api/deals?${new URLSearchParams({
          ...(catSlug && { category: catSlug }),
          page: pagination.page.toString(),
          limit: '9'
        }).toString()}`);
        
        if (res.success) {
          setDeals(res.data || []);
          if (res.pagination) {
            setPagination(prev => ({
              ...prev,
              totalPages: res.pagination.totalPages || 1,
              totalItems: res.pagination.total || 0
            }));
          }
        } else {
          setDeals([]);
          setPagination(prev => ({ ...prev, totalPages: 1, totalItems: 0 }));
        }
      } catch (error) {
        console.error('Error fetching deals:', error);
        setDeals([]);
        setPagination(prev => ({ ...prev, totalPages: 1, totalItems: 0 }));
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, [activeCategory, pagination.page]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const goToNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInquireClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowInquiryModal(true);
    setInquiryForm({
      message: `I'm interested in your "${deal.title}" deal. Please provide more details about the offer and how to proceed.`,
      contact_email: '',
      contact_phone: '',
      hotel_id: ''
    });
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal) return;

    setSubmittingInquiry(true);
    try {
      const res = await apiFetch(`/api/deals/${selectedDeal.id}/inquire`, {
        method: 'POST',
        body: JSON.stringify(inquiryForm)
      });

      if (res.success) {
        alert('Your inquiry has been sent successfully! The vendor will contact you soon.');
        setShowInquiryModal(false);
        setSelectedDeal(null);
      } else {
        alert(res.message || 'Failed to send inquiry. Please try again.');
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'FLASH SALE': return 'bg-red-500 text-white';
      case 'LIMITED TIME': return 'bg-[#B1694A] text-white';
      case 'VOLUME DEAL': return 'bg-[#365A53] text-white';
      case 'NEW CLIENT': return 'bg-[#A37B45] text-white';
      case 'BUNDLE': return 'bg-[#4F7575] text-white';
      case 'LOYALTY': return 'bg-[#1A2352] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return 'text-red-500';
    if (days <= 7) return 'text-[#B1694A]';
    return 'text-[#777777]';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=2000"
          alt="Deals Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#2C4843]/70" />
        <div className="relative z-10 text-center px-6">
          <h1 className="text-5xl md:text-6xl font-display text-white mb-4">Exclusive Deals</h1>
          <p className="text-white/80 font-body text-lg max-w-2xl mx-auto">
            Curated offers from verified vendors — negotiate less, save more on hospitality supplies.
          </p>
        </div>
      </section>

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 md:px-16 py-16">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-7 py-2.5 rounded-full font-body text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? 'bg-[#365A53] border-[#365A53] text-white'
                  : 'bg-white border-[#CCCCCC] text-[#555555] hover:border-[#365A53] hover:text-[#365A53]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#EBE7E0]">
          <p className="font-body text-[#777777] text-sm">
            Showing <span className="font-bold text-[#333333]">{pagination.totalItems}</span> active deals
          </p>
          <div className="flex items-center gap-2 text-sm font-body text-[#777777]">
            <Clock size={16} weight="light" className="text-[#B1694A]" />
            Deals update daily
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#365A53]" />
          </div>
        )}

        {/* Empty State */}
        {!loading && deals.length === 0 && (
          <div className="text-center py-24">
            <h2 className="text-2xl font-display text-[#333333] mb-3">No deals in this category</h2>
            <p className="font-body text-[#777777] mb-6">Try selecting a different category to find active offers.</p>
            <button onClick={() => setActiveCategory('All')} className="text-[#365A53] font-body font-bold underline">
              View all deals
            </button>
          </div>
        )}

        {/* Deals Grid */}
        {!loading && deals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {deals.map(deal => (
              <div
                key={deal.id}
                className="bg-white rounded-[20px] border border-[#EBE7E0] overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
              >
                {/* Top: Vendor + Badge */}
                <div className="p-6 pb-0 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#F5F3ED] border border-[#EBE7E0] flex-shrink-0">
                      <Image
                        src={deal.vendor_logo || 'https://ams.aahoa.com/public/admin_assets/img/placeholder.png'}
                        alt={deal.vendor_name}
                        fill
                        className="object-contain p-1.5"
                      />
                    </div>
                    <div>
                      <Link href={`/vendors/${deal.vendor_slug}`} className="font-bold text-[#1A2352] text-[15px] hover:text-[#365A53] transition-colors leading-tight block">
                        {deal.vendor_name}
                      </Link>
                      <span className="text-[#999999] text-xs font-body">{deal.vendor_city}, {deal.vendor_state}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider flex-shrink-0 ${getBadgeColor(deal.badge)}`}>
                    {deal.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="mb-4">
                    <span className="text-3xl font-display font-bold text-[#B1694A]">{deal.discount}</span>
                  </div>
                  <h3 className="font-bold text-[#333333] text-lg mb-2">{deal.title}</h3>
                  <p className="font-body text-[#777777] text-[14px] leading-relaxed mb-4 flex-grow">
                    {deal.description}
                  </p>

                  {/* Additional Info */}
                  {deal.minimum_order && (
                    <p className="text-xs text-[#666666] mb-2">
                      Minimum order: ${deal.minimum_order.toLocaleString()}
                    </p>
                  )}
                  
                  {deal.maximum_uses && (
                    <p className="text-xs text-[#666666] mb-4">
                      {deal.maximum_uses - deal.current_uses} uses remaining
                    </p>
                  )}

                  {/* Category + Expiry */}
                  <div className="flex items-center justify-between mb-6 pt-4 border-t border-[#F0EDE8]">
                    <span className="bg-[#F5F3ED] text-[#555555] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {deal.category}
                    </span>
                    <span className={`text-xs font-body font-medium flex items-center gap-1 ${getUrgencyColor(deal.days_left)}`}>
                      <Clock size={14} weight="light" />
                      {deal.days_left <= 1 ? 'Expires today!' : `${deal.days_left} days left`}
                    </span>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleInquireClick(deal)}
                      className="flex-1 py-3.5 rounded-full bg-[#365A53] text-white text-sm font-body font-medium hover:bg-[#2A4741] transition-colors"
                    >
                      Contact Vendor
                    </button>
                    <Link
                      href={`/vendors/${deal.vendor_slug}`}
                      className="px-4 py-3.5 rounded-full border border-[#365A53] text-[#365A53] text-sm font-body font-medium hover:bg-[#365A53] hover:text-white transition-colors text-center"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && deals.length > 0 && pagination.totalPages > 1 && (
          <div className="mt-20 flex justify-center items-center gap-6">
            <button 
              onClick={goToPreviousPage}
              disabled={pagination.page === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-medium transition-all ${
                pagination.page === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-[#CCCCCC] text-[#555555] hover:bg-gray-50 hover:shadow-lg'
              }`}
            >
              <CaretLeft size={20} weight="light" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="font-body text-sm text-[#777777]">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>

            <button 
              onClick={goToNextPage}
              disabled={pagination.page === pagination.totalPages}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-medium transition-all ${
                pagination.page === pagination.totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border border-[#CCCCCC] text-[#555555] hover:bg-gray-50 hover:shadow-lg'
              }`}
            >
              Next
              <CaretRight size={20} weight="light" />
            </button>
          </div>
        )}
      </main>

      {/* Inquiry Modal */}
      {showInquiryModal && selectedDeal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-[#1A2352] font-bold text-2xl mb-2">Contact Vendor</h2>
                  <p className="text-gray-600">Inquire about "{selectedDeal.title}" from {selectedDeal.vendor_name}</p>
                </div>
                <button 
                  onClick={() => setShowInquiryModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X size={20} weight="light" className="text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleInquirySubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#365A53] focus:border-transparent resize-none"
                    placeholder="Tell the vendor about your requirements..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={inquiryForm.contact_email}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#365A53] focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={inquiryForm.contact_phone}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#365A53] focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Deal Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Deal Summary</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Discount:</strong> {selectedDeal.discount}</p>
                    <p><strong>Expires:</strong> {selectedDeal.days_left <= 1 ? 'Today' : `${selectedDeal.days_left} days`}</p>
                    {selectedDeal.minimum_order && (
                      <p><strong>Minimum Order:</strong> ${selectedDeal.minimum_order.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInquiryModal(false)}
                    className="flex-1 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInquiry || !inquiryForm.contact_email}
                    className="flex-1 py-3 rounded-full bg-[#365A53] text-white font-medium hover:bg-[#2A4741] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingInquiry ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
