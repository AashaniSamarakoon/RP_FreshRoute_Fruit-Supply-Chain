// supabaseClient.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as FileSystem from "expo-file-system/legacy";
import "react-native-url-polyfill/auto";
// @ts-ignore: no types provided for this helper
import { decode } from "base64-arraybuffer";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function uploadImageToSupabase(
  uri: string,
  userId: string,
  bucketName: string,
  folder: string,
  filename: string,
): Promise<string> {
  try {
    const path = `${userId}/${folder}/${filename}`;

    // obtain the latest supabase session token
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const authSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      },
    });

    // read the file as base64 and decode for upload
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });

    console.log(`Uploading to bucket: ${bucketName}, path: ${path}`);

    const { error: uploadError } = await authSupabase.storage
      .from(bucketName)
      .upload(path, decode(base64), {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw uploadError;
    }

    const { data } = authSupabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error);
    throw error;
  }
}