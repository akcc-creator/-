
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CleaningCanvasProps {
  backgroundImage: string;
  brushSize: number;
  wipesRequired: number;
  onProgress: (percent: number) => void;
  isComplete: boolean;
}

declare const Hands: any;
declare const Camera: any;

// === CONFIGURATION ===
const TRACKING_SMOOTHING = 0.5; 
const MOVEMENT_SENSITIVITY = 1.8; 
const FOG_OPACITY = 0.98;

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

// Particle System Types
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

const CleaningCanvas: React.FC<CleaningCanvasProps> = ({
  backgroundImage,
  brushSize,
  wipesRequired,
  onProgress,
  isComplete
}) => {
  // Canvases
  const stainCanvasRef = useRef<HTMLCanvasElement>(null); // The fog layer
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null); // The cursor & particle layer
  const stainContextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // State
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [inputType, setInputType] = useState<'camera' | 'mouse'>('camera');
  
  // Refs for tracking loop
  const targetPosRef = useRef({ x: 0, y: 0 }); 
  const currentPosRef = useRef({ x: 0, y: 0 });
  const lastDrawPosRef = useRef<{x: number, y: number} | null>(null);
  const requestRef = useRef<number>(0);
  
  // Particles Ref
  const particlesRef = useRef<Particle[]>([]);
  
  // Performance throttling for progress check
  const lastProgressCheckTime = useRef<number>(0);

  // --- 1. MEDIA PIPE SETUP ---
  useEffect(() => {
    const videoElement = document.getElementById('tracking-video') as HTMLVideoElement;
    if (!videoElement) return;

    let camera: any = null;
    let hands: any = null;

    const startTracking = async () => {
      try {
        hands = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setIsHandDetected(true);
            setInputType('camera');
            
            const palm = results.multiHandLandmarks[0][9];
            const canvas = stainCanvasRef.current;
            
            if (canvas) {
              let rawX = 1 - palm.x;
              let rawY = palm.y;
              let x = (rawX - 0.5) * MOVEMENT_SENSITIVITY + 0.5;
              let y = (rawY - 0.5) * MOVEMENT_SENSITIVITY + 0.5;
              x = Math.max(0, Math.min(1, x));
              y = Math.max(0, Math.min(1, y));

              targetPosRef.current = { 
                x: x * canvas.width, 
                y: y * canvas.height 
              };
            }
          } else {
            setIsHandDetected(false);
          }
        });

        camera = new Camera(videoElement, {
          onFrame: async () => {
            if (hands) await hands.send({ image: videoElement });
          },
          width: 640,
          height: 480
        });
        
        await camera.start();
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startTracking();

    return () => {
      if (camera) camera.stop();
    };
  }, []);

  // --- 2. MOUSE FALLBACK ---
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isHandDetected) {
      setInputType('mouse');
      const canvas = stainCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      targetPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  // --- 3. PARTICLE SYSTEM ---
  const spawnParticles = (x: number, y: number) => {
    const count = 3; // Particles per frame
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * brushSize * 0.5,
        y: y + (Math.random() - 0.5) * brushSize * 0.5,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '255, 255, 255' : '20, 184, 166' // White or Teal
      });
    }
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05; // Fade out speed
      p.size *= 0.95; // Shrink

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      } else {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // --- 4. ANIMATION LOOP ---
  const animate = useCallback(() => {
    const cursorCanvas = cursorCanvasRef.current;
    if (!cursorCanvas) return;

    const target = targetPosRef.current;
    const current = currentPosRef.current;
    
    current.x = lerp(current.x, target.x, TRACKING_SMOOTHING);
    current.y = lerp(current.y, target.y, TRACKING_SMOOTHING);

    const ctx = cursorCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      
      // Update Particles
      if (!isComplete) {
        updateAndDrawParticles(ctx);
      }

      if ((isHandDetected || inputType === 'mouse') && !isComplete) {
        const x = current.x;
        const y = current.y;

        // Visual Enhancement: More dynamic cursor
        // 1. Outer Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 1.5);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Center "Sponge"
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(20, 184, 166, 0.5)";
        ctx.fillStyle = "#14b8a6"; // Teal
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    if ((isHandDetected || inputType === 'mouse') && !isComplete) {
      handleWipe(current.x, current.y);
      // Spawn particles when wiping
      spawnParticles(current.x, current.y);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isHandDetected, inputType, isComplete, brushSize]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  // --- 5. STAIN LAYER ---
  useEffect(() => {
    const canvas = stainCanvasRef.current;
    const cCanvas = cursorCanvasRef.current;
    if (!canvas || !cCanvas) return;

    const initStainLayer = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      stainContextRef.current = ctx;
      ctx.globalCompositeOperation = 'source-over';
      
      // Base Fog
      ctx.fillStyle = `rgba(240, 245, 250, ${FOG_OPACITY})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Texture
      for(let i = 0; i < 400; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 100 + 20;
        ctx.beginPath();
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(200, 210, 220, 0.4)');
        grad.addColorStop(1, 'rgba(200, 210, 220, 0)');
        ctx.fillStyle = grad;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const parent = canvas.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => {
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        if (width > 0 && height > 0) {
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                cCanvas.width = width;
                cCanvas.height = height;
                initStainLayer();
            }
        }
    });
    observer.observe(parent);

    return () => observer.disconnect();
  }, [backgroundImage]);

  const calculateProgress = useCallback(() => {
    const ctx = stainContextRef.current;
    const canvas = stainCanvasRef.current;
    if (!ctx || !canvas) return;

    const stride = 20; 
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let totalTransparent = 0;

    for (let i = 3; i < pixels.length; i += 4 * stride) {
      if (pixels[i] < 10) totalTransparent++;
    }

    const totalPixels = (canvas.width * canvas.height) / stride;
    const percent = (totalTransparent / totalPixels) * 100;
    onProgress(percent);
  }, [onProgress]);

  const handleWipe = (x: number, y: number) => {
    const ctx = stainContextRef.current;
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    
    // Hardness calculation
    const hardness = 1 / (wipesRequired * 1.5); 
    ctx.strokeStyle = `rgba(0, 0, 0, ${hardness})`; 
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.shadowBlur = brushSize / 2;
    ctx.shadowColor = 'rgba(0,0,0,1)';

    ctx.beginPath();
    if (lastDrawPosRef.current) {
      ctx.moveTo(lastDrawPosRef.current.x, lastDrawPosRef.current.y);
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.1, y);
    }
    ctx.stroke();
    
    lastDrawPosRef.current = { x, y };
    
    const now = Date.now();
    if (now - lastProgressCheckTime.current > 150) {
        calculateProgress();
        lastProgressCheckTime.current = now;
    }
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden select-none bg-cover bg-center cursor-none"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      onPointerMove={handlePointerMove}
    >
      {/* 1. Stain Layer */}
      <canvas ref={stainCanvasRef} className="absolute top-0 left-0 w-full h-full z-10" />

      {/* 2. Cursor & Particle Layer */}
      <canvas ref={cursorCanvasRef} className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" />

      {/* 3. Lost Tracking Message */}
      {!isHandDetected && inputType === 'camera' && !isComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl text-white flex flex-col items-center animate-pulse border border-white/20">
            <i className="fas fa-hand-paper text-5xl mb-3 text-teal-300"></i>
            <p className="text-xl font-bold">偵測中...</p>
            <p className="text-sm opacity-90 mt-1">請在鏡頭前揮手</p>
          </div>
        </div>
      )}

      {/* 4. Complete Overlay */}
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-md transition-opacity duration-1000 z-50">
          <div className="bg-white/90 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center border-4 border-teal-500 transform scale-110">
             <div className="text-8xl mb-4">✨</div>
             <h2 className="text-4xl font-black text-teal-900 tracking-tight mb-2">窗戶擦乾淨了！</h2>
             <p className="text-xl text-teal-700 font-medium">風景真美</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningCanvas;
