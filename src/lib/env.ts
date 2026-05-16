/// <reference types="vite/client" />

import { z } from "zod";

const envSchema = z.object({
  // TODO: Make required once .env.local is provisioned in all environments.
  VITE_SUPABASE_URL: z.string().url().default(""),
  VITE_SUPABASE_ANON_KEY: z.string().default(""),
  // Optional — analytics disabled when missing.
  VITE_POSTHOG_KEY: z.string().optional().default(""),
  VITE_POSTHOG_HOST: z.string().optional().default(""),
});

export const env = envSchema.parse(import.meta.env);
