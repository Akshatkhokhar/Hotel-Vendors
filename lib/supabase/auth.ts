import { createClient } from './client';

/**
 * Signs in a user using Google OAuth.
 * @param role Optional role to assign to the user (e.g., 'hotel_owner' or 'vendor')
 * @returns An object containing the error if any.
 */
export async function signInWithGoogle(role?: 'hotel_owner' | 'vendor') {
  const supabase = createClient();
  
  if (!supabase) {
    throw new Error('Supabase client could not be initialized.');
  }

  // Define the redirect URL for the callback handler
  // We include the role as a query parameter so the callback handler can use it
  const redirectTo = role 
    ? `${window.location.origin}/auth/callback?role=${role}`
    : `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  return { data, error };
}
