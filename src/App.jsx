import { useEffect, useState } from 'react';
import { FolderOpen, Info, LayoutDashboard, Settings as Cog, Sparkles } from 'lucide-react';
import Converter from './components/Converter.jsx';
import Models from './components/Models.jsx';
import Settings from './components/Settings.jsx';
import About from './components/About.jsx';

const NAV = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['convert', 'Image to 3D', Sparkles],
  ['models', 'Generated Models', FolderOpen],
  ['settings', 'Settings', Cog],
  ['about', 'About', Info],
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [quality, setQuality] = useState(() => Number(localStorage.getItem('aerowix.quality')) || 96);
  useEffect(() => localStorage.setItem('aerowix.quality', String(quality)), [quality]);

  // Pages stay mounted (just hidden) so a running generation is never interrupted by navigating.
  const show = (...p) => (p.includes(page) ? '' : 'hidden');
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-white/10 bg-navy-950/80 p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center gap-2 text-lg font-bold md:mb-8">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-500">A</span> Aerowix 3D
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map(([k, label, Icon]) => (
            <button key={k} onClick={() => setPage(k)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${page === k ? 'bg-orange-500/15 text-orange-300' : 'text-white/70 hover:bg-white/5'}`}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        <div className={show('dashboard', 'convert')}>
          <Converter title={page === 'convert' ? 'Image to 3D' : 'Image to 3D Converter'} quality={quality} />
        </div>
        <div className={show('models')}><Models active={page === 'models'} /></div>
        <div className={show('settings')}><Settings quality={quality} setQuality={setQuality} active={page === 'settings'} /></div>
        <div className={show('about')}><About /></div>
      </main>
    </div>
  );
}
