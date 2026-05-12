import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET handler for Supabase OAuth callback.
 * This route is called by Supabase after a successful OAuth login.
 * It exchanges the 'code' parameter for an authenticated session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') ?? 'vendor';
  
  // After successful login, redirect to the appropriate dashboard
  const next = role === 'vendor' ? '/dashboard/vendor' : '/dashboard';

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      const user = data.user;
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();
        
      let userRole = role;
      
      // If profile doesn't exist, create one. If it does, update the role to match current selection.
      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          role: role,
          full_name: user.user_metadata.full_name || user.user_metadata.name,
          updated_at: new Date().toISOString(),
        });
        
        // Update user metadata for instant access on client
        await supabase.auth.updateUser({
          data: { role: role }
        });
      } else {
        // Update the role based on the current selection at login
        if (profile.role !== role) {
          await Promise.all([
            supabase
              .from('profiles')
              .update({ role, updated_at: new Date().toISOString() })
              .eq('id', user.id),
            supabase.auth.updateUser({
              data: { role: role }
            })
          ]);
        }
        userRole = role;
      }

      // After successful login, redirect to the appropriate dashboard
      // Vendors go to /dashboard/vendor, others (hotel owners) go to /
      const finalNext = userRole === 'vendor' ? '/dashboard/vendor' : '/';
      
      // If session exchange is successful, redirect to the dashboard
      return NextResponse.redirect(`${origin}${finalNext}`);
    }
    
    // Log error if code exchange fails
    if (error) console.error('Error exchanging code for session:', error.message);
  }

  // If something went wrong, redirect to login page with an error
  return NextResponse.redirect(`${origin}/auth?error=auth-callback-failed`);
}
