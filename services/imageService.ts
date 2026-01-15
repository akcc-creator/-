
import { GoogleGenAI } from '@google/genai';
import { BACKGROUNDS } from '../constants';

// === HYBRID STRATEGY ===
// 1. Local Development: Use Client-side SDK directly.
// 2. Production (Vercel): Use /api/generate proxy.
// 3. Fallback: If API fails (Quota/Net), use local curated list.

const getRandomFallback = () => {
  const randomIndex = Math.floor(Math.random() * BACKGROUNDS.length);
  console.log("Using Fallback Image due to API limits");
  return BACKGROUNDS[randomIndex].url;
};

const generateClientSide = async (prompt: string): Promise<string | null> => {
  if (!process.env.API_KEY) throw new Error("Local Dev: API Key missing in .env");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt + ". Photorealistic, high quality, vivid colors, 16:9 aspect ratio, cinematic lighting." }],
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

const generateServerSide = async (prompt: string): Promise<string | null> => {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    // Pass the error message up so we can decide to fallback
    throw new Error(data.error || 'Server generation failed');
  }
  return data.image;
};

export const generateThemeBackground = async (prompt: string): Promise<string | null> => {
  try {
    // Check if we are in Local Dev AND have a key available
    if ((import.meta as any).env.DEV && process.env.API_KEY) {
      console.log("Using Client-side generation (Local Dev)");
      return await generateClientSide(prompt);
    } else {
      console.log("Using Server-side generation (Production)");
      return await generateServerSide(prompt);
    }
  } catch (error: any) {
    // CRITICAL FIX: Instead of crashing/alerting on 429 or Network Error, 
    // simply return a high-quality fallback image.
    console.warn("AI Generation Failed (switching to fallback):", error.message);
    return getRandomFallback();
  }
};

export const generateRandomBackground = async (): Promise<string | null> => {
  const themes = [
    "A cute fluffy cat wearing sunglasses on a beach",
    "A futuristic cyberpunk city with neon lights and flying cars",
    "A delicious giant strawberry cake with whipped cream",
    "A magical dragon flying over a medieval castle",
    "A close-up of a colorful parrot in a jungle",
    "An astronaut floating in deep space with colorful nebula",
    "A cozy library filled with ancient magical books",
    "A steampunk locomotive train traveling through clouds",
    "A vibrant coral reef with a sea turtle",
    "A field of sunflowers with a blue sky",
    "A retro 80s synthwave sunset landscape",
    "A peaceful japanese zen garden with cherry blossoms",
    "A majestic hot air balloon festival over mountains",
    "A fantasy treehouse village glowing at night"
  ];
  
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  const fullPrompt = `Create a high quality image of: ${randomTheme}. 16:9 aspect ratio, photorealistic OR artistic style.`;

  return generateThemeBackground(fullPrompt);
};
