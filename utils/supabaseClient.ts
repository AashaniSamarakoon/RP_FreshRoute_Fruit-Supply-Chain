// supabaseClient.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto"; // Adds URL support for older engines

// Replace these with your actual Supabase Project credentials
// Best practice: Use process.env.EXPO_PUBLIC_SUPABASE_URL if using Expo Router .env
const SUPABASE_URL = "https://aiwndjgadyaxuyoioxxa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpd25kamdhZHlheHV5b2lveHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODEyNDMsImV4cCI6MjA3Njg1NzI0M30.YTYB_SgzsD5syELoH9xR7kiwR0u_G2fL_qVjS-3keRE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // Configures the client to use Async Storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Turn off for React Native (no browser URL bar)
  },
});
