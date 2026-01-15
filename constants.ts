
import { BackgroundInfo } from './types';

export const BACKGROUNDS: BackgroundInfo[] = [
  {
    id: 'garden',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&q=80&w=2000',
    label: '祕密花園',
    emoji: '🌸',
    prompt: 'Lush blooming garden with vibrant flowers, sunlight filtering through leaves, 16:9, serene'
  },
  {
    id: 'sky',
    url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&q=80&w=2000',
    label: '雲端漫步',
    emoji: '☁️',
    prompt: 'Breathtaking high altitude clouds and deep blue sky from a window view, 16:9, peaceful'
  },
  {
    id: 'living-room',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=2000',
    label: '溫馨一角',
    emoji: '🏠',
    prompt: 'Cozy modern living room corner with soft natural morning light, clean aesthetic, 16:9'
  },
  {
    id: 'beach',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2000',
    label: '蔚藍海岸',
    emoji: '🏖️',
    prompt: 'Calm tropical beach with white sand and turquoise water, sunset glow, 16:9'
  },
  {
    id: 'forest',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000',
    label: '森林晨曦',
    emoji: '🌲',
    prompt: 'Enchanted forest with tall trees and morning mist, sunbeams hitting the ground, 16:9'
  },
  {
    id: 'lake',
    url: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&q=80&w=2000',
    label: '鏡面湖泊',
    emoji: '🗻',
    prompt: 'Perfectly still alpine lake reflecting snowy mountains, crystal clear, 16:9'
  },
  {
    id: 'city-night',
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=2000',
    label: '城市星火',
    emoji: '🌃',
    prompt: 'Beautiful city skyline at dusk, warm building lights, purple sky, 16:9'
  },
  {
    id: 'autumn',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=2000',
    label: '金秋時節',
    emoji: '🍁',
    prompt: 'Golden maple trees path in autumn, warm orange tones, soft light, 16:9'
  },
  {
    id: 'snow',
    url: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=2000',
    label: '銀裝素裹',
    emoji: '❄️',
    prompt: 'Minimalist snowy landscape, white frozen fields, pale blue sky, 16:9'
  },
  {
    id: 'zen',
    url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=2000',
    label: '禪意空間',
    emoji: '🧘',
    prompt: 'Japanese zen garden with sand patterns and single stone, peaceful, clean, 16:9'
  },
  {
    id: 'space',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000',
    label: '浩瀚宇宙',
    emoji: '🌌',
    prompt: 'Deep space view with colorful nebula, stars and a distant planet, cinematic lighting, 16:9'
  },
  {
    id: 'underwater',
    url: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&q=80&w=2000',
    label: '海底世界',
    emoji: '🐠',
    prompt: 'Vibrant underwater coral reef with many colorful tropical fish, clownfish, clear blue water, 16:9'
  },
  {
    id: 'aurora',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&q=80&w=2000',
    label: '極光奇景',
    emoji: '✨',
    prompt: 'Green and purple northern lights aurora borealis over snowy mountains, night sky, 16:9'
  },
  {
    id: 'waterfall',
    url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=2000',
    label: '壯闊瀑布',
    emoji: '🌊',
    prompt: 'Majestic waterfall in a lush jungle, water spray, rainbow, green nature, 16:9'
  },
  {
    id: 'food',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=2000',
    label: '環球美食',
    emoji: '🍔',
    prompt: 'Delicious gourmet feast spread table, burgers, pasta, salads, steak, high resolution food photography, appetizing, 16:9'
  }
];

export const DEFAULT_BRUSH_SIZE = 150;
// Increased threshold to ensure user cleans thoroughly (almost 100%)
export const COMPLETION_THRESHOLD = 99;
