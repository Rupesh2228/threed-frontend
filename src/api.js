// Thin client for the Express backend (proxied by Vite, so no CORS needed).
async function call(url, opts) {
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new Error('Cannot reach the backend on localhost:5000. Is it running? (see logs/backend.log)');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => call('/api/health'),
  generate: (file, { quality }) => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('quality', String(quality));
    return call('/api/generate', { method: 'POST', body: fd });
  },
  job: (id) => call(`/api/jobs/${id}`),
  models: () => call('/api/models'),
  model: (id) => call(`/api/models/${id}`),
  remove: (id) => call(`/api/models/${id}`, { method: 'DELETE' }),
};

export const fmtBytes = (n) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
export const fmtDate = (iso) => new Date(iso).toLocaleString();
export const fmtTime = (s) => `${Math.floor(s / 60)}m ${String(Math.floor(s % 60)).padStart(2, '0')}s`;
