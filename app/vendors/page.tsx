'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VendorCard from '@/components/VendorCard';
import PillTab from '@/components/PillTab';
import { 
  MagnifyingGlass, 
  X, 
  Check, 
  CaretLeft, 
  CaretRight 
} from "@phosphor-icons/react";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getVendors, getCategories } from '@/lib/api';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(['All', 'Textiles', 'Furniture', 'Amenities', 'Lighting', 'Technology']);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleFilter = (setState: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setState(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    setPagination(p => ({ ...p, page: 1 }));
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catId = activeCategory === 'All' ? undefined : activeCategory.toLowerCase().replace(/ /g, '-');
        const [vendorsRes, categoriesRes] = await Promise.all([
          getVendors({ 
            category: catId, 
            page: pagination.page, 
            limit: 12,
            search: debouncedSearch || undefined,
            sectors: selectedSectors.length > 0 ? selectedSectors.join(',') : undefined,
            stages: selectedStages.length > 0 ? selectedStages.join(',') : undefined,
            regions: selectedRegions.length > 0 ? selectedRegions.join(',') : undefined
          }),
          getCategories()
        ]);
        
        if (vendorsRes.success) {
          // Always replace vendors array for pagination (not append)
          setVendors(vendorsRes.data || []);
          if (vendorsRes.pagination) {
            setPagination(prev => ({ 
              ...prev,
              totalPages: vendorsRes.pagination.totalPages || 1,
              totalItems: vendorsRes.pagination.total || 0
            }));
          }
        } else {
          // Handle case when no vendors found
          setVendors([]);
          setPagination(prev => ({ 
            ...prev,
            totalPages: 1,
            totalItems: 0
          }));
        }

        if (categoriesRes.success && categoriesRes.data?.parent_categories) {
          setCategories(['All', ...categoriesRes.data.parent_categories.map((c: any) => c.name)]);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        // Handle error case
        setVendors([]);
        setPagination(prev => ({ 
          ...prev,
          totalPages: 1,
          totalItems: 0
        }));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeCategory, pagination.page, selectedSectors, selectedStages, selectedRegions, debouncedSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <Image 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2000" 
            alt="Vendor Directory" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center px-6 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-8">Vendor Directory</h1>
            <p className="text-xl md:text-2xl text-white/90 font-body leading-relaxed">
              Connecting hospitality brands with trade partners and specialized manufacturers.
            </p>
          </div>
        </section>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-20">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => {
                  setActiveCategory(cat);
                  setPagination(p => ({ ...p, page: 1 }));
                }}
                className={`px-10 py-3 rounded-full font-body text-sm font-medium transition-all border shadow-sm ${
                  activeCategory === cat
                    ? 'bg-[#8B5E3C] text-white border-[#8B5E3C] shadow-lg' 
                    : 'bg-white text-muted-teal border-surface-dim hover:border-muted-teal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-16">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="flex flex-col gap-12 sticky top-24">
                {/* Market Sector */}
                <div>
                  <h3 className="font-body text-[12px] font-bold text-terracotta uppercase tracking-[0.2em] mb-6">Market Sector</h3>
                  <div className="flex flex-col gap-4">
                    {['Boutique & Heritage', 'Resort & Spa', 'Business & Urban', 'Eco-Sustainable'].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="hidden" checked={selectedSectors.includes(item)} onChange={() => toggleFilter(setSelectedSectors, item)} />
                        <span className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${selectedSectors.includes(item) ? 'bg-terracotta border-terracotta' : 'border-outline group-hover:border-terracotta'}`}>
                           {selectedSectors.includes(item) && <Check size={12} weight="bold" className="text-white" />}
                        </span>
                        <span className="font-body text-sm text-muted-teal group-hover:text-foreground transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Procurement Stage */}
                <div>
                  <h3 className="font-body text-[12px] font-bold text-terracotta uppercase tracking-[0.2em] mb-6">Procurement Stage</h3>
                  <div className="flex flex-col gap-4">
                    {['Design & Concept', 'Bulk Purchasing', 'Maintenance & Ops', 'Refurbishment'].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="hidden" checked={selectedStages.includes(item)} onChange={() => toggleFilter(setSelectedStages, item)} />
                        <span className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${selectedStages.includes(item) ? 'bg-terracotta border-terracotta' : 'border-outline group-hover:border-terracotta'}`}>
                           {selectedStages.includes(item) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        <span className="font-body text-sm text-muted-teal group-hover:text-foreground transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Region */}
                <div>
                  <h3 className="font-body text-[12px] font-bold text-terracotta uppercase tracking-[0.2em] mb-6">Region</h3>
                  <div className="flex flex-col gap-4">
                    {['EMEA Region', 'North America', 'Asia Pacific'].map(item => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" className="hidden" checked={selectedRegions.includes(item)} onChange={() => toggleFilter(setSelectedRegions, item)} />
                        <span className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${selectedRegions.includes(item) ? 'bg-terracotta border-terracotta' : 'border-outline group-hover:border-terracotta'}`}>
                           {selectedRegions.includes(item) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        <span className="font-body text-sm text-muted-teal group-hover:text-foreground transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Grid */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-surface-dim pb-6 gap-6">
                <p className="font-body text-muted-teal order-2 md:order-1">
                  Showing <span className="font-bold text-foreground">{pagination.totalItems}</span> Vendors
                </p>

                {/* Search Bar */}
                <div className="relative w-full md:w-96 order-1 md:order-2 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlass size={20} weight="light" className="text-gray-400 group-focus-within:text-terracotta transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search vendors by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagination(p => ({ ...p, page: 1 }));
                    }}
                    className="w-full pl-12 pr-12 py-3 bg-white border border-surface-dim rounded-full font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta transition-all shadow-sm hover:shadow-md"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-terracotta transition-colors"
                    >
                      <X size={16} weight="light" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-white animate-pulse rounded-[24px] border border-surface-dim" />
                  ))
                ) : vendors.length > 0 ? (
                  vendors.map(vendor => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="w-20 h-20 rounded-full bg-surface-dim flex items-center justify-center text-muted-teal/30">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No vendors found</h3>
                    <p className="text-muted-teal max-w-md mx-auto">
                      Try adjusting your filters or search terms to find what you're looking for.
                    </p>
                    <button 
                      onClick={() => {
                        setSelectedSectors([]);
                        setSelectedStages([]);
                        setSelectedRegions([]);
                        setActiveCategory('All');
                        setSearchQuery('');
                        setPagination(p => ({ ...p, page: 1 }));
                      }}
                      className="mt-8 px-8 py-3 bg-terracotta text-white rounded-full font-bold text-sm hover:bg-terracotta/90 transition-all"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-20 flex justify-center items-center gap-6">
                  <button 
                    onClick={goToPreviousPage}
                    disabled={pagination.page === 1}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-medium transition-all ${
                      pagination.page === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white border border-surface-dim text-muted-teal hover:bg-gray-50 hover:shadow-lg'
                    }`}
                  >
                    <CaretLeft size={20} weight="light" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-muted-teal">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  </div>

                  <button 
                    onClick={goToNextPage}
                    disabled={pagination.page === pagination.totalPages}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-body font-medium transition-all ${
                      pagination.page === pagination.totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white border border-surface-dim text-muted-teal hover:bg-gray-50 hover:shadow-lg'
                    }`}
                  >
                    Next
                    <CaretRight size={20} weight="light" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

