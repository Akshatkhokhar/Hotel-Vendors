'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@/lib/context/UserContext';

interface SavedVendor {
  id: string;
  slug: string;
  company_name: string;
  image_url?: string;
  city?: string;
  state?: string;
  contact_name?: string;
  phone?: string;
  categories?: { name: string; slug: string }[];
  savedAt: number;
}

interface SavedVendorsContextType {
  savedVendors: SavedVendor[];
  isVendorSaved: (id: string) => boolean;
  toggleSaveVendor: (vendor: Omit<SavedVendor, 'savedAt'>) => { success: boolean; limitReached?: boolean };
  removeSavedVendor: (id: string) => void;
  savedCount: number;
  maxFreeSlots: number;
}

const SavedVendorsContext = createContext<SavedVendorsContextType | undefined>(undefined);

const STORAGE_KEY = 'hv_saved_vendors';
const MAX_FREE_SAVES = 10;

export function SavedVendorsProvider({ children }: { children: React.ReactNode }) {
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);
  const { user } = useUser();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedVendors(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      console.error('Failed to load saved vendors');
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedVendors));
    } catch {
      console.error('Failed to save vendors to localStorage');
    }
  }, [savedVendors]);

  const isVendorSaved = useCallback(
    (id: string) => savedVendors.some(v => v.id === id),
    [savedVendors]
  );

  const toggleSaveVendor = useCallback(
    (vendor: Omit<SavedVendor, 'savedAt'>) => {
      const alreadySaved = savedVendors.some(v => v.id === vendor.id);

      if (alreadySaved) {
        setSavedVendors(prev => prev.filter(v => v.id !== vendor.id));
        return { success: true };
      }

      // Check limit for non-authenticated users
      if (!user && savedVendors.length >= MAX_FREE_SAVES) {
        return { success: false, limitReached: true };
      }

      setSavedVendors(prev => [...prev, { ...vendor, savedAt: Date.now() }]);
      return { success: true };
    },
    [savedVendors, user]
  );

  const removeSavedVendor = useCallback((id: string) => {
    setSavedVendors(prev => prev.filter(v => v.id !== id));
  }, []);

  return (
    <SavedVendorsContext.Provider
      value={{
        savedVendors,
        isVendorSaved,
        toggleSaveVendor,
        removeSavedVendor,
        savedCount: savedVendors.length,
        maxFreeSlots: MAX_FREE_SAVES,
      }}
    >
      {children}
    </SavedVendorsContext.Provider>
  );
}

export function useSavedVendors() {
  const context = useContext(SavedVendorsContext);
  if (context === undefined) {
    throw new Error('useSavedVendors must be used within a SavedVendorsProvider');
  }
  return context;
}
