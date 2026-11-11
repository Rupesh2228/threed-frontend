import { useEffect, useState } from 'react';
import { api } from '../api.js';

export const QUALITIES = [
  [256, 'TripoSR default', 'The tested worker currently uses marching-cubes resolution 256.'],
];

export default function Settings({ quality, setQuality, active }) {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (active) api.health().then((data) => { setHealth(data); setError(null); }).catch((e) => setError(e.message));
  }, [active]);
  const worker = health?.gpuWorker;
  const workerReady = worker?.status === 'ok' && worker?.model_loaded && worker?.cuda_available;
  return <div className="space-y-6">
    <header><h1 className="text-3xl font-bold tracking-tight">Settings</h1></header>
    <section className="card space-y-3">
      <h2 className="font-semibold">Mesh quality</h2>
      <p className="text-sm text-white/60">The current Colab worker uses a fixed extraction resolution of 256. Quality selection is disabled until the worker supports configurable resolution.</p>
      <label className="flex items-center gap-3 rounded-lg border border-orange-500 bg-orange-500/10 p-3">
        <input type="radio" checked readOnly className="accent-orange-500" />
        <div><div className="font-medium">TripoSR default (256)</div><div className="text-sm text-white/50">Fixed worker setting</div></div>
      </label>
    </section>
    <section className="card space-y-2 text-sm">
      <h2 className="mb-2 font-semibold">Service status</h2>
      {error && <p className="text-red-300">{error}</p>}
      {health && <p>Backend: <b className="text-emerald-300">running</b> · uploads max {health.maxUploadMB} MB</p>}
      {health?.gpuWorkerError && <p className="text-red-300">GPU worker: {health.gpuWorkerError}</p>}
      {worker && <>
        <p>GPU worker: <b className={workerReady ? 'text-emerald-300' : 'text-amber-300'}>{workerReady ? 'ready' : 'not ready'}</b></p>
        <p>Device: <b>{worker.gpu?.name || 'Unavailable'}</b> · CUDA: {String(worker.cuda_available)} · Model loaded: {String(worker.model_loaded)}</p>
        {worker.model_error && <p className="text-red-300">{worker.model_error}</p>}
        {worker.gpu?.freeMemoryBytes != null && <p>Free GPU memory: {(worker.gpu.freeMemoryBytes / (1024 ** 3)).toFixed(2)} GB</p>}
      </>}
      {!health && !error && <p className="text-white/50">Loading service status…</p>}
      <p className="pt-2 text-xs text-white/40">Colab GPU sessions and Cloudflare quick-tunnel URLs are temporary. Keep the notebook running while generating models.</p>
    </section>
  </div>;
}
