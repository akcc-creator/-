
import { GoogleGenAI } from '@google/genai';

// === GENERATION STRATEGY ===
// 1. If API_KEY is present in client bundle -> Use Client-Side SDK.
// 2. If API_KEY is missing -> Try /api/generate endpoint.
// 3. Model Fallback: Try Flash -> If 429/Error -> Try Pro.

export interface GenerationResult {
  url: string;
  source: 'AI' | 'FALLBACK';
}

// Models to attempt in order. 
// Using two different models leverages two separate quota buckets.
const MODELS_TO_TRY = [
  'gemini-2.5-flash-image',      // Priority 1: Fast, Standard Quota
  'gemini-3-pro-image-preview'   // Priority 2: High Quality, Separate Quota
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateClientSide = async (prompt: string): Promise<string | null> => {
  // Debug Logging
  if (!process.env.API_KEY) {
    console.warn("❌ Client-Side: API_KEY is missing in process.env");
    return null;
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const enhancedPrompt = prompt + ". Photorealistic, 8k resolution, highly detailed, vivid colors, 16:9 aspect ratio, cinematic lighting.";

  // Iterate through models for fallback
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`🎨 Client: Generating with model [${model}]...`);
      
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: enhancedPrompt }],
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        },
      });

      // Extract image from parts (Gemini style)
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            console.log(`✅ Success with [${model}]`);
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      console.warn(`⚠️ [${model}] returned no inlineData.`);
    } catch (e: any) {
      console.warn(`❌ [${model}] Failed:`, e.message);
      // If this was the last model, throw the error to be caught by the retry loop
      if (model === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) throw e;
      // Otherwise, continue to next model
    }
  }
  return null;
};

const generateServerSide = async (prompt: string): Promise<string | null> => {
  console.log("Generating with Server-Side Proxy...");
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server endpoint unreachable.");
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server generation failed');
    }
    return data.image;
  } catch (e: any) {
    console.warn("Server-side generation error:", e);
    throw e;
  }
};

const attemptGeneration = async (
  genFunc: () => Promise<string | null>, 
  maxRetries = 2
): Promise<string | null> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) {
        console.log(`Retry attempt ${i + 1}/${maxRetries}...`);
        await delay(1000 * (i + 1)); // Backoff
      }
      const result = await genFunc();
      if (result) return result;
    } catch (error: any) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // Stop retrying if key is missing
      if (error.message.includes("API_KEY") || error.message.includes("Missing")) {
        throw error;
      }
      
      if (i === maxRetries - 1) throw error;
    }
  }
  return null;
};

export const generateThemeBackground = async (prompt: string): Promise<GenerationResult | null> => {
  try {
    let imageUrl: string | null = null;
    const hasClientKey = !!process.env.API_KEY;

    imageUrl = await attemptGeneration(async () => {
      if (hasClientKey) {
        return await generateClientSide(prompt);
      } else {
        return await generateServerSide(prompt);
      }
    });

    if (!imageUrl) throw new Error("No image data returned.");

    return {
        url: imageUrl,
        source: 'AI'
    };

  } catch (error: any) {
    console.error("AI Generation Service Error:", error);
    throw error;
  }
};

export const generateRandomBackground = async (): Promise<GenerationResult | null> => {
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
