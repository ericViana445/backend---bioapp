import { createClient } from '@supabase/supabase-js';
import { env } from './config/env';

export type UserProvider = 'local' | 'google';

export type BioUser = {
  id: number;
  name: string;
  email: string;
  password: string | null;
  dob: string | null;
  provider: UserProvider;
  google_id: string | null;
  created_at?: string;
  updated_at?: string;
};

type CreateUserInput = {
  name: string;
  email: string;
  password?: string | null;
  dob?: string | null;
  provider: UserProvider;
  google_id?: string | null;
};

type PdfUploadInput = {
  user_id?: number | null;
  original_name: string;
  storage_path: string;
  public_url: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  extracted_text?: string | null;
};

type AiAnalysisInput = {
  user_id?: number | null;
  pdf_upload_id?: number | null;
  source: 'pdf' | 'manual';
  exam_type: string;
  input_payload?: Record<string, unknown> | string | null;
  result_payload?: unknown;
};

export const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function assertNoError<T>(data: T, error: { message: string } | null): T {
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export const initDB = async () => {
  const { error } = await supabase.from('users').select('id').limit(1);

  if (error) {
    throw new Error(
      `Falha ao conectar ao Supabase. Confira as tabelas e variaveis de ambiente: ${error.message}`
    );
  }

  console.log('Banco Supabase inicializado');
};

export const usersRepository = {
  async findByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    return assertNoError(data as BioUser | null, error);
  },

  async findById(id: number) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, dob, provider')
      .eq('id', id)
      .maybeSingle();

    return assertNoError(data as Omit<BioUser, 'password' | 'google_id'> | null, error);
  },

  async create(input: CreateUserInput) {
    const { data, error } = await supabase
      .from('users')
      .insert(input)
      .select('*')
      .single();

    return assertNoError(data as BioUser, error);
  },

  async updateDob(email: string, dob: string) {
    const { error } = await supabase
      .from('users')
      .update({ dob, updated_at: new Date().toISOString() })
      .eq('email', email);

    assertNoError(null, error);
  },

  async updateProfile(id: number, input: { name: string; email: string; dob: string }) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, email, dob, provider')
      .single();

    return assertNoError(data as Omit<BioUser, 'password' | 'google_id'>, error);
  },

  async updatePassword(email: string, hashedPassword: string) {
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('email', email);

    assertNoError(null, error);
  },
};

export const pdfRepository = {
  async createUpload(input: PdfUploadInput) {
    const { data, error } = await supabase
      .from('pdf_uploads')
      .insert(input)
      .select('*')
      .single();

    return assertNoError(data as { id: number }, error);
  },
};

export const aiRepository = {
  async createAnalysis(input: AiAnalysisInput) {
    const { data, error } = await supabase
      .from('ai_analyses')
      .insert(input)
      .select('*')
      .single();

    return assertNoError(data, error);
  },
};
