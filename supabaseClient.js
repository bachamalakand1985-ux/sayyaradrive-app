import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cvttxeylrxrgvfvatymi.supabase.co';
const supabaseKey = 'sb_publishable_k0e5T11CqEhAhTAdDjmp4w_3aTDdicY';

export const supabase = createClient(supabaseUrl, supabaseKey);
