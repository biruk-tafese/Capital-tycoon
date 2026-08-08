import { ShopItem } from '../types/store';

export const SHOP_ITEMS: ShopItem[] = [
  // --- Apparel Category ---
  {
    id: 'suit_1',
    nameEn: 'Designer Suit',
    nameAm: 'ስማርት ልብስ',
    category: 'clothing',
    price: 1200,
    statusBoost: 15,
    icon: '👔',
  },
  {
    id: 'suit_2',
    nameEn: 'Tuxedo Supreme',
    nameAm: 'ታክሲዶ ሱፍ',
    category: 'clothing',
    price: 3500,
    statusBoost: 45,
    icon: '🎩',
  },
  {
    id: 'jacket_1',
    nameEn: 'Silk Blazer',
    nameAm: 'የሐር ጃኬት',
    category: 'clothing',
    price: 6000,
    statusBoost: 85,
    icon: '🧥',
  },

  // --- Watches Category ---
  {
    id: 'watch_1',
    nameEn: 'Gold Chrono',
    nameAm: 'ወርቃማ ሰዓት',
    category: 'watch',
    price: 4500,
    statusBoost: 60,
    icon: '⌚',
  },
  {
    id: 'watch_2',
    nameEn: 'Diamond Tourbillon',
    nameAm: 'የአልማዝ ሰዓት',
    category: 'watch',
    price: 12000,
    statusBoost: 180,
    icon: '💎',
  },
  {
    id: 'watch_3',
    nameEn: 'Royal Chronometer',
    nameAm: 'ሮያል ሰዓት',
    category: 'watch',
    price: 28000,
    statusBoost: 450,
    icon: '👑',
  },

  // --- Real Estate / Luxury Homes Category ---
  {
    id: 'home_1',
    nameEn: 'Luxury Villa',
    nameAm: 'ዘመናዊ ቪላ',
    category: 'home',
    price: 25000,
    statusBoost: 400,
    icon: '🏰',
  },
  {
    id: 'home_2',
    nameEn: 'Penthouse Suite',
    nameAm: 'ፔንትሃውስ ቪላ',
    category: 'home',
    price: 60000,
    statusBoost: 1000,
    icon: '🏙️',
  },
  {
    id: 'home_3',
    nameEn: 'Private Island Manor',
    nameAm: 'የግል ደሴት መኖሪያ',
    category: 'home',
    price: 150000,
    statusBoost: 2800,
    icon: '🏝️',
  },
];