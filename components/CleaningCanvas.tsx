
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
const LOST_TRACKING_GRACE_PERIOD = 1000; // 1 second tolerance before showing "Lost Hand" UI

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

// Particle System for Foam/Bubbles & Grime
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  type: 'foam' | 'sparkle' | 'grime';
  color?: string;
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
  
  // State for UI
  const [isTrackingActive, setIsTrackingActive] = useState(false); // Debounced tracking state
  const [inputType, setInputType] = useState<'camera' | 'mouse'>('camera');
  
  // Refs for tracking loop logic (avoiding re-renders)
  const lastHandDetectionTime = useRef<number>(0);
  const isHandRawDetected = useRef<boolean>(false);

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
        if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
            console.warn("MediaPipe scripts not loaded yet. Mouse fallback active.");
            return;
        }

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
          // Logic: Even if we lose the hand for a few frames, we keep the UI active
          // until the GRACE_PERIOD expires.
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            isHandRawDetected.current = true;
            lastHandDetectionTime.current = Date.now();
            setIsTrackingActive(true); // Immediate activation
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
            isHandRawDetected.current = false;
            // Do NOT set isTrackingActive(false) here. 
            // We let the checkInterval handle the timeout.
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

    // Loop to check for tracking timeout (Grace Period)
    const checkInterval = setInterval(() => {
        if (isHandRawDetected.current) return; // Hand is currently there, no need to check timeout

        const timeSinceLastHand = Date.now() - lastHandDetectionTime.current;
        if (timeSinceLastHand > LOST_TRACKING_GRACE_PERIOD) {
            setIsTrackingActive(false);
        }
    }, 200);

    return () => {
      if (camera) camera.stop();
      clearInterval(checkInterval);
    };
  }, []);

  // --- 2. MOUSE FALLBACK ---
  const handlePointerMove = (e: React.PointerEvent) => {
    // Only track pointer if game is NOT complete
    if (!isTrackingActive && !isComplete) {
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

  // --- 3. ENHANCED PARTICLE SYSTEM (FOAM, SPARKLES & GRIME) ---
  const spawnParticles = (x: number, y: number) => {
    // 1. Foam (Bubbles)
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * brushSize * 0.6,
        y: y + (Math.random() - 0.5) * brushSize * 0.6,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 1.0,
        size: Math.random() * 8 + 4,
        type: 'foam'
      });
    }

    // 2. Sparkles (Water droplets)
    if (Math.random() > 0.5) {
        particlesRef.current.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 1.0,
          size: Math.random() * 3 + 1,
          type: 'sparkle'
        });
    }

    // 3. Grime (Falling Dust/Dirt) - VISUAL ENHANCEMENT
    for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
            x: x + (Math.random() - 0.5) * brushSize,
            y: y + (Math.random() - 0.5) * brushSize,
            vx: (Math.random() - 0.5) * 2, // Slight horizontal scatter
            vy: Math.random() * 3 + 2,     // Gravity: Falls down
            life: 1.0,
            size: Math.random() * 4 + 2,
            type: 'grime',
            color: Math.random() > 0.5 ? '#8B4513' : '#654321' 
        });
    }
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D) => {
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.type === 'foam') {
        p.life -= 0.02; 
        p.size *= 0.98;
      } else if (p.type === 'sparkle') {
        p.life -= 0.05; 
      } else if (p.type === 'grime') {
        p.life -= 0.015; 
        p.vy += 0.1;     
      }

      if (p.life <= 0 || p.y > ctx.canvas.height) {
        particlesRef.current.splice(i, 1);
      } else {
        ctx.beginPath();
        if (p.type === 'foam') {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.6})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'sparkle') {
            ctx.fillStyle = `rgba(200, 250, 255, ${p.life})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'grime') {
            ctx.fillStyle = `rgba(100, 100, 100, ${p.life * 0.8})`; 
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }
    }
  };

  // --- 4. ANIMATION LOOP ---
  const animate = useCallback(() => {
    const cursorCanvas = cursorCanvasRef.current;
    if (!cursorCanvas) return;

    const target = targetPosRef.current;
    const current = currentPosRef.current;
    
    // Smooth interpolation even when tracking is lost briefly (targetPosRef stays at last known pos)
    current.x = lerp(current.x, target.x, TRACKING_SMOOTHING);
    current.y = lerp(current.y, target.y, TRACKING_SMOOTHING);

    const ctx = cursorCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      
      // Update Particles
      if (!isComplete) {
        updateAndDrawParticles(ctx);
      }

      // Draw custom cursor ONLY if game is running (not complete)
      // Use isTrackingActive instead of raw detection for smoother experience
      if ((isTrackingActive || inputType === 'mouse') && !isComplete) {
        const x = current.x;
        const y = current.y;

        // Visual Enhancement: HAND CURSOR
        // 1. Cleaning Area Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 1.5);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Hand Emoji
        const handSize = brushSize * 0.5; 
        ctx.font = `${handSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.fillText('🖐️', x, y);
        ctx.shadowBlur = 0;
      }
    }

    if ((isTrackingActive || inputType === 'mouse') && !isComplete) {
      handleWipe(current.x, current.y);
      spawnParticles(current.x, current.y);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isTrackingActive, inputType, isComplete, brushSize]);

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
      
      // Base Fog - slightly darker to make cleaning more satisfying
      ctx.fillStyle = `rgba(230, 235, 240, ${FOG_OPACITY})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Texture - Grime spots
      for(let i = 0; i < 600; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 80 + 10;
        ctx.beginPath();
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(180, 190, 200, 0.3)'); // Darker spots
        grad.addColorStop(1, 'rgba(180, 190, 200, 0)');
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

    // Instant Completion Trigger: If we are extremely close to 100%, force it.
    if (percent >= 99) {
        onProgress(100);
    } else {
        onProgress(percent);
    }
  }, [onProgress]);

  const handleWipe = (x: number, y: number) => {
    const ctx = stainContextRef.current;
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    
    // Hardness calculation
    const hardness = 1 / Math.max(1, wipesRequired); 
    
    ctx.strokeStyle = `rgba(0, 0, 0, ${hardness})`; 
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.shadowBlur = brushSize / 4; // Reduced blur for crisper "wipe" edges
    ctx.shadowColor = 'rgba(0,0,0,0.5)';

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
    // Increase check frequency slightly to catch 100% faster
    if (now - lastProgressCheckTime.current > 100) {
        calculateProgress();
        lastProgressCheckTime.current = now;
    }
  };

  return (
    <div 
      // FIX: Only hide cursor when game is active. Show default cursor when complete for UI interaction.
      className={`relative w-full h-full overflow-hidden select-none bg-cover bg-center ${!isComplete ? 'cursor-none' : ''}`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
      onPointerMove={handlePointerMove}
    >
      <canvas ref={stainCanvasRef} className="absolute top-0 left-0 w-full h-full z-10" />
      <canvas ref={cursorCanvasRef} className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" />

      {/* Completion Flash Effect */}
      {isComplete && (
        <div className="absolute inset-0 z-40 pointer-events-none animate-[flash_1s_ease-out_forwards] border-[20px] border-white/80 shadow-[inset_0_0_100px_rgba(255,255,255,0.8)]">
            <style>{`
                @keyframes flash {
                    0% { background-color: rgba(255, 255, 255, 0.9); opacity: 1; }
                    50% { background-color: rgba(255, 255, 255, 0.4); opacity: 1; }
                    100% { background-color: transparent; opacity: 0; }
                }
            `}</style>
        </div>
      )}

      {/* Show Tracking UI only if we really lost the hand for > 1 sec AND not using mouse */}
      {!isTrackingActive && inputType === 'camera' && !isComplete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-500">
          <div className="bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl text-white flex flex-col items-center animate-pulse border border-white/20">
            <i className="fas fa-hand-paper text-5xl mb-3 text-teal-300"></i>
            <p className="text-xl font-bold">偵測中...</p>
            <p className="text-sm opacity-90 mt-1">請在鏡頭前揮手 (或使用滑鼠)</p>
          </div>
        </div>
      )}

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
