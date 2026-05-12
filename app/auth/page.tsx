'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeSlash, GoogleLogo, WindowsLogo, AppleLogo } from "@phosphor-icons/react";
import { Turnstile } from '@marsidev/react-turnstile';
import { useUser } from '@/lib/context/UserContext';
import { createClient } from '@/lib/supabase/client';
import GoogleAuthButton from '@/components/auth/google-auth-button';

interface SignupFormData {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: 'hotel_owner' | 'vendor';
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser } = useUser();
  
  useEffect(() => {
    if (user) {
      const userRole = user.role?.toLowerCase();
      if (userRole === 'vendor') {
        router.push('/dashboard/vendor');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);
  
  const [isRegister, setIsRegister] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [role, setRole] = useState<'hotel_owner' | 'vendor'>('hotel_owner');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [signupData, setSignupData] = useState<SignupFormData>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'hotel_owner'
  });

  useEffect(() => {
    setIsMounted(true);
    const registerParam = searchParams.get('register') === 'true';
    setIsRegister(registerParam);
    if (registerParam) setRole('vendor');
  }, [searchParams]);

  const toggleRegister = () => {
    const nextValue = !isRegister;
    setIsRegister(nextValue);
    const newUrl = nextValue ? '/auth?register=true' : '/auth';
    router.push(newUrl, { scroll: false });
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' && !/^[0-9\s\(\)\-\+]*$/.test(value)) return;
    setSignupData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (isLogin = false) => {
    const newErrors: {[key: string]: string} = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (isLogin) {
      if (!loginData.email) newErrors.loginEmail = 'Required';
      else if (!emailRegex.test(loginData.email)) newErrors.loginEmail = 'Invalid email';
      if (!loginData.password) newErrors.loginPassword = 'Required';
      if (!captchaToken) newErrors.captcha = 'Please verify you are human';
    } else {
      if (!signupData.full_name.trim()) newErrors.full_name = 'Required';
      if (!signupData.email) newErrors.email = 'Required';
      else if (!emailRegex.test(signupData.email)) newErrors.email = 'Invalid email';
      if (!signupData.password || signupData.password.length < 6) newErrors.password = 'Min 6 chars';
      if (!signupData.phone) newErrors.phone = 'Required';
      if (!captchaToken) newErrors.captcha = 'Please verify you are human';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...loginData, captchaToken: captchaToken })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ loginEmail: data.message || 'Invalid credentials' });
        return;
      }
      setUser(data.data.user);
      localStorage.setItem('hv_token', data.data.access_token);
      localStorage.setItem('hv_user', JSON.stringify(data.data.user));
      localStorage.setItem('hv_login_success', 'true');
      
      const userRole = data.data.user.role?.toLowerCase();
      if (userRole === 'vendor') {
        router.push('/dashboard/vendor');
      } else {
        router.push('/');
      }
    } catch (err) {
      setErrors({ loginEmail: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signupData, role, turnstile_token: captchaToken })
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ email: data.message || 'Signup failed' });
        return;
      }
      // Auto-login logic
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email, password: signupData.password })
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        setUser(loginData.data.user);
        localStorage.setItem('hv_token', loginData.data.access_token);
        localStorage.setItem('hv_user', JSON.stringify(loginData.data.user));
        localStorage.setItem('hv_login_success', 'true');
        
        const userRole = loginData.data.user.role?.toLowerCase();
        if (userRole === 'vendor') {
          router.push('/dashboard/vendor');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setErrors({ email: 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
    const supabase = createClient();
    if (!supabase) return;
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
      },
    });

    if (error) {
      setErrors({ social: error.message });
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Cinematic Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[10s] ease-linear scale-110"
        style={{ backgroundImage: 'url("/images/auth-bg.png")' }}
      />
      <div className="absolute inset-0 z-1 bg-black/40 backdrop-blur-[2px]" />
      <div className="absolute inset-0 z-1 bg-gradient-to-b from-[#4F7575]/20 to-black/60" />

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white/20 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_80px_rgba(0,0,0,0.4)] border border-white/30 overflow-hidden flex flex-col items-center p-6 md:p-8 animate-fade-in-up">
        
        {/* Logo Area */}
        <Link href="/" className="group mb-5 flex flex-col items-center">
          <div className="w-10 h-10 bg-[#4F7575] rounded-xl flex items-center justify-center text-white font-display text-xl font-bold shadow-lg group-hover:rotate-12 transition-transform duration-500">H</div>
          <span className="mt-2 font-display font-bold text-sm tracking-[0.2em] text-white">HOTELVENDORS</span>
        </Link>

        <div className="w-full text-center mb-5">
          <h1 className="text-3xl font-display font-bold text-white mb-1 leading-tight">
            {isRegister ? 'Sign Up' : 'Sign In'}
          </h1>
          <p className="text-xs font-bold text-white/70 uppercase tracking-[0.2em]">
            Hospitality Marketplace
          </p>
        </div>

        {/* Role Segmented Control */}
        <div className="w-full bg-black/10 p-1 rounded-2xl flex mb-5 border border-white/10 shadow-inner relative">
          <button 
            onClick={() => { setRole('hotel_owner'); setSignupData(p => ({ ...p, role: 'hotel_owner' })); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-[10px] font-bold uppercase tracking-widest transition-all duration-300 relative z-10 ${role === 'hotel_owner' ? 'bg-white text-[#4F7575] shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'}`}
          >
            Owner
          </button>
          <button 
            onClick={() => { setRole('vendor'); setSignupData(p => ({ ...p, role: 'vendor' })); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-[10px] font-bold uppercase tracking-widest transition-all duration-300 relative z-10 ${role === 'vendor' ? 'bg-white text-[#4F7575] shadow-lg scale-[1.02]' : 'text-white/60 hover:text-white'}`}
          >
            Vendor
          </button>
        </div>

        {/* Form */}
        <form className="w-full space-y-4" onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold text-white/80 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" 
                name="full_name"
                value={signupData.full_name}
                onChange={handleSignupChange}
                required 
                className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:border-white focus:bg-white/20 font-body text-sm text-white transition-all placeholder:text-white/30"
                placeholder="Johnathan Doe" 
              />
            </div>
          )}

          <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold text-white/80 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              name="email"
              value={isRegister ? signupData.email : loginData.email}
              onChange={isRegister ? handleSignupChange : handleLoginChange}
              required 
              className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:border-white focus:bg-white/20 font-body text-sm text-white transition-all placeholder:text-white/30"
              placeholder="director@ritz.com" 
            />
          </div>

          <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold text-white/80 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={isRegister ? signupData.password : loginData.password}
                onChange={isRegister ? handleSignupChange : handleLoginChange}
                required 
                className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:border-white focus:bg-white/20 font-body text-sm text-white transition-all placeholder:text-white/30"
                placeholder="••••••••" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeSlash size={20} weight="light" /> : <Eye size={20} weight="light" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold text-white/80 uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={signupData.phone}
                onChange={handleSignupChange}
                required 
                className="w-full bg-white/10 border border-white/20 px-4 py-3 rounded-xl focus:outline-none focus:border-white focus:bg-white/20 font-body text-sm text-white transition-all placeholder:text-white/30"
                placeholder="+1 (555) 000-0000" 
              />
            </div>
          )}

          <div className="flex flex-col items-center py-2">
            <Turnstile 
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} 
              onSuccess={(token) => setCaptchaToken(token)}
              theme="light"
            />
            {errors.captcha && (
              <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest text-center mt-2">
                {errors.captcha}
              </p>
            )}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#4F7575] font-bold text-xs uppercase tracking-[0.2em] py-4 rounded-xl transition-all hover:bg-white/90 active:scale-95 shadow-xl disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-white/20" />
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-[1px] bg-white/20" />
        </div>

        {/* Social Buttons */}
        <div className="w-full">
          <GoogleAuthButton 
            role={role} 
            onError={(err) => setErrors({ social: err })} 
          />
        </div>

        {errors.social && (
          <p className="mt-4 text-[10px] font-bold text-rose-300 uppercase tracking-widest text-center">
            {errors.social}
          </p>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-white/60 mb-1">
            {isRegister ? 'Already joined?' : 'New here?'}
          </p>
          <button 
            onClick={toggleRegister}
            className="text-xs font-bold text-white hover:text-white/80 underline decoration-dotted transition-colors"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}