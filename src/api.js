// API client. Set VITE_API_URL on Vercel; Vite proxy is used for local development.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const endpoint = (path) => `${API_BASE}${path}`;

async function call(path, opts) {
  let res;
  try {
    res = await fetch(endpoint(path), opts);
  } catch {
    throw new Error('Cannot reach the backend. Check the Render service and VITE_API_URL setting.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function withAbsoluteUrls(model) {
  if (!model?.urls) return model;
  return { ...model, urls: Object.fromEntries(Object.entries(model.urls).map(([key, value]) => [key, value ? endpoint(value) : value])) };
}

export const api = {
  health: () => call('/api/health'),
  generate: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return call('/api/generate', { method: 'POST', body: fd });
  },
  job: (id) => call(`/api/jobs/${id}`),
  models: async () => (await call('/api/models')).map(withAbsoluteUrls),
  model: async (id) => withAbsoluteUrls(await call(`/api/models/${id}`)),
  remove: (id) => call(`/api/models/${id}`, { method: 'DELETE' }),
};

export const fmtBytes = (n) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
export const fmtDate = (iso) => new Date(iso).toLocaleString();
export const fmtTime = (s) => s == null ? '—' : `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;
