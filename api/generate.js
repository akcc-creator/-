import { GoogleGenAI } from '@google/genai';

export const config = {
    runtime: 'nodejs', // Force Node.js runtime for stability
    maxDuration: 30,   // Allow up to 30 seconds for generation
};

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
    
    console.log("Server: Generating image...");

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt + ". Photorealistic, 8k resolution, highly detailed, vivid colors, 16:9 aspect ratio, cinematic lighting." }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    let imageBase64 = null;
    const parts = result.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageBase64) {
      throw new Error("Model returned no image data.");
    }

    return response.status(200).json({ image: imageBase64 });

  } catch (error) {
    console.error("Server API Error:", error);
    return response.status(500).json({ error: error.message || "Unknown server error" });
  }
}