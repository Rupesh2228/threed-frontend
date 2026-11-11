import { useEffect, useState } from 'react';
import { AlertTriangle, Download, Eye, Trash2 } from 'lucide-react';
import Viewer from './Viewer.jsx';
import { api, fmtBytes, fmtDate } from '../api.js';

export default function Models({ active }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const load = () => api.models().then((models) => { setItems(models); setError(null); setLoaded(true); }).catch((e) => setError(e.message));
  useEffect(() => { if (active) load(); }, [active]);

  async function remove(model) {
    if (!window.confirm(`Permanently delete "${model.name}" and its saved image and GLB from the current backend instance?`)) return;
    try {
      await api.remove(model.id);
      if (open?.id === model.id) setOpen(null);
      load();
    } catch (e) { setError(e.message); }
  }

  return <div className="space-y-6">
    <header>
      <h1 className="text-3xl font-bold tracking-tight">Generated Models</h1>
      <p className="mt-1 text-white/60">Models saved by the current backend instance. Free Render storage may be cleared on restart or redeploy.</p>
    </header>
    {error && <div className="flex gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"><AlertTriangle size={18} /> {error}</div>}
    {open && <section className="card space-y-3">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{open.name}</h2><button className="btn-ghost" onClick={() => setOpen(null)}>Close</button></div>
      <Viewer url={open.urls.glb} />
    </section>}
    {loaded && !items.length && !error && <p className="text-white/50">No models yet. Generate one from the Dashboard.</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((model) => <article key={model.id} className="card space-y-3">
        <img src={model.urls.preview} alt={model.name} className="h-40 w-full rounded-lg bg-black/30 object-contain" />
        <div><h3 className="truncate font-semibold">{model.name}</h3><p className="text-xs text-white/50">{fmtDate(model.createdAt)} · {fmtBytes(model.glbBytes)} · GLB</p></div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary !px-3 !py-2" onClick={() => setOpen(model)}><Eye size={15} /> Open</button>
          <a className="btn-ghost" href={model.urls.downloadGlb}><Download size={15} /> GLB</a>
          <button className="btn-ghost !text-red-300" title="Delete" onClick={() => remove(model)}><Trash2 size={15} /></button>
        </div>
      </article>)}
    </div>
  </div>;
}
