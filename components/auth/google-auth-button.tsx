'use client';

import { useState } from 'react';
import { GoogleLogo } from "@phosphor-icons/react";
import { signInWithGoogle } from '@/lib/supabase/auth';

interface GoogleAuthButtonProps {
  role?: 'hotel_owner' | 'vendor';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * A reusable Google Authentication button component.
 * Handles the loading state and error reporting.
 */
export default function GoogleAuthButton({ role, onSuccess, onError }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle(role);
      
      if (error) {
        console.error('Google Auth Error:', error.message);
        if (onError) onError(error.message);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Unexpected Auth Error:', err);
      if (onError) onError(err.message || 'An unexpected error occurred');
    } finally {
      // Note: redirectTo will cause a page navigation, 
      // so isLoading will stay true until the page unmounts.
    }
  };

  return (
    <button 
      onClick={handleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all group disabled:opacity-50"
      type="button"
    >
      <GoogleLogo size={24} weight="light" className={`text-white/60 group-hover:text-white transition-colors ${isLoading ? 'animate-pulse' : ''}`} />
      <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.2em] group-hover:text-white">
        {isLoading ? 'Connecting...' : 'Continue with Google'}
      </span>
    </button>
  );
}
