
import { BackgroundInfo } from './types';

// === THE "JSON" DATABASE ===
// 優化版圖庫：精選高穩定性、高畫質 Unsplash 圖片
// 確保連結有效，避免出現空白 (404)
export const IMAGE_DATABASE = {
  // 1. 日出 (Sunrise)
  sunrise: [
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1600&q=80', // 晨霧湖畔
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80', // 草原日出
    'https://images.unsplash.com/photo-1502318217862-aa4e294f9365?w=1600&q=80', // 金色陽光
    'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1600&q=80', // 寺廟日出
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80', // 北歐晨光
    'https://images.unsplash.com/photo-1548263594-a71ea199f027?w=1600&q=80', // 海岸日出
  ],

  // 2. 日落 (Sunset)
  sunset: [
    'https://images.unsplash.com/photo-1472120435266-531070423d8c?w=1600&q=80', // 壯麗火燒雲
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', // 海灘夕陽
    'https://images.unsplash.com/photo-1501434914109-7f3ae2b0e77d?w=1600&q=80', // 山間日落
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9d856?w=1600&q=80', // 雪山夕照
    'https://images.unsplash.com/photo-1464093515883-ec948246accb?w=1600&q=80', // 薰衣草田夕陽
    'https://images.unsplash.com/photo-1518117624949-0d29676e93df?w=1600&q=80', // 城市剪影
  ],

  // 3. 高山 (Mountain)
  mountain: [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80', // 經典阿爾卑斯
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1600&q=80', // 優勝美地
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1600&q=80', // 登山者視角
    'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=1600&q=80', // 雪山連峰
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1600&q=80', // 壯闊山景
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80', // 馬丘比丘山脈
  ],

  // 4. 海洋 (Ocean)
  ocean: [
    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80', // 碧海藍天
    'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=1600&q=80', // 岩石海岸
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1600&q=80', // 清澈海水
    'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=1600&q=80', // 海浪拍岸
    'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=1600&q=80', // 煙火與海
    'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80', // 廣闊水平線
  ],

  // 5. 森林 (Forest)
  forest: [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80', // 陽光穿透森林
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600&q=80', // 秋天森林
    'https://images.unsplash.com/photo-1476231682828-37edb4819a0f?w=1600&q=80', // 神秘古樹
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1600&q=80', // 迷霧森林
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=1600&q=80', // 針葉林
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600&q=80', // 綠意盎然
  ],

  // 6. 湖泊 (Lake)
  lake: [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80', // 夢蓮湖
    'https://images.unsplash.com/photo-1439246854758-f686a415d988?w=1600&q=80', // 寧靜倒影
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80', // 船屋湖泊
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80', // 瑞士湖光
    'https://images.unsplash.com/photo-1506504294863-74d30c00cc6a?w=1600&q=80', // 冰川湖
    'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=1600&q=80', // 碧綠湖水
  ],

  // 7. 雪景 (Snow)
  snow: [
    'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1600&q=80', // 孤獨的樹
    'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=1600&q=80', // 雪地小屋
    'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1600&q=80', // 滑雪場
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1600&q=80', // 冬季森林
    'https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1600&q=80', // 飄雪瞬間
    'https://images.unsplash.com/photo-1549729864-4d809795e1e1?w=1600&q=80', // 雪山特寫
  ],

  // 8. 雲海 (Cloud)
  cloud: [
    'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=1600&q=80', // 藍天白雲
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1600&q=80', // 山巔雲海
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=1600&q=80', // 風雨欲來
    'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1600&q=80', // 粉色雲朵
    'https://images.unsplash.com/photo-1536514498079-9b765e1431ca?w=1600&q=80', // 飛機視角
    'https://images.unsplash.com/photo-1594156596782-656c93e4d504?w=1600&q=80', // 雲層之上
  ],

  // 9. 星空 (Night)
  night: [
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600&q=80', // 銀河
    'https://images.unsplash.com/photo-1506318137071-a8bcbf6d919d?w=1600&q=80', // 極光
    'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1600&q=80', // 營火星空
    'https://images.unsplash.com/photo-1488866022504-f2584e0afc37?w=1600&q=80', // 雪地星軌
    'https://images.unsplash.com/photo-1517544845501-bb88da78f31f?w=1600&q=80', // 城市夜景
    'https://images.unsplash.com/photo-1532051075672-79f9d280e819?w=1600&q=80', // 滿月
  ],

  // 10. 名勝 (Landmarks)
  landmarks: [
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80', // 泰姬瑪哈陵
    'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1600&q=80', // 富士山
    'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=1600&q=80', // 艾菲爾鐵塔
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&q=80', // 大笨鐘
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&q=80', // 倫敦塔橋
    'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1600&q=80', // 威尼斯
  ]
};

// Preset Buttons - Mapping to the 10 landscape categories
export const BACKGROUNDS: BackgroundInfo[] = [
  { id: 'sunrise', url: IMAGE_DATABASE.sunrise[0], label: '日出晨光', emoji: '🌅', prompt: 'sunrise' },
  { id: 'ocean', url: IMAGE_DATABASE.ocean[0], label: '蔚藍海洋', emoji: '🌊', prompt: 'ocean' },
  { id: 'forest', url: IMAGE_DATABASE.forest[0], label: '森林秘境', emoji: '🌲', prompt: 'forest' },
  { id: 'mountain', url: IMAGE_DATABASE.mountain[0], label: '壯麗高山', emoji: '⛰️', prompt: 'mountain' },
  { id: 'lake', url: IMAGE_DATABASE.lake[0], label: '湖光山色', emoji: '🏞️', prompt: 'lake' },
  { id: 'sunset', url: IMAGE_DATABASE.sunset[0], label: '夕陽餘暉', emoji: '🌇', prompt: 'sunset' },
  { id: 'snow', url: IMAGE_DATABASE.snow[0], label: '銀白雪景', emoji: '❄️', prompt: 'snow' },
  { id: 'cloud', url: IMAGE_DATABASE.cloud[0], label: '漫步雲端', emoji: '☁️', prompt: 'clouds' },
  { id: 'night', url: IMAGE_DATABASE.night[0], label: '璀璨星空', emoji: '🌌', prompt: 'night sky' },
  { id: 'landmarks', url: IMAGE_DATABASE.landmarks[0], label: '世界名勝', emoji: '🗽', prompt: 'landmark' },
];

export const DEFAULT_BRUSH_SIZE = 150;
export const COMPLETION_THRESHOLD = 99;
