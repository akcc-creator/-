
import { IMAGE_DATABASE } from '../constants';

export interface GenerationResult {
  url: string;
  source: 'LIBRARY';
}

/**
 * Simulates an "AI Generation" but actually picks a random curated image
 * from our massive local database (Unsplash URLs).
 */
export const generateThemeBackground = async (keywordOrPrompt: string): Promise<GenerationResult | null> => {
  // Simulate a tiny network delay for better UX
  await new Promise(resolve => setTimeout(resolve, 500));

  const lowerKeyword = keywordOrPrompt.toLowerCase();
  let categoryPool: string[] = [];

  // 1. Direct match with keys in IMAGE_DATABASE
  for (const key of Object.keys(IMAGE_DATABASE)) {
      if (lowerKeyword.includes(key)) {
          categoryPool = (IMAGE_DATABASE as any)[key];
          break;
      }
  }

  // 2. Fallback / Specific overrides
  if (categoryPool.length === 0) {
      if (lowerKeyword.includes('sea') || lowerKeyword.includes('beach')) {
        categoryPool = IMAGE_DATABASE.ocean;
      } else if (lowerKeyword.includes('tree') || lowerKeyword.includes('jungle')) {
        categoryPool = IMAGE_DATABASE.forest;
      } else if (lowerKeyword.includes('sun') || lowerKeyword.includes('morning')) {
        categoryPool = IMAGE_DATABASE.sunrise;
      } else if (lowerKeyword.includes('star') || lowerKeyword.includes('space')) {
        categoryPool = IMAGE_DATABASE.night;
      } else if (lowerKeyword.includes('city') || lowerKeyword.includes('building')) {
        categoryPool = IMAGE_DATABASE.landmarks;
      } else if (lowerKeyword.includes('ice') || lowerKeyword.includes('winter')) {
        categoryPool = IMAGE_DATABASE.snow;
      } else if (lowerKeyword.includes('hill')) {
        categoryPool = IMAGE_DATABASE.mountain;
      } else {
        // Default fallback: Lake (calm)
        categoryPool = IMAGE_DATABASE.lake;
      }
  }

  // 3. Pick a random image from the pool
  const randomUrl = categoryPool[Math.floor(Math.random() * categoryPool.length)];

  return {
    url: randomUrl,
    source: 'LIBRARY'
  };
};

/**
 * Completely random pick from ALL categories
 */
export const generateRandomBackground = async (): Promise<GenerationResult | null> => {
  await new Promise(resolve => setTimeout(resolve, 600)); 

  // Flatten all arrays into one massive pool
  let allImages: string[] = [];
  Object.values(IMAGE_DATABASE).forEach((arr) => {
      allImages = [...allImages, ...arr];
  });

  const randomUrl = allImages[Math.floor(Math.random() * allImages.length)];

  return {
    url: randomUrl,
    source: 'LIBRARY'
  };
};
