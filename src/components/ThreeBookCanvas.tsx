"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { BookOpen, Eye, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

interface ThreeBookCanvasProps {
  currentChapter: number;
  onChapterChange: (chapter: number, direction: "next" | "prev") => void;
  isDark: boolean;
  scrollProgress?: number;
  isScrollControlled?: boolean;
  children?: React.ReactNode;
}

export function ThreeBookCanvas({
  currentChapter,
  onChapterChange,
  isDark,
  scrollProgress,
  isScrollControlled = false,
  children,
}: ThreeBookCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollProgressRef = useRef<number | undefined>(scrollProgress);
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  // Book interaction state
  const [isOpen, setIsOpen] = useState<boolean>(!isScrollControlled);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  // Drag tracking state
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const coverPivotRef = useRef<THREE.Group | null>(null);
  const turningPagePivotRef = useRef<THREE.Group | null>(null);
  const turningPageMeshRef = useRef<THREE.Mesh | null>(null);
  const spineShadowRef = useRef<THREE.Mesh | null>(null);
  const ribbonMeshRef = useRef<THREE.Mesh | null>(null);

  // Original undeformed positions for page curl algorithm
  const originalPagePositionsRef = useRef<Float32Array | null>(null);

  // Animation values (lerped in render loop)
  const animStateRef = useRef({
    coverAngle: isScrollControlled ? 0 : -Math.PI, // 0 = fully closed, -Math.PI = fully open
    targetCoverAngle: isScrollControlled ? 0 : -Math.PI,
    turnProgress: 0, // 0 = resting on right, 1 = resting on left
    targetTurnProgress: 0,
    isTurning: false,
    turnDir: "next" as "next" | "prev",
    mouseTargetRotX: 0,
    mouseTargetRotY: 0,
    mouseCurrentRotX: 0,
    mouseCurrentRotY: 0,
    baseRotX: isScrollControlled ? 0.08 : 0,
    baseRotY: isScrollControlled ? 0.35 : 0,
    cameraTargetZ: isScrollControlled ? 11.5 : 10.0,
    scrollOffsetRotX: 0,
    scrollYProgress: 0,
    ribbonWaveTime: 0,
  });

  // -------------------------------------------------------------------------
  // PROCEDURAL HIGH-RESOLUTION TEXTURE GENERATORS
  // -------------------------------------------------------------------------

  const createCoverTexture = useCallback((dark: boolean): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep rich emerald / midnight leather background
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1400);
    if (dark) {
      bgGrad.addColorStop(0, "#081612");
      bgGrad.addColorStop(0.5, "#0b1f1a");
      bgGrad.addColorStop(1, "#050e0c");
    } else {
      bgGrad.addColorStop(0, "#122a22");
      bgGrad.addColorStop(0.5, "#18382e");
      bgGrad.addColorStop(1, "#0e201a");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1400);

    // Subtle leather grain texture
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    for (let i = 0; i < 40000; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1400;
      ctx.fillRect(rx, ry, 1.2, 1.2);
    }

    // Gold foil outer debossed border
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 6;
    ctx.strokeRect(50, 50, 924, 1300);

    ctx.strokeStyle = "#996515";
    ctx.lineWidth = 2;
    ctx.strokeRect(62, 62, 900, 1276);

    // Corner filigrees
    const drawCorner = (x: number, y: number, scaleX: number, scaleY: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scaleX, scaleY);
      ctx.strokeStyle = "#e6c35c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(40, 40);
      ctx.lineTo(40, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20, 20, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    drawCorner(80, 80, 1, 1);
    drawCorner(944, 80, -1, 1);
    drawCorner(80, 1320, 1, -1);
    drawCorner(944, 1320, -1, -1);

    // Center Gold Emblem / Lungs & Atmospheric Streams
    ctx.save();
    ctx.translate(512, 480);

    // Outer gold medallion ring
    ctx.strokeStyle = "#e6c35c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 134, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred atmospheric wind swirls inside medallion
    ctx.strokeStyle = "#f3e5ab";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-30, -10, 45, Math.PI * 0.2, Math.PI * 1.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(30, -10, 45, Math.PI * 1.4, Math.PI * 0.8, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 35, 30, Math.PI * 0.9, Math.PI * 0.1, true);
    ctx.stroke();

    ctx.restore();

    // Foil Debossed Typography
    ctx.textAlign = "center";

    // Eyebrow
    ctx.fillStyle = "#c5a059";
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.letterSpacing = "6px";
    ctx.fillText("CLINICAL AIR INTELLIGENCE · CPCB NAQI", 512, 700);

    // Title
    ctx.fillStyle = "#f5d77f";
    ctx.font = "bold 58px 'Georgia', serif";
    ctx.letterSpacing = "8px";
    ctx.fillText("VAYU INDEX", 512, 790);

    // Subtitle
    ctx.fillStyle = "#e2c068";
    ctx.font = "italic 26px 'Georgia', serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("Health & Safety Findings Journal", 512, 850);

    // Divider Line
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(360, 890);
    ctx.lineTo(664, 890);
    ctx.stroke();

    // Volume info
    ctx.fillStyle = "#a88944";
    ctx.font = "17px 'Courier New', monospace";
    ctx.letterSpacing = "4px";
    ctx.fillText("VOL. I · PM2.5 VS PM10 PATHOPHYSIOLOGY", 512, 940);
    ctx.fillText("CLINICAL INTERVENTIONS & SENSITIVE GROUPS", 512, 975);

    // Footer insignia
    ctx.fillStyle = "rgba(212, 175, 55, 0.7)";
    ctx.font = "14px 'Courier New', monospace";
    ctx.letterSpacing = "3px";
    ctx.fillText("CENTRAL POLLUTION CONTROL BOARD STANDARDS", 512, 1260);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, []);

  const createPageTexture = useCallback((dark: boolean, side: "left" | "right"): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Warm archival cream paper base
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1400);
    if (dark) {
      bgGrad.addColorStop(0, "#131f1c");
      bgGrad.addColorStop(0.5, "#152420");
      bgGrad.addColorStop(1, "#111b18");
    } else {
      bgGrad.addColorStop(0, "#fcfaf4");
      bgGrad.addColorStop(0.5, "#f7f4ea");
      bgGrad.addColorStop(1, "#f3efe2");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1400);

    // Archival paper micro-grain
    ctx.fillStyle = dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.018)";
    for (let i = 0; i < 30000; i++) {
      ctx.fillRect(Math.random() * 1024, Math.random() * 1400, 1, 1);
    }

    // Spine gutter shadow gradient
    const gutterGrad = ctx.createLinearGradient(
      side === "left" ? 1024 : 0,
      0,
      side === "left" ? 824 : 200,
      0
    );
    gutterGrad.addColorStop(0, dark ? "rgba(0,0,0,0.45)" : "rgba(45,35,20,0.18)");
    gutterGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gutterGrad;
    ctx.fillRect(0, 0, 1024, 1400);

    // Page border rule
    ctx.strokeStyle = dark ? "rgba(147, 226, 197, 0.12)" : "rgba(20, 50, 40, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(50, 50, 924, 1300);

    // Subtle header rule
    ctx.strokeStyle = dark ? "rgba(147, 226, 197, 0.2)" : "rgba(20, 50, 40, 0.15)";
    ctx.beginPath();
    ctx.moveTo(70, 120);
    ctx.lineTo(954, 120);
    ctx.stroke();

    // Footer rule
    ctx.beginPath();
    ctx.moveTo(70, 1280);
    ctx.lineTo(954, 1280);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    return texture;
  }, []);

  const createGildedEdgeTexture = useCallback((): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Metallic gold leaf striations
    const grad = ctx.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, "#a07828");
    grad.addColorStop(0.3, "#e6c35c");
    grad.addColorStop(0.7, "#f5df88");
    grad.addColorStop(1, "#8a641d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 512);

    // Horizontal page line striations
    ctx.fillStyle = "rgba(50, 35, 10, 0.25)";
    for (let y = 0; y < 512; y += 3) {
      ctx.fillRect(0, y, 128, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // -------------------------------------------------------------------------
  // INITIALIZE THREE.JS SCENE
  // -------------------------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 750;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 11.5);
    cameraRef.current = camera;

    // 2. Renderer with soft shadow maps
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.05 : 1.15;
    rendererRef.current = renderer;

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(isDark ? 0x22332e : 0xfffaed, isDark ? 1.4 : 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7e6, isDark ? 1.6 : 2.2);
    dirLight.position.set(4, 8, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    // Spine spot accent light
    const spineLight = new THREE.SpotLight(0xecd8a5, 2.0, 15, Math.PI * 0.25, 0.6);
    spineLight.position.set(0, 4, 6);
    scene.add(spineLight);

    // 4. Main Book Hierarchy Group
    const bookGroup = new THREE.Group();
    bookGroupRef.current = bookGroup;
    scene.add(bookGroup);

    // Dimensions
    const PAGE_W = 4.3;
    const PAGE_H = 5.9;
    const COVER_THICKNESS = 0.08;
    const PAGE_BLOCK_DEPTH = 0.22;

    // Textures
    const coverTex = createCoverTexture(isDark);
    const leftPageTex = createPageTexture(isDark, "left");
    const rightPageTex = createPageTexture(isDark, "right");
    const gildedEdgeTex = createGildedEdgeTexture();

    // -----------------------------------------------------------------------
    // A. SPINE & BINDING
    // -----------------------------------------------------------------------
    const spineGeo = new THREE.CylinderGeometry(0.24, 0.24, PAGE_H + 0.16, 24, 1, false, 0, Math.PI);
    const spineMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x091713 : 0x143026,
      roughness: 0.45,
      metalness: 0.15,
    });
    const spineMesh = new THREE.Mesh(spineGeo, spineMat);
    spineMesh.rotation.z = Math.PI / 2;
    spineMesh.rotation.x = Math.PI / 2;
    spineMesh.position.set(0, 0, -PAGE_BLOCK_DEPTH * 0.5);
    bookGroup.add(spineMesh);

    // Gold spine rings / ribs
    for (let i = -2; i <= 2; i++) {
      const ringGeo = new THREE.TorusGeometry(0.245, 0.015, 8, 24, Math.PI);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.y = Math.PI / 2;
      ringMesh.position.set(0, i * 1.1, -PAGE_BLOCK_DEPTH * 0.5);
      bookGroup.add(ringMesh);
    }

    // -----------------------------------------------------------------------
    // B. STATIONARY PAGE STACKS (LEFT & RIGHT BEVELED BLOCKS)
    // -----------------------------------------------------------------------
    const blockGeo = new THREE.BoxGeometry(PAGE_W, PAGE_H, PAGE_BLOCK_DEPTH);

    // Materials: [Right, Left, Top, Bottom, Front, Back]
    const leftBlockMat = [
      new THREE.MeshStandardMaterial({ map: leftPageTex, roughness: 0.6 }), // inside edge
      new THREE.MeshStandardMaterial({ map: gildedEdgeTex, roughness: 0.4, metalness: 0.5 }), // outside gold edge
      new THREE.MeshStandardMaterial({ map: gildedEdgeTex, roughness: 0.4, metalness: 0.5 }), // top gold edge
      new THREE.MeshStandardMaterial({ map: gildedEdgeTex, roughness: 0.4, metalness: 0.5 }), // bottom gold edge
      new THREE.MeshStandardMaterial({ map: leftPageTex, roughness: 0.7 }), // reading page face
      new THREE.MeshStandardMaterial({ color: isDark ? 0x07110e : 0x163329, roughness: 0.5 }), // back
    ];
    const leftPageBlock = new THREE.Mesh(blockGeo, leftBlockMat);
    leftPageBlock.position.set(-PAGE_W / 2 - 0.02, 0, -PAGE_BLOCK_DEPTH / 2);
    leftPageBlock.receiveShadow = true;
    bookGroup.add(leftPageBlock);

    const rightBlockMat = [
      new THREE.MeshStandardMaterial({ map: gildedEdgeTex, roughness: 0.4, metalness: 0.5 }), // outside gold edge
      new THREE.MeshStandardMaterial({ map: rightPageTex, roughness: 0.6 }), // inside edge
      new THREE.MeshStandardMaterial({ map: gildedEdgeTex, roughness: 0.4, metalness: 0.5 }), // top gold edge
      new THREE.MeshStandardMaterial({ map: gildedEdgeTex, roughness: 0.4, metalness: 0.5 }), // bottom gold edge
      new THREE.MeshStandardMaterial({ map: rightPageTex, roughness: 0.7 }), // reading page face
      new THREE.MeshStandardMaterial({ color: isDark ? 0x07110e : 0x163329, roughness: 0.5 }), // back
    ];
    const rightPageBlock = new THREE.Mesh(blockGeo, rightBlockMat);
    rightPageBlock.position.set(PAGE_W / 2 + 0.02, 0, -PAGE_BLOCK_DEPTH / 2);
    rightPageBlock.receiveShadow = true;
    bookGroup.add(rightPageBlock);

    // -----------------------------------------------------------------------
    // C. FRONT HARDCOVER (PIVOTED AT SPINE X = 0)
    // -----------------------------------------------------------------------
    const coverPivot = new THREE.Group();
    coverPivot.position.set(0, 0, 0.01);
    bookGroup.add(coverPivot);
    coverPivotRef.current = coverPivot;

    const coverGeo = new THREE.BoxGeometry(PAGE_W + 0.12, PAGE_H + 0.16, COVER_THICKNESS);
    coverGeo.translate((PAGE_W + 0.12) / 2, 0, 0); // anchor along spine hinge

    const coverMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.7, roughness: 0.3 }), // right edge
      new THREE.MeshStandardMaterial({ color: 0x10251f, roughness: 0.5 }), // spine edge
      new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.7, roughness: 0.3 }), // top edge
      new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.7, roughness: 0.3 }), // bottom edge
      new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.45, metalness: 0.2 }), // front embossed face
      new THREE.MeshStandardMaterial({ map: leftPageTex, roughness: 0.6 }), // inside cover endpaper
    ];
    const coverMesh = new THREE.Mesh(coverGeo, coverMaterials);
    coverMesh.castShadow = true;
    coverMesh.receiveShadow = true;
    coverPivot.add(coverMesh);

    // Set initial cover state (-Math.PI = open, 0 = closed)
    coverPivot.rotation.y = isScrollControlled ? 0 : -Math.PI;

    // -----------------------------------------------------------------------
    // D. 3D TURNING PAGE MESH (PHYSICS CURVED BENDING DEFORMATION)
    // -----------------------------------------------------------------------
    const turningPagePivot = new THREE.Group();
    turningPagePivot.position.set(0, 0, 0.02);
    bookGroup.add(turningPagePivot);
    turningPagePivotRef.current = turningPagePivot;

    // Subdivided plane mesh (48x24 grid) for smooth dynamic page curl
    const turnPageGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H, 48, 24);
    turnPageGeo.translate(PAGE_W / 2, 0, 0); // anchor at spine x = 0

    // Store original undeformed vertex coordinates for morphing in frame loop
    originalPagePositionsRef.current = new Float32Array(turnPageGeo.attributes.position.array);

    const turnPageMat = new THREE.MeshStandardMaterial({
      map: rightPageTex,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });
    const turningPageMesh = new THREE.Mesh(turnPageGeo, turnPageMat);
    turningPageMesh.castShadow = true;
    turningPageMesh.receiveShadow = true;
    turningPageMesh.visible = false; // only visible while flipping
    turningPagePivot.add(turningPageMesh);
    turningPageMeshRef.current = turningPageMesh;

    // -----------------------------------------------------------------------
    // E. CENTER CREASE SPARKLE & SHADOW PLANE
    // -----------------------------------------------------------------------
    const shadowGeo = new THREE.PlaneGeometry(0.35, PAGE_H);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: isDark ? 0.4 : 0.22,
      depthWrite: false,
    });
    const spineShadow = new THREE.Mesh(shadowGeo, shadowMat);
    spineShadow.position.set(0, 0, 0.015);
    bookGroup.add(spineShadow);
    spineShadowRef.current = spineShadow;

    // -----------------------------------------------------------------------
    // F. REALISTIC SATIN BOOKMARK RIBBON
    // -----------------------------------------------------------------------
    const ribbonGeo = new THREE.PlaneGeometry(0.18, PAGE_H * 0.9, 8, 24);
    ribbonGeo.translate(0, -PAGE_H * 0.45, 0.04);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x10b981 : 0x059669,
      roughness: 0.35,
      metalness: 0.25,
      side: THREE.DoubleSide,
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonMesh.position.set(0, PAGE_H * 0.48, 0.02);
    bookGroup.add(ribbonMesh);
    ribbonMeshRef.current = ribbonMesh;

    // -----------------------------------------------------------------------
    // 5. WINDOW RESIZE OBSERVER
    // -----------------------------------------------------------------------
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 750;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // -----------------------------------------------------------------------
    // 6. RENDER & PHYSICS SIMULATION LOOP
    // -----------------------------------------------------------------------
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const st = animStateRef.current;

      // 0. Scroll Progress Mapping (matching maray.ai portfolio book physics)
      const sp = scrollProgressRef.current;
      if (typeof sp === "number") {
        if (sp < 0.14) {
          // Hero closed-to-opening transition (0.0 to 0.14)
          const norm = Math.max(0, Math.min(1, sp / 0.14));
          st.targetCoverAngle = -Math.PI * norm;
          st.baseRotY = 0.35 * (1 - norm);
          st.baseRotX = 0.08 * (1 - norm);
          st.cameraTargetZ = 11.5 - norm * 1.5;
          st.isTurning = false;
          st.turnProgress = 0;
        } else {
          // Open 2-page reading spread & scroll-driven page curling
          st.targetCoverAngle = -Math.PI;
          st.baseRotY = 0;
          st.baseRotX = 0;
          st.cameraTargetZ = 10.0;

          if (sp < 0.35) {
            // Chapter 1
            st.isTurning = false;
            st.turnProgress = 0;
            if (currentChapter !== 1) onChapterChange(1, "prev");
          } else if (sp < 0.43) {
            // Page 1 turn: Chapter 1 -> 2
            const p = (sp - 0.35) / 0.08;
            st.isTurning = true;
            st.turnProgress = p;
            const target = p > 0.5 ? 2 : 1;
            if (target !== currentChapter) onChapterChange(target, p > 0.5 ? "next" : "prev");
          } else if (sp < 0.63) {
            // Chapter 2
            st.isTurning = false;
            st.turnProgress = 0;
            if (currentChapter !== 2) onChapterChange(2, "prev");
          } else if (sp < 0.71) {
            // Page 2 turn: Chapter 2 -> 3
            const p = (sp - 0.63) / 0.08;
            st.isTurning = true;
            st.turnProgress = p;
            const target = p > 0.5 ? 3 : 2;
            if (target !== currentChapter) onChapterChange(target, p > 0.5 ? "next" : "prev");
          } else if (sp < 0.89) {
            // Chapter 3
            st.isTurning = false;
            st.turnProgress = 0;
            if (currentChapter !== 3) onChapterChange(3, "prev");
          } else if (sp < 0.97) {
            // Page 3 turn: Chapter 3 -> 4
            const p = (sp - 0.89) / 0.08;
            st.isTurning = true;
            st.turnProgress = p;
            const target = p > 0.5 ? 4 : 3;
            if (target !== currentChapter) onChapterChange(target, p > 0.5 ? "next" : "prev");
          } else {
            // Chapter 4
            st.isTurning = false;
            st.turnProgress = 0;
            if (currentChapter !== 4) onChapterChange(4, "next");
          }
        }
      }

      // 1. Mouse Parallax Lerp & Orientation
      st.mouseCurrentRotX += (st.mouseTargetRotX - st.mouseCurrentRotX) * 0.07;
      st.mouseCurrentRotY += (st.mouseTargetRotY - st.mouseCurrentRotY) * 0.07;

      if (bookGroup) {
        bookGroup.rotation.x = st.baseRotX + st.mouseCurrentRotX + st.scrollOffsetRotX;
        bookGroup.rotation.y = st.baseRotY + st.mouseCurrentRotY;
      }

      // Smooth Camera Zoom
      if (camera) {
        camera.position.z += (st.cameraTargetZ - camera.position.z) * 0.08;
      }

      // 2. Cover Opening / Closing Animation Lerp
      st.coverAngle += (st.targetCoverAngle - st.coverAngle) * 0.12;
      if (coverPivot) {
        coverPivot.rotation.y = st.coverAngle;
      }

      // 3. Dynamic Page Turn Curl Physics
      if (st.isTurning && turningPageMesh && originalPagePositionsRef.current) {
        turningPageMesh.visible = true;
        if (typeof sp !== "number") {
          // Progress toward target (0 -> 1 for Next, or 1 -> 0 for Prev)
          st.turnProgress += (st.targetTurnProgress - st.turnProgress) * 0.12;
        }

        const p = Math.max(0, Math.min(1, st.turnProgress));
        turningPagePivot.rotation.y = -p * Math.PI;

        // Curved bending algorithm:
        // When p ~ 0.5, the page peaks in arching curl; at p=0 and p=1 it lays flat
        const curlFactor = Math.sin(p * Math.PI);
        const intensity = 1.35;

        const posAttr = turningPageMesh.geometry.attributes.position;
        const orig = originalPagePositionsRef.current;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const ox = orig[i * 3];
          const oy = orig[i * 3 + 1];

          // Normalized coordinates along page:
          // u in [0, 1] (0 = spine edge, 1 = free edge)
          const u = Math.max(0, Math.min(1, ox / PAGE_W));
          // v in [-0.5, 0.5] (center = 0, top/bottom = ±0.5)
          const v = oy / PAGE_H;

          // Parabolic lift + corner twist
          const zLift = curlFactor * intensity * Math.pow(u, 1.8) * (1.0 - 0.28 * (v * v));
          const xRetract = ox - curlFactor * 0.22 * Math.pow(u, 2.0);
          const yTwist = oy + curlFactor * 0.08 * Math.pow(u, 2.0) * v;

          posAttr.setXYZ(i, xRetract, yTwist, zLift);
        }

        posAttr.needsUpdate = true;
        turningPageMesh.geometry.computeVertexNormals();

        // Check if manual turn completed
        if (typeof sp !== "number" && Math.abs(st.targetTurnProgress - st.turnProgress) < 0.005) {
          st.isTurning = false;
          st.turnProgress = st.targetTurnProgress;
          turningPageMesh.visible = false;
          setIsFlipping(false);
        }
      } else if (turningPageMesh) {
        turningPageMesh.visible = false;
      }

      // 4. Subtle Bookmark Ribbon Sway Physics
      st.ribbonWaveTime += 0.035;
      if (ribbonMesh) {
        ribbonMesh.rotation.z = Math.sin(st.ribbonWaveTime) * 0.035;
        ribbonMesh.rotation.x = Math.cos(st.ribbonWaveTime * 0.7) * 0.04;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, [createCoverTexture, createPageTexture, createGildedEdgeTexture, isDark]);

  // -------------------------------------------------------------------------
  // MOUSE & POINTER PARALLAX LISTENER
  // -------------------------------------------------------------------------

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

    animStateRef.current.mouseTargetRotY = nx * 0.38;
    animStateRef.current.mouseTargetRotX = -ny * 0.28;
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    animStateRef.current.mouseTargetRotX = 0;
    animStateRef.current.mouseTargetRotY = 0;
  };

  // -------------------------------------------------------------------------
  // SCROLL-DRIVEN 3D TRANSFORMATIONS
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Scroll progress through the viewport (0 = entering, 1 = leaving)
      const visibleDelta = 1 - Math.max(0, Math.min(1, rect.bottom / (windowH + rect.height)));
      animStateRef.current.scrollYProgress = visibleDelta;

      // Subtle dynamic camera tilt on scroll
      animStateRef.current.scrollOffsetRotX = (visibleDelta - 0.4) * 0.15;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -------------------------------------------------------------------------
  // TRIGGER 3D PAGE FLIP ANIMATION
  // -------------------------------------------------------------------------

  const trigger3DPageFlip = useCallback((direction: "next" | "prev", targetChap: number) => {
    if (animStateRef.current.isTurning) return;

    setIsFlipping(true);
    setFlipDirection(direction);

    const st = animStateRef.current;
    st.isTurning = true;
    st.turnDir = direction;

    if (turningPageMeshRef.current) {
      turningPageMeshRef.current.visible = true;
    }

    if (direction === "next") {
      st.turnProgress = 0;
      st.targetTurnProgress = 1;
    } else {
      st.turnProgress = 1;
      st.targetTurnProgress = 0;
    }

    onChapterChange(targetChap, direction);
  }, [onChapterChange]);

  // Handle external currentChapter change
  useEffect(() => {
    // If cover is closed and chapter is opened, open it
    if (isOpen) {
      animStateRef.current.targetCoverAngle = -Math.PI;
    } else {
      animStateRef.current.targetCoverAngle = 0;
    }
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // DRAG TO TURN PAGE
  // -------------------------------------------------------------------------

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const dt = Date.now() - dragStartRef.current.time;
    dragStartRef.current = null;

    // Minimum swipe threshold: 45px in < 600ms
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) && dt < 650) {
      if (dx < 0 && currentChapter < 4) {
        // Swiped left -> Turn Next
        trigger3DPageFlip("next", currentChapter + 1);
      } else if (dx > 0 && currentChapter > 1) {
        // Swiped right -> Turn Prev
        trigger3DPageFlip("prev", currentChapter - 1);
      }
    }
  };

  const toggleBookOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    animStateRef.current.targetCoverAngle = nextState ? -Math.PI : 0;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={() => setIsHovered(true)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing transition-all rounded-3xl ${
        isHovered ? "ring-1 ring-emerald-500/30" : ""
      }`}
      style={{
        minHeight: "780px",
        perspective: "2000px",
        boxShadow: isHovered
          ? isDark
            ? "0 35px 80px -15px rgba(0, 0, 0, 0.95)"
            : "0 30px 70px -15px rgba(50, 45, 30, 0.35)"
          : "none",
      }}
    >
      {/* Dynamic 3D Page Flip Direction Indicator */}
      {isFlipping && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-mono tracking-widest text-emerald-400 bg-neutral-900/90 border-emerald-500/40 animate-pulse">
          TURNING {flipDirection === "next" ? "FORWARD →" : "← BACKWARD"} · 3D BEZIER CURL
        </div>
      )}

      {/* 1. Underlying Interactive 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-auto"
        style={{ zIndex: 1 }}
      />

      {/* 2. 3D Floating Mode Switcher & Quick Navigation Bar */}
      <div
        className="absolute top-4 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between pointer-events-none z-30"
      >
        {/* Closed/Open State Toggle Pill (hidden in scroll-controlled mode) */}
        {!isScrollControlled ? (
          <button
            type="button"
            onClick={toggleBookOpen}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-medium backdrop-blur-md shadow-md transition-all hover:scale-105"
            style={{
              backgroundColor: isDark ? "rgba(18, 33, 28, 0.85)" : "rgba(255, 255, 255, 0.9)",
              borderColor: isDark ? "rgba(147, 226, 197, 0.25)" : "rgba(15, 56, 44, 0.18)",
              color: isDark ? "#83dfbd" : "#1a533f",
            }}
            title={isOpen ? "Inspect 3D Hardcover Cover" : "Open 2-Page Reading Spread"}
          >
            {isOpen ? <Eye size={13} /> : <BookOpen size={13} />}
            <span>{isOpen ? "INSPECT 3D COVER" : "OPEN 2-PAGE SPREAD"}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono backdrop-blur-md bg-black/40 border-white/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>3D WEBGL HARDCOVER · VOL. 04</span>
          </div>
        )}

        {/* 3D Drag / Scroll Hint Banner */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono backdrop-blur-md opacity-80"
          style={{
            backgroundColor: isDark ? "rgba(11, 19, 17, 0.7)" : "rgba(247, 246, 240, 0.85)",
            borderColor: isDark ? "rgba(147, 226, 197, 0.15)" : "rgba(15, 56, 44, 0.12)",
            color: isDark ? "#a7c4ba" : "#4a6b5e",
          }}
        >
          <Sparkles size={11} className="text-emerald-500 animate-pulse" />
          <span>{isScrollControlled ? "SCROLL OR DRAG TO TURN PAGES" : "DRAG PAGE EDGE OR SWIPE TO TURN"}</span>
        </div>

        {/* Quick Chapter Navigation Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              if (currentChapter > 1) trigger3DPageFlip("prev", currentChapter - 1);
            }}
            disabled={currentChapter <= 1 || isFlipping}
            className="w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm"
            style={{
              backgroundColor: isDark ? "rgba(18, 33, 28, 0.85)" : "rgba(255, 255, 255, 0.9)",
              borderColor: isDark ? "rgba(147, 226, 197, 0.25)" : "rgba(15, 56, 44, 0.18)",
              color: isDark ? "#83dfbd" : "#1a533f",
            }}
            aria-label="Previous Chapter Page"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentChapter < 4) trigger3DPageFlip("next", currentChapter + 1);
            }}
            disabled={currentChapter >= 4 || isFlipping}
            className="w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm"
            style={{
              backgroundColor: isDark ? "rgba(18, 33, 28, 0.85)" : "rgba(255, 255, 255, 0.9)",
              borderColor: isDark ? "rgba(147, 226, 197, 0.25)" : "rgba(15, 56, 44, 0.18)",
              color: isDark ? "#83dfbd" : "#1a533f",
            }}
            aria-label="Next Chapter Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 3. Hybrid UI Overlay Layer: Renders crisp, accessible typography onto open spread */}
      {(isOpen || isScrollControlled) && (
        <div
          className="relative z-10 w-full h-full p-4 sm:p-8 lg:p-12 pointer-events-auto flex flex-col justify-center transition-opacity duration-300"
          style={{
            opacity:
              isScrollControlled && typeof scrollProgress === "number"
                ? scrollProgress < 0.10
                  ? 0
                  : scrollProgress < 0.16
                  ? (scrollProgress - 0.10) / 0.06
                  : isFlipping
                  ? 0.45
                  : 1
                : isFlipping
                ? 0.45
                : 1,
            pointerEvents:
              isScrollControlled && typeof scrollProgress === "number"
                ? scrollProgress >= 0.15 && !isFlipping
                  ? "auto"
                  : "none"
                : isOpen && !isFlipping
                ? "auto"
                : "none",
          }}
        >
          {children}
        </div>
      )}

      {/* 4. Closed State Interactive Card Overlay (only for non-scroll modal view) */}
      {!isOpen && !isScrollControlled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div
            className="pointer-events-auto max-w-md p-6 sm:p-8 rounded-2xl border backdrop-blur-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-300"
            style={{
              backgroundColor: isDark ? "rgba(11, 23, 20, 0.85)" : "rgba(255, 253, 248, 0.92)",
              borderColor: isDark ? "rgba(212, 175, 55, 0.4)" : "rgba(184, 134, 11, 0.4)",
              boxShadow: isDark
                ? "0 25px 60px -15px rgba(0,0,0,0.9), inset 0 1px 3px rgba(212,175,55,0.2)"
                : "0 20px 50px -15px rgba(50,40,20,0.3), inset 0 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            <div className="w-12 h-12 rounded-full border mx-auto flex items-center justify-center text-amber-500 bg-amber-500/10 border-amber-500/30">
              <Sparkles size={22} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500 font-bold">
                INTERACTIVE 3D ARTIFACT
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                Vayu Index Clinical Journal
              </h3>
              <p className="text-xs text-[var(--dash-muted)] leading-relaxed">
                Move your cursor to inspect the hardcover gold foil debossing. Click below or drag the cover to open the full 2-page reading spread.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleBookOpen}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <BookOpen size={14} />
                <span>Open Journal Spread</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
