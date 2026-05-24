import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const requiredVariables = [
  'SUPABASE_URL',
  'SUPABASE_STORAGE_BUCKET',
  'JWT_SECRET',
] as const;

const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (!supabaseServerKey) {
  missingVariables.push('SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY' as never);
}

if (missingVariables.length > 0) {
  throw new Error(
    `Variaveis de ambiente obrigatorias ausentes: ${missingVariables.join(', ')}`
  );
}

function parseOrigins(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeSupabaseUrl(value: string) {
  const trimmed = value.trim();

  if (/^[a-z0-9-]{15,}$/i.test(trimmed) && !trimmed.includes('.')) {
    return `https://${trimmed}.supabase.co`;
  }

  const parsed = new URL(trimmed);

  if (
    parsed.hostname === 'supabase.com' &&
    parsed.pathname.includes('/dashboard/project/')
  ) {
    const projectRef = parsed.pathname.split('/dashboard/project/')[1]?.split('/')[0];

    if (projectRef) {
      return `https://${projectRef}.supabase.co`;
    }
  }

  if (parsed.pathname === '/rest/v1' || parsed.pathname.startsWith('/rest/v1/')) {
    parsed.pathname = '';
  }

  if (parsed.hostname.endsWith('.supabase.co')) {
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  }

  throw new Error(
    'SUPABASE_URL invalida. Use a Project URL no formato https://SEU_PROJECT_REF.supabase.co'
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3333,
  jwtSecret: process.env.JWT_SECRET as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  frontendOrigins: parseOrigins(process.env.FRONTEND_URL),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  supabase: {
    url: normalizeSupabaseUrl(process.env.SUPABASE_URL as string),
    serviceRoleKey: supabaseServerKey as string,
    anonKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET as string,
  },
};
