
import { GoogleGenAI } from "@google/genai";

// Now using Gemini 2.5 Flash Image (Nano Banana) for speed in all dynamic generations
export const generateThemeBackground = async (prompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: prompt + ". High quality, vivid colors, 16:9 aspect ratio." }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};

export const generateRandomBackground = async (): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  // Expanded themes beyond just landscapes for maximum surprise
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
    "A peaceful japanese zen garden with cherry blossoms"
  ];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Create a high quality image of: ${randomTheme}. 16:9 aspect ratio, photorealistic OR artistic style.` }],
      },
       config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Random generation failed:", error);
    return null;
  }
};
