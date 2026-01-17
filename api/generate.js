
import { GoogleGenAI } from '@google/genai';

export const config = {
    runtime: 'nodejs',
    maxDuration: 45, // Increase timeout for double attempts
};

const MODELS_TO_TRY = [
  'gemini-2.5-flash-image',      
  'gemini-3-pro-image-preview'   
];

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = request.body; 

    if (!process.env.API_KEY) {
      console.error("Server: API_KEY is missing.");
      return response.status(500).json({ error: 'Server configuration error: API Key missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const enhancedPrompt = prompt + ". Photorealistic, 8k resolution, highly detailed, vivid colors, 16:9 aspect ratio, cinematic lighting.";
    
    // Server-side fallback loop
    for (const model of MODELS_TO_TRY) {
        try {
            console.log(`Server: Generating with [${model}]...`);
            const result = await ai.models.generateContent({
                model: model,
                contents: {
                  parts: [{ text: enhancedPrompt }],
                },
                config: {
                  imageConfig: { aspectRatio: "16:9" }
                },
            });

            const parts = result.candidates?.[0]?.content?.parts;
            if (parts) {
                for (const part of parts) {
                    if (part.inlineData) {
                         const imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
                         return response.status(200).json({ image: imageBase64 });
                    }
                }
            }
        } catch (e) {
            console.warn(`Server: [${model}] failed: ${e.message}`);
            // If it's the last model, throw
            if (model === MODELS_TO_TRY[MODELS_TO_TRY.length - 1]) throw e;
        }
    }
    
    throw new Error("All models failed to generate image.");

  } catch (error) {
    console.error("Server API Error:", error);
    return response.status(500).json({ error: error.message || "Unknown server error" });
  }
}
