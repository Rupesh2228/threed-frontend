export default function About() {
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      <div className="card space-y-3 text-white/80">
        <p>Aerowix Image to 3D is a personal, localhost-only tool. It runs the open-source <b>TripoSR</b> model on your own machine. No cloud services, API keys or subscriptions.</p>
        <h2 className="pt-2 font-semibold text-white">Limitations</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>A single photo cannot show hidden sides, interiors or the underside. The AI guesses them.</li>
          <li>Output is a rough single mesh with vertex colours. It needs cleanup, retopology and proper materials in Blender before use as a game vehicle.</li>
          <li>Wheels, glass, mirrors and thin parts are usually merged into the body.</li>
          <li>Best results: one object, side or three-quarter view, even lighting, little background clutter.</li>
          <li>Generation on CPU can take several minutes per image.</li>
        </ul>
      </div>
    </div>
  );
}
