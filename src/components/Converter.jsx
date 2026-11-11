import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Download, Image as ImageIcon, Info, Loader2, Sparkles, Upload } from 'lucide-react';
import Viewer from './Viewer.jsx';
import { api, fmtBytes, fmtTime } from '../api.js';

const STEPS = [
  ['uploading', 'Uploading image'],
  ['preparing_model', 'Preparing AI model'],
  ['removing_background', 'Removing background'],
  ['generating_geometry', 'Generating 3D geometry'],
  ['processing_mesh', 'Processing mesh'],
  ['exporting', 'Preparing GLB export'],
  ['completed', 'Generation completed'],
];
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 10;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Converter({ title, quality }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | running | done | error
  const [stage, setStage] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [drag, setDrag] = useState(false);
  const input = useRef();
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (phase !== 'running') return;
    const t0 = Date.now();
    setElapsed(0);
    const t = setInterval(() => setElapsed((Date.now() - t0) / 1000), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function pick(f) {
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) return setError('Only JPG, PNG or WEBP images are supported.'), setPhase('error');
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Image is larger than ${MAX_MB} MB.`), setPhase('error');
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setModel(null);
    setError(null);
    setPhase('idle');
  }

  async function generate() {
    setPhase('running');
    setStage('uploading');
    setError(null);
    setModel(null);
    try {
      const { id } = await api.generate(file, { quality });
      let fails = 0;
      while (alive.current) {
        await sleep(1500);
        let job;
        try {
          job = await api.job(id);
          fails = 0;
        } catch {
          if (++fails >= 5)
            throw new Error('Lost contact with the AI service while generating. It may have been killed for running out of memory. Check logs/ai-engine.log, use a lower quality preset, and add swap.');
          continue;
        }
        setStage(job.status);
        if (job.status === 'completed') {
          setModel(await api.model(id));
          setPhase('done');
          return;
        }
        if (job.status === 'failed') throw new Error([job.error, job.hint].filter(Boolean).join(' — '));
      }
    } catch (e) {
      setError(e.message);
      setPhase('error');
    }
  }

  const idx = Math.max(0, STEPS.findIndex(([k]) => k === stage));
  const running = phase === 'running';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-white/60">Convert your images into downloadable 3D models.</p>
      </header>

      <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100/80">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          One photo cannot show hidden sides, the interior or the underside of a vehicle. The AI <b>estimates</b> unseen geometry, so results are rough starting
          points for Blender cleanup, not complete game-ready vehicles.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => !running && input.current.click()}
            className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${drag ? 'border-orange-400 bg-orange-500/10' : 'border-white/15 hover:border-white/30'}`}
          >
            {preview ? (
              <img src={preview} alt="Uploaded" className="max-h-64 rounded-lg object-contain" />
            ) : (
              <>
                <Upload size={40} className="text-orange-400" />
                <p className="mt-3 font-medium">Drag &amp; drop an image here</p>
                <p className="text-sm text-white/50">JPG, PNG or WEBP · max {MAX_MB} MB</p>
              </>
            )}
            <input ref={input} type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-ghost" disabled={running} onClick={() => input.current.click()}><ImageIcon size={16} /> Browse Image</button>
            <button className="btn-primary" disabled={!file || running} onClick={generate}>
              {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate 3D Model
            </button>
            {file && <span className="truncate text-sm text-white/50">{file.name} · {fmtBytes(file.size)}</span>}
          </div>

          {(running || phase === 'done') && (
            <div className="rounded-xl bg-black/20 p-4">
              <ol className="space-y-2 text-sm">
                {STEPS.map(([k, label], i) => {
                  const done = phase === 'done' || i < idx;
                  const now = running && i === idx;
                  return (
                    <li key={k} className={`flex items-center gap-2 ${done ? 'text-emerald-300' : now ? 'text-orange-300' : 'text-white/30'}`}>
                      {done ? <Check size={15} /> : now ? <Loader2 size={15} className="animate-spin" /> : <span className="inline-block h-[15px] w-[15px]" />}
                      {label}
                    </li>
                  );
                })}
              </ol>
              {running && (
                <p className="mt-3 text-xs text-white/50">
                  Elapsed {fmtTime(elapsed)}. On a CPU laptop this can take several minutes (the geometry step has no percentage, so none is shown). The page stays usable.
                </p>
              )}
            </div>
          )}
          {error && (
            <div className="flex gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertTriangle size={18} className="shrink-0" /> <span>{error}</span>
            </div>
          )}
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">3D Preview</h2>
          {model ? (
            <>
              <Viewer url={model.urls.glb} />
              <div className="grid grid-cols-2 gap-2 text-sm text-white/70 sm:grid-cols-3">
                <Stat k="Vertices" v={model.vertices.toLocaleString()} />
                <Stat k="Polygons" v={model.faces.toLocaleString()} />
                <Stat k="File size" v={fmtBytes(model.glbBytes)} />
                <Stat k="Size (model units)" v={model.dimensions.map((d) => d.toFixed(2)).join(' × ')} />
                <Stat k="Generated in" v={fmtTime(model.durationSec)} />
                <Stat k="Device" v={model.device} />
              </div>
              <div className="flex gap-2">
                <a className="btn-primary" href={model.urls.downloadGlb}><Download size={16} /> Download GLB</a>
                <a className="btn-ghost" href={model.urls.downloadObj}>OBJ</a>
              </div>
              <p className="text-xs text-white/40">Dimensions are relative model units, not real-world metres. Colour is stored per vertex, not as a baked texture.</p>
            </>
          ) : (
            <div className="flex h-[420px] items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm text-white/40">
              {running ? 'Waiting for the real 3D mesh…' : 'Your generated model will appear here.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const Stat = ({ k, v }) => (
  <div className="rounded-lg bg-black/20 px-3 py-2">
    <div className="text-xs text-white/40">{k}</div>
    <div className="truncate font-medium text-white">{v}</div>
  </div>
);
