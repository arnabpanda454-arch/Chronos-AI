// ... existing code ...
  BarChart3, Settings, Smile, BatteryCharging, Tag, LayoutGrid, CheckSquare, FileText,
  LogIn, LogOut, Cloud, Mail, Lock, UserPlus
} from 'lucide-react';

// ============================================================================
// CONSTANTS & STORAGE KEYS
// ============================================================================
const defaultApiKey = ""; // Canvas runtime automatically injects the key when empty
const STORAGE_KEY = "chronos_ai_state_v3";
const API_KEY_STORAGE = "chronos_gemini_api_key";
const SUPABASE_SESSION_STORAGE = "chronos_supabase_session_v1";

// Paste your public Supabase project URL & Anon Key here (protected by RLS),
// or expose them on window.__CHRONOS_ENV__ in index.html.
const SUPABASE_URL_CONFIG = "";
const SUPABASE_ANON_KEY_CONFIG = "";

// ... existing code ...
// ============================================================================
// GEMINI API HELPER WITH SMART RETRY, TIMEOUT & ENV/UI KEY SUPPORT
// ============================================================================
async function callGeminiAPI(prompt, systemInstruction, responseSchema = null, customApiKey = "") {
  const runtimeKey =
    (typeof window !== 'undefined' && window.__CHRONOS_ENV__?.VITE_GEMINI_API_KEY) || "";
  const effectiveKey = customApiKey?.trim() || runtimeKey || defaultApiKey;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${effectiveKey}`;
// ... existing code ...
// ============================================================================
// SUPABASE REST CLIENT & AUTH PAGE (ZERO-DEPENDENCY, INLINED)
// ============================================================================
const supabaseUrl =
  SUPABASE_URL_CONFIG ||
  (typeof window !== 'undefined' ? window.__CHRONOS_ENV__?.VITE_SUPABASE_URL || '' : '');
const supabaseAnonKey =
  SUPABASE_ANON_KEY_CONFIG ||
  (typeof window !== 'undefined' ? window.__CHRONOS_ENV__?.VITE_SUPABASE_ANON_KEY || '' : '');
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function createSupabaseRestClient(baseUrl, anonKey) {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const listeners = new Set();

  const readStoredSession = () => {
    try {
      const raw = localStorage.getItem(SUPABASE_SESSION_STORAGE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeStoredSession = (sessionObj) => {
    try {
      if (sessionObj) {
        localStorage.setItem(SUPABASE_SESSION_STORAGE, JSON.stringify(sessionObj));
      } else {
        localStorage.removeItem(SUPABASE_SESSION_STORAGE);
      }
    } catch {
      // Ignore storage quota errors
    }
  };

  const notify = (event, sessionObj) => {
    listeners.forEach((cb) => {
      try {
        cb(event, sessionObj);
      } catch {
        // Ignore listener errors
      }
    });
  };

  const buildHeaders = (accessToken) => ({
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`
  });

  const parseError = async (res, fallback) => {
    try {
      const errJson = await res.json();
      return new Error(errJson.error_description || errJson.msg || errJson.message || fallback);
    } catch {
      return new Error(fallback);
    }
  };

  const auth = {
    async getSession() {
      const stored = readStoredSession();
      if (!stored) return { data: { session: null }, error: null };

      const nowSec = Math.floor(Date.now() / 1000);
      if (stored.expires_at && nowSec > stored.expires_at - 60 && stored.refresh_token) {
        try {
          const res = await fetch(`${cleanUrl}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: buildHeaders(null),
            body: JSON.stringify({ refresh_token: stored.refresh_token })
          });
          if (!res.ok) {
            writeStoredSession(null);
            return { data: { session: null }, error: null };
          }
          const refreshed = await res.json();
          writeStoredSession(refreshed);
          return { data: { session: refreshed }, error: null };
        } catch {
          return { data: { session: stored }, error: null };
        }
      }
      return { data: { session: stored }, error: null };
    },

    onAuthStateChange(callback) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback)
          }
        }
      };
    },

    async signInWithPassword({ email, password }) {
      const res = await fetch(`${cleanUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: buildHeaders(null),
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        return { data: null, error: await parseError(res, 'Invalid email or password.') };
      }
      const sessionObj = await res.json();
      writeStoredSession(sessionObj);
      notify('SIGNED_IN', sessionObj);
      return { data: { session: sessionObj, user: sessionObj.user }, error: null };
    },

    async signUp({ email, password }) {
      const res = await fetch(`${cleanUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: buildHeaders(null),
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        return { data: null, error: await parseError(res, 'Could not create account.') };
      }
      const payload = await res.json();
      if (payload?.access_token) {
        writeStoredSession(payload);
        notify('SIGNED_IN', payload);
        return { data: { user: payload.user, session: payload }, error: null };
      }
      return { data: { user: payload?.user || payload, session: null }, error: null };
    },

    async signOut() {
      const stored = readStoredSession();
      if (stored?.access_token) {
        try {
          await fetch(`${cleanUrl}/auth/v1/logout`, {
            method: 'POST',
            headers: buildHeaders(stored.access_token)
          });
        } catch {
          // Always clear local session even if logout request fails
        }
      }
      writeStoredSession(null);
      notify('SIGNED_OUT', null);
      return { error: null };
    }
  };

  const from = (table) => ({
    select(columns = '*') {
      return {
        eq(column, value) {
          return {
            async maybeSingle() {
              const stored = readStoredSession();
              const query = `${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}&select=${encodeURIComponent(columns)}`;
              const res = await fetch(`${cleanUrl}/rest/v1/${table}?${query}`, {
                method: 'GET',
                headers: buildHeaders(stored?.access_token)
              });
              if (!res.ok) {
                return { data: null, error: await parseError(res, 'Failed to load cloud state.') };
              }
              const rows = await res.json();
              return { data: Array.isArray(rows) ? (rows[0] ?? null) : rows, error: null };
            }
          };
        }
      };
    },

    async upsert(record) {
      const stored = readStoredSession();
      const res = await fetch(`${cleanUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          ...buildHeaders(stored?.access_token),
          Prefer: 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify(record)
      });
      if (!res.ok) {
        return { data: null, error: await parseError(res, 'Failed to save cloud state.') };
      }
      return { data: null, error: null };
    }
  });

  return { auth, from };
}

const supabase = isSupabaseConfigured ? createSupabaseRestClient(supabaseUrl, supabaseAnonKey) : null;

function AuthPage({ onGuestContinue }) {
// ... existing code ...