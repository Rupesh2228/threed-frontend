import { Component, Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

function Model({ url }) {
  const { scene } = useGLTF(url, false); // false = no Draco/CDN fetch; everything stays offline
  useEffect(() => {
    scene.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      o.material.metalness = 0; // glTF default is fully metallic, which looks black without an env map
      o.material.roughness = 0.85;
      if (o.geometry.attributes.color) o.material.vertexColors = true;
      o.material.needsUpdate = true;
    });
  }, [scene]);
  return <primitive object={scene} />;
}

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return <div className="p-6 text-sm text-red-300">Could not load the 3D model: {String(this.state.error.message || this.state.error)}</div>;
    return this.props.children;
  }
}

export default function Viewer({ url }) {
  const controls = useRef();
  const [spin, setSpin] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const zoom = (factor) => {
    const c = controls.current;
    if (!c) return;
    const offset = c.object.position.clone().sub(c.target).multiplyScalar(factor);
    c.object.position.copy(c.target).add(offset);
    c.update();
  };

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-navy-700 to-navy-950">
      <Boundary key={`${url}-${resetKey}`}>
        <Canvas dpr={[1, 1.5]} camera={{ position: [2.2, 1.4, 2.6], fov: 45 }}>
          <ambientLight intensity={0.9} />
          <hemisphereLight args={['#ffffff', '#223', 0.6]} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} />
          <directionalLight position={[-5, 2, -4]} intensity={0.6} />
          <Suspense fallback={null}>
            <Bounds fit observe margin={1.3}>
              <Center>
                <Model url={url} />
              </Center>
            </Bounds>
          </Suspense>
          <OrbitControls ref={controls} makeDefault enableDamping autoRotate={spin} autoRotateSpeed={2} />
        </Canvas>
      </Boundary>
      <div className="absolute right-3 top-3 flex gap-2">
        <button className="btn-ghost" title="Zoom in" onClick={() => zoom(0.8)}><ZoomIn size={16} /></button>
        <button className="btn-ghost" title="Zoom out" onClick={() => zoom(1.25)}><ZoomOut size={16} /></button>
        <button className={`btn-ghost ${spin ? '!border-orange-500 !text-orange-400' : ''}`} title="Auto-rotate" onClick={() => setSpin(!spin)}><RotateCw size={16} /></button>
        <button className="btn-ghost" title="Reset camera" onClick={() => setResetKey((k) => k + 1)}><RotateCcw size={16} /></button>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-3 text-xs text-white/40">Drag to rotate · scroll to zoom · right-drag to pan</div>
    </div>
  );
}
