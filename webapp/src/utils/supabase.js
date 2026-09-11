import { createClient } from '@supabase/supabase-js';
import { MOCK_INTAKE_RESPONSES } from '../data/intakeData';

const STORAGE_KEY_URL = 'amazona_supabase_url';
const STORAGE_KEY_ANON = 'amazona_supabase_anon_key';

export function getSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem(STORAGE_KEY_ANON) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key, isConfigured: Boolean(url && key) };
}

export function setSupabaseConfig(url, key) {
  if (url && key) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
}

let supabaseInstance = null;

export function getSupabaseClient() {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

export async function fetchFormResponsesFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Return mock intake data
    return { data: MOCK_INTAKE_RESPONSES, isLive: false };
  }

  try {
    const { data, error } = await supabase
      .from('respuestas_formulario')
      .select('*')
      .order('marca_temporal', { ascending: false });

    if (error) throw error;
    return { data: data || [], isLive: true };
  } catch (err) {
    console.warn('Error obteniendo respuestas de Supabase, usando fallback local:', err);
    return { data: MOCK_INTAKE_RESPONSES, isLive: false, error: err.message };
  }
}

export async function updateResponseStatusInSupabase(id, status) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Update in local mock
    const item = MOCK_INTAKE_RESPONSES.find(r => r.id === id);
    if (item) item.estado_pago = status;
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('respuestas_formulario')
      .update({ estado_pago: status })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error actualizando estado en Supabase:', err);
    return { success: false, error: err.message };
  }
}
