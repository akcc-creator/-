
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
// 0.5 is much snappier than 0.25. It moves 50% of the distance to the target per frame.
// This significantly reduces the "laggy" feeling while still providing some jitter reduction.
const TRACKING_SMOOTHING = 0.5; 
const MOVEMENT_SENSITIVITY = 1.8; 
const FOG_OPACITY = 0.98;

const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

const CleaningCanvas: React.FC<CleaningCanvasProps> = ({
  backgroundImage,
  brushSize,
  wipesRequired,
  onProgress,
  isComplete
}) => {
  // Canvases
  const stainCanvasRef = useRef<HTMLCanvasElement>(null); // The fog layer
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null); // The cursor layer
  const stainContextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // State
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [inputType, setInputType] = useState<'camera' | 'mouse'>('camera');
  const [cameraStatus, setCameraStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  
  // Refs for tracking loop
  const targetPosRef = useRef({ x: 0, y: 0 }); 
  const currentPosRef = useRef({ x: 0, y: 0 });
  const lastDrawPosRef = useRef<{x: number, y: number} | null>(null);
  const requestRef = useRef<number>(0);
  
  // Performance throttling for progress check
  const lastProgressCheckTime = useRef<number>(0);

  // --- 1. MEDIA PIPE SETUP (RE-DESIGNED) ---
  useEffect(() => {
    const videoElement = document.getElementById('tracking-video') as HTMLVideoElement;
    if (!videoElement) {
      setCameraStatus('error');
      return;
    }

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
          setCameraStatus('ready');
          
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setIsHandDetected(true);
            setInputType('camera');
            
            // Use Palm Center (Landmark 9) for most stable tracking
            const palm = results.multiHandLandmarks[0][9];
            const canvas = stainCanvasRef.current;
            
            if (canvas) {
              // 1. Mirror X (Webcam is mirrored)
              let rawX = 1 - palm.x;
              let rawY = palm.y;

              // 2. Apply Sensitivity / Amplification
              // Subtract 0.5 to center, scale up, add 0.5 back
              let x = (rawX - 0.5) * MOVEMENT_SENSITIVITY + 0.5;
              let y = (rawY - 0.5) * MOVEMENT_SENSITIVITY + 0.5;

              // 3. Clamp to screen bounds (0 to 1)
              x = Math.max(0, Math.min(1, x));
              y = Math.max(0, Math.min(1, y));

              targetPosRef.current = { 
                x: x * canvas.width, 
                y: y * canvas.height 
              };
            }
          } else {
            setIsHandDetected(false);
            // We do NOT clear lastDrawPosRef immediately to avoid lines breaking if tracking flickers for 1 frame
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
        setCameraStatus('error');
      }
    };

    startTracking();

    return () => {
      if (camera) camera.stop();
    };
  }, []);

  // --- 2. MOUSE / TOUCH FALLBACK ---
  const handlePointerMove = (e: React.PointerEvent) => {
    // Priority: Camera takes precedence. Only use mouse if hand not detected.
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

  // --- 3. ANIMATION LOOP (Physics & Rendering) ---
  const animate = useCallback(() => {
    const cursorCanvas = cursorCanvasRef.current;
    if (!cursorCanvas) return;

    // A. Smooth Movement
    const target = targetPosRef.current;
    const current = currentPosRef.current;
    
    // Improved Smoothing
    current.x = lerp(current.x, target.x, TRACKING_SMOOTHING);
    current.y = lerp(current.y, target.y, TRACKING_SMOOTHING);

    // B. Draw Cursor Layer
    const ctx = cursorCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      
      if ((isHandDetected || inputType === 'mouse') && !isComplete) {
        const x = current.x;
        const y = current.y;

        // 1. Glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 1.5);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Solid Center Dot (The "Sponge")
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.fillStyle = "#14b8a6"; // Teal-500
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // C. Handle Wiping Logic
    if ((isHandDetected || inputType === 'mouse') && !isComplete) {
      handleWipe(current.x, current.y);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isHandDetected, inputType, isComplete, brushSize, wipesRequired]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  // --- 4. STAIN LAYER INITIALIZATION (The "Fog") ---
  useEffect(() => {
    const canvas = stainCanvasRef.current;
    const cCanvas = cursorCanvasRef.current;
    if (!canvas || !cCanvas) return;

    const initStainLayer = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      stainContextRef.current = ctx;
      // IMPORTANT: Reset composite operation to source-over to draw the fog
      ctx.globalCompositeOperation = 'source-over';
      
      // 1. Fill with solid "Frost" color
      ctx.fillStyle = `rgba(240, 245, 250, ${FOG_OPACITY})`; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Add Noise/Dirt Texture
      for(let i = 0; i < 400; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const r = Math.random() * 100 + 20;
        
        ctx.beginPath();
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(200, 210, 220, 0.4)'); // Greyish spots
        grad.addColorStop(1, 'rgba(200, 210, 220, 0)');
        ctx.fillStyle = grad;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Use ResizeObserver instead of window 'resize' event
    // This fixes the issue where the canvas initializes with 0 height on first render
    const parent = canvas.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(() => {
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        
        // Only initialize if we have valid dimensions
        if (width > 0 && height > 0) {
            // Only re-init if size changed to avoid flickering, but ensure it runs if canvas is 0
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

    // Initial immediate check (in case observer takes a tick or dimensions are already there)
    if (parent.clientWidth > 0 && parent.clientHeight > 0) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        cCanvas.width = parent.clientWidth;
        cCanvas.height = parent.clientHeight;
        initStainLayer();
    }

    return () => observer.disconnect();
  }, [backgroundImage]);

  const calculateProgress = useCallback(() => {
    const ctx = stainContextRef.current;
    const canvas = stainCanvasRef.current;
    if (!ctx || !canvas) return;

    const stride = 20; // Check every 20th pixel for performance
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let totalTransparent = 0;

    for (let i = 3; i < pixels.length; i += 4 * stride) {
      // STRICT CHECK: Only count if alpha is VERY low (almost fully transparent).
      // Previously was < 50, now < 10.
      if (pixels[i] < 10) { 
        totalTransparent++;
      }
    }

    const totalPixels = (canvas.width * canvas.height) / stride;
    const percent = (totalTransparent / totalPixels) * 100;
    onProgress(percent);
  }, [onProgress]);

  const handleWipe = (x: number, y: number) => {
    const ctx = stainContextRef.current;
    if (!ctx) return;

    // Use 'destination-out' to erase the layer
    ctx.globalCompositeOperation = 'destination-out';
    
    // Hardness calculation
    const hardness = 1 / (wipesRequired * 1.5); 
    ctx.strokeStyle = `rgba(0, 0, 0, ${hardness})`; 
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.shadowBlur = brushSize / 2; // Soft edges
    ctx.shadowColor = 'rgba(0,0,0,1)'; // Shadow also helps erase in destination-out mode

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
    
    // THROTTLE: Only calculate progress every 150ms
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
      {/* 1. Stain Layer (The Fog) - Top z-index initially */}
      <canvas 
        ref={stainCanvasRef} 
        className="absolute top-0 left-0 w-full h-full z-10" 
      />

      {/* 2. Cursor Layer - Renders on TOP of the fog */}
      <canvas 
        ref={cursorCanvasRef} 
        className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none" 
      />

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
