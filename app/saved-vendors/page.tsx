'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VendorCard from '@/components/VendorCard';
import { useSavedVendors } from '@/lib/context/SavedVendorsContext';
import { Heart, ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react";
import Link from 'next/link';
import { useState } from 'react';

export default function SavedVendorsPage() {
  const { savedVendors } = useSavedVendors();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = savedVendors.filter(vendor => 
    vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.categories?.some((cat: string) => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-[#E8E0D8] pb-12">
            <div>
              <Link 
                href="/vendors" 
                className="inline-flex items-center gap-2 text-sm font-bold text-[#86A39E] uppercase tracking-widest hover:text-[#4F7575] transition-colors mb-6 group"
              >
                <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
                Back to Marketplace
              </Link>
              <h1 className="text-5xl md:text-6xl font-display font-bold text-[#4F7575] mb-4">Saved Vendors</h1>
              <p className="text-[#86A39E] font-body text-lg max-w-xl">
                Your curated list of hospitality partners and preferred manufacturers.
              </p>
            </div>

            <div className="relative w-full md:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlass size={20} weight="light" className="text-gray-400 group-focus-within:text-[#8B5E3C] transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search saved vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-[#E8E0D8] rounded-2xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/10 focus:border-[#8B5E3C] transition-all modern-shadow"
              />
            </div>
          </div>

          {/* Grid Area */}
          {savedVendors.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[40px] border border-[#E8E0D8] modern-shadow">
              <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#4F7575]/20">
                  <Heart size={48} weight="light" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold text-[#4F7575] mb-4">No saved vendors yet</h3>
              <p className="text-[#86A39E] font-body max-w-md mx-auto mb-10 px-6">
                Explore the marketplace and click the heart icon on any vendor card to save them to your preferred list.
              </p>
              <Link 
                href="/vendors"
                className="inline-flex px-10 py-4 bg-[#8B5E3C] text-white rounded-full font-bold text-sm hover:bg-[#724d31] transition-all hover:scale-105 shadow-xl shadow-[#8B5E3C]/20"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="py-32 text-center">
              <h3 className="text-xl font-bold text-[#4F7575] mb-2">No matches found</h3>
              <p className="text-[#86A39E]">No saved vendors match your current search.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 text-[#8B5E3C] font-bold text-sm hover:underline"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredVendors.map(vendor => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
