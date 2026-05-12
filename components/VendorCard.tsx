'use client';

import Image from 'next/image';
import { MapPin, Phone, User, Star, Buildings, Heart } from "@phosphor-icons/react";
import { useState } from 'react';
import VendorModal from './VendorModal';
import { useSavedVendors } from '@/lib/context/SavedVendorsContext';
import { toast } from 'react-hot-toast';
import { useUser } from '@/lib/context/UserContext';
import Link from 'next/link';

interface VendorCardProps {
  vendor: {
    id: string;
    slug: string;
    company_name: string;
    tagline: string;
    description: string;
    image_url: string;
    average_rating: number;
    review_count: number;
    city: string;
    state: string;
    country?: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    is_featured?: boolean;
    categories?: { name: string; slug: string }[];
  };
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export default function VendorCard({ vendor }: VendorCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toggleSaveVendor, isVendorSaved } = useSavedVendors();
  const { user } = useUser();

  const isSaved = isVendorSaved(vendor.id);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleSaveVendor(vendor);
    if (result.limitReached) {
      toast.error('Limit reached! Sign in to save more than 10 vendors.', {
        icon: '🔒',
        duration: 4000
      });
    } else if (!isSaved) {
      toast.success('Vendor saved to your list');
    }
  };

  const hasValidLogo = vendor.image_url && 
    vendor.image_url.length > 5 &&
    !vendor.image_url.includes('admin_assets/img/location.svg') && 
    !vendor.image_url.includes('placeholder.png');

  return (
    <>
      <div 
        className="relative bg-white rounded-[24px] shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col items-center text-center h-full border border-gray-100 group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Save Button */}
        <button 
          onClick={handleSave}
          className={`absolute top-6 right-6 z-10 p-2.5 rounded-full transition-all duration-300 border ${
            isSaved 
              ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-sm' 
              : 'bg-white border-gray-100 text-gray-300 hover:text-rose-400 hover:border-rose-100 shadow-sm'
          }`}
        >
          <Heart size={20} weight={isSaved ? "fill" : "bold"} />
        </button>
        {/* Logo Section */}
        <div className="relative w-full h-32 mb-6 flex items-center justify-center">
          {hasValidLogo && !imgError ? (
            <Image 
              src={vendor.image_url} 
              alt={vendor.company_name}
              fill
              className="object-contain"
              unoptimized={true}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
              <Buildings size={40} weight="light" />
            </div>
          )}
        </div>

        {/* Company Info */}
        <h3 className="text-[#2D5B92] font-bold text-xl mb-1">{vendor.company_name}</h3>
        
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <MapPin size={18} className="text-[#2D5B92]" />
          <span>{vendor.city}, {vendor.state}</span>
        </div>

        {/* Rating Section - Only show if there are actual reviews */}
        {vendor.review_count > 0 ? (
          <div className="flex items-center gap-2 mb-6">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} weight={s <= (vendor.average_rating || 0) ? 'fill' : 'light'} className={s <= (vendor.average_rating || 0) ? 'text-[#D8994E]' : 'text-gray-200'} />
              ))}
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">({vendor.review_count} Reviews)</span>
          </div>
        ) : (
          <div className="h-6 mb-6" /> // Spacer to keep layout consistent
        )}

        {/* Rep Info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#1FB68C] flex items-center justify-center text-white">
            <User size={20} weight="fill" />
          </div>
          <span className="font-bold text-gray-700">
            {vendor.contact_name && !vendor.contact_name.includes('@') 
              ? vendor.contact_name 
              : 'Inquiry Required'}
          </span>
        </div>

        {/* Phone Pill */}
        <div className="inline-flex items-center gap-3 px-6 py-3 border border-gray-200 rounded-full text-gray-600 mb-8 hover:bg-gray-50 transition-colors">
          <Phone size={20} className="text-[#1FB68C]" weight="fill" />
          <span className="font-bold">{vendor.phone || '+1 Inquire Now'}</span>
        </div>

        {/* View More Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className="mt-auto w-full py-4 bg-[#2D5B92] text-white font-bold rounded-xl hover:bg-[#1a3a5f] transition-all shadow-md active:scale-95 text-xs uppercase tracking-widest"
        >
          View More
        </button>
      </div>

      {/* Vendor Detail Modal */}
      <VendorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        vendor={vendor} 
      />
    </>
  );
}