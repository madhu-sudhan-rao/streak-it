import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase environment variables with fallbacks if needed
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "https://lnrncwjdocbhfbrpnxik.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_KnJUCCHIBtIai0KY__SMYw_lEN6zesP";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
