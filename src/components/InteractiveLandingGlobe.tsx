"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

export function InteractiveLandingGlobe() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const mountedRef = useRef(false);
  const readyFrameRef = useRef<number | null>(null);
  const [size, setSize] = useState({ width: 300, height: 300 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (readyFrameRef.current !== null) cancelAnimationFrame(readyFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const element = document.getElementById("landing-globe-canvas");
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: Math.max(1, Math.round(entry.contentRect.width)), height: Math.max(1, Math.round(entry.contentRect.height)) }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const addAtmosphere = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const scene = globe.scene();
    const geometry = new THREE.SphereGeometry(globe.getGlobeRadius() * 1.04, 48, 48);
    const material = new THREE.ShaderMaterial({
      vertexShader: "varying vec3 vWorldPosition; varying vec3 vNormal; void main(){ vec4 world=modelMatrix*vec4(position,1.0); vWorldPosition=world.xyz; vNormal=normalize(normalMatrix*normal); gl_Position=projectionMatrix*viewMatrix*world; }",
      fragmentShader: "varying vec3 vWorldPosition; varying vec3 vNormal; void main(){ vec3 viewDirection=normalize(cameraPosition-vWorldPosition); float glow=pow(1.0-max(dot(normalize(vNormal),viewDirection),0.0),3.0); gl_FragColor=vec4(0.46,0.77,0.61,glow*0.46); }",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(geometry, material);
    halo.name = "landing-atmosphere-halo";
    scene.add(halo);
    return () => { scene.remove(halo); geometry.dispose(); material.dispose(); };
  }, []);

  const handleReady = useCallback(() => {
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.22;
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.minDistance = 145;
      controls.maxDistance = 520;
    }
    // react-globe.gl can signal readiness before this component's first commit.
    // Defer the state update until after mount, and cancel it if the globe unmounts.
    if (readyFrameRef.current !== null) cancelAnimationFrame(readyFrameRef.current);
    readyFrameRef.current = requestAnimationFrame(() => {
      readyFrameRef.current = null;
      if (mountedRef.current) setReady(true);
    });
  }, []);

  useEffect(() => { if (!ready) return; return addAtmosphere(); }, [addAtmosphere, ready]);

  return <div id="landing-globe-canvas" className="landing-globe-canvas" aria-label="Interactive rotating Earth globe. Drag to explore.">
    <Globe ref={globeRef} width={size.width} height={size.height} backgroundColor="rgba(0,0,0,0)" globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png" showAtmosphere atmosphereColor="#a5d8ba" atmosphereAltitude={0.16} showGraticules enablePointerInteraction animateIn onGlobeReady={handleReady}/>
    <span className="globe-orbit-ring orbit-ring-one" aria-hidden="true"/><span className="globe-orbit-ring orbit-ring-two" aria-hidden="true"/>
    <span className="globe-drag-hint">DRAG TO EXPLORE <i/></span>
  </div>;
}
