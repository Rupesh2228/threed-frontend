import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Download, Image as ImageIcon, Info, Loader2, Sparkles, Upload } from 'lucide-react';
import Viewer from './Viewer.jsx';
import { api, fmtBytes, fmtTime } from '../api.js';

const STEPS = [
  ['uploading', 'Uploading image'],
  ['preparing_model', 'Preparing GPU model'],
  ['generating_geometry', 'Generating 3D geometry'],
  ['completed', 'Generation completed'],
];
const OK_TYPES = ['image/jpeg', 'image/png'];
const MAX_MB = 10;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Converter({ title }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phase, setPhase] = useState('idle');
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
    const started = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed((Date.now() - started) / 1000), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  function pick(nextFile) {
    if (!nextFile) return;
    if (!OK_TYPES.includes(nextFile.type)) {
      setError('Only JPG and PNG images are supported by the GPU worker.');
      setPhase('error');
      return;
    }
    if (nextFile.size > MAX_MB * 1024 * 1024) {
      setError(`Image is larger than ${MAX_MB} MB.`);
      setPhase('error');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
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
      const { id } = await api.generate(file);
      let failures = 0;
      while (alive.current) {
        await sleep(1800);
        let job;
        try {
          job = await api.job(id);
          failures = 0;
        } catch (requestError) {
          if (++failures >= 5) throw new Error(requestError.message || 'Lost connection to the GPU worker. Check that Colab and its tunnel are still running.');
          continue;
        }
        if (job.status === 'queued') setStage('preparing_model');
        else if (job.status === 'running') setStage('generating_geometry');
        else if (job.status === 'completed') {
          setStage('completed');
          setModel(await api.model(id));
          setPhase('done');
          return;
        } else if (job.status === 'failed' || job.status === 'expired') {
          throw new Error(job.error || `GPU job ${job.status}. Submit the image again.`);
        }
      }
    } catch (requestError) {
      setError(requestError.message);
      setPhase('error');
    }
  }

  const idx = Math.max(0, STEPS.findIndex(([key]) => key === stage));
  const running = phase === 'running';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-white/60">Convert an image into a downloadable 3D GLB model using the Colab GPU worker.</p>
      </header>
      <div className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100/80">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>One photo cannot show hidden sides, interiors or undersides. AI estimates unseen geometry; expect a rough starting point for Blender cleanup, not a game-ready vehicle.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4">
          <div
            onDragOver={(event) => { event.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(event) => { event.preventDefault(); setDrag(false); pick(event.dataTransfer.files[0]); }}
            onClick={() => !running && input.current.click()}
            className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${drag ? 'border-orange-400 bg-orange-500/10' : 'border-white/15 hover:border-white/30'}`}
          >
            {preview ? <img src={preview} alt="Uploaded" className="max-h-64 rounded-lg object-contain" /> : <>
              <Upload size={40} className="text-orange-400" />
              <p className="mt-3 font-medium">Drag &amp; drop an image here</p>
              <p className="text-sm text-white/50">JPG or PNG · max {MAX_MB} MB</p>
            </>}
            <input ref={input} type="file" hidden accept=".jpg,.jpeg,.png" onChange={(event) => { pick(event.target.files[0]); event.target.value = ''; }} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-ghost" disabled={running} onClick={() => input.current.click()}><ImageIcon size={16} /> Browse Image</button>
            <button className="btn-primary" disabled={!file || running} onClick={generate}>
              {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate 3D Model
            </button>
            {file && <span className="truncate text-sm text-white/50">{file.name} · {fmtBytes(file.size)}</span>}
          </div>
          {(running || phase === 'done') && <div className="rounded-xl bg-black/20 p-4">
            <ol className="space-y-2 text-sm">
              {STEPS.map(([key, label], index) => {
                const done = phase === 'done' || index < idx;
                const current = running && index === idx;
                return <li key={key} className={`flex items-center gap-2 ${done ? 'text-emerald-300' : current ? 'text-orange-300' : 'text-white/30'}`}>
                  {done ? <Check size={15} /> : current ? <Loader2 size={15} className="animate-spin" /> : <span className="inline-block h-[15px] w-[15px]" />}
                  {label}
                </li>;
              })}
            </ol>
            {running && <p className="mt-3 text-xs text-white/50">Elapsed {fmtTime(elapsed)}. Processing happens on the temporary Colab GPU, not your laptop. Keep the Colab runtime and tunnel running.</p>}
          </div>}
          {error && <div className="flex gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"><AlertTriangle size={18} className="shrink-0" /> <span>{error}</span></div>}
        </section>
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">3D Preview</h2>
          {model ? <>
            <Viewer url={model.urls.glb} />
            <div className="grid grid-cols-2 gap-2 text-sm text-white/70 sm:grid-cols-3">
              <Stat k="Vertices" v={model.vertices == null ? 'Not provided' : model.vertices.toLocaleString()} />
              <Stat k="Polygons" v={model.faces == null ? 'Not provided' : model.faces.toLocaleString()} />
              <Stat k="File size" v={fmtBytes(model.glbBytes)} />
              <Stat k="Generated in" v={fmtTime(model.durationSec)} />
              <Stat k="Device" v={model.device || 'Colab GPU'} />
            </div>
            <a className="btn-primary" href={model.urls.downloadGlb}><Download size={16} /> Download GLB</a>
            <p className="text-xs text-white/40">The worker currently exports GLB only. Geometry statistics and OBJ export are not yet provided.</p>
          </> : <div className="flex h-[420px] items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm text-white/40">{running ? 'Waiting for the real 3D mesh…' : 'Your generated model will appear here.'}</div>}
        </section>
      </div>
    </div>
  );
}

const Stat = ({ k, v }) => <div className="rounded-lg bg-black/20 px-3 py-2"><div className="text-xs text-white/40">{k}</div><div className="truncate font-medium text-white">{v}</div></div>;
