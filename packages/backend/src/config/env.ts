import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),

  GMAIL_CLIENT_ID: z.string().min(1),
  GMAIL_CLIENT_SECRET: z.string().min(1),
  GMAIL_REFRESH_TOKEN: z.string().min(1),
  GMAIL_PUBSUB_TOPIC: z.string().min(1),

  SHOPIFY_STORE_DOMAIN: z.string().min(1),
  SHOPIFY_ACCESS_TOKEN: z.string().min(1),

  OPENAI_API_KEY: z.string().min(1),

  DATABASE_URL: z.string().url(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  EMAIL_NISSAN: z.string().email(),
  EMAIL_TEST: z.string().email().optional(),
  EMAIL_PROD: z.string().email().optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
