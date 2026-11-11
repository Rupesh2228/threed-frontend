import { useEffect, useState } from 'react';
import { api } from '../api.js';

export const QUALITIES = [
  [96, 'Draft', 'Fastest, lowest RAM. Use for first tests.'],
  [128, 'Balanced', 'Good default for an 8 GB laptop.'],
  [192, 'Detailed', 'More polygons, slower, more RAM.'],
  [256, 'High', "TripoSR's own default. Slowest; may run out of memory on 8 GB."],
];

export default function Settings({ quality, setQuality, active }) {
  const [h, setH] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (active) api.health().then((d) => { setH(d); setErr(null); }).catch((e) => setErr(e.message));
  }, [active]);
  const ai = h?.ai;
  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-bold tracking-tight">Settings</h1></header>
      <section className="card space-y-3">
        <h2 className="font-semibold">Mesh quality</h2>
        {QUALITIES.map(([v, name, desc]) => (
          <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${quality === v ? 'border-orange-500 bg-orange-500/10' : 'border-white/10'}`}>
            <input type="radio" name="q" checked={quality === v} onChange={() => setQuality(v)} className="accent-orange-500" />
            <div><div className="font-medium">{name} <span className="text-white/40">({v})</span></div><div className="text-sm text-white/50">{desc}</div></div>
          </label>
        ))}
      </section>
      <section className="card space-y-1 text-sm">
        <h2 className="mb-2 font-semibold">Service status</h2>
        {err && <p className="text-red-300">{err}</p>}
        {h && <p>Backend: <b className="text-emerald-300">running</b> · uploads max {h.maxUploadMB} MB</p>}
        {h?.aiError && <p className="text-red-300">{h.aiError}</p>}
        {ai && (
          <>
            <p>AI service: <b className="text-emerald-300">running</b>{ai.busy && ' (busy generating)'}</p>
            <p>Device: <b>{ai.device ?? 'n/a'}</b> · CUDA available: {String(ai.cudaAvailable)} · PyTorch {ai.torchVersion ?? 'not installed'}</p>
            <p>Model weights: {ai.weightsPresent ? <b className="text-emerald-300">found</b> : <b className="text-red-300">missing — run ai-engine/setup_ai_engine.sh</b>}</p>
            <p>RAM: {ai.memoryGB.available} GB free of {ai.memoryGB.total} GB · swap {ai.memoryGB.swap} GB</p>
            {ai.memoryGB.swap < 4 && <p className="text-amber-300">Low swap: with 8 GB RAM, add swap to avoid out-of-memory kills.</p>}
          </>
        )}
      </section>
    </div>
  );
}
