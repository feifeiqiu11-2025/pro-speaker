import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),

  // Azure Speech Services
  AZURE_SPEECH_KEY: z.string().min(1, 'Azure Speech key is required'),
  AZURE_SPEECH_REGION: z.string().min(1, 'Azure Speech region is required'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  // Database (optional for POC)
  DATABASE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    throw new Error('Environment not loaded. Call loadEnv() first.');
  }
  return cachedEnv;
}
