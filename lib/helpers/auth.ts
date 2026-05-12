import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export async function getCurrentUser(_request?: NextRequest): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireRole(...roles: string[]): Promise<{ authorized: boolean, error?: string, status?: number, user?: User, role?: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { authorized: false, error: 'Unauthorized', status: 401 };
  }

  const userRole = user.user_metadata?.role;
  
  // admin can access anything protected by role
  if (userRole === 'admin') {
    return { authorized: true, user, role: userRole };
  }

  if (roles.length > 0 && !roles.includes(userRole)) {
    return { authorized: false, error: 'Forbidden', status: 403 };
  }

  return { authorized: true, user, role: userRole };
}
